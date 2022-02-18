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
        window.businessManager = this;
    }

    fillDataFromWebSocketReadyJson(j) {
        // self
        let uid = j['user']['id'];
        this.name = j['user']['username'];
        if (this.uid != uid) {
            error(`Uid isn't correct, should be ${this.uid}, but is ${uid}, name is ${this.name}`);
        }
        this.uid = uid;
        this.sessionId = j['session_id'];

        // guild and channel
        this.guilds = [];
        let channelId2Channel = {};
        let roleId2Guild = {};
        j['guilds'].forEach((guildJ) => {
            let guild = new Guild(guildJ['id'], guildJ['name']);
            // 频道
            let channels = [];
            guildJ['channels'].forEach((channelJ) => {
                if (channelJ.type == 0 || channelJ.type == 5) { // 普通频道 or 公告频道
                    let channelId = channelJ['id'];
                    let channel = new Channel(channelId, channelJ['name'], guild);
                    if (channelJ.type == 0) {
                        channel.channelType = Channel.TypeNormal;
                        channel.slowModeInterval = channelJ['rate_limit_per_user'] * 1000;
                    } else if (channelJ.type == 5) {
                        channel.channelType = Channel.TypeAnnouncement;
                    }
                    channel.lastMessageId = channelJ['last_message_id'];
                    channels.push(channel);
                    channelId2Channel[channelId] = channel;
                }
            });
            guild.channels = channels;
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
                    roleId2Guild[role.id] = guild;
                }
            });
            guild.roles = roles;
            guild.bots = bots;
            this.guilds.push(guild);
        });
        this.channelId2Channel = channelId2Channel;

        // 红点数
        j['read_state']['entries'].forEach((mentionJ) => {
            let channelId = mentionJ['id'];
            if (channelId2Channel[channelId]) {
                channelId2Channel[channelId].mentionCount = mentionJ['mention_count'];
            }
        });

        // 自己在每个 guild 的角色
        j['merged_members'].forEach((x) => {
            x.forEach((memberJ) => {
                if (memberJ['user_id'] != this.uid) {
                    error(`invalid memeber data, user should be ${self.uid}, but now is ${memberJ['user_id']}`);
                } else if (memberJ['roles'].length > 0) {
                    let guild = roleId2Guild[memberJ['roles'][0]];
                    if (!guild) {
                        error(`invalid role, cann't find the guild, roleIds: ${memberJ['roles']}`);
                    } else {
                        guild.selfRoles = memberJ['roles'].map((id) => guild.getRoleById(id));
                    }
                }
            })
        })

        // 保存原始信息，debug 用
        this.raw = j;
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
    sessionId;
    guilds;
    channelId2Channel;
};