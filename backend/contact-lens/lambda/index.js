console.log('Loading function');

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const eventbridge = new AWS.EventBridge({ apiVersion: '2015-10-07' });
const dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const api = require('./api');

const getObjectFromS3 = async (params) => {
    return s3.getObject(params).promise().catch((err) => {
        const message = `
            Error getting object ${params.Key} from bucket ${params.Bucket}. 
            Make sure they exist and your bucket is in the same region as this function
            `;
        console.error(message, err);
        return { ContentType: null, Metadata: null, Body: null };
    });
};

const getRetries = async () => {
    const params = {
        Select: 'ALL_ATTRIBUTES',
        TableName: process.env.RETRIES_TABLE
    };
    const result = dynamodb.scan(params).promise().catch((err) => {
        const message = 'Error scanning DynamoDB for items.';
        console.error(message, err);
        return null; // TODO: raise a cloudwatch alert
    });
    return result;
};

const getRetriesCount = async () => {
    const params = {
        Select: 'COUNT',
        TableName: process.env.RETRIES_TABLE
    };
    const result = await dynamodb.scan(params).promise().catch((err) => {
        const message = 'Error scanning DynamoDB for items count.';
        console.error(message, err);
        return null; // TODO: raise a cloudwatch alert
    });
    console.log('Count result: ', result);
    return result.Count;
};

const addRetry = async ({ contactId, s3key }) => {
    const params = {
        Item: {
            contactId: { S: contactId },
            s3key: { S: s3key },
            expires: { N: (Math.floor(Date.now() / 1000) + process.env.EXPIRES_MINUTES * 60).toString() }
        },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: process.env.RETRIES_TABLE
    };
    await dynamodb.putItem(params).promise().catch((err) => {
        const message = 'Error adding new item to DynamoDB.';
        console.error(message, err);
        return false; // TODO: raise a cloudwatch alert
    });
    return true;
};

const enableRule = async (enable = true) => {
    const params = {
        Name: process.env.EVENT_BRIDGE_RULE
    };
    console.log(`${enable ? 'En' : 'Dis'}abling the rule ${params.Name}`);
    const errorMessage = `
        Error ${enable ? 'en' : 'dis'}abling the rule ${params.Name}. 
        Make sure rule exists and is in the same region as this function
        `;
    return enable
        ? eventbridge.enableRule(params).promise().catch((err) => { console.error(errorMessage, err); })
        : eventbridge.disableRule(params).promise().catch((err) => { console.error(errorMessage, err); });
};

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.Records) {
        // Get the params of s3 object that triggered this function by being uploaded to the bucket
        const params = {
            Bucket: event.Records[0].s3.bucket.name,
            Key: decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
        };
        console.log('s3 params: ', params);
        if (!params.Key.includes('Redacted/')) return;
        const { ContentType, Metadata, Body } = await getObjectFromS3(params);
        if (ContentType !== 'application/json') return;

        const payload = JSON.parse(Body.toString('utf-8'));
        const contactId = Metadata['contact-id'];
        console.log('Object: ', { ContentType, contactId, payload });

        // searching for corresponding Zendesk ticket
        const [matchedTicket] = await api.findTickets([contactId]);
        if (matchedTicket) {
            console.log(`Found Zendesk ticket no. ${matchedTicket.ticketId}, updating`);
            const success = await api.updatedTicket(matchedTicket.ticketId, null);
            return success;
        } else {
            // ticket not found, nedd to add contact details to retries collection
            const retriesCount = await getRetriesCount();
            if (retriesCount === null) return;
            const retry = {
                contactId,
                s3key: params.Key
            };
            console.log('Adding retry info to DB: ', retry);
            const added = await addRetry(retry);
            // if this is the first entry then re-enable the rule
            if (added && retriesCount === 0) return enableRule();
        }

    } else {
        // EventBridge triggered a scheduled retry
        console.log('Scheduled trigger. Checking DB:');
        const results = await getRetries();
        if (!results) return;
        console.log('DDB Result: ', results);
        if (results.Count === 0) {
            console.log('No more retries to process, disabling the scheduled EventBridge rule');
            return enableRule(false);
        }
        let retries = results.Items;
        // // then attempt to find matching tickets
        // const matchedTickets = await api.findTickets(retries.map((retry) => retry.contactId));
        // // remove any matched tickets from retries
        // const matchedContactIds = matchedTickets.map((ticket) => ticket.contactId);
        // retries = retries.filter((retry) => !matchedContactIds.includes(retry.contactId));

    }

};
