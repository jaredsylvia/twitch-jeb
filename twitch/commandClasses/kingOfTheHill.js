const Command = require('./command.js');

class KingOfTheHill extends Command {
    constructor(db, wss) {
        super();
        this.name = 'King Of The Hill';
        this.aliases = ['koth'];
        this.cooldown = 5;
        this.description = 'Starts a king of the hill game.';
        this.usage = '!koth starts a king of the hill game, !joink joins the game.';
        this.subcommands = ['joink'];
        
        this.kothPlayers = [];
        this.kothWinner = '';
        this.execute = this.startKoth;
        this.joink = this.join;
        this.db = db;
        this.wss = wss;
    }

    startKoth(twitchbot, channel, args, userstate) {
        try {
            if(Command.gameActive) {
                twitchbot.client.say(channel, `A game is already active!`);
                return;
            }           

            Command.gameActive = true;
            
            this.kothPlayers = [];
            this.kothWinner = '';
            const data = {
                type: 'koth',
                active: Command.gameActive,
            }
            this.wss.sendToWebSocket(data);
            twitchbot.client.say(channel, `A king of the hill game has started! Type !joink to join the game.`);

            setTimeout(() => {
                if (this.kothPlayers.length === 0) {
                    twitchbot.client.say(channel, `Nobody joined the game!`);
                    Command.gameActive = false;
                    this.wss.sendToWebSocket({ type: 'koth', active: Command.gameActive });                    
                    return;
                }

                const winner = this.kothPlayers[Math.floor(Math.random() * this.kothPlayers.length)];
                this.kothWinner = winner;

                twitchbot.client.say(channel, `The winner is ${winner}!`);
                Command.gameActive = false;                
                const data = {
                    type: 'koth',
                    active: Command.gameActive,
                    winner: this.kothWinner
                }
                this.wss.sendToWebSocket(data);
                
                this.kothPlayerNames = '';
                this.kothPlayers.forEach(player => {
                    this.kothPlayerNames += player + ',';
                });         

                this.db.addKOTH(Command.gameActive, this.kothPlayerNames, this.kothWinner)
            }, 30000);
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    join(twitchbot, channel, args, userstate) {
        try {
            if (!Command.gameActive) {
                twitchbot.client.say(channel, `There is no king of the hill game active!`);
                return;
            }

            if (this.kothPlayers.includes(userstate.username)) {
                twitchbot.client.say(channel, `You have already joined the game!`);
                return;
            }

            this.kothPlayers.push(userstate.username);
            twitchbot.client.say(channel, `${userstate.username} has joined the game!`);
            const data = {
                type: 'koth',
                active: Command.gameActive,
                players: this.kothPlayers
            }
            this.wss.sendToWebSocket(data);
        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }

    }
}

module.exports = KingOfTheHill;