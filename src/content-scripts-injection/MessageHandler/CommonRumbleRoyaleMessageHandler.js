import { delay, log, error } from '../util'
import G from '../G';

export default class CommonRumbleRoyaleMessageHandler {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(messageJ, messageS) {
        return messageJ['author'] &&
        messageJ['author']['id'] == '693167035068317736';
    }

    pickUpDataFromMessage(messageJ) {
        var result = {
            channelId: messageJ['channel_id'],
            messageId: messageJ['id'],
        };
        let embeds = messageJ['embeds'];
        if (embeds && embeds.length > 0) {
            result.title = embeds[0]['title'];
            result.description = embeds[0]['description'];
        }
        result.mentionIds = messageJ['mentions'].map((j) => j['id']);
        return result;
    }

    async action(data) {
        // log
        let channel = this.businessManager.getChannelById(data.channelId);
        let messageUrl = `https://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
        if (data.title && data.title.indexOf('started a new Rumble Royale session')) {
            // 正式开始新的比赛了
            var peopleCount = 0;
            var matchResult = /Number of participants: (\d+)/.exec(data.description)
            if (matchResult && matchResult[1]) {
                log(`Rumble Royale Start Message, people count: ${matchResult[1]}, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                return;
            }
        } else if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
            // 提到自己
            log(`Rumble Royale @ME Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
            return;
        } 
        // 其他消息
        log(`Rumble Royale Common Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
    }
}