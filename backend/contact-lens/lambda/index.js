console.log('Loading function');

const api = require('./api');
const dynamoDB = require('./dynamoDB');
const s3 = require('./s3');
const eventBridge = require('./eventBridge');

exports.handler = async (event, context) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.Records) {
        // Get the key of s3 object that triggered this function by being uploaded to the bucket
        const s3key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        if (!s3key.includes('Redacted/')) return;
        // then get the analysis object itself
        const { ContentType, contactId, analysis } = await s3.getAnalysis(s3key);
        if (ContentType !== 'application/json') return;
        console.log('Analysis record: ', { ContentType, contactId, analysis });

        // check for explicit exclusion of this contact
        const excludeContact = analysis.Categories.MatchedCategories.includes(process.env.EXCLUSION_KEY);
        const includeContact = analysis.Categories.MatchedCategories.includes(process.env.INCLUSION_KEY);
        if (excludeContact && !includeContact) return;

        // searching for corresponding Zendesk ticket
        const [matchedTicket] = await api.findTickets([contactId]);
        if (matchedTicket) {
            console.log(`Found Zendesk ticket no. ${matchedTicket.ticketId}, updating`);
            const success = await api.updateTicket(matchedTicket.ticketId, analysis);
            return success;

        } else {
            // ticket not found, nedd to add contact details to retries collection
            const retriesCount = await dynamoDB.getRetriesCount();
            if (retriesCount === null) return;
            const retry = { contactId, s3key };
            console.log('Adding retry info to DB: ', retry);
            const added = await dynamoDB.addRetry(retry);
            // if this is the first entry then re-enable the rule
            if (added && retriesCount === 0) return eventBridge.enableRule();
        }

    } else {
        // EventBridge triggered a scheduled retry
        console.log('Scheduled trigger. Checking DB:');
        const { retries, count } = await dynamoDB.getAllRetries();
        console.log('retryContactIds: ', retries);
        if (count == null) return;

        // if there are no more retries to process disable the scheduled EventBridge rule
        if (count === 0) return eventBridge.disableRule();
        
        // otherwise attempt to find matching tickets
        const matchedTickets = await api.findTickets(retries);
        let processed = 0;

        // for each matching ticket get the Contect Lens analysis and apply it to the ticket
        for (const ticket of matchedTickets) {
            const s3key = await dynamoDB.getRetryKey(ticket.contactId);
            console.log('getRetryKey: ', s3key);
            if (!s3key) return;
            const { analysis } = await s3.getAnalysis(s3key);
            // console.log('Analysis: ', analysis);
            const success = await api.updateTicket(ticket.ticketId, analysis);
            if (success) {
                // we can now delete it from retries
                await dynamoDB.deleteRetry(ticket.contactId);
                console.log(`ticket ${ticket.ticketId} succesfully updated, record ${ticket.contactId} removed from the retries table`);
                processed++;
            }
        }
        if (processed === count) {
            console.log(`all ${count} retries were successfully processed.`);
            return eventBridge.disableRule();
        }
    }

};
