export default class Guild {
    constructor(guildId, name) {
        this.id = guildId;
        this.name = name;
        this.channles = [];
        this.roles = [];
        this.bots = [];
    }

    id;
    name;
    channles;  // [Channel]
    roles;     // [Role]
    bots;      // [Bot]
}