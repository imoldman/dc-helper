export default class MessageItem {
	constructor(guildId, channelId, content, replyingMessageId, createTime) {
		this.guildId = guildId;
		this.channelId = channelId;
		this.content = content;
		this.replyingMessageId = replyingMessageId;
		this.createTime = createTime;
	}
	
	static createMessagesFromJsonString(jsonString) {
		let x = JSON.parse(jsonString);
		return x.map(j => {
			return new MessageItem(j.guildId, j.channelId, j.content, j.replyingMessageId, j.createTime);
		});
	}
}