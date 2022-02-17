import pako from 'pako';
import BusinessManager from './BusinessManager';
import JoinRumbleRoyaleMessageHanlder from './MessageHandler/JoinRumbleRoyaleMessageHandler';
import {log, error} from './util';

const CHUNK_SIZE = 1024 * 64;

export default class WebSocketListener {
    constructor(businessManager) {
        this.businessManager = businessManager;
        this.initMessaegHandlers();
        this.initInflate();
        this.initListener();
    }

    initMessaegHandlers() {
        this.messageHandlers = [];
        this.messageHandlers.push(new JoinRumbleRoyaleMessageHanlder(this.businessManager));
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
        window.beforeSend = (data) => {
            // log(`beforeSend: ${data}`);
        }
        window.onDCHWebSocketMessage = (data) => {
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
            } else if (type == 'MESSAGE_CREATE') {
                this.messageHandlers.forEach((h) => {
                    if (h.needProcess(j['d'], JSON.stringify(j['d']))) {
                        let data = h.pickUpDataFromMessage(j['d']);
                        if (data) {
                            h.action(data);
                        }
                    }
                });
            }
        } catch (error) {
            error(`message process error: ${error}, message:${message}`);
        }

    }
}