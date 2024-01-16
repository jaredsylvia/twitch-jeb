require('dotenv').config();
const tmi = require('tmi.js');

const CoinFlipCommand = require('./commandClasses/coinFlipCommand.js');
const StandardCommands = require('./commandClasses/standardCommands.js');
const DiceRoll = require('./commandClasses/diceRoll.js');
const KingOfTheHill = require('./commandClasses/kingOfTheHill.js');
const Lurkers = require('./commandClasses/lurkers.js');
const Quotes = require('./commandClasses/quotes.js');
const Roulette = require('./commandClasses/roulette.js');
const Points = require('./commandClasses/points.js');
const Goals = require('./commandClasses/goals.js');
const Disclaimers = require('./commandClasses/disclaimers.js');
const Clips = require('./commandClasses/clips.js');
const Trivia = require('./commandClasses/trivia.js');
const standardCommands = new StandardCommands();


class TwitchBot {
    constructor (username, twitchClientId, twitchOauthToken, twitchRefreshToken, twitchUserID, channel, wss, db, twitchApiClient) {
        this.username = username;
        this.twitchClientId = twitchClientId;
        this.oauthToken = twitchOauthToken;
        this.refreshToken = twitchRefreshToken;
        this.userID = twitchUserID;
        this.channel = channel;
        this.wss = wss;
        this.db = db;        
        this.coinFlipCommand = null;
        this.twitchApiClient = twitchApiClient;
        this.commands = [];
        this.running = false;        

        this.onTwitchBotConnectedHandler = this.onTwitchBotConnectedHandler.bind(this);
        this.onTwitchBotDisconnectedHandler = this.onTwitchBotDisconnectedHandler.bind(this);
        
        this.onTwichBotMessageHandler = this.onTwichBotMessageHandler.bind(this);
        this.onTwitchBotMessageDeletedHandler = this.onTwitchBotMessageDeletedHandler.bind(this);
        
        this.onTwitchBotJoinHandler = this.onTwitchBotJoinHandler.bind(this);
        this.onTwitchBotPartHandler = this.onTwitchBotPartHandler.bind(this);
        
        this.onTwitchBotModHandler = this.onTwitchBotModHandler.bind(this);
        this.onTwitchBotUnmodHandler = this.onTwitchBotUnmodHandler.bind(this);

        this.onTwitchBotFollowHandler = this.onTwitchBotFollowHandler.bind(this);
        
        this.onTwitchBotBanHandler = this.onTwitchBotBanHandler.bind(this);
        this.onTwitchBotTimeoutHandler = this.onTwitchBotTimeoutHandler.bind(this);
        
        this.onTwitchBotRaidedHandler = this.onTwitchBotRaidedHandler.bind(this);
        
        this.onTwitchBotSubscriptionHandler = this.onTwitchBotSubscriptionHandler.bind(this);
        this.onTwitchBotSubgiftHandler = this.onTwitchBotSubgiftHandler.bind(this);
        this.onTwitchBotSubmysterygiftHandler = this.onTwitchBotSubmysterygiftHandler.bind(this);

        this.onTwitchBotCheerHandler = this.onTwitchBotCheerHandler.bind(this);

        this.tenMinuteInterval = null;

        console.log('TwitchBot instantiated');
    }

