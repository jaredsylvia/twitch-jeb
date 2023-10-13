// Load the things we need
require('dotenv').config();
const TwitchBot = require('./twitch/twitchBot.js');
const WebSocketServer = require('./websocket/webSocketServer.js');
const express = require('express');
const fetch = require('node-fetch');
const tmi = require('tmi.js');
const cookieParser = require('cookie-parser');
const WebSocket = require('ws');
const path = require('path');
const ejs = require('ejs');
const { send } = require('process');
const { get } = require('http');

// Get variables from .env
const twitchUsername = process.env.TWITCH_USERNAME;
const twitchChannel = process.env.TWITCH_CHANNEL;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchSecret = process.env.TWITCH_SECRET;
const twitchUserID = process.env.TWITCH_USERID;
const serverIp = process.env.SERVER_IP;
const serverPort = process.env.SERVER_PORT || 3000;
const serverBaseUrl = process.env.SERVER_BASE_URL;

// Define configuration options for Twitch bot
const twitchTokenUrl = 'https://id.twitch.tv/oauth2/token';
let twitchOAuthToken;
let twitchBotClient;

// Create an Express app
const app = express();
app.use(cookieParser());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Start the web server
const server = app.listen(serverPort, serverIp, () => {
    console.log(`Server listening on ${serverIp}:${serverPort}`);
    console.log(`Base URL: ${serverBaseUrl}`);
});

// Start the websocket server
let wss = new WebSocketServer(server, twitchClientId, twitchOAuthToken, twitchChannel, twitchUserID);
async function startWebSocketServer() {
    await wss.setupWebSocketServer();
}
startWebSocketServer ();

// Define a route for the home page
app.get('/', (req, res) => {
    const twitchRefreshToken = req.cookies?.twitchRefreshToken;
   
    if (twitchRefreshToken) {
        const twitchTokenParams = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: twitchRefreshToken,
        client_id: twitchClientId,
        client_secret: twitchSecret
        });

        fetch(twitchTokenUrl, {
            method: 'POST',
            body: twitchTokenParams
          }).then((response) => {
            return response.json();
          }).then((data) => {
            twitchOAuthToken = data.access_token;
            res.cookie('twitchOAuthToken', data.access_token);
            res.cookie('twitchRefreshToken', data.refresh_token);
            
            res.redirect('/dashboard');
          }).catch((error) => {
            console.error('Error refreshing access token:', error);
            res.redirect('/auth/twitch');
          });
        } else {
          res.redirect('/dashboard');
        }    
});

// Define a route for the Twitch OAuth flow
app.get('/auth/twitch', (req, res) => {
    const redirectUri = `${serverBaseUrl}/auth/twitch/callback`;
    const scope = 'channel:moderate+chat:edit+chat:read';

    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    res.redirect(twitchAuthUrl);
});

// Define a route for the Twitch OAuth callback
app.get('/auth/twitch/callback', async (req, res) => {
    const { code } = req.query;

    const params = new URLSearchParams();
    params.append('client_id', twitchClientId);
    params.append('client_secret', twitchSecret);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', `${serverBaseUrl}/auth/twitch/callback`);

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: params
    });

    const data = await response.json();

    twitchOAuthToken = data.access_token;

    // Store the OAuth token in a cookie or session
    res.cookie('twitchOAuthToken', data.access_token);
    res.cookie('twitchRefreshToken', data.refresh_token);
    
    // Define configuration options for Twitch bot

    // Redirect to the home page
    res.redirect('/dashboard');
});

// Define a route for the dashboard page
app.get('/dashboard', (req, res) => {
    const twitchOAuthToken = req.cookies?.twitchOAuthToken;
    
    
    if (twitchOAuthToken) {
        res.render('dashboard', { twitchUsername });
        twitchBotClient = new TwitchBot(twitchUsername, twitchOAuthToken, twitchChannel, wss);
        async function startTwitchClient() {
            await twitchBotClient.connect();
        }
        wss.updateTwitchInfo(twitchClientId, twitchOAuthToken, twitchChannel);
        startTwitchClient ();
    } else {
        res.redirect('/auth/twitch');
    }
});