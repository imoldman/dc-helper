import { delay, log } from '../util'
import G from '../G'

export default class GiveawayBotMessageHanlder {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(type, messageJ) {
        return messageJ['author'] &&
        messageJ['author']['id'] == '294882584201003009';
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
                log(`[GiveawayBot] DM Message: ${messageUrl}`);
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
                        error(`[GiveawayBot] Join Failed, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    } else{
                        title = `Join Giveaway Success - [${channel.guild.name}]`;
                        log(`[GiveawayBot] Join Success, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    }
                    await Notification.requestPermission();
                    let notification = new Notification(title, {
                        body: `Channel: ${channel.name}`
                    });
                    notification.onclick = (e) => {
                        e.preventDefault();
                        window.open(messageUrl, '_blank');
                    };
                } else if (data.raw.indexOf('Congratulations') != -1) {
                    // 开奖结果
                    if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
                        log(`[GiveawayBot] Result @ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    } else {
                        log(`[GiveawayBot] Result NO ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    }
                } else if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
                    // 提到自己
                    log(`[GiveawayBot] Common @ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                } else {
                    log(`[GiveawayBot] Common Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                }
            }
        }
    }
}