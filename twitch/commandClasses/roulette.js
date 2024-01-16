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
            if (Command.gameActive) {
                twitchbot.client.say(channel, `A game is already active!`);
                return;
            }
    
            Command.gameActive = true;
            this.wss.sendToWebSocket({ type: 'roulette', active: Command.gameActive });
            this.roulettePlayers = [];
            this.rouletteWinner = '';
            twitchbot.client.say(channel, `A game of roulette has started! Type !joinr to join the game.`);
    
            // Timeout for joining
            setTimeout(() => {
                if (this.roulettePlayers.length === 0) {
                    twitchbot.client.say(channel, `Nobody joined the game!`);
                    Command.gameActive = false;
                    return;
                }
    
                // Announce that the spinning phase is starting
                twitchbot.client.say(channel, `Spinning the roulette wheel!`);
                this.wss.sendToWebSocket({ type: 'roulette', data: { players: this.roulettePlayers, spinning: 'start' }, active: Command.gameActive });
                // Timeout for spinning
                setTimeout(() => {
                    const winner = this.roulettePlayers[Math.floor(Math.random() * this.roulettePlayers.length)];
                    this.rouletteWinner = winner;
                    this.pool = parseInt(this.pool);
                    twitchbot.client.say(channel, `${winner} wins ${this.pool}!`);
                    Command.gameActive = false;
                    this.db.addPoints(winner, this.pool);
    
                    this.roulettePlayerNames = '';
                    this.roulettePlayers.forEach(player => {
                        this.roulettePlayerNames += player + ',';
                    });
    
                    twitchbot.client.say(channel, `Players: ${this.roulettePlayerNames.substring(0, this.roulettePlayerNames.length - 1)}`);
                    twitchbot.client.say(channel, `Winner: ${this.rouletteWinner}`);
    
                    this.db.addRoulette(false, this.roulettePlayerNames.substring(0, this.roulettePlayerNames.length - 1), this.rouletteWinner, this.pool);
                    this.pool = 0;
                    this.wss.sendToWebSocket({ type: 'roulette', data: { winner: this.rouletteWinner, spinning: 'stop' }, active: Command.gameActive });
                }, 10000); // 10 seconds for spinning
            }, 30000); // 30 seconds for joining
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }
    

    async join(twitchbot, channel, args, userstate) {
        try {
            if (!Command.gameActive) {
                twitchbot.client.say(channel, `There is no game of roulette active!`);
                twitchbot.client.say(channel, `Type !roulette to start a game.`);
                return;
            } else if (this.roulettePlayers.includes(userstate.username)) {
                twitchbot.client.say(channel, `You are already in the game!`);
                return;
            }
            let bet = args[1] ? args[1] : 0;
            let isNumber = /^\d+$/.test(bet);
            let hasJoined = false;
            const points = await this.db.getPoints(userstate.username);
            if (isNumber) {
                bet = parseInt(bet);
            }            
            console.log(typeof bet);
            switch (typeof bet) {
                case 'string':
                    switch (bet) {
                        case 'all':
                            bet = points;
                            twitchbot.client.say(channel, `@${userstate.username} has bet all their points, a whopping ${bet}!`);
                            hasJoined = true;
                            break;
                        case 'half':
                            bet = Math.floor(points / 2);
                            twitchbot.client.say(channel, `@${userstate.username} has bet half their points, totalling ${bet}!`);
                            hasJoined = true;
                            break;
                        default:
                            if(bet.includes('%')) {
                                bet.slice(0, -1);
                                bet = Math.floor(points * (parseInt(bet) / 100));
                                twitchbot.client.say(channel, `@${userstate.username} has bet ${bet} points!`);
                                hasJoined = true;
                            } else {
                                twitchbot.client.say(channel, `@${userstate.username} bet must be 'half', 'all', a percentage or a number!`);
                                return;
                            }
                            break;
                        }
                case 'number':
                    
                            if (bet === 0) {
                                twitchbot.client.say(channel, `@${userstate.username} must bet at least 1 point!`);
                                return;
                            } else if (points < bet) {
                                twitchbot.client.say(channel, `@${userstate.username} doesn't have enough points!`);
                                return;
                            } else if (bet < 0) {
                                twitchbot.client.say(channel, `@${userstate.username} cannot bet a negative amount!`);
                                return;
                            } else {
                                twitchbot.client.say(channel, `@${userstate.username} has bet ${bet} points!`);                                
                                hasJoined = true;
                            }                            
                    
                    break;                    
                default:
                    twitchbot.client.say(channel, `@${userstate.username} bet must be 'half', 'all', a percentage or a number!`);
                    return;
                }

            
            if (hasJoined) {
                twitchbot.client.say(channel, `@${userstate.username} has joined the game!`);
                this.roulettePlayers.push(userstate.username);
                await this.db.addPoints(userstate.username, -bet);
                this.pool += parseInt(bet);
                this.wss.sendToWebSocket({ type: 'roulette', data: { players: this.roulettePlayers }, active: Command.gameActive });
            }            
        }
        catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `@${userstate.username} bet must be 'half', 'all', a percentage or a number!`);
        }
    }
}

module.exports = Roulette;