import { 
    log, sendMessageToChannel, delay
} from "./util";
import StorageMessageItem from "./StorageMessageItem";

export default class DialogFetcher {
    constructor(messageStorage) {
        this.uid = JSON.parse(W.localStorage.getItem('user_id_cache'));
        if (!this.uid) {
            console.error('无法获取 UID !!');
        }
        this.messageStorage = messageStorage;
    }

    async start() {
        return this.pullMessage();
    }

    async pullMessage() {
        var result = null;
        while (true) {
            await delay(5000);
            let url = `http://localhost:3000/next?uid=${this.uid}`
            let response = await fetch(url);
            result = await response.json();
            if (result.action != 'wait') {
                break;
            } else {
                log('远端无需发消息');
            }
        }

        log(`远端需发消息: ${result.message.content}, ${result.message.replyId}`);
        let messageItem = new StorageMessageItem(StorageMessageItem.TYPE_SCHEDULED,
                                          result.channel.guildId,
                                          result.channel.channelId,
                                          result.message.content,
                                          result.message.replyId,
                                          (new Date()).getTime());
        return this.messageStorage.appendUnsentMessage(messageItem, 30*1000, false);
    }

    async didMessageSend(content, messageId) {
        await fetch('http://localhost:3000/didMessageSend', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uid: this.uid,
                content: content,
                messageId: messageId
            })
        });
        log(`发送消息成功: ${content}  => ${messageId}`);
        // 继续 pull
        await this.pullMessage();
    }
}