import { log } from '../util'

export default class RumbleRoyaleCommonMessageHandler {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(type, messageJ) {
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
            result.description = embeds[0]['description'];
        }
        result.mentionIds = messageJ['mentions'].map((j) => j['id']);
        return result;
    }

    async action(data) {
        // log
        let channel = this.businessManager.getChannelById(data.channelId);
        let messageUrl = `https://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
        if (data.description && data.description.indexOf('Number of participants') != -1) {
            // 正式开始新的比赛了
            var peopleCount = 0;
            var matchResult = /Number of participants: (\d+)/.exec(data.description)
            if (matchResult && matchResult[1]) {
                log(`[Rumble Royale] Start, people count: ${matchResult[1]}, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                return;
            }
        }
        if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
            // 提到自己
            log(`[Rumble Royale] @ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
            return;
        } 
        // 其他消息
        log(`[Rumble Royale] Common, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
    }
}