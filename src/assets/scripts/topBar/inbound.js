import logStamp from '../util/log.js';
import session from './session.js';
import { zafClient } from './zafClient.js';
import appendTicketComments from './appendTicketComments.js';
import newTicket from './newTicket.js';
import {
    resize, determineAssignmentBehavior, popUser, popTicket, getFromZD,
    findTicket, findMostRecentTicket, resolveUser, validateTicket
} from './core.js';

export const processInboundCall = async (contact) => {
    console.log(logStamp('Processing inbound call on contact'), contact);
    console.log(logStamp("Attributes map: "), contact.getAttributes());

    session.phoneNo = contact.customerNo;
    let ticketId, user, userId;
    let autoAssignTickets = determineAssignmentBehavior();
    const appSettings = session.zafInfo.settings;

    if (session.callInProgress) {
        ticketId = session.ticketId;
        user = session.user;
        if (!autoAssignTickets && !ticketId) {
            userId = localStorage.getItem('vf.viewingUserId');
            user = userId ? await getFromZD(`users/${userId}.json`, 'user') : user;
            ticketId = localStorage.getItem('vf.viewingTicketId');
        }

    } else {
        let ticket = {};
        ticketId = appSettings.zendeskTicket;   // in case existing ticket was passed via an attribute

        if (session.isTransfer) {
            if (!ticketId)
                ticketId = await findTicket(session.contact.initialContactId);
            if (!ticketId) {
                // ticket being transferred was not found. This could be due to first agent not creating it
                // or, on a rare occassion, due to Zendesk indexing delay.
                // Either way we will switch to agent assignment mode.
                session.zafInfo.settings.createAssignTickets = 'agent';
                autoAssignTickets = false;
                const message = 'No ticket was found related to transfer.\n Reverting to manual mode';
                zafClient.invoke('notify', message, 'alert', { sticky: true });
            } else {
                ticket = await validateTicket(ticketId);
                ticket.fromTransfer = true;
            }

        } else if (ticketId != null) {
            if (ticketId === '0') {
                ticket = { ticketId: 0 }
                if (!autoAssignTickets) {
                    // Set as 0 in the contact flow, alert the agent that customer wants to open a new ticket 
                    const message = 'Request to open a new ticket received';
                    zafClient.invoke('notify', message, 'alert', { sticky: false });
                }
            } else {
                ticket = await validateTicket(ticketId);
                if (!ticket.ticketId) {
                    const message = `Requested ticket #${ticketId} was not found`;
                    zafClient.invoke('notify', message, 'alert', { sticky: true });
                    ticket = { ticketId: 0 }
                }
            }
        }
        ticketId = ticket.ticketId;

        // then attempt to find the user
        user = ticket.fromTransfer
            ? await getFromZD(`users/${ticket.requester}.json`, 'user')
            : await resolveUser(contact, ticket.requester);
    }

    if (user) {
        session.user = user;
        if (!autoAssignTickets)
            newTicket.setRequesterName(user.name);
    } else if (autoAssignTickets) {
        if (session.state.connected) {
            await newTicket.createUser();
            user = session.user;
        }
        ticketId = null;
    }

    userId = user ? user.id : null;
    if (userId)
        localStorage.setItem('vf.currentUserId', userId);

    // for a known user select the most recent open ticket within the set timeframe
    // unless new ticket was explicitly requested
    if (userId && ticketId == null && appSettings.createTicketAfterMinutes) {
        const recentTicket = await findMostRecentTicket(userId);
        ticketId = recentTicket.id;
    }
    if (ticketId) 
        localStorage.setItem('vf.currentTicketId', ticketId);

    if (userId && ticketId) {
        // we have both the user and the ticket
        console.log(logStamp('Found the requested ticket, popping: '), ticketId);
        await popTicket(session.zenAgentId, ticketId);
        await newTicket.refreshUser('ticket', ticketId);
        if (session.state.connected) {
            if (autoAssignTickets) {
                // assign this ticket to call and attach contact details automatically
                if (!session.callInProgress)    // and app was not reloaded in the middle of a call
                    await appendTicketComments.appendContactDetails(session.contact, ticketId);
                zafClient.invoke('popover', 'hide');
            } else
                resize('full');
        } else
            session.ticketId = ticketId;
        return;
    }

    if (ticketId && !autoAssignTickets) {
        // specific zendesk ticket with unknown or anonymous user (only with agent manual assignment)
        await popTicket(session.zenAgentId, ticketId);
        // force user refresh in case agent is already on that ticket
        await newTicket.refreshUser('ticket', ticketId);
        if (session.state.connected)
            resize('full');
        return;
    }

    if (userId) {
        if (session.state.connected) {
            if (autoAssignTickets) {
                // create new ticket and assign it to call and attach contact details automatically
                const ticketId = await newTicket.createTicket().catch((err) => null); //TODO: handle this error
                if (ticketId) {
                    await appendTicketComments.appendContactDetails(session.contact, ticketId);
                    await popTicket(session.zenAgentId, ticketId);
                    zafClient.invoke('popover', 'hide');
                    localStorage.setItem('vf.currentTicketId', ticketId);
                }
            } else {
                await popUser(session.zenAgentId, userId);
                resize('full');
            }
        } else
            await popUser(session.zenAgentId, userId);
        return;
    }

    // anonymous user
    if (session.state.connected) {
        if (autoAssignTickets) {
            // create new ticket and assign it to call and attach contact details automatically
            const ticketId = await newTicket.createTicket().catch((err) => null); //TODO: handle this error
            if (ticketId) {
                await appendTicketComments.appendContactDetails(session.contact, ticketId);
                await popTicket(session.zenAgentId, ticketId);
                zafClient.invoke('popover', 'hide');
                localStorage.setItem('vf.currentTicketId', ticketId);
            }
        } else
            resize('full');
    }
}