export default class Channel {
    static TypeNormal = 0;
    static TypeAnnouncement = 5;

    constructor(channelId, name, inWhichGuild) {
        this.id = channelId;
        this.name = name;
        this.guild = inWhichGuild;
        this.lastMessageId = 0;
        this.mentionCount = 0;
        this.slowModeInterval = 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            lastMessageId: this.lastMessageId,
            mentionCount: this.mentionCount,
            slowModeInterval: this.slowModeInterval
        }
    }

    id;
    name;   // 名称
    lastMessageId;  // 最后一条消息
    mentionCount;   // 红点数
    slowModeInterval;   // 慢速模式间隔，单位毫秒；如没有开启则为零
    guild;  // 所在 guild
}