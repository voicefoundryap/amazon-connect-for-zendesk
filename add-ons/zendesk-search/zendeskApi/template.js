const { init, searchZendesk } = require('./api');
const { httpStatus, keywordParams } = require('./constants');
const { commonUserFields, commonTicketFields } = require('./commonFields');

const template = async (event) => {
    const { Parameters } = event.Details;
    if (!Parameters.search_template) return { status_code: httpStatus.badRequest }

    // populate search template with values
    const params = Object.keys(Parameters).filter((key) => !keywordParams.includes(key));
    let searchString = Parameters.search_template;
    params.forEach((key) => {
        searchString = searchString.replace(`{${key}}`, Parameters[key]);
    });
    
    // check for bad formatting
    if (searchString.includes('{') || searchString.includes('}')) return { status_code: httpStatus.badRequest }

    const webClient = init();
    if (!webClient) return { status_code: httpStatus.serverError };

    const query = `/api/v2/search.json?query=${encodeURIComponent(searchString)}`;
    if (Parameters.includes('sort_by')) query += `&sort_by=${Parameters.sort_by}`;
    if (Parameters.includes('sort_order')) query += `&sort_order=${Parameters.sort_order}`;

    const { results, count } = await searchZendesk(webClient, query);
    if (!results) return { status_code: httpStatus.serverError };
    if (!results.length) return { status_code: httpStatus.notFound };
    const result = results[0];

    const response = { status_code: httpStatus.ok, results_count: count };
    if (Parameters.return_fields) {
        const returnFields = Parameters.return_fields.split(',').map((field) => field.trim());
        returnFields.forEach((field) => {
            response[field] = result[field];
        })
    }

    if (searchString.startsWith('type:ticket')) {
        return { 
            ...response,
            ...commonTicketFields(result) 
        };
    }

    if (searchString.startsWith('type:user')) {
        return { 
            ...response, 
            ...commonUserFields(result) 
        };
    }
    
    return response;
}

module.exports = template; 