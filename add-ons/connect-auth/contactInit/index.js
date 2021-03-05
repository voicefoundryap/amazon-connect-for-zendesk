const AWS = require("aws-sdk");

exports.handler = async (event, context) => {
    // console.log("Event From Amazon Connect: " + JSON.stringify(event, null, 2));
    if (!(event.Name && event.Name === 'ContactFlowEvent')) {
        console.error('Unexpected event:', JSON.stringify(event, null, 2));
        return { status_code: 400 };
    }

    const sts = new AWS.STS();
    const params = {
        DurationSeconds: Number(process.env.SESSION_EXPIRY) || 3600,
        ExternalId: "AWS_Connector_for_Zendesk",
        RoleArn: process.env.ASSUME_ROLE,
        RoleSessionName: event.Details.ContactData.ContactId
    };
    const unsuccessfulMessage = 'Failed to obtain temporary credentials from STS: ';
    
    const data = await sts.assumeRole(params).promise().catch((err) => {
        console.error(unsuccessfulMessage, err);
        return null;
    });
    if (!data) return { status_code: 500 };

    const { Credentials } = data;
    if (!Credentials) {
        console.error(unsuccessfulMessage, data);
        return { status_code: 500 };
    }
    console.log('Temporary credentials successfully obtained from STS');
    
    const instanceArnParts = event.Details.ContactData.InstanceARN.split(":");

    return {
        status_code: 200,
        aid: Credentials.AccessKeyId,
        sak: Credentials.SecretAccessKey,
        sst: Credentials.SessionToken,
        cfg: JSON.stringify({
            instanceId: instanceArnParts[5].split("/")[1],
            region: instanceArnParts[3]
        })
    };

};
