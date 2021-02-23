import logStamp from '../util/log.js';
import { zafClient } from './zafClient.js';

const hardcoded = [
    {
        name: "createTicketAfterMinutes",
        label: "Create ticket after minutes",
        description: "This setting controls whether a recent ticket of a recognised caller should be opened instead of creating a new one. E.g. 15 means that a new ticket will be created if no such ticket exist for the user that was last updated less than 15 minutes ago.",
        type: "number",
        default: 0,
        legacy: true, // takes value from application settings
        attribute: "recent_ticket_timeout"
    },
    {
        name: "createAssignTickets",
        label: "Create or assign tickets behavior",
        description: "Determines how tickets are created or assigned to a call. When set to \"auto\" (default) a new ticket will be created or the most recent assigned automatically. When set to \"agent\" the agent will have control over creation of new tickets or selecting from existing ones to attach the call to.",
        type: "text",
        valueCheck: true,
        default: "auto", // "auto" | "agent"
        attribute: "ticket_assignment"
    },
    {
        name: "forceTicketCreation",
        label: "Force ticket creation for every call",
        description: "When ticket assignment is set to \"agent\" this flag determines whether to force create a ticket in case agent hasn't created or assigned one during the call.",
        type: "checkbox",
        default: true, 
        attribute: "force_ticket_creation"
    },
    {
        name: "popBeforeCallConnected",
        label: "Display customer/ticket details in Zendesk before accepting the incoming call",
        description: "If this option is unticked then customer or ticket details will be displayed in Zendesk only after the agent accepts the call.",
        type: "checkbox",
        default: true,
        attribute: "pop_incoming"
    },
    {
        name: "enableVoiceComment",
        label: "Insert call details with embedded player for the recording",
        description: "Call details such as where the call originated from, who answered it, time and length of the conversation and audio recording of the call will be appended to the ticket.",
        type: "checkbox",
        default: true,
        attribute: "voice_comment"
    },
    {
        name: "enableRecordingDownload",
        label: "Provide a link to download the call recording",
        description: "A link to download the audio file of the call recording will be included in the call comments section.",
        type: "checkbox",
        default: true,
        attribute: "download_recording"
    },
    {
        name: "inboundDialedNumber",
        label: "Inbound dialed number",
        description: "The number that will be reported in tickets as the number that the caller dialled (in inbound calls). Ifnot specified the outbound CLI number will be used.",
        type: "attribute",
        valueCheck: true,
        default: null,
        attribute: "dialed_number"
    },
    {
        name: "zendeskTicket",
        label: "Contact attribute name containing Zendesk Ticket Number",
        description: "The Amazon Connect contact attribute that contains an existing ticket number to display. If this is set in a contact flow the ticket number specified will be opened.",
        type: "attribute",
        default: null,
        legacy: true, // takes attribute name from application settings
        attribute: "zendesk_ticket"
    },
    {
        name: "zendeskUser",
        label: "Contact attribute name containing Zendesk User ID",
        description: "The Amazon Connect contact attribute that contains an existing Zendesk user ID. If this is set in a contact flow without the ticket number (see above) then the specified user will be opened.",
        type: "attribute",
        default: null,
        attribute: "zendesk_user"
    },
    {
        name: "userPhone",
        label: "Contact attribute name containing the main phone number of the user",
        description: "The Amazon Connect contact attribute that contains the user's phone number which may be different from the number that the user dialed from. This number would then be used in search instead of the CLI.",
        type: "attribute",
        valueCheck: true,
        default: null,
        attribute: "customer_number"
    },
    {
        name: "userName",
        label: "Contact attribute name containing user name for unrecognised caller",
        description: "The Amazon Connect contact attribute that contains the user's name which may be obtained from a different source, eg. sales database. This name would then be applied to the newly created Zendesk user instead of the CLI.",
        type: "attribute",
        default: null,
        attribute: "customer_name"
    },
    {
        name: "customerLanguage",
        label: "2-letter Code of your Customer Language",
        description: "Required for Speech Analysis. Supported language codes are: en, es, fr, de, it, pt, ar, hi, ja, ko, zh, and zh-TW. Defaults to English (en).",
        type: "text",
        valueCheck: true,
        default: "en",
        attribute: "customer_language"
    },
    {
        name: "speechAnalysis",
        label: "Append advanced speech analysis to tickets",
        description: "Uses Amazon Transcribe & Amazon Comprehend to perform realtime transcription, text comprehension and sentiment analysis and allows you to add results to ticket comments.",
        type: "checkboxgroup",
        valueCheck: true,
        default: null, //"transcript,comprehend,sentiment"
        attribute: "speech_analysis"
    },
    {
        name: "pauseRecording",
        label: "Enable pause and resume recording of the call",
        description: "Displays pause/resume button to enable agent pause the call recording while obtaining sensitive data (eg. credit card details) from the customer.",
        type: "checkbox",
        default: false,
        attribute: "pause_recording"
    }
];

