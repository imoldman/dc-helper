export default class Guild {
    constructor(guildId, name) {
        this.id = guildId;
        this.name = name;
        this.channles = [];
        this.roles = [];
        this.bots = [];
        this.selfRoles = [];
    }

    getRoleById(roleId) {
        for (let i in this.roles) {
            if (this.roles[i].id == roleId) {
                return this.roles[i];
            }
        }
        return null;
    }

    id;
    name;
    channles;  // [Channel]
    roles;     // [Role]
    bots;      // [Bot]
    selfRoles;  // [Role]，自己的角色
}