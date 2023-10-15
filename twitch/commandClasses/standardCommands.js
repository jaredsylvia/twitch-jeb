const Command = require('./command.js');

class StandardCommands {
    constructor() {
        this.slap = new Command('Trout Slapper', 'Slaps a user with a large trout.', ['slap', 'trout'], '!slap <user>', 5, this.executeSlap);
        this.hug = new Command('Hug Attack', 'Hugs a user.', ['hug', 'hugs'], '!hug <user>', 5, this.executeHug);
        this.kick = new Command('Big Boot', 'Kicks a user from the channel.', ['kick'], '!kick <user>', 5, this.executeKick);
        this.ban = new Command('Ban Hammer', 'Bans a user from the channel.', ['ban'], '!ban <user>', 5, this.executeBan);
        this.timeout = new Command('Corner Sitter', 'Times out a user for 10 minutes.', ['timeout', 'mute'], '!timeout <user>', 5, this.executeTimeout);
    }
    
    executeSlap(twitchbot, channel, args, userstate) {
        twitchbot.client.say(channel, `@${userstate.username} slaps ${args[1]} around a bit with a large trout!`);
    }

    executeHug(twitchbot, channel, args, userstate) {
        twitchbot.client.say(channel, `@${userstate.username} hugs ${args[1]}!`);
    }

    executeKick(twitchbot, channel, args, userstate) {
        if(this.kick.checkIfMod(userstate)) {
            twitchbot.client.say(channel, `@${userstate.username} has been kicked!`);
            twitchbot.client.timeout(channel, args[1], 1);
        }
    }

    executeBan(twitchbot, channel, args, userstate) {
        if(this.ban.checkIfMod(userstate)) {
            twitchbot.client.say(channel, `@${userstate.username} has been banned!`);
            twitchbot.client.ban(channel, args[1]);
        }        
    }

    executeTimeout(twitchbot, channel, args, userstate) {
        if(this.timeout.checkIfMod(userstate)) {
            twitchbot.client.say(channel, `@${userstate.username} has been timed out!`);
            twitchbot.client.timeout(channel, args[1], 600);
        }
    }

    execute (twitchbot, channel, command, args, userstate) {
        switch(command) {
            case 'slap':
                this.slap.execute(twitchbot, channel, args, userstate);
                break;
            case 'hug':
                this.hug.execute(twitchbot, channel, args, userstate);
                break;
            case 'kick':
                this.kick.execute(twitchbot, channel, args, userstate);
                break;
            case 'ban':
                this.ban.execute(twitchbot, channel, args, userstate);
                break;
            case 'timeout':
                this.timeout.execute(twitchbot, channel, args, userstate);
                break;
        }
    }

    getAllCommands() {
        return [this.slap, this.hug, this.kick, this.ban, this.timeout];
    }
}

module.exports = StandardCommands;