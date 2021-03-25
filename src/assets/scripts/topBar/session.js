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

    clear: function (withStorage = true) {
        this.contact = {};
        this.state = {
            callback: false,
            connecting: false,
            connected: false
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
        if (withStorage) this.clearStorage();
    },

    clearStorage: function () {
        // preserve just the focused window
        const focusedTab = localStorage.getItem('vf.tabInFocus');
        localStorage.clear();
        if (focusedTab) {
            // needs an out of thread execution for some reason
            window.setTimeout(() => { localStorage.setItem('vf.tabInFocus', focusedTab) }, 0);
        }
    }
}
