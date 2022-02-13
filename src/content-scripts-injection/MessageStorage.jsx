import MessageItem from "./MessageItem";
import ChannelItem from "./ChannelItem";
import { log, LOG_PREFIX } from "./util";

export default class MessageStorage {
	constructor() {
		this._P_getAllChannelsFromStroage();
		this._P_channel2unsentMessages = {};
		this._P_channels.forEach(c => {
			let messages = this._P_getUnsentMessagesFromStorageOfChannel(c.channelId);
			this._P_channel2unsentMessages[c.channelId] = messages;
		});
	}

	takeCurrentSendableMessage() {
		let now = (new Date()).getTime();
		var result = null;
		for (let channelId in this._P_channel2unsentMessages) {
			let messages = this._P_channel2unsentMessages[channelId];
			if (messages.length > 0) {
				let channelItem = ChannelItem.findChannelItemInArray(this._P_channels, channelId);
				if (channelItem.nextSendableTime < now) {
					result = messages[0];
					messages.shift();
					if (messages.length == 0) {
						delete this._P_channel2unsentMessages[channelId];
						ChannelItem.removeChannelInArray(this._P_channels, channelId);
					}
					// 不要发的那么快，55秒左右发一个就好了
					channelItem.nextSendableTime = now + Math.max(channelItem.slowModeInterval, 55*1000) + Math.random()*5000;
					this._P_flushAllChannelsToStroage();
					this._P_flushUnsentMessagesToStorageOfChannel(channelItem.channelId, messages);
					break;
				}
			}
		}
		return result;
	}

	appendUnsentMessage(messageItem, slowModeInterval, forceInsertFirst = false) {
		var messages = this._P_channel2unsentMessages[messageItem.channelId];
		if (!messages) {
			messages = []
			this._P_channel2unsentMessages[messageItem.channelId] = messages;
			this._P_channels.push(new ChannelItem(messageItem.guildId, messageItem.channelId, slowModeInterval));
			this._P_flushAllChannelsToStroage();
		}
		if (forceInsertFirst) {
			messages.unshift(messageItem);
		} else {
			messages.push(messageItem);
		}
		this._P_flushUnsentMessagesToStorageOfChannel(messageItem.channelId, messages);
	}

	_P_getAllChannelsFromStroage() {
		let channelsJsonString =  W.localStorage.getItem(MessageStorage._P_CHANNEL_KEY) || '[]';
		this._P_channels = ChannelItem.createChannelsFromJsonString(channelsJsonString);
		return this._P_channels;
	}

	_P_flushAllChannelsToStroage() {
		W.localStorage.setItem(MessageStorage._P_CHANNEL_KEY, JSON.stringify(this._P_channels));
	}
	
	_P_getUnsentMessagesFromStorageOfChannel(channelId) {
		let messagesJsonString = W.localStorage.getItem(MessageStorage._P_UNSENT_MESSAGE_KEY_PREFIX+channelId) || '[]';
		return MessageItem.createMessagesFromJsonString(messagesJsonString);
	}

	_P_flushUnsentMessagesToStorageOfChannel(channelId, messages) {
		W.localStorage.setItem(MessageStorage._P_UNSENT_MESSAGE_KEY_PREFIX+channelId, JSON.stringify(messages));
	}

	_P_archiveSentMessage(messageItem, sentTime) {
		let messagesJsonString = W.localStorage.getItem(MessageStorage._P_ARCHIVE_MESSAGE_KEY_PREFIX+channelId);
		let messages = MessageItem.createMessagesFromJsonString(messagesJsonString);
		messages.unshift(messageItem);
		W.localStorage.setItem(MessageStorage._P_ARCHIVE_MESSAGE_KEY_PREFIX+channelId, JSON.stringify(messages));
	}

	dumpMemoryStatus() {
		log(`Channels: ${JSON.stringify(this._P_channels)} [-]`);
		for (let channelId in this._P_channel2unsentMessages) {
			log('\n');
			log(`${this._P_channel2unsentMessages[channelId].map(x => JSON.stringify(x)).join('\n'+LOG_PREFIX)}`)
		}
	}

	getPendingItemCountForCurrentChannel() {
		let messages = this._P_channel2unsentMessages[getCurrentChannelId()];
		if (!messages) {
			return 0;
		}
		return messages.length;
	}

	static _P_CHANNEL_KEY = 'DchChannels';
	static _P_UNSENT_MESSAGE_KEY_PREFIX = 'DchMessages_'
	static _P_ARCHIVE_MESSAGE_KEY_PREFIX = 'DchArchivedMessages_'
	_P_channels;
	_P_channel2unsentMessages;
}