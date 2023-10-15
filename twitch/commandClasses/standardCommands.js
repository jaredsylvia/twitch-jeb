const Command = require('./command.js');

class StandardCommands {
    constructor() {
        this.lurkers = [];

        this.slap = new Command('Trout Slapper', 'Slaps a user with a large trout.', ['slap', 'trout'], '!slap <user>', 5, this.executeSlap);
        this.hug = new Command('Hug Attack', 'Hugs a user.', ['hug', 'hugs'], '!hug <user>', 5, this.executeHug);
        this.lurk = new Command('Nightman', 'Marks a user as lurking.', ['lurk', 'lurking'], '!lurk', 5, this.executeLurk);
        this.lurkoff = new Command('Dayman', 'Marks a user as no longer lurking.', ['here', 'back', 'unlurk'], '!unlurk', 5, this.executeLurkoff);
        this.lurkcheck = new Command('Lurk Lister 3000', 'Lists all lurkers.', ['lurkcheck'], '!lurkcheck', 5, this.executeLurkcheck);
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

    executeLurk(twitchbot, channel, args, userstate) {
        if (this.lurkers.includes(userstate.username)) {
            twitchbot.client.say(channel, `@${userstate.username} is already lurking!`);
            return;
        }
        twitchbot.client.say(channel, `@${userstate.username} is lurking!`);
        this.lurkers.push(userstate.username);
        
    }

    executeLurkoff(twitchbot, channel, args, userstate) {
        if (!this.lurkers.includes(userstate.username)) {
            twitchbot.client.say(channel, `@${userstate.username} wasn't lurking to begin with!`);
            return;
        }
        twitchbot.client.say(channel, `@${userstate.username} is no longer lurking!`);
        this.lurkers.splice(this.lurkers.indexOf(userstate.username), 1);
    }

    executeLurkcheck(twitchbot, channel, args, userstate) {
        if (this.lurkers.length === 0) {
            twitchbot.client.say(channel, `There are no lurkers!`);
            return;
        }
        twitchbot.client.say(channel, `Lurkers: ${this.lurkers.join(', ')}`);

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
            case 'lurk':
                this.lurk.execute(twitchbot, channel, args, userstate);
                break;
            case 'lurkoff':
                this.lurkoff.execute(twitchbot, channel, args, userstate);
                break;
            case 'lurkcheck':
                this.lurkcheck.execute(twitchbot, channel, args, userstate);
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
        return [this.slap, this.hug, this.lurk, this.lurkoff, this.lurkcheck, this.kick, this.ban, this.timeout];
    }
}

module.exports = StandardCommands;