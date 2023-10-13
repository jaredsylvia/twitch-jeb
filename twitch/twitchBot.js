const tmi = require('tmi.js');
const CoinFlipCommand = require('./commandClasses/coinFlipCommand');

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

        this.client = new tmi.client(options);

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

    async updateWss (wss) {
        this.wss = wss;
    }

    async say (message) {
        this.client.say(this.channel, message);
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
        const messageText = message.trim();
        const isCommand = messageText.startsWith('!');

        if(isCommand) {
            const commandName = messageText.substring(1);
            this.onCommand(commandName, channel, userstate, message);
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

    async onCommand(commandName, channel, userstate) {
        const args = commandName.split(' ');
        const isBroadcaster = userstate.badges && userstate.badges.broadcaster === '1';
        const isMod = userstate.mod || isBroadcaster;
        const isSub = userstate.subscriber || isBroadcaster;
        const isVip = userstate.badges && userstate.badges.vip === '1';
       
        switch (commandName) {
            case 'slap':
                this.client.say(channel, `@${userstate.username} slapped ${message.substring(6)} with a large trout!`);
                break;
            case 'lurk':
                this.client.say(channel, `@${userstate.username} is now lurking!`);
                break;
            case 'unlurk':
                this.client.say(channel, `@${userstate.username} is no longer lurking!`);
                break;
            case 'flip':
                this.coinFlipCommand = new CoinFlipCommand(this, channel);
                this.coinFlipCommand.flip(userstate);
                break;
            case 'heads':
                if(this.coinFlipCommand) {
                    this.coinFlipCommand.guess(userstate, 'heads');
                } else {
                    this.client.say(channel, `@${userstate.username} there is no coin to flip!`);
                }
                break;
            case 'tails':
                if(this.coinFlipCommand) {
                    this.coinFlipCommand.guess(userstate, 'tails');
                } else {
                    this.client.say(channel, `@${userstate.username} there is no coin to flip!`);
                }
                break;
            case 'help':
                switch (args[0]) {
                    case 'slap':
                        this.client.say(channel, 'Usage: !slap <username>');
                        break;
                    case 'lurk':
                        this.client.say(channel, 'Usage: !lurk');
                        break;
                    case 'unlurk':
                        this.client.say(channel, 'Usage: !unlurk');
                        break;
                    case 'flip':
                        this.client.say(channel, 'Usage: !flip');
                        break;
                    case 'heads':
                        this.client.say(channel, 'Usage: !heads');
                        break;
                    case 'tails':
                        this.client.say(channel, 'Usage: !tails');
                        break;
                    default:
                        this.client.say(channel, 'Commands: !slap, !lurk, !unlurk, !flip, !heads, !tails');
                        break;
                }
        }
        if(isMod) {
            switch (commandName) {
                case 'ping':
                    this.client.say(channel, 'Pong!');
                    break;
                case 'pong':
                    this.client.say(channel, 'Ping!');
                    break;
                case 'uptime':
                    this.client.say(channel, 'Uptime!');
                    break;
                case 'parrot':
                    this.client.say(channel, message.substring(7));
                    break;
                case 'ban':
                    this.client.ban(channel, message.substring(5));
                    break;
                case 'unban':
                    this.client.unban(channel, message.substring(7));
                    break;
                case 'timeout':
                    this.client.timeout(channel, message.substring(9));
                    break;
                case 'untimeout':
                    this.client.untimeout(channel, message.substring(11));
                    break;
                case 'slow':
                    this.client.slow(channel, message.substring(6));
                    break;
                case 'slowoff':
                    this.client.slowoff(channel);
                    break;
                case 'followers':
                    this.client.followersonly(channel, message.substring(10));
                    break;
                case 'followersoff':
                    this.client.followersonlyoff(channel);
                    break;
                case 'clear':
                    this.client.clear(channel);
                    break;
                case 'emoteonly':
                    this.client.emoteonly(channel);
                    break;
                case 'emoteonlyoff':
                    this.client.emoteonlyoff(channel);
                    break;
                case 'subscribers':
                    this.client.subscribers(channel);
                    break;
                case 'subscribersoff':
                    this.client.subscribersoff(channel);
                    break;
                case 'commercial':
                    this.client.commercial(channel, message.substring(11));
                    break;
                case 'host':
                    this.client.host(channel, message.substring(6));
                    break;
                case 'unhost':
                    this.client.unhost(channel);
                    break;
                case 'raid':
                    this.client.raid(channel, message.substring(6));
                    break;
                case 'modhelp':
                    switch (args[0]) {
                        case 'ban':
                            this.client.say(channel, 'Usage: !ban <username>');
                            break;
                        case 'unban':
                            this.client.say(channel, 'Usage: !unban <username>');
                            break;
                        case 'timeout':
                            this.client.say(channel, 'Usage: !timeout <username> <seconds>');
                            break;
                        case 'untimeout':
                            this.client.say(channel, 'Usage: !untimeout <username>');
                            break;
                        case 'slow':
                            this.client.say(channel, 'Usage: !slow <seconds>');
                            break;
                        case 'slowoff':
                            this.client.say(channel, 'Usage: !slowoff');
                            break;
                        case 'followers':
                            this.client.say(channel, 'Usage: !followers <minutes>');
                            break;
                        case 'followersoff':
                            this.client.say(channel, 'Usage: !followersoff');
                            break;
                        case 'clear':
                            this.client.say(channel, 'Usage: !clear');
                            break;
                        case 'emoteonly':
                            this.client.say(channel, 'Usage: !emoteonly');
                            break;
                        case 'emoteonlyoff':
                            this.client.say(channel, 'Usage: !emoteonlyoff');
                            break;
                        case 'subscribers':
                            this.client.say(channel, 'Usage: !subscribers');
                            break;
                        case 'subscribersoff':
                            this.client.say(channel, 'Usage: !subscribersoff');
                            break;
                        case 'commercial':
                            this.client.say(channel, 'Usage: !commercial <length>');
                            break;
                        case 'host':
                            this.client.say(channel, 'Usage: !host <channel>');
                            break;
                        case 'unhost':
                            this.client.say(channel, 'Usage: !unhost');
                            break;
                        case 'raid':
                            this.client.say(channel, 'Usage: !raid <channel>');
                            break;
                        default:
                            this.client.say(channel, 'Commands: !ban, !unban, !timeout, !untimeout, !slow, !slowoff, !followers, !followersoff, !clear, !emoteonly, !emoteonlyoff, !subscribers, !subscribersoff, !commercial, !host, !unhost, !raid');
                            break;
                    }
                    break;
            }
        }
    }


    

}

module.exports = TwitchBot;