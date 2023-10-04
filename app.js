// Load the things we need
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const tmi = require('tmi.js');

// Get variables from .env
const twitchUsername = process.env.TWITCH_USERNAME;
const twitchChannel = process.env.TWITCH_CHANNEL;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchSecret = process.env.TWITCH_SECRET;
const serverIp = process.env.SERVER_IP;
const serverPort = process.env.SERVER_PORT || 3000;
const serverBaseUrl = process.env.SERVER_BASE_URL;

// Define configuration options for Twitch bot
let twitchBotOpts = null;
let twitchBotClient = null;

// Create an Express app
const app = express();

// Define a route for the home page
app.get('/', (req, res) => {
    res.send('Hello, world!');
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

    // Store the OAuth token in a cookie or session
    res.cookie('twitchOAuthToken', data.access_token);
    console.log(data);
    // Define configuration options for Twitch bot
    twitchBotOpts = {
        identity: {
            username: twitchUsername,
            password: data.access_token
        },
        channels: [twitchChannel]
    };

    // Create a client for Twitch bot
    twitchBotClient = new tmi.client(twitchBotOpts);
    console.log(twitchBotClient);

    // Connect the Twitch bot client

    await twitchBotClient.connect().catch((error) => {
        console.error('Error connecting to Twitch:', error);

    });


    // Register event handlers for Twitch bot
    twitchBotClient.on('message', onTwitchBotMessageHandler);
    twitchBotClient.on('connected', onTwitchBotConnectedHandler);
    twitchBotClient.on('disconnected', onTwitchBotDisconnectedHandler);
    twitchBotClient.on('join', onTwitchBotJoinHandler);
    twitchBotClient.on('follow', onTwitchBotFollowHandler);
    twitchBotClient.on('ban', onTwitchBotBanHandler);
    twitchBotClient.on('raided', onTwitchBotRaidedHandler);
    twitchBotClient.on('subscription', onTwitchBotSubscriptionHandler);
    twitchBotClient.on('subgift', onTwitchBotSubgiftHandler);
    twitchBotClient.on('submysterygift', onTwitchBotSubmysterygiftHandler);
    



    // Redirect to the home page
    res.redirect('/');
});

// Start the server
app.listen(serverPort, serverIp, () => {
    console.log(`Server listening on ${serverIp}:${serverPort}`);
    console.log(`Base URL: ${serverBaseUrl}`);
});

//Event handler functions
function onTwitchBotMessageHandler(channel, userstate, message, self) {
    // Check if command
    if (message.startsWith('!') && (userstate.badges.broadcaster === '1' || userstate.mod === true)) { // Commands for moderators
        const args = message.slice(1).split(' ');
        const command = args.shift().toLowerCase();

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
    } else if (message.startsWith('!')) { // Commands for non moderators
        const args = message.slice(1).split(' ');
        const command = args.shift().toLowerCase();

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
                var flipping = true;
                let heads = [];
                let tails = [];

                twitchBotClient.say(channel, `@${userstate.username} wants to flip a coin! Type !heads or !tails to guess!`);
                //Give people time to respond using !heads or !tails
                setTimeout(function () {
                    twitchBotClient.say(channel, `Flipping a coin!`);
                    setTimeout(function () {
                        twitchBotClient.say(channel, `The coin landed on ${Math.random() < 0.5 ? 'heads' : 'tails'}!`);
                    }, 2000);

                }, 2000);
                
                break;
            case 'heads':
                twitchBotClient.say(channel, `@${userstate.username} guessed heads!`);
                //store the guess in an array

                break;
                


                    }
        
    }
}

function onTwitchBotConnectedHandler() {
    console.log(`* Connected to Twitch`);
}

function onTwitchBotDisconnectedHandler(reason) {
    console.log(`Disconnected from Twitch: ${reason}`);
}

function onTwitchBotJoinHandler(channel, username, self) {
    console.log(`* ${username} joined ${channel}`);
}

function onTwitchBotFollowHandler(channel, username, self) {
    console.log(`* ${username} followed ${channel}`);
}

function onTwitchBotBanHandler(channel, username, reason, userstate) {
    console.log(`* ${username} was banned from ${channel} for ${reason}`);
}

function onTwitchBotRaidedHandler(channel, username, viewers) {
    console.log(`* ${username} raided ${channel} with ${viewers} viewers`);
}

function onTwitchBotSubscriptionHandler(channel, username, method, message, userstate) {
    console.log(`* ${username} subscribed to ${channel} using ${method} (${message})`);
}

function onTwitchBotSubgiftHandler(channel, username, streakMonths, recipient, methods, userstate) {
    console.log(`* ${username} gifted a subscription to ${recipient} for ${streakMonths} months`);
}

function onTwitchBotSubmysterygiftHandler(channel, username, numbOfSubs, methods, userstate) {
    console.log(`* ${username} gifted ${numbOfSubs} subscriptions`);
}


