import logStamp from './log.js';

const getCredentials = () => new Promise((resolve, reject) => {
    AWS.config.credentials.get((err) => {
        if (err) reject(err)
        else resolve();
    });
});

export default async (contact, appSettings) => {
    // console.log(logStamp('attempting to refresh AWS credentials'));
    let connectConfig;
    const configError = 'AWS configuration has not been properly set in the contact flow';
    const attributes = contact.getAttributes();
    const connectConfigStr = attributes.cfg && attributes.cfg.value;
    if (!connectConfigStr) {
        console.error(logStamp('cfg attribute not set: '), attributes.cfg);
        return configError;
    }
    try {
        connectConfig = JSON.parse(connectConfigStr);
    } catch (err) {
        console.error(logStamp('invalid cfg attribute format: '), err);
        return configError;
    }

    appSettings.connectInstanceId = connectConfig.instanceId;
    const region = appSettings.awsRegion = connectConfig.region;

    // validate credential attributes first
    const missingOrEmpty = ['aid', 'sak', 'sst'].filter((attr) => !(attributes[attr] && attributes[attr].value)).join(', ');
    if (missingOrEmpty) {
        console.error(logStamp('The following AWS attributes are missing or not set properly: '), missingOrEmpty);
        return configError;
    }

    AWS.config.update({
        accessKeyId: attributes.aid.value,
        secretAccessKey: attributes.sak.value,
        sessionToken: attributes.sst.value,
        region
    });

    return getCredentials().catch((err) => {
        console.error(logStamp('getting AWS credentials'), err);
        return "Error while setting AWS credentials";
    });
}