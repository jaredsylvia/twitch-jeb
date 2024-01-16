require('dotenv').config();
const TwitchAPIClient = require('../twitchApi.js');
const Command = require('./command.js');
const fetch = require('node-fetch');

class Clips extends Command {
    constructor(db, wss) {
        super();
        this.name = 'Clips';
        this.description = 'Play, list or remove clips.';
        this.usage = '!clips, !delclip id, !playclip id/next/random';
        this.aliases = ['clips'];
        this.cooldown = 5;
        this.subcommands = [ 'delclip', 'playclip', 'stopclip'];
        this.execute = this.executeClips;
        this.delclip = this.deleteClip;
        this.playclip = this.playClip;
        this.stopclip = this.stopClip;
        this.addclip = this.addClip;
        this.db = db;
        this.wss = wss;
        this.host = process.env.SERVER_HOST;
    }

    async executeClips(twitchbot, channel, args, userstate) {
        try {
            const clips = await this.db.getClips();
            let clipList = [];
            let numOfClips = args[1] || 5;
            
            console.log(args[1]);
            console.log(numOfClips);            

            clips.forEach(clip => {
                clipList.push({ 'id' : clip.id, 'title' : clip.title });
            });            
            
            if(numOfClips > clipList.length) {
                numOfClips = clipList.length;
            }

            console.log(clipList.length);
            console.log(numOfClips);

            for(let i = 0; i < numOfClips; i++) {
                twitchbot.client.say(channel, `${clipList[i].id}: ${clipList[i].title}`);
            }

        } catch (err) {
            console.log(err);
            twitchbot.client.say(channel, `${this.title}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
        }
    }

    async deleteClip(twitchbot, channel, args, userstate) {
        if(this.checkIfMod(userstate)) {
            try {
                const id = args[1];
                await this.db.deleteClip(id);
                twitchbot.client.say(channel, `Clip ${id} deleted.`);
            } catch (err) {
                console.log(err);
                twitchbot.client.say(channel, `${this.name}: ${this.description}`);
                twitchbot.client.say(channel, `Usage: ${this.usage}`);
            }
        }
    }

    async playClip(twitchbot, channel, args, userstate) {
        
            try {
                //if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
                const clip = await this.db.getOldestClip();
                let url = clip.url;
                let clipId = '';
                const provider = clip.provider;

                switch (provider) {
                    case 'twitch':
                        if (url.includes('clip/')) {
                            clipId = (url.split('clip/')[1]).split('?')[0];                            
                        } else {
                            clipId = (url.split('twitch.tv/')[1]).split('?')[0];
                        }
                        url = `https://clips.twitch.tv/embed?clip=${clipId}&parent=${this.host}&autoplay=true`;
                        this.wss.sendToWebSocket({ type: 'clip', data: { url: url, visible: true, provider: provider } }); 
                        break;
                    case 'youtube':
                        if (url.includes('youtu.be')) {
                            clipId = (url.split('youtu.be/')[1]).split('?')[0];
                        } else if(url.includes('shorts')) {
                            clipId = (url.split('shorts/')[1]).split('?')[0];
                        } else {
                            clipId = (url.split('watch?v=')[1]).split('&')[0];
                        }
                        url = `https://www.youtube.com/embed/${clipId}?autoplay=1&origin=https://${this.host}`;
                        this.wss.sendToWebSocket({ type: 'clip', data: { url: url, visible: true } });
                        break;
                    case 'tiktok':
                        twitchbot.client.say(channel, `TikTok clips are not supported yet!`);
                        break;
                    default:
                        twitchbot.client.say(channel, `No clips found!`);
                        break;
                }
            } catch (err) {
                console.log(err);
                twitchbot.client.say(channel, `${this.name}: ${this.description}`);
                twitchbot.client.say(channel, `Usage: ${this.usage}`);
            }
           
    }

    async stopClip(twitchbot, channel, args, userstate) {
        
            try {
                //if(!this.checkIfMod(userstate)) throw new Error('You are not a mod!');
                this.wss.sendToWebSocket({ type: 'clip', data: { url: '', visible: false } });
            } catch (err) {
                console.log(err);
                twitchbot.client.say(channel, `${this.name}: ${this.description}`);
                twitchbot.client.say(channel, `Usage: ${this.usage}`);
            }
           
    }

    async addClip(twitchbot, channel, args, userstate) {
        try {            
            const provider = args.includes('twitch.tv') ? 'twitch' : args.includes('youtube.com' || 'youtu.be') ? 'youtube' : args.includes('tiktok.com') ? 'tiktok' : undefined;
            let title;
            const response = await fetch(args,
                {
                    method: 'GET'
                });
            const data = await response.text();
            try {
                title = data.split('<meta property="og:title" content="')[1].split('"')[0];
            } catch (err) {
                title = "No title found!";
            }

            if (provider !== undefined) {
                await this.db.addClip(args, provider, userstate.username, title);
                //get most recently added clip
                const clip = await this.db.getClip();
                twitchbot.client.say(channel, `${clip.provider.charAt(0).toUpperCase() + clip.provider.slice(1)} clip ${clip.id} added by ${clip.submitter}!`);
            }    
        } catch (err) {
            if(err.code === 'SQLITE_CONSTRAINT') {
                twitchbot.client.say(channel, `Clip already exists!`);
            } else {
                console.log(err);
                twitchbot.client.say(channel, `${this.name}: ${this.description}`);
                twitchbot.client.say(channel, `Usage: ${this.usage}`);
            }
        }        
    }

}

module.exports = Clips;