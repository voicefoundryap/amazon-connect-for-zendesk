const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const getAnalysis = async (key) => {
    const params = {
        Bucket: process.env.CONTACT_LENS_BUCKET,
        Key: key
    };
    const { ContentType, Metadata, Body } = await s3.getObject(params).promise().catch((err) => {
        const message = `
            Error getting Contact Lens analysis for contact ${params.Key} from bucket ${params.Bucket}. 
            Make sure they exist and your bucket is in the same region as this function
            `;
        console.error(message, err);
        return {};
    });
    if (ContentType !== 'application/json') return {};
    
    return {
        ContentType,
        contactId: Metadata['contact-id'],
        analysis: JSON.parse(Body.toString('utf-8'))
    };
};

module.exports = {
    getAnalysis
};