const Command = require('./command.js');
const fetch = require('node-fetch');
const he = require('he');

class Trivia extends Command {
    constructor(wss) {
        super();
        this.name = 'Trivia';
        this.aliases = ['trivia'];
        this.cooldown = 5;
        this.description = 'Trivia game.';
        this.usage = '!trivia';
        this.subcommands = ['g'];
        this.execute = this.trivia;
        this.g = this.guess;       
        this.question = '';
        this.answers = [];
        this.timer;
        this.wss = wss;
    }

    async shuffleArray(array) {   // Fisher-Yates shuffle - like 12 different examples almost exactly like this
        let currentIndex = array.length, temporaryValue, randomIndex;

        // Shuffle when you can
        while(0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;            
        }
        return array;
    }

    async trivia(twitchbot, channel, args, userstate) {
        try {
            if (Command.gameActive) {
                twitchbot.client.say(channel, `A game is already active!`);
                return;
            }
            Command.gameActive = true;
            twitchbot.client.say(channel, `Trivia is now active!`);
            const response = await fetch('https://opentdb.com/api.php?amount=1');
            const trivia = await response.json();
            this.question = he.decode(trivia.results[0].question);
            this.type = trivia.results[0].type;
            this.category = he.decode(trivia.results[0].category);
            this.difficulty = trivia.results[0].difficulty;
            
            trivia.results[0].incorrect_answers.forEach(answer => {
                this.answers.push({answer : he.decode(answer), correct : false});
            });

            this.answers.push({answer : he.decode(trivia.results[0].correct_answer), correct : true});
            this.answers = await this.shuffleArray(this.answers);
            
            this.answers.forEach((answer, index) => {
                answer.letter = String.fromCharCode(97 + index);
            });
            
            this.wss.sendToWebSocket({
                type: 'trivia',
                active: Command.gameActive,    
                question: this.question,
                answers: this.answers,
                category: this.category,
                difficulty: this.difficulty
            });
                
                
            //send question to chat, pausing after each line
            twitchbot.client.say(channel, `Question: ${this.question}`);
            this.answers.forEach(answer => {
                twitchbot.client.say(channel, `${answer.letter}: ${answer.answer}`);
            });

            //start cancellable timer
            console.log(Command.gameActive);
            this.timer = setTimeout(() => this.triviaTimer(twitchbot, channel), 30000);

        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
            Command.gameActive = false;
            this.question = '';
            this.answers = [];
            console.log(err);
        }
    }

    async guess (twitchbot, channel, args, userstate) {
        try {
            if(!Command.gameActive) {
                twitchbot.client.say(channel, `Trivia is not active!`);
                return;
            }
            const guess = args[1];
            //find answer in answer array based on letter
            const answer = this.answers.find(answer => answer.letter === guess);
            if(answer.correct) {
                const answer = this.answers.find(answer => answer.correct);
                twitchbot.client.say(channel, `${userstate.username} is correct!`);
                twitchbot.client.say(channel, `The answer was ${answer.answer}`);
                twitchbot.db.addPoints(userstate.username, 1000);
                twitchbot.client.say(channel, `${userstate.username} has been given 1000 points!`);                                
                Command.gameActive = false;
                this.question = '';
                this.answers = [];                
                this.wss.sendToWebSocket({ 
                    type: 'trivia', 
                    active: Command.gameActive, 
                    winner: userstate.username, 
                    answer: answer.answer
                });
                clearTimeout(this.timer);

            } else {
                twitchbot.client.say(channel, `Incorrect! Try again ${userstate.username}!`);
            }
        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
            console.log(err);
        }
    }

    // if nobody guesses correctly after 30 seconds, reveal answer - needs to be cancellable
    async triviaTimer(twitchbot, channel, args, userstate) {
        console.log(Command.gameActive);      
        try {
            if(!Command.gameActive) {
                console.log('Trivia is not active!');
                return;
            } else {
                console.log('Time\'s up!');                
                const answer = this.answers.find(answer => answer.correct);
                twitchbot.client.say(channel, `Time's up! The answer was ${answer.answer}`);
                Command.gameActive = false;
                this.question = '';
                this.answers = [];
                this.wss.sendToWebSocket({
                    type: 'trivia',
                    active: Command.gameActive,
                    winner: 'Nobody',
                    answer: answer.answer
                });                
            }
        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);
            console.log(err);
        }
    }
}

module.exports = Trivia;