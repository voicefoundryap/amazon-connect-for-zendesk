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
        // preserve just the focused window ('vf.tabInfocus')
        const vfStorage = [
            'vf.storedAttributes', 
            'vf.processingTab', 
            'vf.currentlyRecording', 
            'vf.viewingUserId', 
            'vf.viewingTicketId',
            'vf.assignedTicketId', 
        ];
        vfStorage.forEach((key) => localStorage.removeItem(key));
    }
}
