
import React from 'react';
import { render } from 'react-dom';
import { contentClient } from '../chrome';
import './ContentScripts.scss';
import DrawerDemo from './DrawerDemo';

const WEBSOCKET_HOOK_CODE = `(function() { \
let DCHWebSocket = class extends WebSocket { \
    constructor(s) { \
        console.log('[DCH] in DCHWebSocket constructor'); \
        super(s); \
        this.messageBuffer = []; \
    } \
    send(s) { \
        console.log('[DCH] in DCHWebSocket send'); \
        return super.send(s); \
    } \
    set onmessage(f) { \
        console.log('[DCH] in DCHWebSocket set onmessage'); \
        super.onmessage = (evt) => { \
            if (!window.onDCHWebSocketMessage) { \
                console.log('[DCH] no onDCHWebSocketMessage, save to buffer'); \
                this.messageBuffer.push(evt.data); \
            } else { \
                if (this.messageBuffer.length > 0) { \
                    this.messageBuffer.forEach((x) => { \
                        window.onDCHWebSocketMessage(x); \
                    }); \
                    this.messageBuffer = []; \
                } \
                window.onDCHWebSocketMessage(evt.data); \
            }
            f(evt); \
        } \
    } \
}; \
window.OriginWebSocket = WebSocket; \
window.WebSocket = DCHWebSocket; \
})();`

export default class ContentScripts {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // 加载 contentScript 到网页上下文
        this.injectContentSript();
        // 注意，必须设置了run_at=document_start 此段代码才会生效
        document.addEventListener('DOMContentLoaded', () => {
            this.initContainer();
            this.initMessageClient();
        });
    }

    // 初始化消息通道
    initMessageClient() {
        const { container } = this;

        contentClient.listen('show drawer', () => {
            this.showContainer();

            render(
                <DrawerDemo onClose={() => { this.hideContainer(); }} />,
                container
            );
        });
    }

    // 初始化外层包裹元素
    initContainer() {
        const { document } = window;
        this.container = document.createElement('div');
        this.container.setAttribute('id', 'chrome-extension-content-base-element');
        this.container.setAttribute('class', WRAPPER_CLASS_NAME);
        document.body.appendChild(this.container);
    }

    injectContentSript() {
        // save storage token
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.innerText = 'var W = {}; W.localStorage = window.localStorage; W.token = W.localStorage.getItem("token")';
        document.documentElement.appendChild(s);

        // webhook
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.innerText = WEBSOCKET_HOOK_CODE;
        document.documentElement.appendChild(s);

        // add content
        var f = chrome.extension.getURL('./js/contentScriptsInjection.js');
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = f;
        document.documentElement.appendChild(s);        
    }

    showContainer() {
        this.container.setAttribute('style', 'display: block');
    }

    hideContainer() {
        this.container.setAttribute('style', 'display: none');
    }
}