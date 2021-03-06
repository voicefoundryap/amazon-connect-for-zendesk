const axios = require('axios');
const { httpStatus } = require('./constants');

const apiError = (queryUrl) => `
    error getting response from Zendesk Search API
    for query ${queryUrl}
`;

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

const getApiResponse = async (webClient, queryUrl) => {
    return webClient.get(queryUrl).catch((err) => {
        console.error(apiError(queryUrl));
        if (err.response) {
            // client received an error response (5xx, 4xx)
            console.error(`💥💥💥💥 response status: ${err.response.status}`);
            console.error(err.response.data);
            console.error(err.response.headers);
            return err.response.status;
        } else if (err.request) {
            console.error(`💥💥💥💥 ${err.request}`);
            return null;
        } else {
            return null;
        }
    });
};

const searchZendesk = async (webClient, queryUrl) => {
    const response = await getApiResponse(webClient, queryUrl);
    if (!(response && response.data)) return {};

    const { data } = response;
    if (!data.results) {
        console.error('Unexpected response from Zendesk API: ', data);
        return {};
    }

    return {
        results: data.results,
        count: data.count
    };
};

const queryZendesk = async (webClient, queryUrl, expected) => {
    const response = await getApiResponse(webClient, queryUrl);
    if (!(response && response.data)) {
        return response == '404' ? httpStatus.notFound : null;
    }

    const { data } = response;
    if (!(data[expected])) {
        console.error('Unexpected response from Zendesk API: ', data);
        return null;
    }

    return data[expected];
};

module.exports = {
    init,
    searchZendesk,
    queryZendesk
};
