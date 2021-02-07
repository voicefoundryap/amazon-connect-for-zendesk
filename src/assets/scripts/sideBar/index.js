import getTopBarInstance from '../util/topBarInstance.js';
import logStamp from '../util/log.js';
import ui from './ui.js';

let topBarInstance;
let tabType;
let itemId;

const showAnalysis = (enable) => {
    if (enable) {
        console.log(logStamp('enabling the speech analysis pane'));
        client.invoke('resize', { width: '100%', height: '60vh' });
        client.invoke('show');
    } else {
        // console.log(logStamp('disabling the speech analysis pane'));
        client.invoke('hide');
    }
}

const client = ZAFClient.init();
client.context().then((context) => {
    // console.log(logStamp("sideBar loaded, context: "), context);
    showAnalysis(localStorage.getItem('vf.sidebar-enable') === 'true');
    tabType = context.location.split('_')[0];
    itemId = tabType === 'user' ? context.userId : context.ticketId;
    getTopBarInstance(client).then((instance) => {
        topBarInstance = instance;
        topBarInstance.trigger('vf.tab_switched', { tabType, itemId });
    });
});

client.on('app.activated', async (context) => {
    // console.log(logStamp("app activated"), itemId);
    if (!topBarInstance)
        topBarInstance = await getTopBarInstance(client);
    if (topBarInstance && !context.firstLoad)
        topBarInstance.trigger('vf.tab_switched', { tabType, itemId });

});

client.on('app.deactivated', async () => {
    // console.log(logStamp("app deactivated"), itemId);
    if (!topBarInstance)
        topBarInstance = await getTopBarInstance(client);
    if (topBarInstance)
        topBarInstance.trigger('vf.tab_switched', { tabType: 'other', itemId: null });
});

window.onload = (event) => {
    const transcriptContainer = document.getElementById('transcript-text');
    const transcriptHtml = localStorage.getItem('vf.transcript-init');
    if (transcriptHtml) {
        transcriptContainer.innerHTML = transcriptHtml;
        transcriptContainer.scrollIntoView(false);
    }
    window.addEventListener('storage', (event) => {
        // console.log(logStamp(`received storage event on ${tabType} ${itemId}: `), event)
        let data;
        switch (event.key) {
            case 'vf.transcript-init':
                transcriptContainer.innerHTML = event.newValue;
                transcriptContainer.scrollIntoView(false);
                break;
            case 'vf.transcript-fragment':
                $('#transcript-text').append(event.newValue);
                break;
            case 'vf.transcript-span':
                data = JSON.parse(event.newValue);
                $('#transSpan' + data.segment).html(data.text);
                transcriptContainer.scrollIntoView(false);
                $('.awsui-tooltip-trigger').tipsy({
                    gravity: 'n',
                    fade: true
                });
                break;
            case 'vf.entities-element':
                $('#entitiesTable').append(event.newValue);
                break;
            case 'vf.key-phrases':
                $('#keyPhrasesTable').append(event.newValue);
                break;
            case 'vf.refresh-sentiment':
                data = JSON.parse(event.newValue);
                ui.refreshSentiment(data);
                break;
            case 'vf.content-clear':
                transcriptContainer.innerHTML = '';
                ui.resetComprehendTables();
                ui.resetSentiment();
                break;
            case 'vf.sidebar-enable':
                console.log('[vf] showAnalysis triggered with ', event.newValue);
                showAnalysis(event.newValue === 'true');
                break;
        }
    });
}
