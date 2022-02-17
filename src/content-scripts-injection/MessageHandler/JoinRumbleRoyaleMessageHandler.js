import { delay, error } from '../util'
import G from '../G';

export default class JoinRumbleRoyaleMessageHanlder {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(messageJson, messageString) {
        return messageJson['author'] &&
               messageJson['author']['id'] == '693167035068317736' && 
               messageString.indexOf('Rumble Royale hosted by') != -1 &&
               messageString.indexOf('Click the emoji below to join') != -1;
    }

    pickUpDataFromMessage(messageJ) {
        let channelId = messageJ['channel_id'];
        let messageId = messageJ['id'];
        return {
            channelId: channelId,
            messageId: messageId,
        }
    }

    async action(data) {
        let channel = this.businessManager.getChannelById(data.channelId);

        // notification
        await Notification.requestPermission();
        let messageUrl = `http://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
        let notification = new Notification(`Join Rumble Royale - ${channel.guild.name}`, {
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
            error(`Join Rumble Royale Failed, message: ${messageUrl}`);
        }
    }
}



