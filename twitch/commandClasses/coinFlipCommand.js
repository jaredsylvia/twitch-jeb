class CoinFlipCommand {
    constructor(client, channel) {
        this.client = client;
        this.channel = channel;
        this.flipping = false;
        this.heads = [];
        this.tails = [];
        this.winningCoin = '';        
    }

    flip(userstate) {
        this.flipping = true;

        this.client.say(`@${userstate.username} wants to flip a coin! Type !heads or !tails to guess!`);
        
        // Give people time to respond using !heads or !tails
        setTimeout(() => {
            setTimeout(() => {
                this.client.say(`Flipping a coin!`);
                // Set winning coin
                this.winningCoin = Math.random() < 0.5 ? 'heads' : 'tails';
                // Announce winning coin
                this.client.say(`The coin landed on ${this.winningCoin}!`);
            }, 20000);
    
            // Check who guessed correctly
            setTimeout(() => {
                this.winner(() => {                
                // Reset variables
                this.heads = [];
                this.tails = [];
                this.winningCoin = '';
                this.flipping = false;
                });
                
            }, 22000);
    
        }, 2000);
    }

    guess(userstate, side) {
        if (this.flipping) {
            if(this.heads.includes(userstate.username) || this.tails.includes(userstate.username)) {
                this.client.say(`@${userstate.username} you have already guessed!`);
            } else {
                if (side === 'heads') {
                    this.heads.push(userstate.username);
                    this.client.say(`@${userstate.username} has guessed ${side}!`);
                } else {
                    this.tails.push(userstate.username);
                    this.client.say(`@${userstate.username} has guessed ${side}!`);
                }
            }
            
        }

    }

    winner() {
        if(this.winningCoin === 'heads') {
            if(this.heads.length === 0) {
                this.client.say(`Nobody guessed correctly!`);
                return;
            } else if(this.tails.length === 0) {
                this.client.say(`Everybody guessed correctly!`);
                this.client.say(`@${heads[0]} was the first winner!`);
                return;
            } else {
                this.client.say(`The following people guessed correctly: ${heads}`);
                this.client.say(`@${heads[0]} was the first winner!`);
                this.client.say(`@${tails[0]} is the biggest loser!`);
            }             
            
        } else {
            if(this.tails.length === 0) {
                this.client.say(`Nobody guessed correctly!`);
                return;
            } else if(this.heads.length === 0) {
                this.client.say(`Everybody guessed correctly!`);
                this.client.say(`@${tails[0]} was the first winner!`);
                return;
            } else {
                this.client.say(`The following people guessed correctly: ${tails}`);
                this.client.say(`@${tails[0]} was the first winner!`);
                this.client.say(`@${heads[0]} is the biggest loser!`);
            }            
        }
    }
}

module.exports = CoinFlipCommand;
