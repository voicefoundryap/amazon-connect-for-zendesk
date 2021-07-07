const header = require('./commentHeader');

const wrapInBox = (contents) => {
    return `<div class="contact-lens-box">${contents}</div>`;
};

const getTitle = (title) => {
    return `<div class="contact-lens-section-title">${title}</div>`;
};

const roundPercentRate = (share, total) => Math.round(share / total * 100);

const buildCategories = (categories) => {
    return categories.reduce((markup, category) => markup + `<div class="lens-cat">${category}</div>`, '');
};

const buildOverallSentiment = (analysis, side) => {
    const sideKey = side.toUpperCase();
    const participantId = analysis.Participants.find((p) => p.ParticipantRole === sideKey).ParticipantId;
    const overallScore = analysis.ConversationCharacteristics.Sentiment.OverallSentiment[sideKey];
    let overallLabel = 'Neutral';
    if (overallScore > 1.5) overallLabel = 'Positive';
    if (overallScore < -1.5) overallLabel = 'Negative';
    const participantTurns = analysis.Transcript.filter((turn) => turn.ParticipantId === participantId);
    const calcSentimentRate = (label) => roundPercentRate(participantTurns.filter((turn) => turn.Sentiment === label).length, participantTurns.length);
    const positiveRate = calcSentimentRate('POSITIVE');
    const negativeRate = calcSentimentRate('NEGATIVE');
    const neutralRate = calcSentimentRate('NEUTRAL');
    const mixedRate = 100 - (positiveRate + negativeRate + neutralRate);
    return `<p><strong>${side}</strong> overall sentiment: ${overallLabel}</p>` +
        `<p>Positive: ${positiveRate}%</p><p>Negative: ${negativeRate}%</p><p>Neutral: ${neutralRate}%</p><p>Mixed: ${mixedRate}%</p>`;
};

const getCTRLink = (analysis) => {
    const contactId = analysis.CustomerMetadata.ContactId;
    let url = process.env.CONNECT_INSTANCE_URL;
    if (!url)
        return 'related contact trace record';

    if (url.endsWith('.awsapps.com'))
        url += '/connect';
    url += `/contact-trace-records/details/${contactId}`;
    if (process.env.TIME_ZONE)
        url += `?tz=${process.env.TIME_ZONE}`;
    return `<a href="${url}" rel="noreferer" target="_blank">contact trace record</a>`;
};

const buildConversationCharacteristics = (analysis) => {
    const nonTalkTime = analysis.ConversationCharacteristics.NonTalkTime.TotalTimeMillis;
    const agentTalkTime = analysis.ConversationCharacteristics.TalkTime.DetailsByParticipant.AGENT.TotalTimeMillis;
    const customerTalkTime = analysis.ConversationCharacteristics.TalkTime.DetailsByParticipant.CUSTOMER.TotalTimeMillis;
    const totalTime = nonTalkTime + agentTalkTime + customerTalkTime;
    const agentTalkRate = roundPercentRate(agentTalkTime, totalTime);
    const customerTalkRate = roundPercentRate(customerTalkTime, totalTime);
    return `<p>Non-talk time: ${100 - (agentTalkRate + customerTalkRate)}%</p>` + 
        `<p>Customer talk time: ${customerTalkRate}%</p><p>Agent talk time: ${agentTalkRate}%</p>`;
};

const buildTranscript = (analysis) => {
    const agentId = analysis.Participants.find((p) => p.ParticipantRole === 'AGENT').ParticipantId;
    const timeMark = (time) => {
        const formatPart = (num) => Math.floor(num).toString().padStart(2, '0');
        return formatPart(time / 60) + ':' + formatPart(time % 60);
    };
    const smileyIcons = {
        positive: '&#x1F600',
        neutral: '&#x1F610',
        mixed: '&#x1F615',
        negative: '&#x1F620'
    };
    return analysis.Transcript.reduce((markup, turn) => {
        const role = turn.ParticipantId === agentId ? 'agent' : 'customer';
        const sentiment = turn.Sentiment.toLowerCase();
        const smiley = `<div class="sentiment-icon sentiment-icon-${role}" style="background-color: #fafafa;">${smileyIcons[sentiment]}</div>`;
        return markup +
            `<div class="${role}-time">${role.toUpperCase()} &#183; ${timeMark(turn.BeginOffsetMillis / 1000)}</div>` + 
            `<div class="${role}-turn">` +
            (role === 'agent'
                ? `${smiley}<div class="turn-bubble">${turn.Content}</div>`
                : `<div class="turn-bubble">${turn.Content}</div>${smiley}`) +
            `</div>`;
    }, '');
};

const buildComment = (analysis) => {
    // time of call
    const contactIdNote = `<div><strong>Contact ID: </strong>${analysis.CustomerMetadata.ContactId}</div>`;
    // sectionCategories
    const categories = analysis.Categories.MatchedCategories;
    const sectionCategories = categories.length 
        ? getTitle('Categories') + `<div>${buildCategories(categories)}</div>`
        : '';
    // overall sentiment analysis
    const sectionSentiment = getTitle('Overall sentiment analysis') + 
        `<div style="float:left; width: 50%">${buildOverallSentiment(analysis, 'Agent')}</div>` + 
        `<div>${buildOverallSentiment(analysis, 'Customer')}</div>` + 
        `<div style="margin-top: 8px; font-style: italic;">For a more detailed sentiment analysis, ` +
        `view the ${getCTRLink(analysis)}</div>`; 
    // talk times
    const sectionConversation = getTitle('Conversation characteristics') + 
        `<div style="margin-bottom: 10px;">${buildConversationCharacteristics(analysis)}</div>`;
    // transcript
    const sectionTranscript = `<div class="contact-lens-section-title" style="margin-top: 6px;">Transcript</div>` + buildTranscript(analysis);

    return header() + 
        wrapInBox(contactIdNote + sectionCategories + sectionSentiment + sectionConversation) + 
        wrapInBox(sectionTranscript);
};

module.exports = buildComment;
