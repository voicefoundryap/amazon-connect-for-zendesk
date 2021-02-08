import ui from './ui.js';
import logStamp from '../util/log.js';
import session from './session.js';
import { zafClient } from './zafClient.js';

export const resize = (size) => {
    if (size === 'full')
        ui.show('newTicketContainer');
    else
        ui.hide('newTicketContainer');

    zafClient.invoke('resize', {
        width: '360px',
        height: size === 'full' ? '610px' : '510px'
    });
}

export const determineAssignmentBehavior = () => {
    const appSettings = session.zafInfo.settings;
    return appSettings.createAssignTickets === 'auto';
}

export const popUser = async (agentId, userId) => {
    if (!userId) return;

    const data = await zafClient.request({
        url: `/api/v2/channels/voice/agents/${agentId}/users/${userId}/display.json`,
        type: 'POST',
        contentType: 'application/json',
        data: null
    }).catch(err => { console.error(logStamp('popUser'), err); });
    console.log(logStamp('user popped'), userId);
}

export const getFromZD = async (path, target, defaultValue = null) => {
    const data = await zafClient.request({
        url: `/api/v2/${path}`,
        type: 'GET',
        contentType: 'application/json',
    }).catch((err) => { console.error(logStamp(`getting ${target} by ${path} from Zendesk API: `), err) });
    const returnValue = data && data[target] ? data[target] : defaultValue;
    console.log(logStamp(`returning ${target} value from obtained from Zendesk API query ${path}: `), returnValue);
    return returnValue;
}

export const popTicket = async (agentId, ticketId) => {
    const data = await zafClient.request({
        url: `/api/v2/channels/voice/agents/${agentId}/tickets/${ticketId}/display.json`,
        type: 'POST',
        contentType: 'application/json',
        data: null
    }).catch(err => { console.error(logStamp('popTicket'), err); });
    console.log(logStamp('ticket popped: '), ticketId);
}

export const findTicket = async (query) => {
    console.log(logStamp('Searching for ticket by query: '), query);
    const tickets = await getFromZD(`search.json?query=type%3Aticket+%22${query}%22`, 'results', []);
    if (tickets.length) {
        const ticket = tickets[0];
        console.log(logStamp('Found matching ticket: '), ticket);
        return ticket.id;
    }
}

const findUser = async (query, requester = null) => {
    console.log(logStamp('Searching for user: '), query, requester);
    if (!query.trim() || ['anonymous', 'private', 'unknown'].includes(query.toLowerCase().trim()))
        return { id: null, name: 'anonymous' };

    const prefix = session.zafInfo.settings.defaultCountryPrefix;
    console.log(logStamp('prefix: '), prefix);
    if (prefix && query.startsWith(prefix))
        query = query.substring(prefix.length);

    console.log(logStamp('Searching for user by query: '), query);
    const users = await getFromZD(`search.json?query=role%3Aend-user%20phone%3A*${query}`, 'results', []);
    if (users.length) {
        console.log(logStamp('Found matching user(s): '), users);
        if (requester) {
            const foundAsReqester = users.find((user) => user.id === requester);
            if (foundAsReqester) {
                console.log(logStamp('Ticket requester matched'), foundAsReqester.name);
                return foundAsReqester;
            } else {
                console.warn(logStamp(`No requester (${requester}) match!`));
                const message = `No user with this phone number matches the requested ticket`;
                zafClient.invoke('notify', message, 'alert', { sticky: true })
                return null;
            }
        }
        const user = users.find((user) => !user.shared_phone_number);
        if (user)
            console.log(logStamp('Found existing user'), user.name);
        return user;
    }
    console.log(logStamp(`User with query ${query} not found`), data);
    return null;
}

export const findMostRecentTicket = async (userId) => {
    const timeSpan = session.zafInfo.settings.createTicketAfterMinutes;
    // console.log(logStamp('time span in minutes: '), timeSpan);
    if (timeSpan == 0) return {};
    const tickets = await getFromZD(`users/${userId}/tickets/requested.json?sort_by=updated_at&sort_order=desc`, 'tickets', []);
    if (tickets.length) {
        const openTickets = tickets.filter((ticket) => ticket.status !== 'closed');
        if (openTickets.length) {
            const ticket = openTickets[0];
            console.log(logStamp('Found most recent ticket'), ticket);
            const timePassed = Math.floor((new Date() - new Date(ticket.updated_at).getTime()) / 1000 / 60);
            console.log(logStamp(`minutes passed since last update: `), timePassed);
            return timePassed <= timeSpan ? ticket : {};
        } else
            console.log(logStamp(`User ${userId} doesn't have any active tickets`));
    } else
        console.log(logStamp(`User ${userId} doesn't exist or has no tickets`));

    return {};
}

export const resolveUser = async (contact, requester = null, dialOut = null) => {

    // obtained from dial-out event?
    if (dialOut) {
        if (!dialOut.userId)
            return null;

        console.log(logStamp('Searching for user by dialout'), dialOut.userId);
        return getFromZD(`users/${dialOut.userId}.json`, 'user');
    }

    const appSettings = session.zafInfo.settings;
    // obtained from the contact flow attribute?
    const userId = appSettings.zendeskUser;
    if (userId) {
        console.log(logStamp('Searching for user by id via attribute'), userId);
        const user = await getFromZD(`users/${userId}.json`, 'user');
        if (!user) {
            const message = `A user with the specified user id #${userId} was not found`;
            zafClient.invoke('notify', message, 'alert', { sticky: true });
            return null;
        }
        if (requester != null && user.id !== requester) {
            const message = `Requested ticket doesn't belong to this user`;
            zafClient.invoke('notify', message, 'alert', { sticky: true })
            return null;
        }
        return user;
    }

    console.log(logStamp('trying to find user by phone'));

    return appSettings.userPhone
        // use the phone number from the contact flow attribute if we have one
        ? findUser(appSettings.userPhone.replace(/[ \.\(\)-]/g, ''), requester)
        // otherwise use phone number from the contact information
        : findUser(contact.customerNo, requester);
}

export const validateTicket = async (ticketId) => {
    console.log(logStamp('Searching for ticket by number: '), ticketId);
    const ticket = await getFromZD(`tickets/${ticketId}.json`, 'ticket');
    return ticket 
        ? { 
            ticketId: ticket.id, 
            requester: ticket.requester_id }
        : {}    
}