const tmi = require('tmi.js');
const CoinFlipCommand = require('./commandClasses/coinFlipCommand.js');
const StandardCommands = require('./commandClasses/standardCommands.js');
const DiceRoll = require('./commandClasses/diceRoll.js');
const KingOfTheHill = require('./commandClasses/kingOfTheHill.js');
const standardCommands = new StandardCommands();

const commands = [];
standardCommands.getAllCommands().forEach(command => {
    commands.push(command);
});
commands.push(new DiceRoll());
commands.push(new KingOfTheHill());
commands.push(new CoinFlipCommand());


class TwitchBot {
    constructor (username, oauthToken, channel, wss) {
        this.username = username;
        this.oauthToken = oauthToken;
        this.channel = channel;
        this.wss = wss;
        this.client = null;
        this.coinFlipCommand = null;

        this.onTwitchBotConnectedHandler = this.onTwitchBotConnectedHandler.bind(this);
        this.onTwitchBotDisconnectedHandler = this.onTwitchBotDisconnectedHandler.bind(this);
        this.onTwichBotMessageHandler = this.onTwichBotMessageHandler.bind(this);
        this.onTwitchBotJoinHandler = this.onTwitchBotJoinHandler.bind(this);
        this.onTwitchBotFollowHandler = this.onTwitchBotFollowHandler.bind(this);
        this.onTwitchBotBanHandler = this.onTwitchBotBanHandler.bind(this);
        this.onTwitchBotRaidedHandler = this.onTwitchBotRaidedHandler.bind(this);
        this.onTwitchBotSubscriptionHandler = this.onTwitchBotSubscriptionHandler.bind(this);
        this.onTwitchBotSubgiftHandler = this.onTwitchBotSubgiftHandler.bind(this);
        this.onTwitchBotSubmysterygiftHandler = this.onTwitchBotSubmysterygiftHandler.bind(this);        

        console.log('TwitchBot instantiated');
    }

    async connect () {
        const options = {
          identity: {
            username: this.username,
            password: this.oauthToken
          },
            channels: [ this.channel ]
        };
        if(!this.client) {
            this.client = new tmi.client(options);
        } else {
            await this.client.disconnect();
            this.client = null;
            this.client = new tmi.client(options);
        }
        

        this.client.on('connected', this.onTwitchBotConnectedHandler);
        this.client.on('disconnected', this.onTwitchBotDisconnectedHandler);
        this.client.on('message', this.onTwichBotMessageHandler);
        this.client.on('join', this.onTwitchBotJoinHandler);
        this.client.on('follow', this.onTwitchBotFollowHandler);
        this.client.on('ban', this.onTwitchBotBanHandler);
        this.client.on('raided', this.onTwitchBotRaidedHandler);
        this.client.on('subscription', this.onTwitchBotSubscriptionHandler);
        this.client.on('subgift', this.onTwitchBotSubgiftHandler);
        this.client.on('submysterygift', this.onTwitchBotSubmysterygiftHandler);

        await this.client.connect();
    }

    async disconnect () {
        await this.client.disconnect();
    }

    async updateWss (wss) {
        this.wss = wss;
    }
    
    async onTwichBotMessageHandler (channel, userstate, message, self) {
        this.wss.sendToWebSocket({
            type: 'message',
            channel,
            userstate,
            message,
            self
        });

        // extract message
        const isCommand = message.startsWith('!');
        
        if(isCommand) {
            this.onCommand(channel, userstate, message);
        }        
    }

    async onTwitchBotConnectedHandler() {
        console.log("Twitch bot connected to channel " + this.channel);
        this.wss.sendToWebSocket({
            type: 'connected'
            });
    }
    
    async onTwitchBotDisconnectedHandler(reason) {
        this.wss.sendToWebSocket({
            type: 'disconnected',
            reason
        });
    }
    
    async onTwitchBotJoinHandler(channel, username, self) {
        this.wss.sendToWebSocket({
            type: 'join',
            channel,
            username
        });
    
    }
    
    async onTwitchBotFollowHandler(channel, username, self) {
        
        this.wss.sendToWebSocket({
            type: 'follow',
            channel,
            username
        });
    }
    
    async onTwitchBotBanHandler(channel, username, reason, userstate) {
        this.wss.sendToWebSocket({
            type: 'ban',
            channel,
            username,
            reason,
            userstate
        });
    }
    
    async onTwitchBotRaidedHandler(channel, username, viewers) {
        this.wss.sendToWebSocket({
            type: 'raided',
            channel,
            username,
            viewers
        });
    }
    
    async onTwitchBotSubscriptionHandler(channel, username, method, message, userstate) {
        this.wss.sendToWebSocket({
            type: 'subscription',
            channel,
            username,
            method,
            message,
            userstate
        });
    }
    
    async onTwitchBotSubgiftHandler(channel, username, streakMonths, recipient, methods, userstate) {
        this.wss.sendToWebSocket({
            type: 'subgift',
            channel,
            username,
            streakMonths,
            recipient,
            methods,
            userstate
        });
    }
    
    async onTwitchBotSubmysterygiftHandler(channel, username, numbOfSubs, methods, userstate) {
        this.wss.sendToWebSocket({
            type: 'submysterygift',
            channel,
            username,
            numbOfSubs,
            methods,
            userstate
        });
    }

    async onCommand(channel, userstate, message) {
        const args = message.split(' ');
        const trigger = args[0].toLowerCase().substring(1);
        
        if(trigger === 'help'){
            if(args.length === 1) {
                this.client.say(channel, `Available commands: ${commands.map(command => command.aliases).join(',')}`);
            } else {
                const command = commands.find(command => command.aliases.includes(args[1]));
                if(command) {
                    this.client.say(channel, `${command.name}: ${command.description}`);
                    this.client.say(channel, `Usage: ${command.usage}`);
                } else {
                    this.client.say(channel, `Command not found!`);
                }
            }
        }
        for(const command of commands) {
            if (command.aliases.includes(trigger)) {
                try {
                    command.execute(this, channel, args, userstate);
                    console.log(`Aliases: ${command.aliases}`);
                } catch (err) {
                    console.log(err);
                }
                
                
            } else if (command.subcommands && command.subcommands.includes(trigger)) {
                
                try {
                    command[trigger](this, channel, args, userstate);
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

}

module.exports = TwitchBot;