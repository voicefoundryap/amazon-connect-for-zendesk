const { httpStatus } = require('./constants');
const searchByTemplate = require('./template');

const callingUser = async (event) => {
    const { CustomerEndpoint } = event.Details.ContactData;
    if (CustomerEndpoint.Type === 'TELEPHONE_NUMBER') {
        const phoneNo = CustomerEndpoint.Address;
        if (!phoneNo || ['private', 'unknown', 'anonymous'].includes(phoneNo)) {
            console.warn('User search aborted due to private number');
            return { status: httpStatus.notFound };
        }
        const { Parameters } = event.Details;
        Parameters.search_template = `type:user role:end-user phone:${phoneNo}`;
        return searchByTemplate(event);
    }

    return { status: httpStatus.notFound };
};

module.exports = callingUser;