import NotificationHelper from '../NotificationHelper';
import { delay, log, error } from '../util'
import BaseMessageHandler from './BaseMessageHandler';

export default class ATMeMessageHandler extends BaseMessageHandler {
    constructor(businessManager) {
        super(businessManager);
    }

    needProcess(type, messageJ) {
        if (!super.needProcess(type, messageJ)){
            return false;
        }
        let mentionsJ = messageJ['mentions'];
        if (mentionsJ) {
            for (let i in mentionsJ) {
                let j = mentionsJ[i];
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
        NotificationHelper.notify(title, body, messageUrl);
        log(`@ME Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}, from ${data.authorName}`);
    }
}