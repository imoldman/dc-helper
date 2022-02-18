import BaseHandler from "./BaseHandler";

export default class BaseMessageHandler extends BaseHandler {
    constructor(businessManager) {
        super(businessManager);
    }

    needProcess(type, messageJson) {
        return type == 'MESSAGE_CREATE' || type == 'MESSAGE_UPDATE';
    }

    pickUpDataFromMessage(messageJ) {}

    async action(data) {}
}