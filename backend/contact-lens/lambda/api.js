const axios = require('axios');
let webClient = {};

const init = async () => {
    const credentials = {
        url: process.env.ZD_URL,
        email: process.env.ZD_EMAIL,
        token: process.env.ZD_TOKEN
    };

    if (!credentials.url || !credentials.email || !credentials.token) {
        console.error('missing credentials in env variables (ZD_URL, ZD_EMAIL, ZD_TOKEN)');
        return false;
    }

    try {
        const raw = `${credentials.email}/token:${credentials.token}`;
        const encoded = (Buffer.from(raw)).toString('base64');
        webClient = axios.create({
            baseURL: credentials.url,
            timeout: 5000,
            headers: { 'Authorization': 'Basic ' + encoded }
        });
    }
    catch (err) {
        console.error('Error initiating web client: ', err.message);
        return false;
    }

    return true;
};

const findTickets = async (contacts) => {
    const maxCount = Math.floor((process.env.MAX_QUERY_LENGTH - 100) / 50);
    const baseQueryStr = '/api/v2/search.json?query=type:ticket';
    while (contacts.length) {
        const chunk = contacts.splice(0, maxCount);
        const queryUrl = baseQueryStr + chunk.reduce((queryStr, contactId) => `${queryStr} comment:"${contactId}"`, '');
        const response = await webClient.get(queryUrl).catch((err) => {
            const message = `
            error getting response from Zendesk Search API
            for query ${queryUrl}
        `;
            console.error(message, err);
            return null;
        });
        console.log('ZD Search API response: ', response.data);
    }

    return [];

    // return [{
    //     contactId: contacts[0],
    //     ticketId: 1
    // }];
};

const updateTicket = async (ticketId, comment) => {
    return true;
};


module.exports = {
    init,
    findTickets,
    updateTicket
};