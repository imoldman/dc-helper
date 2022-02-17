export default class StorageMessageItem {

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
        return new StorageMessageItem(j.type ? j.type : StorageMessageItem.TYPE_MANUAL,
                               j.guildId, 
                               j.channelId,
                               j.content,
                               j.replyingMessageId,
                               j.createTime);
    }
    
    static createMessagesFromJsonString(jsonString) {
        let x = JSON.parse(jsonString);
        return x.map(j => StorageMessageItem.createFromJson(j));
    }
}