    async connect () {
        
        if(this.running) {
            return;
        }
        const options = {
        identity: {
            username: this.username,
            password: this.oauthToken
        },
            channels: [ this.channel ]
        };        

        //check if client is already connected
        if(this.client) {            
            await this.disconnect();
            if(typeof this.tenMinuteInterval !== 'undefined') {
                clearInterval(this.tenMinuteInterval);        
            }
            
            
        }
        console.log('Connecting to Twitch...');
        
            this.client = new tmi.client(options);
            console.log('Twitch client created');
            this.running = true;        

            this.client.on('connected', this.onTwitchBotConnectedHandler);
            this.client.on('disconnected', this.onTwitchBotDisconnectedHandler);
            
            this.client.on('message', this.onTwichBotMessageHandler);
            this.client.on('messagedeleted', this.onTwitchBotMessageDeletedHandler);
                    
            this.client.on('join', this.onTwitchBotJoinHandler);
            this.client.on('part', this.onTwitchBotPartHandler);
            
            this.client.on('mod', this.onTwitchBotModHandler);
            this.client.on('unmod', this.onTwitchBotUnmodHandler);
            
            this.client.on('follow', this.onTwitchBotFollowHandler);
            
            this.client.on('ban', this.onTwitchBotBanHandler);
            this.client.on('timeout', this.onTwitchBotTimeoutHandler);

            this.client.on('raided', this.onTwitchBotRaidedHandler);
            
            this.client.on('subscription', this.onTwitchBotSubscriptionHandler);
            this.client.on('subgift', this.onTwitchBotSubgiftHandler);
            this.client.on('submysterygift', this.onTwitchBotSubmysterygiftHandler);

            this.client.on('cheer', this.onTwitchBotCheerHandler);
            console.log('Twitch client event handlers set');

            try {
                await this.client.connect();
                console.log('Connected to Twitch!');
                // 10 minute interval
                this.tenMinuteInterval = setInterval(async () => {
                    await this.updateVips();
                }, 600000);  
            } catch (error) {
                console.error('Error connecting to Twitch:', error);
                console.trace('Full stack trace:', error.stack);
        
                if (error.message === 'Not connected to server.') {
                    console.error('The error occurred during the connection attempt.');
                } else {
                    console.error('Unknown error during the connection attempt.');
                }               
            }
        }

    

    async disconnect () {
        try {
        await this.client.disconnect();
        if(typeof this.tenMinuteInterval !== 'undefined') {
            clearInterval(this.tenMinuteInterval);        
        }
        this.running = false;
        this.db.setAllNotViewingNow();        
        } catch (error) {
            console.log(error);
        }
        
    }

    async updateWss (wss) {
        this.wss = wss;
    }

    
    
    async setupCommands () {
        
        standardCommands.getAllCommands().forEach(command => {
            this.commands.push(command);
        });
        this.commands.push(new DiceRoll());
        this.commands.push(new KingOfTheHill(this.db, this.wss));
        this.commands.push(new CoinFlipCommand(this.db, this.wss));
        this.commands.push(new Lurkers());
        this.commands.push(new Quotes(this.db, this.wss));
        this.commands.push(new Roulette(this.db, this.wss));
        this.commands.push(new Points(this.db));
        this.commands.push(new Goals(this.db));
        this.commands.push(new Disclaimers(this.db));    
        this.commands.push(new Clips(this.db, this.wss));
        this.commands.push(new Trivia(this.wss));
    //  console.log(this.commands);
    }
    
    async onTwichBotMessageHandler (channel, userstate, message, self) {
        this.wss.sendToWebSocket({
            type: 'message',
            channel,
            userstate,
            message,
            self
        });
        // add viewer to viewersMessaged set if not already in it
        if(!this.twitchApiClient.viewersMessaged.has(userstate.username)) {
            this.twitchApiClient.viewersMessaged.add(userstate.username);
            this.wss.sendToWebSocket({ type: 'alert', message: `Welcome to the stream ${userstate.username}`});
            await this.db.setViewingNow(userstate.username, true);
        } else {
            
        }

        //check for url and extract it
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const url = message.match(urlRegex);
        if(url) {
            //send to clips command
            console.log(message);
            this.commands.find(command => command.name === 'Clips').addClip(this, channel, message, userstate);
        }
        //count length of message, divide by 2 and round up to get points
        const points = Math.ceil(message.length / 3);
        
        // add points to user
        await this.db.addPoints(userstate.username, points);

        // extract message
        const isCommand = message.startsWith('!');
        
        if(isCommand) {
            this.onCommand(channel, userstate, message);
        }

        // Get user from viewer table
        const viewer = await this.db.getViewer(userstate.username);
        
        // Check if user has userid
        if(viewer && !viewer.userid) {
            console.log(`Adding userid ${userstate['user-id']} to ${userstate.username}`);
            await this.db.setUserID(userstate.username, userstate['user-id']);
            }
    }

