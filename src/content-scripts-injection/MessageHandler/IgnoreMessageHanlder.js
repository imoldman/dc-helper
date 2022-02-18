import { delay, log, error } from '../util'
import BaseHandler from './BaseHandler';

export default class IgnoreMessageHandler extends BaseHandler {
    constructor(businessManager) {
        super(businessManager);
    }

    isHittingBlacklist(type, messageJ) {
        if (type != 'MESSAGE_CREATE' && type != 'MESSAGE_UPDATE') {
            return false;
        }
        let channelId = messageJ['channel_id'];
        let guildId = messageJ['guild_id'];
        var guildName = null, channelName = null;
        let channel = this.businessManager.getChannelById(channelId);
        if (channel) {
            guildName = channel.guild.name;
            channelName = channel.name;
        } else {
            channelName = channelId;
            let guild = this.businessManager.getGuildById(guildId);
            if (guild) {
                guildName = guild.name;
            } else {
                guildName = guildId;
            }
            if (guildId) {
                log(`Cann't find guild by channel, [${guildId}(${guildName})-${channelId}]: https://discord.com/channels/${guildId}/${channelId}`);
            }
        }
        if (guildName) {
            if (guildName.indexOf('Fury of the fur') != -1 || guildName.indexOf('Roborovski NFT Collections') != -1){
                let messageId = messageJ['id'];
                let messageUrl = `https://discord.com/channels/${channel.guild.id}/${channelId}/${messageId}`;
                return true;
            }
        }

        let blacklist = [
        ];
        let messageS = JSON.stringify(messageJ);
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