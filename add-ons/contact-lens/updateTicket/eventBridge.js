const AWS = require('aws-sdk');
const eventbridge = new AWS.EventBridge({ apiVersion: '2015-10-07' });

const enableRule = async () => {
    const params = {
        Name: process.env.EVENT_BRIDGE_RULE
    };
    console.log('Enabling the rule ', params.Name);
    const errorMessage = `
        Error enabling the rule ${params.Name}. 
        Make sure rule exists and is in the same region as this function
        `;
    return eventbridge.enableRule(params).promise().catch((err) => { console.error(errorMessage, err); });
};

const disableRule = async () => {
    const params = {
        Name: process.env.EVENT_BRIDGE_RULE
    };
    console.log('Disabling the rule ', params.Name);
    const errorMessage = `
        Error disabling the rule ${params.Name}. 
        Make sure rule exists and is in the same region as this function
        `;
    return eventbridge.disableRule(params).promise().catch((err) => { console.error(errorMessage, err); });
};

module.exports = {
    enableRule,
    disableRule
};