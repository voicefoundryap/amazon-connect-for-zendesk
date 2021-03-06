const { init, queryZendesk } = require('./api');
const { httpStatus, returnType } = require('./constants');
const { commonUserFields, copiedFields } = require('./returningFields');

const userId = async (event) => {
    const { Parameters } = event.Details;
    if (!Parameters.zendesk_user) return { status: httpStatus.badRequest };

    const webClient = init();
    if (!webClient) return { status: httpStatus.serverError };

    const query = `/api/v2/users/${Parameters.zendesk_user}.json`;
    const user = await queryZendesk(webClient, query, returnType.user);
    if (!user) return { status: httpStatus.serverError };
    if (user === httpStatus.notFound) {
        return {
            status: httpStatus.notFound,
            ...copiedFields(Parameters.cary_on, Parameters)
        };
    }

    return {
        status: httpStatus.ok,
        ...commonUserFields(user),
        ...copiedFields(Parameters.cary_on, Parameters)
    };
};

module.exports = userId;
