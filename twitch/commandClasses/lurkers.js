const Command = require('./command.js');

class Lurkers extends Command {
    constructor() {
        super();

        this.lurkers = [];
        this.name = 'Lurkers';
        this.description = 'Mark a user as lurking or not lurking.';
        this.usage = '!lurk, !unlurk, !lurkers';
        this.aliases = ['lurkers'];
        this.cooldown = 5;
        this.subcommands = ['lurk', 'unlurk'];
        this.execute = this.executeLurkCheck;
        this.lurk = this.executeLurk;
        this.unlurk = this.executeLurkOff;
            
    }

    executeLurk(twitchbot, channel, args, userstate) {
        if (this.lurkers.includes(userstate.username)) {
            twitchbot.client.say(channel, `@${userstate.username} is already lurking!`);
            return;
        }
        twitchbot.client.say(channel, `@${userstate.username} is lurking!`);
        this.lurkers.push(userstate.username);
        
    }

    executeLurkOff(twitchbot, channel, args, userstate) {
        if (!this.lurkers.includes(userstate.username)) {
            twitchbot.client.say(channel, `@${userstate.username} wasn't lurking to begin with!`);
            return;
        }
        twitchbot.client.say(channel, `@${userstate.username} is no longer lurking!`);
        this.lurkers.splice(this.lurkers.indexOf(userstate.username), 1);
    }

    executeLurkCheck(twitchbot, channel, args, userstate) {
        if (this.lurkers.length === 0) {
            twitchbot.client.say(channel, `There are no lurkers!`);
            return;
        }
        twitchbot.client.say(channel, `Lurkers: ${this.lurkers.join(', ')}`);

    }

}

module.exports = Lurkers;
