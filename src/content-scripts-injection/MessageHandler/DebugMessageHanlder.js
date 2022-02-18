import { message } from 'antd';
import { f } from '../../../dist/js/demo';
import NotificationHelper from '../NotificationHelper';
import { delay, log, error } from '../util'
import BaseHandler from './BaseHandler';

export default class DebugMesssageHandler extends BaseHandler {
    constructor(businessManager, filter) {
        super(businessManager);
        this.filter = filter;
    }

    needProcess(type, messageJ) {
        return this.filter(type, messageJ);
    }

    pickUpDataFromMessage(messageJ) {
        return messageJ;
    }
}