const getConfig = async (session) => {
    // in the future this will come from the client's DynamoDB table via a lambda call
    const config = hardcoded.map((setting) => {
        if (setting.legacy) {
            // use legacy application settings 
            const zafSettingValue = session.zafInfo.settings[setting.name];
            if (setting.type === 'attribute')
                setting.attribute = zafSettingValue;
            else
                setting.value = setting.type === 'number'
                    ? (zafSettingValue && !isNaN(zafSettingValue) ? zafSettingValue * 1 : 0)
                    : zafSettingValue;
        }
        return setting;
    });

    return config;
}

const init = async (session) => {
    session.appConfig = await getConfig(session).catch((err) => {
        console.error(logStamp('Error obtaining app config: '), err);
        return [];
    });
}

const evaluate = (isValid, value, attrName, expected) => {
    if (isValid(value)) return true;

    const message = `Expecting ${expected} in attribute ${attrName}, got: ${value}`;
    console.error(logStamp(message));
    zafClient.invoke('notify', message, 'error', { sticky: true });
    return false;
}

const valueChecks = (setting, value, attrName) => {
    if (setting.type === 'number')
        return evaluate((v) => !isNaN(v), value, attrName, 'numeric value');

    if (setting.type === 'checkbox')
        return evaluate((v) => ['true', 't', '1', 'yes', 'y', 'false', 'f', '0', 'no', 'n'].includes(v), value, attrName, 'true/false');

    if (setting.valueCheck)
        switch (setting.name) {
            case 'createAssignTickets':
                return evaluate((v) => ['auto', 'agent'].includes(v), value, attrName, "'auto' or 'agent'");
            case 'userPhone':
            case 'inboundDialedNumber':
                return evaluate((v) => !isNaN(v.replace(/[ \.\(\)-]/g, '')), value, attrName, 'a phone number');
            case 'customerLanguage':
                return evaluate((v) => ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW'].includes(v),
                    value, attrName, 'supported language code');
            case 'speechAnalysis':
                return evaluate((v) => {
                    const parts = v.split(',');
                    return parts.reduce((valid, part) =>
                        valid && ['transcript', 'comprehend', 'sentiment'].includes(part.toLowerCase().trim()), true);
                }, value, attrName, "a combination of 'transcript', 'comprehend' or 'sentiment'");
        }

    return true;
}

const applyAttributes = async (session) => {
    if (!session.appConfig.length) {
        await init(session);
        session.appConfig.forEach((setting) => session.zafInfo.settings[setting.name] = setting.value || setting.default)
    }

    const attributes = session.contact.getAttributes();
    console.log(logStamp('Applying config attributes: '), attributes);
    session.appConfig.forEach((setting) => {
        if (setting.attribute.trim()) { // attribute name must be a non-empty string, ignore if empty
            const attribute = attributes[setting.attribute];
            if (attribute) {
                const attrValue = attribute.value;
                if (!(['', '-', 'none', 'empty', 'ignore', 'timeout'].includes(attrValue.toLowerCase().trim()) 
                    || !valueChecks(setting, attrValue, attribute.name))) {
                    let value = attrValue;
                    if (setting.type === 'number') value = attrValue * 1;
                    if (setting.type === 'checkbox') value = ['true', 't', '1', 'yes', 'y'].includes(attrValue);
                    session.zafInfo.settings[setting.name] = value;
                }
            }
        }
    });
}

export default { applyAttributes }