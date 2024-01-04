require('dotenv').config();
const fetch = require('node-fetch');

// Twitch variables
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchSecret = process.env.TWITCH_SECRET;

class TwitchAPIClient {
    constructor(twitchOauthToken, twitchRefreshToken, twitchUserID) {
        this.clientId = twitchClientId;
        this.secret = twitchSecret;
        this.oauthToken = twitchOauthToken;
        this.refreshToken = twitchRefreshToken;
        this.userID = twitchUserID;
        this.reauthorizing = false;
        this.headers = {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${this.oauthToken}`
        };
        this.jsonHeaders = this.headers;
        this.jsonHeaders['Content-Type'] = 'application/json';

    }

    setOauthToken(twitchOauthToken) {
        this.oauthToken = twitchOauthToken;
    }

    setRefreshToken(twitchRefreshToken) {
        this.refreshToken = twitchRefreshToken;
    }

    setUserID(twitchUserID) {
        this.userID = twitchUserID;
    }

    setHeaders() {
        this.headers = {
            'Client-ID': this.clientId,
            'Authorization': `Bearer ${this.oauthToken}`
        };
        this.jsonHeaders = this.headers;
        this.jsonHeaders['Content-Type'] = 'application/json';
    }
    // Function to handle api responses
    async handleResponse(response) {
        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            console.log(`Error: ${response.statusText}`);
            console.log(`Error: ${response.body}`);
            if(response.status === 401 && this.reauthorizing === false) {
                this.reauthorizing = true;                
                await this.renewOauth().then(() => {
                    return null;
                });
            } else if (this.reauthorizing === true) {
                console.log('Already reauthorizing, please wait...');
                return null;
            }
            return null;
        }
        const data = await response.json();
        return data;
    }

    // Functions to get data from Twitch API
    async getStreamData() {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before getting stream data.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${this.userID}`, {
            method: 'GET',
            headers: this.headers
        });               
        return await this.handleResponse(response);
    }

    async getChannelData() {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before getting channel data.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async setGameTitle(gamename) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before setting game title.');
            return null;
        }
        const lookupResponse = await fetch(`https://api.twitch.tv/helix/games?name=${gamename}`, {
            method: 'GET',
            headers: this.headers
        });
        const gameData = await lookupResponse.json();
        const gameID = gameData.data[0].id;        
        headers['Content-Type'] = 'application/json';
        
        const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.userID}`, {
            method: 'PATCH',
            headers: this.jsonHeaders,            
            body: JSON.stringify({
                game_id: gameID
            })
        });
        return await this.handleResponse(response);
    }

    async setStreamTitle(title) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before setting stream title.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.userID}`, {
            method: 'PATCH',
            headers: this.jsonHeaders,
            body: JSON.stringify({
                title: title
            })
        });
        return await this.handleResponse(response);
    }    

    async getFollowerCount() {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before getting follower count.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: this.headers
        });
        
        return await ((await this.handleResponse(response))?.total || 0);
    }

    async getFollowers() {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before getting followers.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/users/followers?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async getSubscriberCount() {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before getting subscriber count.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: this.headers
        });
        return await ((await this.handleResponse(response))?.total || 0);
    }    


    async checkFollower(username) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before checking follower.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${this.userID}&from_name=${username}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async checkSubscriber(username) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before checking subscriber.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${this.userID}&user_id=${username}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async checkModerator(username) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before checking moderator.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${this.userID}&user_id=${username}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async checkVIP(username) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before checking VIP.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/moderation/vips?broadcaster_id=${this.userID}&user_id=${username}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async getViewerInfo(username) {
        if(this.reauthorizing === true) {
            console.log('Reauthorizing, please wait before getting viewer info.');
            return null;
        }
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
            method: 'GET',
            headers: this.headers
        });
        return await this.handleResponse(response);
    }

    async renewOauth() {        
        const twitchTokenParams = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
            client_id: this.clientId,
            client_secret: this.secret
        });

        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: 'POST',
            body: twitchTokenParams
        });

        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            console.log(`Error: ${response.statusText}`);
            console.log(`Error: ${response.body}`);
            return null;
        } else {
            const data = await response.json();
            this.oauthToken = data.access_token;
            this.refreshToken = data.refresh_token;
            const time = new Date().toLocaleTimeString();
            console.log(`Successfully renewed OAuth token at ${time}`);
            this.setHeaders();
            this.reauthorizing = false;
            return data;
            }   
    }

}
module.exports = TwitchAPIClient;