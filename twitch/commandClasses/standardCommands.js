const Command = require('./command.js');

class StandardCommands {
    constructor() {
        this.slap = new Command('Trout Slapper', 'Slaps a user with a large trout.', ['slap', 'trout'], '!slap <user>', 5, this.executeSlap);
        this.hug = new Command('Hug Attack', 'Hugs a user.', ['hug', 'hugs'], '!hug <user>', 5, this.executeHug);
        this.ban = new Command('Ban Hammer', 'Bans a user from the channel.', ['ban'], '!ban <user>', 5, this.executeBan);
        this.timeout = new Command('Corner Sitter', 'Times out a user for 10 minutes.', ['timeout', 'mute'], '!timeout <user>', 5, this.executeTimeout);
    }
    
    executeSlap(twitchbot, channel, args, userstate) {
        twitchbot.client.say(channel, `@${userstate.username} slaps ${args[1]} around a bit with a large trout!`);
    }

    executeHug(twitchbot, channel, args, userstate) {
        twitchbot.client.say(channel, `@${userstate.username} hugs ${args[1]}!`);
    }

    executeBan(twitchbot, channel, args, userstate) {
        if(userstate.mod || userstate.badges.broadcaster === '1') {
            twitchbot.client.ban(channel, args[1]).then(function() {
                twitchbot.client.say(channel, `@${args[1]} has been banned!`);
            }, function(err) {
                twitchbot.client.say(channel, `@${args[1]} could not be banned!`);
                console.log(err);
            });            
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
        return [this.slap, this.hug, this.ban, this.timeout];
    }
}

module.exports = StandardCommands;