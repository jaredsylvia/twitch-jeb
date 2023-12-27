const Command = require('./command.js');

class Disclaimers extends Command {
    constructor(db) {
        super();
        this.name = 'Disclaimer Commands';
        this.description = 'Chat Disclaimers';
        this.usage = `!disclaimer [name] to view the chosen disclaimer.`;
        this.aliases = [`disclaimer`];
        this.cooldown = 5;
        this.subcommands = ['adddisclaimer', 'removedisclaimer', 'listdisclaimers'];
        this.execute = this.executeDisclaimers;
        this.adddisclaimer = this.addDisclaimer;
        this.removedisclaimer = this.removeDisclaimer;
        this.listdisclaimers = this.listDisclaimers;
        this.db = db;
    }

    async executeDisclaimers(twitchbot, channel, args, userstate) {
        try{
            const disclaimerName = args[1];
            const disclaimer = await this.db.getDisclaimer(disclaimerName);
            twitchbot.client.say(channel, disclaimer.message);
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async addDisclaimer(twitchbot, channel, args, userstate) {
        twitchbot.client.say(channel, `addDisclaimer`);
        try {
            //remove !addquote from args
            args.shift();
            //check if mod
            if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
            //check args for separator
            if(!args.join(' ').includes('|')) throw new Error('No separator found!');
            //separator is a |
            args = args.join(' ').split('|');
            const name = args[0];
            const message = args[1];
            await this.db.addDisclaimer(name, message);
            //console.log(await this.db.addQuote(quote, author));
            twitchbot.client.say(channel, `Disclaimer added! Disclaimer ${name}`);
            
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: !addDisclaimers [name]|[message]`);
        }
    }

    async removeDisclaimer(twitchbot, channel, args, userstate) {
        try {
            //check if mod
            if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
            const name = args[1];
            await this.db.deleteDisclaimer(name);
            twitchbot.client.say(channel, `Disclaimer removed!`);
            
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: !removeDisclaimer [name]`);
        }
    }

    async listDisclaimers(twitchbot, channel, args, userstate) {
        try {
            const disclaimers = await this.db.listDisclaimers();
            let disclaimerNames = '';
            disclaimers.forEach(disclaimer => {
                disclaimerNames += disclaimer.name + ', ';
            });
            twitchbot.client.say(channel, `Disclaimers: ${disclaimerNames.substring(0, disclaimerNames.length - 2)}`);
        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: !listDisclaimers`);
        }
    }
}

module.exports = Disclaimers;