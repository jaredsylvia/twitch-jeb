const { parse } = require('dotenv');
const Command = require('./command.js');

class Roulette extends Command {
    constructor(db, wss) {
        super();
        this.name = 'Roulette';
        this.aliases = ['roulette'];
        this.cooldown = 5;
        this.description = 'Starts a game of roulette.';
        this.usage = '!roulette to start a game, !joinr to join the game.';
        this.subcommands = ['joinr'];
        this.rouletteActive = false;
        this.roulettePlayers = [];
        this.rouletteWinner = '';
        this.pool = 0;
        this.execute = this.startRoulette;
        this.joinr = this.join;
        this.db = db;
        this.wss = wss;
    }

    async startRoulette(twitchbot, channel, args, userstate) {
        try {
            if (this.rouletteActive) {
                twitchbot.client.say(channel, `A game of roulette is already active!`);
                return;
            }

            this.rouletteActive = true;
            this.roulettePlayers = [];
            this.rouletteWinner = '';
            twitchbot.client.say(channel, `A game of roulette has started! Type !joinr to join the game.`);

            setTimeout(() => {
                if (this.roulettePlayers.length === 0) {
                    twitchbot.client.say(channel, `Nobody joined the game!`);
                    this.rouletteActive = false;
                    return;
                }

                const winner = this.roulettePlayers[Math.floor(Math.random() * this.roulettePlayers.length)];
                this.rouletteWinner = winner;
                this.pool = parseInt(this.pool);
                twitchbot.client.say(channel, `${winner} wins ${this.pool}!`);
                this.rouletteActive = false;
                this.db.addPoints(winner, this.pool);

                this.roulettePlayerNames = '';
                this.roulettePlayers.forEach(player => {
                    this.roulettePlayerNames += player + ',';
                });
                twitchbot.client.say(channel, `Players: ${this.roulettePlayerNames.substring(0, this.roulettePlayerNames.length - 1)}`);
                twitchbot.client.say(channel, `Winner: ${this.rouletteWinner}`);
                
                this.db.addRoulette(false, this.roulettePlayerNames.substring(0, this.roulettePlayerNames.length - 1), this.rouletteWinner, this.pool);
                this.pool = 0;
            }, 30000);

        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async join(twitchbot, channel, args, userstate) {
        try {
            const bet = args[1] ? args[1] : 0;
            const points = await this.db.getPoints(userstate.username);

            if (points < bet) {
                twitchbot.client.say(channel, `@${userstate.username} doesn't have enough points!`);
                return;
            } else if (bet < 0) {
                twitchbot.client.say(channel, `@${userstate.username} cannot bet a negative amount!`);
                return;
            } else if (bet === 0) {
                twitchbot.client.say(channel, `@${userstate.username} must bet at least 1 point!`);
                return;
            } else {
                await this.db.addPoints(userstate.username, -bet);
                this.pool += bet;
            }

            if (!this.rouletteActive) {
                twitchbot.client.say(channel, `There is no game of roulette active!`);
                return;
            }

            if (this.roulettePlayers.includes(userstate.username)) {
                twitchbot.client.say(channel, `You are already in the game!`);
                return;
            }

            this.roulettePlayers.push(userstate.username);
            twitchbot.client.say(channel, `@${userstate.username} has joined the game!`);
        }
        catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.subcommands[0].name}: ${this.subcommands[0].description}`);
            twitchbot.client.say(channel, `Usage: ${this.subcommands[0].usage}`);
        }
    }
}

module.exports = Roulette;