import { log } from "../util";
import Channel from "../Channel";
import BaseHandler from "./BaseHandler";

export default class NewChannelHandler extends BaseHandler {
    constructor(businessManager) {
        super(businessManager);
    }

    needProcess(type, messageJson) {
        return type == 'CHANNEL_CREATE';
    }

    pickUpDataFromMessage(messageJ) {
        return {
            channelId: messageJ['id'],
            guildId: messageJ['guild_id'],
            name: messageJ['name'],
            lastMessageId: messageJ['last_message_id'],
            slowModeInterval: messageJ['rate_limit_per_user'] * 1000
        }
    }

    async action(data) {
        if (data.guildId) {
            let guild = this.businessManager.getGuildById(data.guildId);
            let channel = new Channel(data.channelId, data.name, guild);
            channel.lastMessageId = data.lastMessageId;
            channel.slowModeInterval = data.slowModeInterval;
            channel.mentionCount = 0;
            if (data.name.indexOf('ticket-') == 0 || data.name.indexOf('support-') == 0){
                // ignore 
            } else {
                guild.channels.push(channel);
                let url = `https://discord.com/channels/${data.guildId}/${data.channelId}`;
                log(`New Channel Create [${guild.name} - ${data.name}]: ${url}`);
            }

        }
    }
}