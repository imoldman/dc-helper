import { delay, log, error } from '../util'

export default class IgnoreMessageHandler {
    constructor(businessManager) {
        this.businessManager = businessManager;
    }

    isHittingBlacklist(messageJ, messageS) {
        let blacklist = [
        ];
        for (let i in blacklist) {
            let keyword = blacklist[i];
            if (messageS.indexOf(keyword) != -1) {
                let channelId = messageJ['channel_id'];
                let channel = this.businessManager.getChannelById(channelId);
                let messageId = messageJ['id'];
    
                let messageUrl = `https://discord.com/channels/${channel.guild.id}/${channelId}/${messageId}`;
                log(`IGNORED Message, in [${channel.guild.name} - ${channel.name}]: ${messageUrl}, keyword: "${keyword}"`);
                return true;
            }
        }
        return false;
    }
}