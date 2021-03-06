const { httpStatus, defaults } = require('./constants');
const searchByTemplate = require('./template');

const recentTicket = async (event) => {
    const { Parameters } = event.Details;
    if (!Parameters.zendesk_user) return { status: httpStatus.badRequest };

    const hrs = Parameters.recent_hours || process.env.RECENT_TICKETS_HOURS || defaults.recentTicketHours;
    Parameters.search_template = `type:ticket requester:{zendesk_user} -status:closed -status:solved created>${hrs}hours`;
    Parameters.sort_by = 'updated';
    Parameters.sort_order = 'desc';
    return searchByTemplate(event);
};

module.exports = recentTicket;