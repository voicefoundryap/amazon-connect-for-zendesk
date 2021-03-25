import logStamp from '../util/log.js';
import session from './session.js';
import { zafClient } from './zafClient.js';
import ui from './ui.js'
import newTicket from './newTicket.js';
import { resize } from './core.js';

export default (agent) => {

    // close login popup
    const w = window.open("", window.connect.MasterTopics.LOGIN_POPUP);
    if (w) w.close();

    console.log(logStamp(`Subscribing to events for agent [${agent.getName()}] who is [${agent.getStatus().name}]]`));
    window.clearTimeout(window.vfConnectTimeout);
    ui.hide('loadingContainer');
    ui.show('ccpContainer');

    session.agent = agent;
    
    const routingStatus = agent.getStatus().type;
    console.log(logStamp('agent routing status: '), routingStatus);
    // pop CCP open if not routable
    if (routingStatus.toLowerCase() !== "routable") zafClient.invoke('popover', 'show');

    agent.onRefresh((agent) => {
        // console.log(logStamp(`Agent is refreshed. Agent status is [${agent.getStatus().name}]`), agent.getStatus());
        session.agent = agent;
    });

    agent.onRoutable((agent) => {
        console.log(logStamp(`Agent is routable. Agent status is [${agent.getStatus().name}]`));
        resize('down');
        newTicket.setRequesterName(null);
        session.clearStorage();
        console.log(logStamp('Cleared storage'));
    });

    agent.onNotRoutable((agent) => {
        // console.log(logStamp(`Agent is online, but not routable. Agent status is [${agent.getStatus().name}]`));
    });

    agent.onOffline((agent) => {
        // console.log(logStamp(`Agent is offline. Agent status is [${agent.getStatus().name}]`));
    });

}