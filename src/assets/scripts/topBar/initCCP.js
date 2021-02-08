import logStamp from '../util/log.js';
import subscribeToContactEvents from './contactEvents.js';
import subscribeToAgentEvents from './agentEvents.js';
import { getFromZD } from './core.js';
import ui from './ui.js'

export default (appSettings, ccpContainerId) => {
    // initialize connect session based on app settings

    ui.setText('instanceUrl', `https://${appSettings.subdomain}.zendesk.com`);

    getFromZD(`apps/installations.json`, 'installations', [])
    .then((installations) => {
        const apps = installations.filter((app) =>
            'vfApplicationName' in app.settings &&
            app.settings.vfApplicationName.toLowerCase() === 'aws connector').sort((a, b) => a.created_at < b.created_at ? 1 : -1);
        console.log(logStamp('Installations:\n'), apps);
        if (apps.length)
            ui.setText('appUrl', `https://${apps[0].app_id}.apps.zdusercontent.com`)
        else
            console.error(logStamp('App named "AWS Connector" not found'));
    });

    const ccpParams = {
        ccpUrl: appSettings.connectInstanceUrl + "/connect/ccp-v2#",
        loginPopup: true, // TODO: display login popup within the app iframe, not as a new tab
        softphone: {
            allowFramedSoftphone: !appSettings.medialess
        }
    };
    if (appSettings.ssoSignInUrl)
    ccpParams.loginUrl = appSettings.ssoSignInUrl;
    
    // console.log(logStamp('ccpInit with params: '), ccpParams);
    try {
        connect.core.initCCP(document.getElementById(ccpContainerId), ccpParams);
    } catch (err) {
        console.error(logStamp('Error initializing CCP: '), err);
        return;
    }

    connect.contact(subscribeToContactEvents);
    connect.agent(subscribeToAgentEvents);
    // console.log(logStamp('CCP initialized successfully'));
}
