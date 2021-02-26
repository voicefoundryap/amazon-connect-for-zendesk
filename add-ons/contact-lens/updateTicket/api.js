const axios = require('axios');

const init = (email) => {
    const credentials = {
        url: process.env.ZD_URL,
        email: email || process.env.ZD_EMAIL,
        token: process.env.ZD_TOKEN
    };

    if (!credentials.url || !credentials.email || !credentials.token) {
        console.error('missing credentials in env variables (ZD_URL, ZD_EMAIL, ZD_TOKEN)');
        return null;
    }

    try {
        const raw = `${credentials.email}/token:${credentials.token}`;
        const encoded = (Buffer.from(raw)).toString('base64');
        return axios.create({
            baseURL: credentials.url,
            timeout: 5000,
            headers: { 'Authorization': 'Basic ' + encoded }
        });
    }
    catch (err) {
        console.error('Error initiating web client: ', err.message);
        return null;
    }
};

const querySupport = async (webClient, queryUrl) => {
    return webClient.get(queryUrl).catch((err) => {
        const message = `
        error getting response from Zendesk Search API
        for query ${queryUrl}
    `;
        console.error(message, err);
        return null;
    });
};

const findTickets = async (contacts) => {
    const webClient = init();
    if (!webClient) return null;
    const maxCount = Math.floor((process.env.MAX_QUERY_LENGTH - 100) / 50);
    const baseQueryStr = '/api/v2/search.json?query=type:ticket';
    const matchedTickets = [];
    while (contacts.length) {
        const chunk = contacts.splice(0, maxCount);
        let chunkCount = 1; // assuming we have a single contact to check
        if (chunk.length > 1) {
            const queryUrl = baseQueryStr + chunk.reduce((queryStr, contactId) => `${queryStr} comment:"${contactId}"`, '');
            const response = await querySupport(webClient, queryUrl);
            if (!response) continue;
            // console.log('ZD Search API response: ', response.data);
            chunkCount = response.data.count;
        }
        if (chunkCount > 0) {
            // process contacts in parallel
            const asyncRequests = chunk.map(async (contactId) => {
                if (matchedTickets.length < chunkCount) {
                    const ticketQuery = `${baseQueryStr} comment:"${contactId}"`;
                    const response = await querySupport(webClient, ticketQuery);
                    if (response && response.data.count > 0) {
                        const ticket = response.data.results[0];
                        let agentEmail = null;
                        if (ticket.assignee_id) {
                            // get the assignee's email address
                            const userQuery = `/api/v2/users/${ticket.assignee_id}.json`;
                            const response = await querySupport(webClient, userQuery);
                            if (response && response.data.user)
                                agentEmail = response.data.user.email;
                        }
                        matchedTickets.push({
                            contactId,
                            ticketId: ticket.id,
                            agentEmail
                        });
                    }
                }
            });

            await Promise.all(asyncRequests);
        }
    }

    console.log('matched tickets: ', matchedTickets);
    return matchedTickets;
};

const updateTicket = async (ticket, comment) => {
    const webClient = init(ticket.agentEmail);
    if (!webClient) return null;
    // console.log(`Updating ticket ${ticket.ticketId} with comment: `, comment);
    const updateUrl = `/api/v2/tickets/${ticket.ticketId}.json?async=true`;
    const response = await webClient.put(updateUrl, {
        ticket: {
            comment: {
                html_body: `<div>${comment}</div>`,
                public: false
            }
        }
    }).catch((err) => {
        console.error('Error while updating ticket: ', err);
        return { status: 500 };
    });
    console.log('Updated ticket response status: ', response.status);
    return response.status === 200;
};

module.exports = {
    findTickets,
    updateTicket
};