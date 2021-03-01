const { init, queryZendesk } = require('./api');
const { httpStatus, returnType } = require('./constants');
const { commonUserFields } = require('./commonFields');

const userId = async (event) => {
    const { Parameters } = event.Details;
    if (!Parameters.zendesk_user) return { status_code: httpStatus.badRequest };

    const webClient = init();
    if (!webClient) return { status_code: httpStatus.serverError };

    const query = `/api/v2/users/${Parameters.zendesk_user}.json`;
    const user = await queryZendesk(webClient, query, returnType.user);
    if (user === undefined) return { status_code: httpStatus.serverError };
    if (user === null) return { status_code: httpStatus.notFound };

    return {
        status_code: httpStatus.ok,
        ...commonUserFields(user)
    };
};

module.exports = userId; 