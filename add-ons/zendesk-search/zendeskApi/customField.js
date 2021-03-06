const { httpStatus } = require('./constants');
const searchByTemplate = require('./template');

const customField = async (event) => {
    const { Parameters } = event.Details;
    
    if(Object.keys(Parameters).length !== 2) {
        return { status: httpStatus.badRequest };
    }

    const [customField, value] = Object.entries(Parameters).find(([key]) => key !== 'search_by'); 
    Parameters.search_template = `type:user role:end-user ${customField}:${value}`;
    return searchByTemplate(event);
};

module.exports = customField;