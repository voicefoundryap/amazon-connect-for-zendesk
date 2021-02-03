import logStamp from '../util/log.js';
import session from './session.js';
import { zafClient } from './zafClient.js';
import appConfig from './appConfig.js';
import appendTicketComments from './appendTicketComments.js';
import newTicket from './newTicket.js';
import ui from './ui.js';
import { resize, determineAssignmentBehavior, popTicket } from './core.js';
import { processOutboundCall } from './outbound.js';
import { processInboundCall } from './inbound.js';

let appSettings = {};
let speechAnalysis;

// speech analysis is loaded dynamically in preparation for decoupling in version 2.2
import('../sideBar/speechAnalysis.js')
    .then((module) => { speechAnalysis = module.default })
    .catch((err) => console.log(logStamp('real-time speech analysis is not present and will not be used')));

const handleContactConnecting = async () => {
    zafClient.invoke('popover', 'show');
    console.log(logStamp('Contact connecting: '), session.contact);
    if (session.isMonitoring) return;

    ui.show('newTicketContainer');
    session.ticketId = null;
    
    if (session.contact.inboundConnection) {
        await appConfig.applyAttributes(session);
        appSettings = session.zafInfo.settings;
        console.log(logStamp('handleContactIncoming, pop before connected: '), appSettings.popBeforeCallConnected);
        if (appSettings.popBeforeCallConnected) {
            await processInboundCall(session.contact);
        }
    }
}

const handleContactConnected = async () => {
    if (session.isMonitoring) return;

    if (session.contact.outboundConnection)
        await appConfig.applyAttributes(session);
    appSettings = session.zafInfo.settings;
    session.callStarted = new Date();

    console.log(logStamp('handleContactConnected, pop before connected: '), appSettings.popBeforeCallConnected);

    // check real-time speech analysis support and config
    appSettings.speechAnalysisEnabled = false;
    if (appSettings.speechAnalysis) {
        if (!speechAnalysis) {
            const message = `
                This version of AWS Connector App <br/>
                doesn't supports real-time speech analysis.<br/> 
                Please notify your administrator.
                `;
            zafClient.invoke('notify', message, 'error', { sticky: true });
        } else {
            speechAnalysis.verifyConfig(session.contact);
            if (appSettings.speechAnalysisEnabled) {
                // open speech analysis session
                speechAnalysis.sessionOpen(session.contact);
            }
        }
    }

    if (session.contact.outboundConnection) {
        // console.log(logStamp('handleContactConnected'), "outbound");
        await processOutboundCall(session.contact);
    }

    if (session.contact.inboundConnection) {
        // console.log(logStamp('handleContactConnected'), "inbound");

        if (!appSettings.popBeforeCallConnected)
            await processInboundCall(session.contact);
        else {
            const autoAssignTickets = determineAssignmentBehavior();
            if (autoAssignTickets) {
                if (!session.user)
                    // create new user if necessary
                    await newTicket.createUser();
                if (!session.ticketId)
                    // create new ticket if necessary
                    session.ticketId = await newTicket.createTicket().catch((err) => null); //TODO: handle these errors
                if (session.ticketId) {
                    // assign this ticket to call and attach contact details automatically
                    await appendTicketComments.appendContactDetails(session.contact, session.ticketId);
                    await popTicket(session.zenAgentId, session.ticketId);
                    zafClient.invoke('popover', 'hide');
                }
            } else
                resize('full');
        }
    }
}

const handleContactEnded = async () => {
    console.log(logStamp('handleContactEnded, session.state.connected: '), session.state.connected);
    if (!session.state.connected) {
        // clear session for any rejected or missed calls
        session.clear();
        return;
    }

    session.state.callEnded = true;
    session.state.connected = false;
    // cleanup session data for the next call
    if (appSettings.speechAnalysisEnabled) {
        console.log(logStamp('handleContactEnded'), 'attempting to close webSocket session');
        await speechAnalysis.sessionClose();
        localStorage.clear();
    }

    console.log(logStamp('handleContactEnded'), session.contact.outboundConnection
        ? 'outbound'
        : (session.contact.inboundConnection
            ? 'inbound'
            : 'monitoring'));

    if (session.ticketId && session.ticketAssigned) {
        // add assembled information and analysis to ticket
        await appendTicketComments.appendTheRest(session.contact, session.ticketId);
        if (appSettings.speechAnalysisEnabled)
            speechAnalysis.updateTicketAttribute(session.ticketId.toString());
    } else if (appSettings.forceTicketCreation && !(session.isMonitoring)) {
        // manual assignment mode, the agent has forgotten to assign - force ticket creation (if configured)
        // set the agent as a requester
        session.user = { name: session.contact.customerNo, id: null }
        const ticketId = await newTicket.createTicket().catch((err) => null); //TODO: handle these errors
        if (ticketId) {
            await appendTicketComments.appendContactDetails(session.contact, ticketId, false); // don't open the apps tray here
            await appendTicketComments.appendTheRest(session.contact, ticketId);
            if (appSettings.speechAnalysisEnabled)
                speechAnalysis.updateTicketAttribute(ticketId.toString());
        }
    }

    resize('down');
    newTicket.setRequesterName(null);
    ui.enable('attachToCurrentBtn', false);
    zafClient.invoke('popover', 'show');
    // initialize new session
    session.clear();
}

