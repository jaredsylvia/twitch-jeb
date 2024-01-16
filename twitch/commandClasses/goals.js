const Command = require('./command.js');

class Goals extends Command {
    constructor(db) {
        super();
        this.name = 'Goals';
        this.description = 'Set goals.';
        this.usage = '!setgoal type amount, type is follow, sub, bits, or donate.';
        this.aliases = ['goal'];
        this.cooldown = 5;
        this.subcommands = ['setgoal'];
        this.execute = this.executeGoal;
        this.setgoal = this.executeGoal;
        this.db = db;       
    }

    async executeGoal(twitchbot, channel, args, userstate) {
        try {
            if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
            const type = args[1];
            const amount = args[2];
            await this.db.addGoal(type, amount);

            twitchbot.client.say(channel, `Goal set!`);
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }
}

module.exports = Goals;