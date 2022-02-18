import Bot from "./Bot";
import Channel from "./Channel";
import Guild from "./Guild";
import Role from "./Role";
import {
    log, error
} from './util';

export default class BusinessManager {
    constructor() {
        this.uid = JSON.parse(W.localStorage.getItem('user_id_cache'));
    }

    fillDataFromWebSocketReadyJson(j) {
        // self
        let uid = j['user']['id'];
        this.name = j['user']['username'];
        if (this.uid != uid) {
            error(`Uid isn't correct, should be ${this.uid}, but is ${uid}, name is ${this.name}`);
        }
        this.uid = uid;
        this.token = j['analytics_token'];
        if (W.token == null) {
            log(`W.token is null, refresh to ${this.token}`);
        }

        // guild and channel
        this.guilds = [];
        let channelId2Channel = {};
        j['guilds'].forEach((guildJ) => {
            let guild = new Guild(guildJ['id'], guildJ['name']);
            // 频道
            let channels = [];
            guildJ['channels'].forEach((channelJ) => {
                if (channelJ.type == 0) { // 普通频道
                    let channelId = channelJ['id'];
                    let channel = new Channel(channelId, channelJ['name'], guild);
                    channel.slowModeInterval = channelJ['rate_limit_per_user'] * 1000;
                    channel.lastMessageId = channelJ['last_message_id'];
                    channels.push(channel);
                    channelId2Channel[channelId] = channel;
                }
            });
            guild.channles = channels;
            // 角色和机器人
            let roles = [];
            let bots = [];
            guildJ['roles'].forEach((roleOrBotJ) => {
                if (!!roleOrBotJ['tags'] && !!roleOrBotJ['tags']['bot_id']) {
                    let bot = new Bot(roleOrBotJ['tags']['bot_id'], roleOrBotJ['name']);
                    bots.push(bot);
                } else {
                    let role = new Role(roleOrBotJ['id'], roleOrBotJ['name']);
                    roles.push(role);
                }
            });
            guild.roles = roles;
            guild.bots = bots;
            // 红点数
            j['read_state']['entries'].forEach((mentionJ) => {
                let channelId = mentionJ['id'];
                if (channelId2Channel[channelId]) {
                    channelId2Channel[channelId].mentionCount = mentionJ['mention_count'];
                }
            });

            this.guilds.push(guild);
        });
        this.channelId2Channel = channelId2Channel;

        // log(`Init Business Manager: ${JSON.stringify(this.guilds)}`);
    }

    getGuildById(guildId) {
        for (let i in this.guilds) {
            if (this.guilds[i].id == guildId) {
                return this.guilds[i];
            }
        }
        return null;
    }

    getChannelById(channelId) {
        return this.channelId2Channel[channelId];
    }

    uid;
    name;
    guilds;
    channelId2Channel;
};