const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const getRetryKey = async (contactId) => {
    const params = {
        Key: { contactId: { S: contactId } },
        ProjectionExpression: 's3key',
        TableName: process.env.RETRIES_TABLE
    };
    const result = await dynamoDB.getItem(params).promise().catch((err) => {
        const message = `Error getting contact ${contactId} from DynamoDB.`;
        console.error(message, err);
        return null; // TODO: raise a cloudwatch alert
    });
    if (!result.Item) {
        console.error(`s3 key not found for contact ${contactId}`);
        return null; // TODO: raise a cloudwatch alert
    }
    return result.Item.s3key.S;
};

const getAllRetries = async () => {
    const params = {
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: 'contactId',
        TableName: process.env.RETRIES_TABLE
    };
    const results = await dynamoDB.scan(params).promise().catch((err) => {
        const message = 'Error scanning DynamoDB for items.';
        console.error(message, err);
        return {}; // TODO: raise a cloudwatch alert
    });
    const retries = results.Items && results.Items.map((item) => item.contactId.S);
    return { retries, count: results.Count };
};

const addRetry = async ({ contactId, s3key }) => {
    const params = {
        Item: {
            contactId: { S: contactId },
            s3key: { S: s3key },
            expires: { N: (Math.floor(Date.now() / 1000) + process.env.EXPIRES_MINUTES * 60).toString() }
        },
        ReturnConsumedCapacity: 'TOTAL',
        TableName: process.env.RETRIES_TABLE
    };
    await dynamoDB.putItem(params).promise().catch((err) => {
        const message = 'Error adding new item to DynamoDB.';
        console.error(message, err);
        return false; // TODO: raise a cloudwatch alert
    });
    return true;
};

const deleteRetry = async (contactId) => {
    const params = {
        Key: { contactId: { S: contactId } },
        TableName: process.env.RETRIES_TABLE
    };
    await dynamoDB.deleteItem(params).promise().catch((err) => {
        const message = `Error deleting record ${contactId} from DynamoDB.`;
        console.error(message, err);
        return false; // TODO: raise a cloudwatch alert
    });
    return true;
};

module.exports = {
    getRetryKey,
    getAllRetries,
    addRetry,
    deleteRetry
};