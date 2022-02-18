import pako from 'pako';
import BusinessManager from './BusinessManager';
import ATMeMessageHandler from './MessageHandler/AtMeMessageHandler';
import DynoGiveawayMessageHandler from './MessageHandler/DynoGiveawayMessageHandler';
import GiveawayBoatMessageHanlder from './MessageHandler/GiveawayBoatMessageHandler';
import GiveawayBotMessageHanlder from './MessageHandler/GiveawayBotMessageHanlder';
import IgnoreMessageHandler from './MessageHandler/IgnoreMessageHanlder';
import InviteTrackerGiveawayMessageHandler from './MessageHandler/InviteTrackerGiveawayMessageHandler';
import DebugMesssageHandler from './MessageHandler/DebugMessageHanlder';
import NewChannelHandler from './MessageHandler/NewChannelHandler';
import RumbleRoyaleCommonMessageHandler from './MessageHandler/RumbleRoyaleCommonMessageHandler';
import RumbleRoyaleJoinMessageHanlder from './MessageHandler/RumbleRoyaleJoinMessageHandler';
import {log, error} from './util';

const CHUNK_SIZE = 1024 * 64;

export default class WebSocketListener {
    constructor(businessManager) {
        this.businessManager = businessManager;
        this.initMessaegHandlers();
        this.initInflate();
        this.initListener();
        window.webSocketListener = this;
    }

    initMessaegHandlers() {
        this.messageHandlers = [];
        this.messageHandlers.push(new DebugMesssageHandler(this.businessManager, (type, messageJ) => {
            if ((type == 'MESSAGE_CREATE' || type == 'MESSAGE_UPDATE') && messageJ['author'] && messageJ['author']['id'] == '155149108183695360') {
                return true;
            }
            return false;
        }));
        this.messageHandlers.push(new ATMeMessageHandler(this.businessManager));
        this.messageHandlers.push(new RumbleRoyaleJoinMessageHanlder(this.businessManager));
        this.messageHandlers.push(new RumbleRoyaleCommonMessageHandler(this.businessManager));
        this.messageHandlers.push(new InviteTrackerGiveawayMessageHandler(this.businessManager));
        this.messageHandlers.push(new GiveawayBotMessageHanlder(this.businessManager));
        this.messageHandlers.push(new GiveawayBoatMessageHanlder(this.businessManager));
        this.messageHandlers.push(new DynoGiveawayMessageHandler(this.businessManager));
        this.messageHandlers.push(new NewChannelHandler(this.businessManager));
        this.ignoreMessageHandler = new IgnoreMessageHandler(this.businessManager);
    }

    initInflate() {
        this.inflate = new pako.Inflate({chunkSize: CHUNK_SIZE});
        this.bufferedData = [];
        this.inflate.onData = (data) => {
            this.bufferedData.push(data);
            // log(`in inflate.onData, length: ${data.length}`);
        };
        this.inflate.onEnd = (status) => {
            // log(`in inflate.onEnd, status: ${status}`);
        }
    }

    initListener() {
        this.onDCHWebSocketReconnect = (socket) => {
            log(`WebSocekt Reconnected`);
            this.socket = socket;
            this.initInflate();
        }
        this.onDCHWebSocketBeforeSend = (socket, data) => {
            // log(`beforeSend: ${data}`);
        }
        this.onDCHWebSocketMessage = (socket, data) => {
            if (!this.socket) {
                this.socket = socket;
            }
            if (socket != this.socket) {
                log(`not matched web socket`);
                return;
            }
            // console.log(`[DCH][+] recv: ${data}, length = ${data.byteLength}, inflating...`);
            this.inflate.push(data);
            // console.log(`[DCH][+] inflating result, last size: ${this.inflate.strm.next_out}`);

            // merge output
            this.bufferedData.push(this.inflate.strm.output.subarray(0, this.inflate.strm.next_out))
            let mergedBuffer = new Uint8Array(this.bufferedData.reduce((x, b) => x+b.length, 0));
            for (let i = 0, offset = 0; i < this.bufferedData.length; ++i) {
                mergedBuffer.set(this.bufferedData[i], offset);
                offset += this.bufferedData[i].length;
            }
            this.bufferedData = [];
            // console.log(`[DCH][+] inflating result, merge size: ${mergedBuffer.length}`);

            // decode
            let result = new TextDecoder('utf-8').decode(mergedBuffer);
            // log(`decompress result: ${result}`)
            
            // reset 
            this.inflate.strm.output = new Uint8Array(CHUNK_SIZE);
            this.inflate.strm.avail_out = CHUNK_SIZE;
            this.inflate.strm.next_out = 0;

            this.processWebSocketMessage(result);
        };
    }

    processWebSocketMessage(message) {
        try {
            let j = JSON.parse(message);
            let type = j['t'];
            if (type == 'READY') {
                this.businessManager.fillDataFromWebSocketReadyJson(j['d']);
            } else if (!!type){
                let messageJ = j['d'];
                let messageS = JSON.stringify(messageJ);
                if (!this.ignoreMessageHandler.isHittingBlacklist(type, messageJ)) {
                    this.messageHandlers.forEach((h) => {
                        if (h.needProcess(type, messageJ)) {
                            let data = h.pickUpDataFromMessage(messageJ);
                            if (data) {
                                h.action(data);
                            }
                        }
                    });
                }                
            }
        } catch (e) {
            error(`message process error: ${e}, message(${message.length}):${message}, stack:\n ${e.stack}`);
        }
    }

    onDCHWebSocketReconnect;
    onDCHWebSocketBeforeSend;
    onDCHWebSocketMessage;
}