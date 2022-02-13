export default class ChannelItem {
	constructor(guildId, channelId, slowModeInterval) {
		this.guildId = guildId;
		this.channelId = channelId;
		this.slowModeInterval = slowModeInterval;
		this.nextSendableTime = (new Date()).getTime();
	}

	static createChannelsFromJsonString(jsonString) {
		let x = JSON.parse(jsonString);
		return x.map(j => {
			return new ChannelItem(j.guildId, j.channelId, j.slowModeInterval, j.nextSendableTime);
		});
	}

	static _P_findIndexFromArray(channelArray, channelId) {
		var index = -1;
		for(var i = 0; i < channelArray.length; ++i) {
			if (channelArray[i].channelId == channelId) {
				index = i;
				break;
			}
		}
		return index;
	}

	static findChannelItemInArray(channelArray, channelId) {
		var index = ChannelItem._P_findIndexFromArray(channelArray, channelId);
		if (index == -1) {
			console.error(`cann\'t find channel ${channelId} in ${JSON.stringify(channelArray)}`);
			return null;
		} else {
			return channelArray[index];
		}
	}

	static removeChannelInArray(channelArray, channelId) {
		var index = ChannelItem._P_findIndexFromArray(channelArray, channelId);
		if (index == -1) {
			console.error(`cann\'t find channel ${channelId} in ${JSON.stringify(channelArray)}`);
		} else {
			channelArray.splice(index, 1);
		}
	}
}