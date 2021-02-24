import logStamp from '../util/log.js';
import session from './session.js';
import { dialableNumber } from './phoneNumbers.js';
import { zafClient } from './zafClient.js';

let appSettings = {}
let contactAttributes = {};
let outboundCli, inboundDialedNumber;

const systemAttributes = ['aid', 'sak', 'sst', 'cfg', 'kvsTriggerLambdaResult', 'saveCallRecording',
    'startStreamingAudioStatus', 'transcribeCall'];

const link = (url, text) => {
    return `<a href="${url}" rel="noreferer" target="_blank">${text}</a>`;
}

const contactDetailsHtml = (dict, title, noUnderscores = true) => {
    // console.log(logStamp('contact details:'), dict);
    let details = `<p><em>${title}</em></p><p>`;
    details = Object.keys(dict).reduce((s, key) => {
        const separator = s != details ? (appSettings.compactAttributesMode ? ', ' : '<br>') : '';
        const item = `<strong>${(noUnderscores ? key.replace(/_/g, '&nbsp;') : key)}:&nbsp;</strong>${dict[key]}`
        return s + separator + item;
    }, details);

    return details + '</p>';
}

const contactDetailsPlain = (dict, title, noUnderscores = true) => {
    let details = `${title.toUpperCase()}\n\n`;
    details = Object.keys(dict).reduce((s, key) => {
        const item = `${(noUnderscores ? key.replace('_', ' ') : key)}: ${dict[key]}\n`
        return s + item;
    }, details);

    return details + '\n';
}

const getConnectUrl = () => {
    let url = session.zafInfo.settings.connectInstanceUrl;
    if (!url.endsWith('/'))
        url += '/';
    if (url.endsWith('.awsapps.com/'))
        url += 'connect/';
    return url;
}

const recordingUrl = (contactId) => 
    `${getConnectUrl()}get-recording?format=wav&callLegId=${contactId}&zendesk_format=.wav`;

const traceUrl = (contactId) => {
    let url = `${getConnectUrl()}contact-trace-records/details/${contactId}`;
    let timeZone = session.zafInfo.settings.timeZone;
    if (timeZone)
        url += `?tz=${timeZone}`;
    return url;
}

const updateTicket =  async (ticketId, changes) => {
    const data = await zafClient.request({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            ticket: changes
        })
    }).catch((err) => { console.error(logStamp('Error while updating ticket'), err) });

    if (data && data.ticket)
        console.log(logStamp(`Updated ticket ${data.ticket.id} with: `), changes);
}

