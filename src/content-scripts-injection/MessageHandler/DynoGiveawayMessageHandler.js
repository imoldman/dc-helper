import { delay, log, error } from '../util'
import NotificationHelper from '../NotificationHelper';
import BaseMessageHandler from './BaseMessageHandler';
import G from '../G';

export default class DynoGiveawayMessageHandler extends BaseMessageHandler {
    constructor(businessManager) {
        super(businessManager);
    }

    needProcess(type, messageJ) {
        // 只处理新消息，貌似 Dyno 有多个版本的 bot，id 不同，所以我们改用 Name 来探测
        return type == 'MESSAGE_CREATE' &&
        messageJ['author'] &&
        messageJ['author']['username'] == 'Dyno';
    }

    pickUpDataFromMessage(messageJ) {
        var result = {
            uid: messageJ['author']['id'],
            guildId: messageJ['guild_id'],
            channelId: messageJ['channel_id'],
            messageId: messageJ['id'],
            applicationId: messageJ['application_id']
        };
        let components = messageJ['components'];
        if (components && components.length > 0) {
            for (let i in components) {
                let innerComponents = components[i]['components'];
                for (let j in innerComponents) {
                    let buttonJ = innerComponents[j];
                    if (buttonJ['label'] == 'Enter' || buttonJ['label'] == 'Start') {
                        result.buttonId = buttonJ['custom_id'];
                    }
                }
            }
        }
        result.mentionIds = messageJ['mentions'].map((j) => j['id']);
        result.raw = JSON.stringify(messageJ);
        return result;
    }

    async action(data) {
        if (data.raw.indexOf('GIVEAWAY') != -1 || data.raw.indexOf('Giveaway') != -1 || data.raw.indexOf('giveaway') != -1) {
            // 只处理 Giveaway 消息
            let channel = this.businessManager.getChannelById(data.channelId);
            let messageUrl = `https://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
            if (data.raw.indexOf('Winners') != -1) {
                // 参加抽奖
                if (!data.buttonId) {
                    error(`[Dyno] Cann't Join Dyno Giveaway, buttonId is null: ${JSON.stringify(data.raw)}`);
                } else {
                    let body = {
                        type: 3,
                        nonce: "944" + parseInt(Math.random() * 1000000000000000).toString().padStart(15, '0'),
                        guild_id: data.guildId,
                        channel_id: data.channelId,
                        message_flags: 0,
                        message_id: data.messageId,
                        application_id: data.applicationId ? data.applicationId : data.uid,
                        session_id: this.businessManager.sessionId,
                        data: {
                            component_type: 2,
                            custom_id: data.buttonId
                        }
                    };
                    await delay(200);
                    let response = await fetch("https://discord.com/api/v9/interactions", {
                        "headers": {
                            "authorization": G.token,
                            "content-type": "application/json",
                            "x-debug-options": "bugReporterEnabled",
                            "x-discord-locale": "zh-CN",
                        },
                        "method": "POST",
                        "mode": "cors",
                        "body": JSON.stringify(body)
                        }
                    );
                    // 通知
                    var title = null;
                    if (response.status != 204) {
                        title = `Dyno Giveaway Join Failed - [${channel.guild.name}]`;
                        error(`[Dyno] Join Failed, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    } else{
                        title = `Dyno Giveaway Join Success - [${channel.guild.name}]`;
                        log(`[Dyno] Join Success, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                    }
                    let notifyBody = `Channel: ${channel.name}`;
                    NotificationHelper.notify(title, notifyBody, messageUrl);
                }
            } else if (data.raw.indexOf('Congratulations') != -1) {
                // 开奖结果
                var title = null;
                if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
                    title = `Dyno Giveaway Result @ME - [${channel.guild.name}]`;
                    log(`[Dyno] Result @ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                } else {
                    title = `Dyno Giveaway Result NO ME - [${channel.guild.name}]`
                    log(`[Dyno] Result NO ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
                }
                let body = `Channel: ${channel.name}`;
                NotificationHelper.notify(title, body, messageUrl);
            } else if (data.mentionIds.indexOf(this.businessManager.uid) != -1) {
                // 提到自己
                log(`[Dyno] Common @ME, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
            } else {
                log(`[Dyno] Common Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
            }
        }
    }
}