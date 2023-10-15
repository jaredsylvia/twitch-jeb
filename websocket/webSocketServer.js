const WebSocket = require('ws');
const twitchApi = require('../twitch/twitchApi.js');

class WebSocketServer {
    constructor(server, twitchClientId, twitchOauthToken, twitchChannel, twitchUserID) {
        this.server = server;
        this.twitchClientId = twitchClientId;
        this.twitchOauthToken = twitchOauthToken;
        this.twitchChannel = twitchChannel;
        this.twitchUserID = twitchUserID;
        this.wss = new WebSocket.Server({ server });
    }

    setupWebSocketServer() {
        this.wss.on('listening', this.onListening.bind(this));
        this.wss.on('connection', this.onConnection.bind(this));
    }

    sendToWebSocket(data) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    updateTwitchInfo(twitchClientId, twitchOauthToken, twitchChannel) {
        this.twitchClientId = twitchClientId;
        this.twitchOauthToken = twitchOauthToken;
        this.twitchChannel = twitchChannel;
    }

    setTwitchBot(twitchBotClient) {
        this.twitchBotClient = twitchBotClient;
    }

    onListening() {
        console.log(`WebSocket server started and listening.`);
    }

    onConnection(ws) {
        console.log('WebSocket client connected');
        ws.on('message', this.onMessage.bind(this));
        ws.on('close', this.onClose.bind(this));
    }

    async onMessage(message) {
        
        const parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case 'getInfo':
                try {
                    const streamData = await twitchApi.getStreamData(this.twitchClientId, this.twitchOauthToken, this.twitchUserID);
                    const channelData = await twitchApi.getChannelData(this.twitchClientId, this.twitchOauthToken, this.twitchUserID);
                    const followerCount = await twitchApi.getFollowerCount(this.twitchClientId, this.twitchOauthToken, this.twitchUserID);

                    const data = {
                        type: 'info',
                        streamData,
                        channelData,
                        followerCount
                    };
                    this.sendToWebSocket(data);
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
                    this.wss.sendToWebSocket({
                        type: 'message',
                        message: parsedMessage.message
                    });
                } catch (error) {
                    console.log(error);
                }
                break;

        }

    }

    onClose() {
        console.log('WebSocket client disconnected');
    }
}

module.exports = WebSocketServer;
