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
    
    // Functions to get data from Twitch API
    async getStreamData() {
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_id=${this.userID}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });
        
        if (response.status !== 200) {
            //console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.data.length === 0) {
            //console.log(`User is not currently streaming`);
            //console.log(data);
            return null;
        }

        return data;
    }

    async getChannelData() {
        const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });

        if (response.status !== 200) {
            //console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.data.length === 0) {
            console.log(`User does not have a channel`);
            return null;
        }
            
        return data;
    }

    async setGameTitle(gamename) {
        const lookupResponse = await fetch(`https://api.twitch.tv/helix/games?name=${gamename}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });
        const gameData = await lookupResponse.json();
        const gameID = gameData.data[0].id;

        const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.userID}`, {
            method: 'PATCH',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_id: gameID
            })
        });

        if (response.status !== 200 || response.status !== 204) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        return data;
    }

    async setStreamTitle(title) {
        const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${this.userID}`, {
            method: 'PATCH',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title
            })
        });

        if (response.status !== 200 || response.status !== 204) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        return data;
    }    

    async getFollowerCount() {
        const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });

        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
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

    async getFollowers() {
        const response = await fetch(`https://api.twitch.tv/helix/users/followers?broadcaster_id=${this.userID}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });
    }

    async checkFollower(username) {
        const response = await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${this.userID}&from_name=${username}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });

        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.total.length === 0) {
            console.log(`User is not a follower`);
            return null;
        }

        return data.total;
    }

    async checkSubscriber(username) {
        const response = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${this.userID}&user_id=${username}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });

        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.total.length === 0) {
            console.log(`User is not a subscriber`);
            return null;
        }

        return data.total;
    }

    async checkModerator(username) {
        const response = await fetch(`https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${this.userID}&user_id=${username}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });

        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.total.length === 0) {
            console.log(`User is not a moderator`);
            return null;
        }

        return data.total;
    }

    async checkVIP(username) {
        const response = await fetch(`https://api.twitch.tv/helix/moderation/vips?broadcaster_id=${this.userID}&user_id=${username}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });

        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.total.length === 0) {
            console.log(`User is not a VIP`);
            return null;
        }

        return data.total;
    }

    async getViewerInfo(username) {
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
            method: 'GET',
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.oauthToken}`
            }
        });
        
        if (response.status !== 200) {
            console.log(`Error: Twitch API returned status ${response.status}`);
            if(response.status === 401) {
                this.renewOauth();
            }
            return null;
        }

        const data = await response.json();
        
        if (data.data.length === 0) {
            console.log(`User does not exist`);
            return null;
        }

        return data;
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
            
            return data;
            }   
    }

}
module.exports = TwitchAPIClient;