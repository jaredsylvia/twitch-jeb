const WebSocket = require('ws');
const TwitchApi = require('../twitch/twitchApi.js');

class WebSocketServer {
    constructor(server, twitchClientId, twitchOauthToken, twitchRefreshToken, twitchChannel, twitchUserID, db) {
        this.server = server;
        this.twitchClientId = twitchClientId;
        this.twitchOauthToken = twitchOauthToken;
        this.twitchRefreshToken = twitchRefreshToken;
        this.twitchChannel = twitchChannel;
        this.twitchUserID = twitchUserID;        
        this.wss = new WebSocket.Server({ server });
        this.twitchApiClient = new TwitchApi(twitchOauthToken, null, twitchUserID);
        this.db = db;
    }

    async setupWebSocketServer() {
        this.wss.on('listening', this.onListening.bind(this));
        this.wss.on('connection', this.onConnection.bind(this));
    }

    async sendToWebSocket(data) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
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

    async onListening() {
        console.log(`WebSocket server started and listening.`);
    }

    async onConnection(ws) {
        console.log('WebSocket client connected');
        ws.on('message', this.onMessage.bind(this));
        ws.on('close', this.onClose.bind(this));
    }

    async onMessage(message) {
        
        const parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case 'getInfo':
                try {
                    const streamData = await this.twitchApiClient.getStreamData();
                    const channelData = await this.twitchApiClient.getChannelData();
                    const followerCount = await this.twitchApiClient.getFollowerCount();
                    const kothData = await this.db.getKOTH();
                    const rouletteData = await this.db.getRoulette();
                    const coinflipData = await this.db.getCoinflip();
                    const goals = [
                        await this.db.getGoal('follow'),
                        await this.db.getGoal('sub'),
                        await this.db.getGoal('bits'),
                        await this.db.getGoal('dono')
                    ]
                    const mostRecentFollower = await this.db.getMostRecentFollower();
                    const mostRecentSubscriber = await this.db.getMostRecentSubscriber();
                    const mostRecentViewer = await this.db.getMostRecentViewer();
                    
                    const data = {
                        type: 'info',
                        streamData,
                        channelData,
                        followerCount,
                        kothData,
                        rouletteData,
                        coinflipData,
                        goals,                        
                        mostRecentFollower,
                        mostRecentSubscriber,
                        mostRecentViewer
                    };
                    
                    this.sendToWebSocket(data);
                } catch (error) {
                    console.log(error);
                }
                break;
            case 'updateUserInformation':
                try {
                    // get all users viewing the stream
                    const viewers = await this.db.getAllViewers();
                    for (const viewer of viewers) {
                        
                        // add points to each viewer
                        await this.db.addPoints(viewer.username, 10);
                        
                    }
                } catch (error) {
                    console.log(error);
                }
                break;
            case 'startBot':
                try {
                    await this.twitchBotClient.connect();                    
                } catch (error) {
                    console.log(error);
                }
                break;
            case 'stopBot':
                try {
                    await this.twitchBotClient.disconnect();
                } catch (error) {
                    console.log(error);
                }
                break;
            case 'message':
                try {
                    this.sendToWebSocket({
                        type: 'message',
                        message: parsedMessage.message
                    });
                } catch (error) {
                    console.log(error);
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
                    console.log(error);
                }
                break;
            case 'alert':
                try {
                    
                    this.sendToWebSocket({
                        type: 'alert',
                        message: parsedMessage.message
                    });
                } catch (error) {
                    console.log(error);
                }
                break;
            case 'disclaimer':
                try {
                    var disclaimer = await this.db.getDisclaimer('default');
                    this.twitchBotClient.client.say(this.twitchChannel, disclaimer.message);
                } catch (error) {
                    console.log(error);
                }
                break;
            default:
                break;
        }

    }

    async onClose() {
        console.log('WebSocket client disconnected');        
    }
}

module.exports = WebSocketServer;