    async onTwitchBotMessageDeletedHandler (channel, username, deletedMessage, userstate) {
        this.wss.sendToWebSocket({
            type: 'messageDeleted',
            channel,
            username,
            deletedMessage,
            userstate
        });

        // Add to viewer's deleted message count
        await this.db.addDeletedMessage(username);

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
        
        // Add viewer if not already in database
        const viewer = await this.db.getViewer(username);
        if(!viewer) {
            await this.db.addViewer(username);
        } else {            
            await this.db.setLastSeen(username, new Date());            
        }
    }

    async onTwitchBotPartHandler(channel, username, self) {
        this.wss.sendToWebSocket({
            type: 'part',
            channel,
            username
        });

        // Set viewing now to false
        await this.db.setViewingNow(username, false);

        // Set last seen to current date
        await this.db.setLastSeen(username, new Date());
    }

    async onTwitchBotModHandler(channel, username) {
        this.wss.sendToWebSocket({
            type: 'mod',
            channel,
            username
        });

        // Set moderator status to true
        await this.db.setModerator(username, true);
    }

    async onTwitchBotUnmodHandler(channel, username) {
        this.wss.sendToWebSocket({
            type: 'unmod',
            channel,
            username
        });

        // Set moderator status to false
        await this.db.setModerator(username, false);
    }

    async onTwitchBotBanHandler(channel, username, reason, userstate) {
        this.wss.sendToWebSocket({
            type: 'ban',
            channel,
            username,
            reason,
            userstate
        });

        // delete viewer from database
        await this.db.deleteViewer(username);
    }

    async onTwitchBotTimeoutHandler(channel, username, reason, duration, userstate) {
        this.wss.sendToWebSocket({
            type: 'timeout',
            channel,
            username,
            reason,
            duration,
            userstate
        });

        // Add to viewer's timeout count
        await this.db.addTimeout(username);

    }

    async onTwitchBotFollowHandler(channel, username, self) {
        
        this.wss.sendToWebSocket({
            type: 'follow',
            channel,
            username
        });

        // Set follower status to true
        await this.db.setFollower(username, true);

        // Add points to user
        await this.db.addPoints(username, 1000);
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

        // Set subscriber status to true
        await this.db.setSubscriber(username, true);

        // Add points to user
        await this.db.addPoints(username, 1000);
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

    async onTwitchBotDisconnectedHandler(reason) {
        this.wss.sendToWebSocket({
            type: 'disconnected',
            reason
        });
        console.log("Twitch bot disconnected from channel " + this.channel);
        console.log(reason);
    }
    async onCommand(channel, userstate, message) {
        const args = message.split(' ');
        const trigger = args[0].toLowerCase().substring(1);
        
        if(trigger === 'help'){
            if(args.length === 1) {
                this.client.say(channel, `Available commands: ${this.commands.map(command => command.aliases).join(',')}`);
            } else {
                const command = this.commands.find(command => command.aliases.includes(args[1]));
                if(command) {
                    this.client.say(channel, `${command.name}: ${command.description}`);
                    this.client.say(channel, `Usage: ${command.usage}`);
                } else {
                    this.client.say(channel, `Command not found!`);
                }
            }
        }
        for(const command of this.commands) {
            if (command.aliases.includes(trigger)) {
                try {
                    command.execute(this, channel, args, userstate);
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

    async onTwitchBotCheerHandler(channel, userstate, message) {
        this.wss.sendToWebSocket({
            type: 'cheer',
            channel,
            userstate,
            message
        });

        //update cheer count
        this.twitchApiClient.bits += userstate.bits;       

        // Add points to user
        await this.db.addPoints(userstate.username, userstate.bits * 10);
    }

    async updateOauthToken (twitchOauthToken) {
        this.oauthToken = twitchOauthToken;
        this.connect(); 
    }

    // get top3 viewers and set to VIP
    async updateVips () {
        const viewers = await this.db.getTop3Viewers();
        viewers.forEach(async viewer => {            
            this.twitchApiClient.setVip(viewer.userid, true);            
        });
    }
    

}

module.exports = TwitchBot;