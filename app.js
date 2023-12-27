// Load the things we need
require('dotenv').config();
const TwitchBot = require('./twitch/twitchBot.js');

const WebSocketServer = require('./websocket/webSocketServer.js');
const Database = require('./db/db.js');


const express = require('express');
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
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
const serverHost = process.env.SERVER_HOST;
const serverPort = process.env.SERVER_PORT || 3000;
const serverProxied = (process.env.SERVER_PROXIED === "true");

// Define the base URL for the server
// If proxied, use the serverHost variable, no port, and https
// Otherwise, use the serverIp variable, port, and http
let serverBaseUrl;
let webSocketAddress;
if (serverProxied) {
    serverBaseUrl = `https://${serverHost}`;
    webSocketAddress = `wss://${serverHost}`;
    } else {
    serverBaseUrl = `http://${serverIp}:${serverPort}`;
    webSocketAddress = `ws://${serverIp}:${serverPort}`;
}

const dbPath = process.env.DB_PATH;

// Define configuration options for Twitch bot
const twitchTokenUrl = 'https://id.twitch.tv/oauth2/token';
let twitchOAuthToken;
let twitchRefreshToken;
let twitchBotClient;

// Connect to database
let db = new Database(dbPath);

// Create tables if they don't exist
db.createTables();

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
    console.log(`Twitch username: ${twitchUsername}`);
    console.log(`Twitch channel: ${twitchChannel}`);
    console.log(`Twitch user ID: ${twitchUserID}`);
    console.log(`Server IP: ${serverIp}`);
    console.log(`Database path: ${dbPath}`);
});

// Start the websocket server
let wss = new WebSocketServer(server, twitchClientId, twitchOAuthToken, twitchRefreshToken, twitchChannel, twitchUserID, db);
wss.setupWebSocketServer();

// Define a route for the home page
app.get('/', (req, res) => {
          res.render('index', { twitchUsername });
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
    res.cookie('twitchOAuthToken', data.access_token, { sameSite: 'Strict', httpOnly: false });
    res.cookie('twitchRefreshToken', data.refresh_token, { sameSite: 'Strict', httpOnly: false });
    res.cookie('twitchExpiry', data.expires_in, { sameSite: 'Strict', httpOnly: false });       
    console.log(data);
    // Redirect to the home page
    res.redirect('/');
});

// Define a route for the logout page
app.get('/logout', (req, res) => {
    res.clearCookie('twitchOAuthToken');
    res.clearCookie('twitchRefreshToken');
    res.clearCookie('twitchExpiry');
    res.redirect('/');
});

// Define a route for the dashboard page
app.get('/dashboard', (req, res) => {
    const twitchOAuthToken = req.cookies?.twitchOAuthToken;
    const twitchRefreshToken = req.cookies?.twitchRefreshToken;
    
    if (twitchOAuthToken) {
        if(!twitchBotClient) {
            twitchBotClient = new TwitchBot(twitchUsername, twitchClientId, twitchOAuthToken, twitchRefreshToken, twitchUserID, twitchChannel, wss, db);
        } else {
            twitchBotClient.updateOauthToken(twitchOAuthToken);
        }
        wss.setTwitchBot(twitchBotClient);
        wss.updateTwitchInfo(twitchClientId, twitchOAuthToken, twitchRefreshToken, twitchChannel);
        twitchBotClient.setupCommands();

        res.render('dashboard', { twitchUsername, twitchChannel, serverHost, webSocketAddress });
        
    } else {
        res.redirect('/auth/twitch');
    }
});

// Define a route for overlay page
app.get('/overlay', (req, res) => {
    res.render('overlay', { twitchUsername, webSocketAddress });      
});