export default {
    contact: {},
    agent: {},
    zafInfo: {},
    appConfig: [],
    state: {
        callback: false,
        connecting: false,
        connected: false,
        callEnded: false
    },
    transcriptHtml: '',
    visitedTabs: {},
    appendedAttributes: {},
    isTransfer: false,
    isMonitoring: false,
    callInProgress: false,
    pauseRecording: false,

    clear: function () {
        this.contact = {};
        this.state = {
            callback: false,
            connecting: false,
            connected: false,
            callEnded: false
        };
        this.isTransfer = false;
        this.isMonitoring = false;
        this.outbound = false;
        this.appendedAttributes = {}
        this.ticketId = null;
        this.ticketAssigned = false;
        this.user = null;
        this.phoneNo = '';
        this.transcriptHtml = '';
        this.speechAnalysisHtml = '';
        this.dialOut = null;
        this.ticketInstance = null;
        this.contactDetailsAppended = false;
        this.appConfig.forEach((setting) => this.zafInfo.settings[setting.name] = setting.value || setting.default);
        this.callInProgress = false;
        this.pauseRecording = false;
        this.clearStorage();
    },

    clearStorage: function () {
        // preserve just the focused window
        const tabs = localStorage.getItem('vf.tabsInFocus');
        localStorage.clear();
        if (tabs) {
            // needs an out of thread execution for some reason
            window.setTimeout(() => { localStorage.setItem('vf.tabsInFocus', tabs) }, 0);
        }
    },

    refocusTabs: function (focus = true) {
        // make the current tab the most recent (index 0) or remove it from the list
        let tabs = JSON.parse(localStorage.getItem('vf.tabsInFocus')) || [];
        tabs = [...tabs.filter((tabId) => tabId !== this.windowId)];
        if (focus) tabs = [this.windowId, ...tabs];
        localStorage.setItem('vf.tabsInFocus', JSON.stringify(tabs));
    }
}
