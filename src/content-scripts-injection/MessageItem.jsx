export default class MessageItem {

    static TYPE_MANUAL = 'manual';
    static TYPE_SCHEDULED = 'scheduled';

    constructor(type, guildId, channelId, content, replyingMessageId, createTime) {
        this.type = type
        this.guildId = guildId;
        this.channelId = channelId;
        this.content = content;
        this.replyingMessageId = replyingMessageId;
        this.createTime = createTime;
    }

    static createFromJson(j) {
        return new MessageItem(j.type ? j.type : MessageItem.TYPE_MANUAL,
                               j.guildId, 
                               j.channelId,
                               j.content,
                               j.replyingMessageId,
                               j.createTime);
    }
    
    static createMessagesFromJsonString(jsonString) {
        let x = JSON.parse(jsonString);
        return x.map(j => MessageItem.createFromJson(j));
    }
}