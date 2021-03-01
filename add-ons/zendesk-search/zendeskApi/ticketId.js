const { init, queryZendesk } = require('./api');
const { httpStatus, returnType } = require('./constants');
const { commonTicketFields } = require('./commonFields');

const ticketId = async (event) => {
    const { Parameters } = event.Details;
    if (!Parameters.zendesk_ticket) return { status_code: httpStatus.badRequest };

    const webClient = init();
    if (!webClient) return { status_code: httpStatus.serverError };

    const query = `/api/v2/tickets/${Parameters.zendesk_ticket}.json`;
    const ticket = await queryZendesk(webClient, query, returnType.ticket);
    if (ticket === undefined) return { status_code: httpStatus.serverError };
    if (ticket === null) return { status_code: httpStatus.notFound };
    
    return {
        status_code: httpStatus.ok,
        ...commonTicketFields(ticket)
    };
};

module.exports = ticketId; 