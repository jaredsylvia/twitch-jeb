const fetch = require('node-fetch');

// Functions to get data from Twitch API
async function getStreamData(twitchClientId, twitchOauthToken, twitchUserID) {
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${twitchUserID}`, {
        method: 'GET',
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${twitchOauthToken}`
        }
    });

    if (response.status !== 200) {
        console.log(`Error: Twitch API returned status ${response.status}`);
        return null;
    }

    const data = await response.json();
    
    if (data.data.length === 0) {
        console.log(`User is not currently streaming`);
        return null;
    }

    return data;
}

async function getChannelData(twitchClientId, twitchOauthToken, twitchUserID) {
    const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${twitchUserID}`, {
        method: 'GET',
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${twitchOauthToken}`
        }
    });

    if (response.status !== 200) {
        console.log(`Error: Twitch API returned status ${response.status}`);
        return null;
    }

    const data = await response.json();
    
    if (data.data.length === 0) {
        console.log(`User does not have a channel`);
        return null;
    }
        
    return data;
}

async function getFollowerCount(twitchClientId, twitchOauthToken, twitchUserID) {
    const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${twitchUserID}`, {
        method: 'GET',
        headers: {
            'Client-ID': twitchClientId,
            'Authorization': `Bearer ${twitchOauthToken}`
        }
    });

    if (response.status !== 200) {
        console.log(`Error: Twitch API returned status ${response.status}`);
        if(response.status === 401) {
        }
        return null;
    }

    const data = await response.json();
    
    if (data.total.length === 0) {
        console.log(`User does not have any followers`);
        return null;
    }

    return data.total;
}

module.exports = {
    getStreamData,
    getChannelData,
    getFollowerCount
};