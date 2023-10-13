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





//Event handler functions
async function onTwitchBotMessageHandler(channel, userstate, message, self) {
    
    sendToWebSocket({
        type: 'message',
        channel,
        userstate,
        message
    });
    
    const args = message.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    const isBroadcaster = userstate.badges && typeof userstate.badges.broadcaster !== 'undefined';
    const isMod = userstate.mod === true;
    
    // Commands
    if (message.startsWith('!')) { // Commands for non moderators
        switch (command) {
            case 'slap':
                twitchBotClient.say(channel, `@${userstate.username} slapped ${message.substring(6)} with a large trout!`);
                break;
            case 'lurk':
                twitchBotClient.say(channel, `@${userstate.username} is now lurking!`);
                break;
            case 'unlurk':
                twitchBotClient.say(channel, `@${userstate.username} is no longer lurking!`);
                break;
            case 'flip':
                flipping = true;
                

                twitchBotClient.say(channel, `@${userstate.username} wants to flip a coin! Type !heads or !tails to guess!`);
                //Give people time to respond using !heads or !tails
                setTimeout(function () {
                    
                    setTimeout(function () {
                        twitchBotClient.say(channel, `Flipping a coin!`);
                        //set winning coin
                        winningCoin = Math.random() < 0.5 ? 'heads' : 'tails';
                        //announce winning coin
                        twitchBotClient.say(channel, `The coin landed on ${winningCoin}!`);
                    }, 20000);
                //check who guessed correctly
                    setTimeout(function () {
                        if(winningCoin === 'heads') {
                            twitchBotClient.say(channel, `The following people guessed correctly: ${heads}`);
                            twitchBotClient.say(channel, `The following people guessed incorrectly: ${tails}`);
                            twitchBotClient.say(channel, `@${heads[0]} was the first winner!`);
                            twitchBotClient.say(channel, `@${tails[0]} is the biggest loser!`);
                        } else {
                            twitchBotClient.say(channel, `The following people guessed correctly: ${tails}`);
                            twitchBotClient.say(channel, `The following people guessed incorrectly: ${heads}`);
                            twitchBotClient.say(channel, `@${tails[0]} was the first winner!`);
                            twitchBotClient.say(channel, `@${heads[0]} is the biggest loser!`);
                        }
                        //reset variables
                        heads = [];
                        tails = [];
                        winningCoin = '';
                        flipping = false;
                    }, 22000);
                

                }, 2000);
                
                break;
            case 'heads':
                if(flipping) {
                    //Check if user is already in heads array
                    if(heads.includes(userstate.username) || tails.includes(userstate.username)) { 
                        twitchBotClient.say(channel, `@${userstate.username} you already guessed!`);
                        break;
                    }
                    else {
                        heads.push(userstate.username);
                        twitchBotClient.say(channel, `@${userstate.username} guessed heads!`);
                    }
                    
                } else {
                    twitchBotClient.say(channel, `@${userstate.username} there is no coin to flip!`);
                }
                
                break;
            case 'tails':
                if(flipping) {
                    //Check if user is already in tails array
                    if(heads.includes(userstate.username) || tails.includes(userstate.username)) { 
                        twitchBotClient.say(channel, `@${userstate.username} you already guessed!`);
                        break;
                    }
                    else {
                        tails.push(userstate.username);
                        twitchBotClient.say(channel, `@${userstate.username} guessed tails!`);
                    }
                    
                } else {
                    twitchBotClient.say(channel, `@${userstate.username} there is no coin to flip!`);
                }
                
                break;
            case 'help':
                switch (args[0]) {
                    case 'slap':
                        twitchBotClient.say(channel, 'Usage: !slap <username>');
                        break;
                    case 'lurk':
                        twitchBotClient.say(channel, 'Usage: !lurk');
                        break;
                    case 'unlurk':
                        twitchBotClient.say(channel, 'Usage: !unlurk');
                        break;
                    case 'flip':
                        twitchBotClient.say(channel, 'Usage: !flip');
                        break;
                    case 'heads':
                        twitchBotClient.say(channel, 'Usage: !heads');
                        break;
                    case 'tails':
                        twitchBotClient.say(channel, 'Usage: !tails');
                        break;
                    default:
                        twitchBotClient.say(channel, 'Commands: !slap, !lurk, !unlurk, !flip, !heads, !tails');
                        break;
                }
        }
        if (message.startsWith('!') && (isMod || isBroadcaster)) { // Commands for moderators
    
            switch (command) {
                case 'ping':
                    twitchBotClient.say(channel, 'Pong!');
                    break;
                case 'pong':
                    twitchBotClient.say(channel, 'Ping!');
                    break;
                case 'uptime':
                    twitchBotClient.say(channel, 'Uptime!');
                    break;
                case 'parrot':
                    twitchBotClient.say(channel, message.substring(7));
                    break;
                case 'ban':
                    twitchBotClient.ban(channel, message.substring(5));
                    break;
                case 'unban':
                    twitchBotClient.unban(channel, message.substring(7));
                    break;
                case 'timeout':
                    twitchBotClient.timeout(channel, message.substring(9));
                    break;
                case 'untimeout':
                    twitchBotClient.untimeout(channel, message.substring(11));
                    break;
                case 'slow':
                    twitchBotClient.slow(channel, message.substring(6));
                    break;
                case 'slowoff':
                    twitchBotClient.slowoff(channel);
                    break;
                case 'followers':
                    twitchBotClient.followersonly(channel, message.substring(10));
                    break;
                case 'followersoff':
                    twitchBotClient.followersonlyoff(channel);
                    break;
                case 'clear':
                    twitchBotClient.clear(channel);
                    break;
                case 'emoteonly':
                    twitchBotClient.emoteonly(channel);
                    break;
                case 'emoteonlyoff':
                    twitchBotClient.emoteonlyoff(channel);
                    break;
                case 'subscribers':
                    twitchBotClient.subscribers(channel);
                    break;
                case 'subscribersoff':
                    twitchBotClient.subscribersoff(channel);
                    break;
                case 'commercial':
                    twitchBotClient.commercial(channel, message.substring(11));
                    break;
                case 'host':
                    twitchBotClient.host(channel, message.substring(6));
                    break;
                case 'unhost':
                    twitchBotClient.unhost(channel);
                    break;
                case 'raid':
                    twitchBotClient.raid(channel, message.substring(6));
                    break;
                case 'modhelp':
                    switch (args[0]) {
                        case 'ban':
                            twitchBotClient.say(channel, 'Usage: !ban <username>');
                            break;
                        case 'unban':
                            twitchBotClient.say(channel, 'Usage: !unban <username>');
                            break;
                        case 'timeout':
                            twitchBotClient.say(channel, 'Usage: !timeout <username> <seconds>');
                            break;
                        case 'untimeout':
                            twitchBotClient.say(channel, 'Usage: !untimeout <username>');
                            break;
                        case 'slow':
                            twitchBotClient.say(channel, 'Usage: !slow <seconds>');
                            break;
                        case 'slowoff':
                            twitchBotClient.say(channel, 'Usage: !slowoff');
                            break;
                        case 'followers':
                            twitchBotClient.say(channel, 'Usage: !followers <minutes>');
                            break;
                        case 'followersoff':
                            twitchBotClient.say(channel, 'Usage: !followersoff');
                            break;
                        case 'clear':
                            twitchBotClient.say(channel, 'Usage: !clear');
                            break;
                        case 'emoteonly':
                            twitchBotClient.say(channel, 'Usage: !emoteonly');
                            break;
                        case 'emoteonlyoff':
                            twitchBotClient.say(channel, 'Usage: !emoteonlyoff');
                            break;
                        case 'subscribers':
                            twitchBotClient.say(channel, 'Usage: !subscribers');
                            break;
                        case 'subscribersoff':
                            twitchBotClient.say(channel, 'Usage: !subscribersoff');
                            break;
                        case 'commercial':
                            twitchBotClient.say(channel, 'Usage: !commercial <length>');
                            break;
                        case 'host':
                            twitchBotClient.say(channel, 'Usage: !host <channel>');
                            break;
                        case 'unhost':
                            twitchBotClient.say(channel, 'Usage: !unhost');
                            break;
                        case 'raid':
                            twitchBotClient.say(channel, 'Usage: !raid <channel>');
                            break;
                        default:
                            twitchBotClient.say(channel, 'Commands: !ban, !unban, !timeout, !untimeout, !slow, !slowoff, !followers, !followersoff, !clear, !emoteonly, !emoteonlyoff, !subscribers, !subscribersoff, !commercial, !host, !unhost, !raid');
                            break;
                    }
                    break;
            }
        }
        
    }
}