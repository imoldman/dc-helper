export default class BaseHandler {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(type, messageJson) {
        return false;
    }

    pickUpDataFromMessage(messageJ) {}

    async action(data) {}
}