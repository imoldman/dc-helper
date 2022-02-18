import { delay, log } from '../util'
import G from '../G'
import NotificationHelper from '../NotificationHelper';

export default class InviteTrackerGiveawayMessageHandler {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(type, messageJ) {
        return messageJ['author'] &&
        messageJ['author']['id'] == '720351927581278219';
    }

    pickUpDataFromMessage(messageJ) {
        var result = {
            guildId: messageJ['guild_id'],
            channelId: messageJ['channel_id'],
            messageId: messageJ['id'],
        };
        let embeds = messageJ['embeds'];
        if (embeds && embeds.length > 0) {
            result.title = embeds[0]['title'];
            result.description = embeds[0]['description'];
        }
        result.mentionIds = messageJ['mentions'].map((j) => j['id']);
        result.raw = JSON.stringify(messageJ);
        return result;
    }

    async action(data) {
        if (data.raw.indexOf('GIVEAWAY') != -1 || data.raw.indexOf('Giveaway') != -1 || data.raw.indexOf('giveaway') != -1) {
            // 只处理 Giveaway 消息
            if (!data.guildId) {
                // 私聊信息
                let messageUrl = `https://discord.com/channels/@me/${data.channelId}/${data.messageId}`;
                log(`[Invite Tracker Giveaway] DM Message: ${messageUrl}`);
            } else {
                let channel = this.businessManager.getChannelById(data.channelId);
                let messageUrl = `https://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
                if (data.raw.indexOf('React with') != -1 && data.raw.indexOf('to enter') != -1) {
                    // 参加抽奖
                    await delay(200);
                    let response = await fetch(`https://discord.com/api/v9/channels/${data.channelId}/messages/${data.messageId}/reactions/%F0%9F%8E%89/%40me`, {
                        "headers": {
                          "authorization": G.token,
                          "x-debug-options": "bugReporterEnabled",
                          "x-discord-locale": "zh-CN",
                        },
                        "method": "PUT",
                        "mode": "cors",
                        "credentials": "include"
                      }
                    );
                    // 通知
                    var title = null;
                    if (response.status != 204) {
                        title = `Join Giveaway Failed - [${channel.guild.name}]`;
                        error(`[Invite Tracker Giveaway] Join Failed, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    } else{
                        title = `Join Giveaway Success - [${channel.guild.name}]`;
                        log(`[Invite Tracker Giveaway] Join Success, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    }
                    let body = `Channel: ${channel.name}`;
                    NotificationHelper.notify(title, body, messageUrl);
                } else if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
                    // 提到自己
                    log(`[Invite Tracker Giveaway] @ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                } else {
                    log(`[Invite Tracker Giveaway] Common Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                }
            }
        }
    }
}