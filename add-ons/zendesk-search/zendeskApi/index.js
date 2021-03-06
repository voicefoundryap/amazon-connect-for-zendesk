console.log('Loading function');

const { httpStatus } = require('./constants');
const callingUser = require('./callingUser');
const recentTicket = require('./recentTicket');
const userId = require('./userId');
const ticketId = require('./ticketId');
const template = require('./template');
const customField = require('./customField');

exports.handler = async (event, context) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    const badRequestStatus = { status: httpStatus.badRequest };
    if (!(event.Name && event.Name === 'ContactFlowEvent')) {
        console.error('Unexpected event:', JSON.stringify(event, null, 2));
        return badRequestStatus;
    }

    const { Parameters } = event.Details;
    const searchBy = Parameters.search_by || Parameters.action; // action is deprecated, will be removed in v2.3
    if (!searchBy) {
        console.error('Parameter search_by is missing or empty:', Parameters);
        return badRequestStatus;
    }

    let response;
    switch (searchBy) {
        case 'zendesk_user':
            response = await userId(event);
            break;
        case 'zendesk_ticket':
            response = await ticketId(event);
            break;
        case 'find_calling_user':   // this search type is deprecated, will be removed in v2.3
            response = await callingUser(event);
            if (response.status_code === httpStatus.ok) {
                Parameters.zendesk_user = response.zendesk_user;
                const recentTickets = await recentTicket(event);
                if (recentTickets.status_code === httpStatus.ok) {
                    response = {
                        ...response,
                        ...recentTickets,
                        open_tickets: recentTickets.results_count
                    };
                } else {
                    response = {
                        ...response,
                        open_tickets: 0
                    };
                }
            }
            break;
        case 'calling_user':
            response = await callingUser(event);
            break;
        case 'most_recent_ticket':
            response = await recentTicket(event);
            break;
        case 'custom_field':
            response = await customField(event);
            break;
        case 'template':
            response = await template(event);
            break;
        default:
            console.error('The search_by parameter value is illegal:', searchBy);
            response = badRequestStatus;
            break;
    }

    return response;
};
