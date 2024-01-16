const Command = require('./command.js');

class Quotes extends Command {
    constructor(db, wss) {
        super();
        this.name = 'Quotes';
        this.description = 'Add, remove, or view quotes.';
        this.usage = '!addquote quote|author, !removequote id, !quote id';
        this.aliases = ['quotes'];
        this.cooldown = 5;
        this.subcommands = ['addquote', 'removequote', 'quote'];
        this.execute = this.executeQuote;
        this.addquote = this.addQuote;
        this.removequote = this.removeQuote;
        this.quote = this.getQuote;
        this.db = db;   
        this.wss = wss;     
    }

    async addQuote(twitchbot, channel, args, userstate) {
        try {
            if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
            //remove !addquote from args
            args.shift();
            
            //check args for separator
            if(!args.join(' ').includes('|')) throw new Error('No separator found!');
            //separator is a |
            args = args.join(' ').split('|');
            const quote = args[0];
            const author = args[1];
            const quoteId = await this.db.addQuote(quote, author);
            //console.log(await this.db.addQuote(quote, author));
            twitchbot.client.say(channel, `Quote added by ${userstate.username}! Quote #${quoteId}`);
            
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async removeQuote(twitchbot, channel, args, userstate) {
        try {
            if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
            const id = args[1];
            await this.db.deleteQuote(id);
            twitchbot.client.say(channel, `Quote removed!`);
            
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async getQuote(twitchbot, channel, args, userstate) {
        try {
            const id = args[1];
            const quote = await this.db.getQuote(id);
            const text = quote.quote;
            const author = quote.author;
            twitchbot.client.say(channel, `Quote #${id}: ${text} - ${author}`);
            
        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    executeQuote(twitchbot, channel, args, userstate) {
        twitchbot.client.say(channel, `${this.name}: ${this.description}`);
        twitchbot.client.say(channel, `Usage: ${this.usage}`);
    }
}

module.exports = Quotes;