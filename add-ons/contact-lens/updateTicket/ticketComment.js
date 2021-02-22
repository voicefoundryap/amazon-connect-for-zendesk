const header = require('./commentHeader');

const wrapInBox = (contents) => {
    return `<div class="contact-lens-box">${contents}</div>`
};

const getTitle = (title) => {
    return `<div class="contact-lens-section-title">${title}</div>`
};

const roundPercentRate = (share, total) => Math.round(share / total * 100);

const extractDate = (s3uri) => {
    const ds = s3uri.split('_')[1];
    const dsUTC = `${ds.substr(0, 4)}-${ds.substr(4, 2)}-${ds.substr(6, 2)}T${ds.substr(9, 2)}:${ds.substr(12, 2)}:00.000Z`;
    return new Date(dsUTC).toLocaleString({}, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });    
};    

const buildCategories = (categories) => {
    return categories.reduce((markup, category) => markup + `<span class="lens-cat">${category}</span>`, '')
}    

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
    return `<pP<strong>${side}</strong> overal sentiment: ${overallLabel}</p>` +
        `<p>Positive: ${positiveRate}%</p><p>Negative: ${negativeRate}%</p><p>Neutral: ${neutralRate}%</p><p>Mixed: ${mixedRate}%</p>`;
}

const getCTRLink = (analysis, connectInstanceUrl) => {
    const contactId = analysis.CustomerMetadata.ContactId;
    let url = connectInstanceUrl;
    if (!url.endsWith('/'))
        url += '/';
    url += `connect/contact-trace-records/details/${contactId}`;
    return `<a href="${url}" rel="noreferer" target="_blank">contact trace record</a>`
}

const buildConversationCharacteristics = (analysis) => {
    const nonTalkTime = analysis.ConversationCharacteristics.NonTalkTime.TotalTimeMillis;
    const agentTalkTime = analysis.ConversationCharacteristics.TalkTime.DetailsByParticipant.AGENT.TotalTimeMillis;
    const customerTalkTime = analysis.ConversationCharacteristics.TalkTime.DetailsByParticipant.CUSTOMER.TotalTimeMillis;
    const totalTime = nonTalkTime + agentTalkTime + customerTalkTime;
    const agentTalkRate = roundPercentRate(agentTalkTime, totalTime);
    const customerTalkRate = roundPercentRate(customerTalkTime, totalTime);
    return `<p>Non-talk time: ${100 - (agentTalkRate + customerTalkRate)}</p>` + 
        `<p>Customer talk time: ${customerTalkRate}</p><p>Agent talk time: ${agentTalkRate}</p>`;
}

const buildTranscript = (analysis) => {
    const agentId = analysis.Participants.find((p) => p.ParticipantRole === 'AGENT').ParticipantId;
    const timeMark = (time) => {
        const formatPart = (num) => Math.floor(num).toString().padStart(2, '0');
        return formatPart(time / 60) + ':' + formatPart(time % 60);
    }
    const capitalise = (string) => string.charAt(0).toUpperCase() + string.slice(1);
    return analysis.Transcript.reduce((markup, turn) => {
        const role = turn.ParticipantId === agentId ? 'agent' : 'customer';
        const sentiment = turn.Sentiment.toLowerCase();
        return markup +
            `<div class="${role}-time">${role.toUpperCase()} &#183; ${timeMark(turn.BeginOffsetMillis / 1000)}</div>` +
            `<div class="${role}-turn"><svg class="sentiment-icon sentiment-icon-agent" xmlns="http://www.w3.org/2000/svg">` +
            `<title>sentiment-${sentiment}</title><use href="#iconSentiment${capitalise(sentiment)}"/></svg>` +
            `<div class="turn-bubble">${turn.Content}</div></div>`
    }, '');
}

const buildComment = (analysis, connectInstanceUrl) => {
    // time of call
    const callTime = `<div><strong>Time of call: </strong>${extractDate(analysis.CustomerMetadata.InputS3Uri)}</div>`;
    // sectionCategories
    const testCategories = ['CustomerWorried', 'CustomerHappy', 'Swearing', 'ProductA', 'ProductB', 'ProductC', 'AgentHelpful', 'LongCategoryNameHere']; 
    const categories = [...analysis.Categories.MatchedCategories, ...testCategories] // remove after testing
    const sectionCategories = categories.length 
        ? getTitle('Categories') + `<div>${buildCategories(categories)}</div>`
        : ''
    // overall sentiment analysis
    const sectionSentiment = getTitle('Overall sentiment analysis') + 
        `<div style="float:left; width: 50%">${buildOverallSentiment(analysis, 'Agent')}</div>` + 
        `<div>${buildOverallSentiment(analysis, 'Customer')}</div>` + 
        `<div style="margin-top: 8px; font-style: italic;">For a more detailed sentiment analysis, 
         view the ${getCTRLink(analysis, connectInstanceUrl)}</div>`; 
    // talk times
    const sectionConversation = getTitle('Conversation characteristics') + 
        `<div style="margin-bottom: 10px;">${buildConversationCharacteristics(analysis)}</div>`
    // transcript
    const sectionTranscript = `<div class="contact-lens-section-title" style="margin-top: 6px;">Transcript</div>` + buildTranscript(analysis);

    return header + 
        wrapInBox(callTime + sectionCategories + sectionSentiment + sectionConversation) + 
        wrapInBox(sectionTranscript);
}

module.exports = buildComment;
