const httpStatus = {
    ok: 200,
    badRequest: 400,
    accessDenied: 403,
    notFound: 404,
    serverError: 500
};

const defaults = {
    recentTicketHours: 72
};

const returnType = {
    results: 'results',
    ticket: 'ticket',
    user: 'user'
};

const keywordParams = [
    'search_template', 
    'return_fields', 
    'sort_by', 
    'sort_order'
];

module.exports = {
    httpStatus,
    defaults,
    returnType,
    keywordParams
};