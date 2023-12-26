const Command = require('./command.js');

class Points extends Command {
    constructor(db) {
        super();
        this.name = 'Points';
        this.description = 'View your points, or someone else\'s points.';
        this.usage = '!points, !points username';
        this.aliases = ['points'];
        this.cooldown = 5;
        this.subcommands = [];
        this.execute = this.executePoints;
        this.db = db;
    }

    async executePoints(twitchbot, channel, args, userstate) {
        try {
            let username = userstate.username;
            if (args.length > 1) {
                username = args[1];
            }
            const points = await this.db.getPoints(username);
            twitchbot.client.say(channel, `@${username} has ${points} points!`);
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async givePoints(twitchbot, channel, args, userstate) {
        try {
            const username = args[1];
            const points = args[2];
            const gifterPoints = await this.db.getPoints(userstate.username);
            
            if (gifterPoints < points) {
                twitchbot.client.say(channel, `You don't have enough points to give!`);
                return;
            } else if (points < 0) {
                twitchbot.client.say(channel, `You can't give negative points!`);
                return;
            }

            await this.db.addPoints(username, points);
            await this.db.addPoints(userstate.username, -points);

            twitchbot.client.say(channel, `@${username} has been given ${points} points!`);
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async addPoints(twitchbot, channel, args, userstate) {
        if(this.checkIfMod(userstate)) {
            try {
                const username = args[1];
                const points = args[2];
                await this.db.addPoints(username, points);
                twitchbot.client.say(channel, `@${username} has been given ${points} points!`);
            } catch (err) {
                console.log(err);
                twitchbot.client.say(channel, `${this.name}: ${this.description}`);
                twitchbot.client.say(channel, `Usage: ${this.usage}`);
            }
        } else {
            twitchbot.client.say(channel, `You don't have permission to do that!`);
            twitchbot.client.say(channel, `You lose ${points} points!`);}
            this.db.addPoints(userstate.username, -points);
        }

}

module.exports = Points;