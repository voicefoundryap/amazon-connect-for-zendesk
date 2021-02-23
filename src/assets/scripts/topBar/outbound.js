import logStamp from '../util/log.js';
import session from './session.js';
import { zafClient } from './zafClient.js';
import appendTicketComments from './appendTicketComments.js';
import newTicket from './newTicket.js';
import { resize, determineAssignmentBehavior, popUser, popTicket, resolveUser } from './core.js';

export const processOutboundCall = async (contact) => {
    console.log(logStamp('Processing outbound call on contact'), contact);

    session.outbound = true;
    const dialOut = session.dialOut;
    console.log(logStamp(dialOut && dialOut.number ? 'dialOut: ' : 'Dialed out manually'), dialOut);

    const autoAssignTickets = determineAssignmentBehavior();

    let user, userId, ticketId;
    if (session.callInProgress) {
        ticketId = session.ticketId;
        user = session.user;
    } else {
        // attempt to resolve user first
        user = await resolveUser(contact, null, dialOut).catch((err) => {
            console.error(logStamp('processOutboundCall'), err);
            return null;
        });
    }

    if (user) {
        // recognised user from either the dial pad or a dial-out event
        console.log(logStamp('resolved user'), user);
        session.user = user;
        userId = user.id;
        localStorage.setItem('vf.viewingUserId', userId);

        // for a new call determine the ticket from the dialout event
        ticketId = ticketId || (dialOut ? dialOut.ticketId : null);

        if (ticketId) {
            // currently open zendesk ticket was obtained from the dialOut event
            if (!session.callInProgress) {
                await appendTicketComments.appendContactDetails(contact, ticketId);
            }
        } else {
            if (autoAssignTickets) {
                // create new ticket for the user
                ticketId = await newTicket.createTicket().catch((err) => null); //TODO: handle this error
                if (ticketId) {
                    await appendTicketComments.appendContactDetails(contact, ticketId);
                    await popTicket(session.zenAgentId, ticketId);
                    zafClient.invoke('popover', 'hide');
                }
            } else {
                // pop the user and let agent decide further actions
                await popUser(session.zenAgentId, userId);
                newTicket.setRequesterName(user.name);
                resize('full');
            }
        }

    } else if (dialOut && !dialOut.number && session.currentTabTicket) {
        // number called manually from specific ticket tab
        console.log(logStamp('currentTabTicket:'), session.currentTabTicket);

        // check if not a zombie ticket
        const data = await zafClient.get('instances');
        console.log(logStamp('instances: '), data.instances);
        const ticketInstances = Object.keys(data.instances)
            .filter((guid) => data.instances[guid].location === 'ticket_sidebar')
        console.log(logStamp('open ticket instances: '), ticketInstances.length);
        if (ticketInstances.length) {
            const ticketId = session.currentTabTicket;
            await appendTicketComments.appendContactDetails(contact, ticketId);
            zafClient.invoke('popover', 'hide');
        }
    }
}