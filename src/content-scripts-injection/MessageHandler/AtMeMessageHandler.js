import { delay, log, error } from '../util'

export default class ATMeMessageHandler {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    needProcess(messageJson, messageString) {
        let mentionsJson = messageJson['mentions'];
        if (mentionsJson) {
            for (let i in mentionsJson) {
                let j = mentionsJson[i];
                if (j['id'] && j['id'] == this.businessManager.uid) {
                    return true;
                }
            }
        }
        return false;
    }

    pickUpDataFromMessage(messageJ) {
        return {
            channelId: messageJ['channel_id'],
            messageId: messageJ['id'],
            authorName: messageJ['author']['username'],
            content: messageJ['content'],
            embedsDescriptions: messageJ['embeds'].map(j => j['description'])
        }
    }

    async action(data) {
        let channel = this.businessManager.getChannelById(data.channelId);
        let messageUrl = `https://discord.com/channels/${channel.guild.id}/${data.channelId}/${data.messageId}`;
        let title = `@ME Message: [${channel.guild.name} - ${channel.name}]`;
        let body = `[${data.authorName}]: ${data.content}\n${data.embedsDescriptions.join('\n')}`;

        // notification
        await Notification.requestPermission();
        let notification = new Notification(title, {body: body});
        notification.onclick = (e) => {
            e.preventDefault();
            window.open(messageUrl, '_blank');
        };
        log(`@ME Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}, from ${data.authorName}`);
    }
}