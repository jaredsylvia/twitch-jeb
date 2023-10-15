const Command = require('./command.js');

class KingOfTheHill extends Command {
    constructor() {
        super();
        this.name = 'King Of The Hill';
        this.aliases = ['koth'];
        this.cooldown = 5;
        this.description = 'Starts a king of the hill game.';
        this.usage = '!koth starts a king of the hill game, !join joins the game.';
        this.subcommands = ['join'];
        this.kothActive = false;
        this.kothPlayers = [];
        this.kothWinner = '';
        this.execute = this.startKoth;
        this.join = this.join;
    }

    startKoth(twitchbot, channel, args, userstate) {
        try {
            if (this.kothActive) {
                twitchbot.client.say(channel, `A king of the hill game is already active!`);
                return;
            }

            this.kothActive = true;
            this.kothPlayers = [];
            this.kothWinner = '';

            twitchbot.client.say(channel, `A king of the hill game has started! Type !join to join the game.`);

            setTimeout(() => {
                if (this.kothPlayers.length === 0) {
                    client.say(channel, `Nobody joined the game!`);
                    this.kothActive = false;
                    return;
                }

                const winner = this.kothPlayers[Math.floor(Math.random() * this.kothPlayers.length)];
                this.kothWinner = winner;

                client.say(channel, `The winner is ${winner}!`);
                this.kothActive = false;
            }, 30000);
        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    join(twitchbot, channel, args, userstate) {
        try {
            if (!this.kothActive) {
                twitchbot.client.say(channel, `There is no king of the hill game active!`);
                return;
            }

            if (this.kothPlayers.includes(message.userInfo.displayName)) {
                twitchbot.client.say(channel, `You have already joined the game!`);
                return;
            }

            this.kothPlayers.push(message.userInfo.displayName);
            twitchbot.client.say(channel, `${message.userInfo.displayName} has joined the game!`);
        } catch (err) {
            twitchbot.client.say(channel, `${this.subcommands[0].name}: ${this.subcommands[0].description}`);
            twitchbot.client.say(channel, `Usage: ${this.subcommands[0].usage}`);
        }

    }
}

module.exports = KingOfTheHill;