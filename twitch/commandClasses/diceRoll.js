const command = require('./command.js');

class DiceRoll extends command {
    constructor() {
        super();
        this.name = 'Dice Roller';
        this.aliases = ['roll'];
        this.cooldown = 5;
        this.description = 'Rolls dice in standard D&D format.';
        this.usage = '!roll 3d6, !roll 1d20, etc.';
        this.execute = this.roll;
    }

    roll(twitchbot, channel, args, userstate) {
        try {
            const dice = args[1].split('d');
            const numberOfDice = dice[0];
            const diceType = dice[1];
            const diceRolls = [];
            let total = 0;

            for (let i = 0; i < numberOfDice; i++) {
                diceRolls.push(Math.floor(Math.random() * diceType) + 1);
            }

            diceRolls.forEach(roll => {
                total += roll;
            });

            twitchbot.client.say(channel, `You rolled ${total}!`);
        } catch (err) {
            twitchbot.client.say(channel, `${this.name}: ${this.description}`);
            twitchbot.client.say(channel, `Usage: ${this.usage}`);

        }
    }   
}

module.exports = DiceRoll;
