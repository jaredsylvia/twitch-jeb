const Command = require('./command.js');

class CoinFlipCommand extends Command {
    constructor(db, wss) {
        super();  
        this.flipping = false;
        this.headsGuesses = [];
        this.tailsGuesses = [];
        this.winningCoin = '';
        this.name = 'Coin Flipper';  
        this.description = 'Initiate a coin flip game.'; 
        this.usage = '!flip starts a flip, !heads or !tails to guess.'; 
        this.aliases = ['coinflip', 'flip']; 
        this.cooldown = 5;  
        this.subcommands = ['heads', 'tails'];
        this.execute = this.flip;
        this.heads = this.guess;
        this.tails = this.guess;
        this.headsBets = [];
        this.tailsBets = [];
        this.db = db;
        this.wss = wss;
    }
   

    flip(twitchbot, channel, args, userstate) {
        this.flipping = true;

        twitchbot.client.say(channel, `@${userstate.username} wants to flip a coin! Type !heads or !tails to guess!`);
        
        // Give people time to respond using !heads or !tails
        setTimeout(() => {
            setTimeout(() => {
                twitchbot.client.say(channel, `Flipping a coin!`);
                // Set winning coin
                this.winningCoin = Math.random() < 0.5 ? 'heads' : 'tails';
                // Announce winning coin
                twitchbot.client.say(channel, `The coin landed on ${this.winningCoin}!`);
            }, 20000);
    
            // Check who guessed correctly
            setTimeout(() => {
                this.announceWinner(twitchbot, channel);
                // Reset variables
                this.headsGuesses = [];
                this.tailsGuesses = [];
                this.winningCoin = '';
                this.flipping = false;
            }, 22000);
    
        }, 2000);
    }

    async guess(twitchbot, channel, args, userstate) {
        try {
            const side = args[0].toLowerCase().substring(1);
            const bet = args[1] ? args[1] : 0;
            console.log(bet);
            
            const points = await this.db.getPoints(userstate.username);
            console.log(points);
            if (points < bet) {
                twitchbot.client.say(channel, `@${userstate.username} you don't have enough points!`);
                return;
            } else if (bet < 0) {
                twitchbot.client.say(channel, `@${userstate.username} you can't bet negative points!`);
                return;
            }

            if (this.flipping) {
                const username = userstate.username;
                if (this.headsGuesses.includes(username) || this.tailsGuesses.includes(username)) {
                    twitchbot.client.say(channel, `@${username} you have already guessed!`);
                } else {
                    if (side === 'heads') {
                        this.headsGuesses.push(username);
                        this.headsBets.push(bet);
                        twitchbot.client.say(channel, `@${username} has guessed ${side}!`);
                    } else if (side === 'tails') {
                        this.tailsGuesses.push(username);
                        this.tailsBets.push(bet);
                        twitchbot.client.say(channel, `@${username} has guessed ${side}!`);
                    } else {
                        twitchbot.client.say(channel, `@${username} you must guess either heads or tails!`);
                    }
                }
            }
            else {
                twitchbot.client.say(channel, `There is no coin flip game active!`);
            }
        } catch (err) {
            twitchbot.client.say(channel, `${this.subcommands[0].name}: ${this.subcommands[0].description}`);
            twitchbot.client.say(channel, `Usage: ${this.subcommands[0].usage}`);
        }
    }

    announceWinner(twitchbot, channel, args, userstate) {
        const correctGuesses = this.winningCoin === 'heads' ? this.headsGuesses : this.tailsGuesses;
        const incorrectGuesses = this.winningCoin === 'heads' ? this.tailsGuesses : this.headsGuesses;
        if (correctGuesses.length === 0) {
            twitchbot.client.say(channel, `Nobody guessed correctly!`);
        } else if (this.headsGuesses.length === 0 || this.tails.length === 0) {
            twitchbot.client.say(channel, `Everybody guessed correctly!`);
            twitchbot.client.say(channel, `@${correctGuesses[0]} was the first winner!`);
            
        } else {
            twitchbot.client.say(channel, `The following people guessed correctly: ${correctGuesses.join(', ')}`);
            twitchbot.client.say(channel, `@${correctGuesses[0]} was the first winner!`);
            if(incorrectGuesses.length > 0) {
                twitchbot.client.say(channel, `@${incorrectGuesses[0]} is the biggest loser!`);
            }
            
        }

        correctGuesses.forEach((guess, index) => {
                if(this.winningCoin === 'heads') {
                    this.db.addPoints(guess, this.headsBets[index]);
                } else {
                    this.db.addPoints(guess, this.tailsBets[index]);
                }
            });

        incorrectGuesses.forEach((guess, index) => {
            if(this.winningCoin === 'heads') {
                this.db.addPoints(guess, 0 - this.tailsBets[index]);
            } else {
                this.db.addPoints(guess, 0 - this.headsBets[index]);
            }
        });

        let headsGuessesStr = '';
        let tailsGuessesStr = '';
        
        this.headsGuesses.forEach(guess => {
            headsGuessesStr += guess + ',';
        });

        this.tailsGuesses.forEach(guess => {
            tailsGuessesStr += guess + ',';
        });        

        this.db.addCoinFlip(true, this.winningCoin, headsGuessesStr, tailsGuessesStr, correctGuesses[0], incorrectGuesses[0]);
    }
}

module.exports = CoinFlipCommand;
