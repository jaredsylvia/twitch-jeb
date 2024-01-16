require('dotenv').config();
const WebSocket = require('ws');
const OctoPrinter = require('../octopi/octoApi.js');
const Command = require('../twitch/commandClasses/command.js');

class WebSocketServer {
    constructor(server, twitchClientId, twitchOauthToken, twitchRefreshToken, twitchChannel, twitchUserID, db, twitchApiClient) {
        this.server = server;
        this.twitchClientId = twitchClientId;
        this.twitchOauthToken = twitchOauthToken;
        this.twitchRefreshToken = twitchRefreshToken;
        this.twitchChannel = twitchChannel;
        this.twitchUserID = twitchUserID;        
        this.wss = new WebSocket.Server({ server });
        this.twitchApiClient = twitchApiClient;
        this.octoPrinter = new OctoPrinter(process.env.OCTO_API, process.env.OCTO_URL);
        this.bits = 0;
        this.db = db;
        this.disconnectCount = 0;   
    }

    async setupWebSocketServer() {
        try {
            this.wss.on('listening', this.onListening.bind(this));
            this.wss.on('connection', this.onConnection.bind(this));
        } catch (error) {
            console.error('Error in setupWebSocketServer:', error);
        }
    }

    async sendToWebSocket(data) {
        try {
            if (data instanceof Promise) {
                // If data is a promise, await its resolution
                data = await data;
            }

            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('Error in sendToWebSocket:', error);
        }
    }

    async updateTwitchInfo(twitchClientId, twitchOauthToken, twitchRefreshToken, twitchChannel) {
        this.twitchClientId = twitchClientId;
        this.twitchOauthToken = twitchOauthToken;
        this.twitchRefreshToken = twitchRefreshToken;
        this.twitchChannel = twitchChannel;
        this.twitchApiClient.setOauthToken(twitchOauthToken);
        this.twitchApiClient.setRefreshToken(twitchRefreshToken);
        
    }

    async setTwitchBot(twitchBotClient) {
        this.twitchBotClient = twitchBotClient;
    }

    async setTwichApiClient(twitchApiClient) {
        this.twitchApiClient = twitchApiClient;
    }

    async filterDefinedProperties(obj) {
        const entries = await Promise.all(
            Object.entries(obj).map(async ([key, value]) => [key, await Promise.resolve(value)])
        );
        return Object.fromEntries(entries.filter(([key, value]) => value !== undefined && value !== null));
    }
    
    
    async filterNestedObject(obj) {
        return this.filterDefinedProperties(obj);
    }

    async handleGetInfo() {
        try {
            const [
                streamData,
                channelData,
                followerCount,
                subCount,
                bitCount,
                kothData,
                rouletteData,
                coinflipData,
                followGoal,
                subGoal,
                bitsGoal,
                donoGoal,
                mostRecentFollower,
                mostRecentSubscriber,
                mostRecentViewer,
                [printerStatus, printerJob],
            ] = await Promise.all([
                await this.twitchApiClient.getStreamData(),
                await this.twitchApiClient.getChannelData(),
                await this.twitchApiClient.getFollowerCount(),
                await this.twitchApiClient.getSubscriberCount(),
                this.bits,
                this.db.getKOTH(),
                this.db.getRoulette(),
                this.db.getCoinflip(),
                this.db.getGoal('follow'),
                this.db.getGoal('sub'),
                this.db.getGoal('bits'),
                this.db.getGoal('dono'),
                this.db.getMostRecentFollower(),
                this.db.getMostRecentSubscriber(),
                this.db.getMostRecentViewer(),
                Promise.all([
                    this.octoPrinter.getPrinterStatus(),
                    this.octoPrinter.getPrinterJob(),
                ]),
            ]);

            const data = this.filterDefinedProperties({
                type: 'info',
                stream: this.filterNestedObject({ 
                    data: streamData, 
                    channel: channelData, followerCount, subCount, bitCount,
                    goals: this.filterNestedObject({ follow: followGoal, sub: subGoal, bits: bitsGoal, dono: donoGoal }),
                }),
                game: this.filterNestedObject({
                    koth: kothData,
                    roulette: rouletteData,
                    coinflip: coinflipData,
                }),
                mostRecent: this.filterNestedObject({ follower: mostRecentFollower, subscriber: mostRecentSubscriber, viewer: mostRecentViewer }),
                printer: this.filterNestedObject({ status: printerStatus, job: printerJob }),
            });
    
            this.sendToWebSocket(data);
        } catch (error) {
            console.error('Error in data retrieval:', error);
        }
    }

    async updateUserInfo() {
        try {
            // get all users viewing the stream
            const viewers = await this.db.getAllViewers();
            for (const viewer of viewers) {
                
                // add points to each viewer
                await this.db.addPoints(viewer.username, 10);
                
            }
            
        } catch (error) {
            console.error(`Error in data retrieval: ${error}`);
        }
    }

    async onListening() {
        console.log(`WebSocket server started and listening.`);        
    }

    async onConnection(ws) {
        ws.on('message', this.onMessage.bind(this));
        ws.on('close', this.onClose.bind(this));
    }

    async onMessage(message) {
        
        const parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case 'getInfo':
                try {
                    await this.handleGetInfo();
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }                
                break;
            case 'updateUserInformation':
                try {
                    await this.updateUserInfo();
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'startBot':
                try {
                    await this.twitchBotClient.connect();                    
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'stopBot':
                try {
                    await this.twitchBotClient.disconnect();
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'message':
                try {
                    this.sendToWebSocket({
                        type: 'message',
                        message: parsedMessage.message
                    });
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'refreshOauth':
                try {
                    var data = await this.twitchApiClient.renewOauth(parsedMessage.token);
                    this.twitchOauthToken = data.access_token;
                    this.twitchApiClient.setOauthToken(data.access_token);
                    this.twitchBotClient.updateOauthToken(data.access_token);
                    this.sendToWebSocket({
                        type: 'refreshOauth',
                        token: data
                    });
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'alert':
                try {
                    
                    this.sendToWebSocket({
                        type: 'alert',
                        message: parsedMessage.message
                    });
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'disclaimer':
                try {
                    var disclaimer = await this.db.getDisclaimer('default');
                    this.twitchBotClient.client.say(this.twitchChannel, disclaimer.message);
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'setGameTitle':
                try {
                    this.twitchApiClient.setGameTitle(parsedMessage.game);
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'setStreamTitle':
                try {
                    this.twitchApiClient.setStreamTitle(parsedMessage.title);
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'updateVIP':
                try {
                    this.twitchBotClient.updateVIP(parsedMessage.username, parsedMessage.action);
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            case 'command':
                try {
                    this.twitchBotClient.client.say(this.twitchChannel, `!${parsedMessage.command}`);
                } catch (error) {
                    console.error(`Error in data retrieval: ${error}`);
                }
                break;
            default:
                break;
        }

    }

    async onClose() {
        this.disconnectCount++;
    }

    
}

module.exports = WebSocketServer;