const updateTicketWithContactDetails = async (contact, ticketId) => {
    // adds information to an existing ticket about the call, including a link to call recording
    // console.log(logStamp(`Updating ticket #${ticketId} with contact details`), contact);

    let direction;
    let htmlBody = '', plainBody = '';

    outboundCli = appSettings.outboundCli;
    inboundDialedNumber = appSettings.inboundDialedNumber || outboundCli;

    if (!session.contactDetailsAppended) {

        const agent = session.agent;

        const contactCallInfo = {
            Direction: session.outbound ? 'outbound' : 'inbound',
            Contact_Id: contact.contactId,
            Recording_file: `${link(recordingUrl(contact.contactId), 'download')} (available within a few minutes after the call)`,
            Contact_Trace_Record_URL: `${link(traceUrl(contact.contactId), 'view')} (available within a few minutes after the call)`,
            Queue_Name: contact.getQueue().name,
            Agent_Name: agent.getName(),
            Agent_Routing_Profile: agent.getRoutingProfile().name,
            Agent_Extension: agent.isSoftphoneEnabled() ? 'Softphone' : agent.getExtension()
        };

        if (!session.zafInfo.settings.enableVoiceComment) {
            contactCallInfo.Call_from = session.outbound ? outboundCli : contact.customerNo;
            contactCallInfo.Call_to = session.outbound ? contact.customerNo.split('@')[0].replace('sip:', '') : inboundDialedNumber;
        }

        if (!session.zafInfo.settings.enableRecordingDownload)
            delete contactCallInfo.Recording_file;

        htmlBody = contactDetailsHtml(contactCallInfo, 'Amazon Connect Contact Details');
        plainBody = contactDetailsPlain(contactCallInfo, 'Amazon Connect Contact Details');
        session.contactDetailsAppended = true;
    }

    let contactAttributesInfo = {};
    Object.keys(contactAttributes)
        .filter((attr) => !systemAttributes.includes(attr))
        .forEach((attr) => {
            const attrValue = contactAttributes[attr].value;
            if (!(attr in session.appendedAttributes) || session.appendedAttributes[attr] !== attrValue) {
                contactAttributesInfo[attr] = attrValue;
                session.appendedAttributes[attr] = attrValue;
            }
        });

    // console.log(logStamp('built attribute dict'), contactAttributesInfo);

    if (Object.keys(contactAttributesInfo).length) {
        htmlBody += (htmlBody ? '<br>' : '') + contactDetailsHtml(contactAttributesInfo, 'Amazon Connect Contact Attributes', false);
        plainBody += (plainBody ? '\r\n' : '') + contactDetailsPlain(contactAttributesInfo, 'Amazon Connect Contact Attributes', false);
        localStorage.setItem('vf.storedAttributes', JSON.stringify(contactAttributesInfo));
    }

    if (htmlBody) {
        await updateTicket(ticketId, {
            comment: {
                html_body: `<div>${htmlBody}</div>`,
                plain_body: plainBody,
                public: false
            },
            via_id: direction === 'inbound' ? 45 : 46
        });
    }
}

export default {

    appendContactDetails: async (contact, ticketId, showApps=true) => {

        contactAttributes = contact.getAttributes();
        appSettings = session.zafInfo.settings;

        await updateTicketWithContactDetails(contact, ticketId);
        session.ticketId = ticketId;
        session.ticketAssigned = true;
        if (appSettings.speechAnalysisEnabled && showApps) {
            // open mini app
            zafClient.invoke('appsTray.show');
        }
        localStorage.setItem('vf.assignedTicketId', ticketId);

        // do we need to update the user with the CLI?
        const cliNumber = session.phoneNo;
        const user = session.user;
        if (user.id && cliNumber && !isNaN(cliNumber) && cliNumber !== dialableNumber(user.phone)) {
            console.log(logStamp(`Number ${cliNumber} will be added to user ${user.name}`));
            await zafClient.request({
                url: `/api/v2/users/${user.id}.json`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    user: { phone: cliNumber }
                })
            }).catch((err) => { console.error(logStamp('Error while updating user phone '), err) });
        }    
    },

    appendTheRest: async (contact, ticketId) => {

        contactAttributes = contact.getAttributes();
        appSettings = session.zafInfo.settings;

        //SA TODO: extract into speech analysis core
        if (appSettings.speechAnalysisEnabled) {
            if (session.speechAnalysisHtml) {
                // console.log(logStamp('Adding speech analysis'));
                await updateTicket(ticketId, {
                    comment: {
                        html_body: session.speechAnalysisHtml,
                        public: false
                    }
                });
                session.speechAnalysisHtml = null;
            }
        }

        await updateTicketWithContactDetails(contact, ticketId);

        if (appSettings.enableVoiceComment) {
            // console.log(logStamp('Adding voice comment'));
            const callEndedAt = new Date();

            await updateTicket(ticketId, {
                voice_comment: {
                    from: session.outbound ? outboundCli : contact.customerNo,
                    to: session.outbound ? contact.customerNo.split('@')[0].replace('sip:', '') : inboundDialedNumber,
                    recording_url: recordingUrl(contact.contactId),
                    started_at: session.callStarted.toISOString(),
                    call_duration: Math.round((callEndedAt - session.callStarted) / 1000),
                    answered_by_id: session.zenAgentId,
                }
            });
        }

        zafClient.invoke('appsTray.hide');
        zafClient.invoke('routeTo', 'ticket', ticketId);
    }
}