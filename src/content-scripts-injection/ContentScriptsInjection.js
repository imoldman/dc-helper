
import {
    delay,
    log,
    getDateString,
    getCurrentGuildId,
    getCurrentChannelId,
    getChannelMessages,
    SendMessageError,
    sendMessageToChannel,
    isReplying,
    closeReplyBar,
    getReplyingMessageId,
    getTypingMessageContent,
    isSlowModeOpening,
    getSlowModeIntervalMS,
    sendCmdBackspaceToInput,
    hookChatInput,
} from './util';
import MessageStorage from './MessageStorage';
import DialogFetcher from './DialogFetcher';
import StorageMessageItem from './StorageMessageItem';
import WebSocketListener from './WebSocketListener';
import BusinessManager from './BusinessManager';

export default class ContentScriptsInjection {
    constructor() {
        // 初始化
        this._P_messageStorageInstance = new MessageStorage();
        this._P_canSendMessage = true;
        this._P_dialogFetcher = new DialogFetcher(this._P_messageStorageInstance);
        this._P_businessManager = new BusinessManager();
        this._P_webSocketHookListener = new WebSocketListener(this._P_businessManager);
        // 行动
        document.addEventListener('DOMContentLoaded', () => this.initChatInputHook());
        this.startDialogFetcher();

        log(`ContentScriptsInjection Inited`);
    }

    async startDialogFetcher() {
        await delay(3000);
        return this._P_dialogFetcher.start();
    }

    async initChatInputHook() {
        await delay(5000);
        // 安装钩子
        hookChatInput(this._P_messageStorageInstance);
        // 页面刷新的时候需要重新安装钩子
        let e = document.querySelector('[class*="chat-"] [class*="chatContent-"]').parentElement;
        let observerOptions = {
            childList: true,
            attributes: false,
            subtree: false,
        }
        let observer = new MutationObserver((mutationList, observer) => {
            mutationList.forEach((mutation) => {
                if (mutation.addedNodes.length == 1 && mutation.removedNodes.length == 0) {
                    hookChatInput(this._P_messageStorageInstance);
                }
            });
        });
        observer.observe(e, observerOptions);
        // 调度发消息：13 s 一个循环， 小步快跑
        while(true) {
            await this.checkAndSendMessage();
            await delay(Math.random() * 2 * 1000 + 13 * 1000);
        }
    }

    async checkAndSendMessage() {
        if (!this._P_canSendMessage) {
            return;
        }
        let messageItem = this._P_messageStorageInstance.takeCurrentSendableMessage();
        if (!!messageItem) {
            log(`[${getDateString(new Date)}] 发送: ${JSON.stringify(messageItem)}`);
            let sentResult = await sendMessageToChannel(messageItem.guildId,
                                                        messageItem.channelId,
                                                        messageItem.content,
                                                        messageItem.replyingMessageId);
            if (sentResult[0] == SendMessageError.SUCCESS && messageItem.type == StorageMessageItem.TYPE_SCHEDULED) {
                return this._P_dialogFetcher.didMessageSend(messageItem.content, sentResult[1]);
            }
        } else {
            log(`[${getDateString(new Date)}]: 无需发送`);
            return;
        }       
    }

// (async () => {
// 	let text = await getChannelMessages('934400149017493614');
// 	alert(text);
// })();




// fetch("https://discord.com/api/v9/users/932358448870473728/profile?with_mutual_guilds=false&guild_id=918873900690059264", {
//   "headers": {
//     "authorization": G.token,
//   },
// });

// .user.id // 自己的id
// .guild_member.roles[] // 在这个 guild 的角色 id
}