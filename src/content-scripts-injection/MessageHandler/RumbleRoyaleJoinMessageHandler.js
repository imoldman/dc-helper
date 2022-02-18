import { delay, log, error } from '../util'
import G from '../G';
import BaseMessageHandler from './BaseMessageHandler';

export default class RumbleRoyaleJoinMessageHanlder extends BaseMessageHandler {
    constructor(businessManager) {
        super(businessManager);
    }

    needProcess(type, messageJ) {
        return super.needProcess(type, messageJ) && 
        messageJ['author'] &&
        messageJ['author']['id'] == '693167035068317736' && 
        JSON.stringify(messageJ).indexOf('Click the emoji below to join') != -1;
    }

    pickUpDataFromMessage(messageJ) {
        return {
            channelId: messageJ['channel_id'],
            messageId: messageJ['id'],
        }
    }

    async action(data) {
        let channel = this.businessManager.getChannelById(data.channelId);

        // notification
        await Notification.requestPermission();
        let messageUrl = `https://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
        let notification = new Notification(`Join Rumble Royale - [${channel.guild.name}]`, {
            body: `Channel: ${channel.name}`
        });
        notification.onclick = (e) => {
            e.preventDefault();
            window.open(messageUrl, '_blank');
        };

        // wait to make emoji show
        await delay(2000);
        // click the emoji
        let response = await fetch(`https://discord.com/api/v9/channels/${data.channelId}/messages/${data.messageId}/reactions/Swrds%3A872886436012126279/%40me`, {
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
        if (response.status != 204) {
            error(`[Rumble Royale] Join Failed, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
        } else{
            log(`[Rumble Royale] Join Success, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}`);
        }
    }
}