const handleIncomingCallback = async () => {
    // console.log(logStamp(`handleIncomingCallback`));
    zafClient.invoke('popover', 'show');
}

const logContactState = (contact, handlerName, description) => {
    if (contact)
        console.log(logStamp(handlerName), `${description}. Contact state is ${contact.getStatus().type}`);
    else
        console.warn(logStamp(handlerName), `${description}. Null contact passed to event handler`);
}

export default (contact) => {

    // console.log(logStamp('Subscribing to events for contact'), contact);
    // if (contact.getActiveInitialConnection() && contact.getActiveInitialConnection().getEndpoint()) {
    //     console.log(logStamp('subscribeToContactEvents'), `New contact is from ${contact.getActiveInitialConnection().getEndpoint().phoneNumber}`);
    // }
    // else {
    //     console.log(logStamp('subscribeToContactEvents'), 'This is an existing contact for this agent');
    // }
    // console.log(logStamp('subscribeToContactEvents'), `Contact is from queue ${contact.getQueue().name}`);

    session.contact = contact;

    const currentContact = session.contact;
    const activeConnection = contact.getActiveInitialConnection();
    currentContact.contactId = activeConnection['contactId'];
    const connectionId = activeConnection['connectionId'];
    const connection = new connect.Connection(currentContact.contactId, connectionId);
    currentContact.customerNo = connection.getEndpoint().phoneNumber;
    currentContact.snapshot = contact.toSnapshot();

    const currentConnections = currentContact.snapshot.contactData.connections;
    currentContact.inboundConnection = currentConnections.find((connection) => connection.type === 'inbound');
    currentContact.outboundConnection = currentConnections.find((connection) => connection.type === 'outbound');

    try {
        // don't create tickets for supervisors monitoring calls
        session.isMonitoring = !(currentContact.outboundConnection || currentContact.inboundConnection);
        console.log(logStamp('is it monitoring? '), session.isMonitoring);
        // is this call a transfer?
        const data = currentContact.snapshot.contactData;
        session.isTransfer = data.type !== "queue_callback" && data.initialContactId && data.initialContactId !== data.contactId;
        currentContact.initialContactId = data.initialContactId;
        console.log(logStamp('is it a transfer? '), session.isTransfer);

    } catch (err) {
        console.error(logStamp("Error on new contact: "), err);
    }

    session.state = { connecting: false, callback: false, connected: false, callEnded: false };

    contact.onConnecting((contact) => {
        logContactState(contact, 'handleContactConnecting', 'Contact connecting to agent');
        if (!session.state.connecting) {
            session.state.connecting = true;
            handleContactConnecting()
                .then((result) => result)
                .catch((err) => { console.error(logStamp('handleContactConnecting'), err) });
        }
    });

    contact.onIncoming((contact) => {
        logContactState(contact, 'handleIncomingCallback', 'Contact is incoming as a callback');
        if (!session.state.callback) {
            session.state.callback = true;
            handleIncomingCallback()
                .then((result) => result)
                .catch((err) => { console.error(logStamp('handleIncomingCallback'), err) });
        }
    });

    contact.onConnected((contact) => {
        logContactState(contact, 'handleContactConnected', 'Contact connected to agent');
        if (!session.state.connected) {
            session.state.connected = true;
            handleContactConnected()
                .then((result) => result)
                .catch((err) => { console.error(logStamp('handleContactConnected'), err) });
        }
    });

    contact.onEnded((contact) => {
        logContactState(contact, 'handleContactEnded', 'Contact has ended successfully');
        handleContactEnded()
            .then((result) => result)
            .catch((err) => { console.error(logStamp('handleContactEnded'), err) });
    });

}