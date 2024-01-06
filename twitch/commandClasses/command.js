
class Command {
    constructor(name, description, aliases, usage, cooldown, execute, subcommands, wss, db) {
        this.name = name;
        this.description = description;
        this.aliases = aliases;
        this.usage = usage;
        this.cooldown = cooldown;
        this.execute = execute;
        this.subcommands = subcommands;
        this.wss = wss;
        this.db = db;
    }

    checkIfMod(userstate) {
        if(userstate.mod || userstate.badges.broadcaster === '1') {
            return true;
        } else {
            return false;
        }
    }

    checkIfVip(userstate) {
        if(userstate.badges.vip === '1') {
            return true;
        } else {
            return false;
        }
    }

    parseMessage(message) {
        const messageArray = message.split(' ');
        const command = messageArray.shift().toLowerCase();
        const args = messageArray;
        return {
            command,
            args
        };
    }

    getName() {
        return this.name;
    }

    getDesc() {
        return this.description;
    }

    getAliases() {
        return this.aliases;
    }

    getUsage() {
        return this.usage;
    }

    getCooldown() {
        return this.cooldown;
    }

    setName(name) {
        this.name = name;
    }

    setDescription(description) {
        this.description = description;
    }

    setAliases(aliases) {
        this.aliases = aliases;
    }

    setUsage(usage) {
        this.usage = usage;
    }

    setCooldown(cooldown) {
        this.cooldown = cooldown;
    }

    execute(client, channel, args, userstate) {
        throw new Error('execute() not implemented');      
    }
}

module.exports = Command;