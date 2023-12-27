$(document).ready(() => {
    const ws = new WebSocket(`${webSocketAddress}`);
    const hackerTextElement = $('#hacker-text');
    
    ws.onerror = (event) => {
        console.error('WebSocket error:', event);
    };

    ws.onopen = () => {
        console.log('WebSocket client connected');
        ws.send(JSON.stringify({ type : 'getInfo' }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'message':
                //Create chat message in <p> tag
                let username = message.userstate['display-name'];
                let color = message.userstate.color;
                let messageText = message.message;
                let messageHtml = `<p class="messageText"><span style="color: ${color}">${username}</span>: <span style="color: #FFFFFF">${messageText}</span></p>`;
                //Append message to <div> with id="messages"
                $('#messages').append(messageHtml);
                //Scroll to bottom of messages
                $('#chatArea').animate({ scrollTop: $('#chatArea').prop('scrollHeight') }, 1000);
                break;
            case 'user':
                console.log(message);
                break;
            case 'connected':
                ws.send(JSON.stringify({ type : 'getInfo' }));
                console.log(message);
                break;
            case 'disconnected':
                console.log(message);
                break;
            case 'join':
                let joinUsername = message.username;
                $('#recentJoined').text("Last joined: " + joinUsername);
                break;
            case 'follow':
                let followUsername = message.username;
                $('#recentFollowed').text("Last follower: " + followUsername);
                showAlert(followUsername + " has followed!");
                break;
            case 'ban':
                console.log(message);
                break;
            case 'raided':
                console.log(message);
                break;
            case 'subscription':
                console.log(message);
                break;
            case 'subgift':
                console.log(message);
                break;
            case 'info':
                // Extract relevant information from message
                let game = message.channelData.data[0].game_name;
                let title = message.channelData.data[0].title;
                let viewers = (message.streamData && message.streamData.data && message.streamData.data[0].viewer_count) ?? 0;
                let followers = message.followerCount ?? 0;
                let koth = message.kothData;
                let roulette = message.rouletteData;
                let coinflip = message.coinflipData;
                let goals = message.goals;                
                let mostRecentFollower = message.mostRecentFollower.username;
                let mostRecentSubscriber = message.mostRecentSubscriber.username;
                let mostRecentViewer = message.mostRecentViewer.username;
                
                // get heads and tails guesses from coinflip remove last character and add "and" after last comma
                let headsGuesses = coinflip.headsGuesses;
                let tailsGuesses = coinflip.tailsGuesses;
                
                if(headsGuesses.length > 0) {
                    headsGuesses = headsGuesses.substring(0, headsGuesses.length - 1);
                    headsGuesses = headsGuesses.replace(/,/g, ', ');
                    headsGuesses = headsGuesses.replace(/, ([^,]*)$/, ' and $1');
                    $('#coinflipHeads').text(headsGuesses + " guessed heads.");
                } else {
                    $('#coinflipHeads').text("No one guessed heads.");
                }
                if(tailsGuesses.length > 0) {
                    tailsGuesses = tailsGuesses.substring(0, tailsGuesses.length - 1);
                    tailsGuesses = tailsGuesses.replace(/,/g, ', ');
                    tailsGuesses = tailsGuesses.replace(/, ([^,]*)$/, ' and $1');
                    $('#coinflipTails').text(tailsGuesses + " guessed tails.");
                } else {
                    $('#coinflipTails').text("No one guessed tails.");
                }
    
                // Update information on page
                $('#game').text("Game: " + game);
                $('#title').text("Title: " + title);
                $('#viewers').text("Viewers: " + viewers);
                $('#followers').text("Followers: " + followers + "/" + followerGoal);
                $('#kothWinner').text("Current KoTH: " + koth.kothWinner);
                $('#kothPlayers').text("Players: " + koth.kothPlayers.substring(0, koth.kothPlayers.length - 1).replace(/,/g, ', '));
                $('#rouletteWinner').text("Last roulette winner: " + roulette.rouletteWinner);
                $('#roulettePlayers').text("Players: " + roulette.roulettePlayers);
                $('#roulettePool').text("Pool: " + roulette.roulettePool);
                $('#coinflipWinner').text("Last coinflip winner: " + coinflip.firstWinner);
                $('#winningCoin').text("Winning coin: " + coinflip.winningCoin);                               
                $('#followGoal').text("Follower Goal: " + goals[0].goal);
                $('#subGoal').text("Subscriber Goal: " + goals[1].goal);
                $('#bitsGoal').text("Bit Goal: " + goals[2].goal);
                $('#donationGoal').text("Donation Goal: " + goals[3].goal);
                $('#recentFollowed').text("Last follower: " + mostRecentFollower);
                $('#recentSubbed').text("Last subscriber: " + mostRecentSubscriber);
                $('#recentJoined').text("Last joined: " + mostRecentViewer);

                break;
            case 'koth':
                let kothActive = message.active;
                let kothWinner = message.winner;
                let kothPlayers = message.players;
                console.log(message);
                if(kothActive) {
                    $('#kothStatus').text("KoTH Active. !join to join the game!");
                } else if(!kothActive) {
                    $('#kothStatus').text("No KoTH active");
                    $('#kothPlayers').empty();
                }
                
                if(kothWinner) {
                    $('#kothWinner').text("Current KoTH: " + kothWinner);
                }

                if(kothPlayers) {
                    $('#kothPlayers').text("Players: " + kothPlayers);
                } 
                break;
            case 'alert':
                console.log(message);
                let alertMessage = message.message;
                showAlert(alertMessage);
                break;
            case 'roulette':
                let rouletteActive = message.active;
                let rouletteWinner = message.winner;
                let roulettePlayers = message.players;
                let roulettePool = message.pool;
                console.log(message);
                if(rouletteActive) {
                    $('#rouletteStatus').text("Roulette Active. !join to join the game!");
                } else if(!rouletteActive) {
                    $('#rouletteStatus').text("No roulette active");
                    $('#roulettePlayers').empty();
                }
                
                if(rouletteWinner) {
                    $('#rouletteWinner').text("Last roulette winner: " + rouletteWinner);
                }

                if(roulettePlayers) {
                    $('#roulettePlayers').text("Players: " + roulettePlayers);
                }
                
                if(roulettePool) {
                    $('#roulettePool').text("Pool: " + roulettePool);
                }
                break;
            case 'coinflip':
                let coinflipActive = message.active;
                let coinflipWinner = message.firstWinner;
                let winningCoin = message.winningCoin;
                headsGuesses = message.headsGuesses;
                tailsGuesses = message.tailsGuesses;

                console.log(message);
                if(coinflipActive) {
                    $('#coinflipStatus').text("Coinflip Active. !join to join the game!");
                } else if(!coinflipActive) {
                    $('#coinflipStatus').text("No coinflip active");
                    $('#coinflipPlayers').empty();
                }
                
                if(coinflipWinner) {
                    $('#coinflipWinner').text("Last coinflip winner: " + coinflipWinner);
                }

                if(winningCoin) {
                    $('#winningCoin').text("Winning coin: " + winningCoin);
                }
                
                if(headsGuesses) {
                    $('#coinflipHeads').text(headsGuesses + " guessed heads.");
                } else {
                    $('#coinflipHeads').text("No one guessed heads.");
                }
                
                if(tailsGuesses) {
                    $('#coinflipTails').text(tailsGuesses + " guessed tails.");
                } else {
                    $('#coinflipTails').text("No one guessed tails.");
                }
                break;
            default:
                
            break;
        }
    };

    function formatNameList(names) {
        if (names.length > 0) {
            names = names.substring(0, names.length - 1);
            names = names.replace(/,/g, ', ');
            names = names.replace(/, ([^,]*)$/, ' and $1');
            return names;
        } else {
            return "No one";
        }
    }
    //Hacker text
    
    const charactersPerLine = 175; // Adjust the number of characters per line

    function getRandomCharacter() {
        // Generate a random Unicode code point between U+0020 and U+058F
        const randomUnicode = Math.floor(Math.random() * (0x058F - 0x0020) + 0x0020);
        return String.fromCodePoint(randomUnicode);
    }

    function updateHackerText() {
        const currentText = hackerTextElement.text();

        if (currentText.length >= charactersPerLine * 3) {
            // If the text is full, remove first character of the first line
            hackerTextElement.text(currentText.substring(1));            
        } else {
            // Otherwise, add a random character
            hackerTextElement.text(currentText + getRandomCharacter());
        }

        // Repeat the process with a delay
        setTimeout(updateHackerText, Math.random() * 50); // Adjust the timing here
    }

    updateHackerText();

    // Alerts in mainBody section
    function showAlert(message) {
        var overlay = $("#overlay");
        var alertElement = $("#customAlert");

        

        alertElement.text(message);
        alertElement.slideDown(500, function () {
            setTimeout(function () {
                alertElement.slideUp(500);
        
            }, 2000);
        });
    }
    

});