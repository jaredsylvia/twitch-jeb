$(document).ready(() => {
    let ws = new WebSocket(`${webSocketAddress}`);
    const hackerTextElement = $('#hacker-text');
    const clips = [];
    let clipIndex = 0;
    var urlRegex = /(https?:\/\/[^ ]*)/;
    let followerGoal;

    ws.onerror = (event) => {
        console.error('WebSocket error:', event);
    };

    ws.onopen = () => {
        console.log('WebSocket client connected');
        ws.send(JSON.stringify({ type : 'getInfo' }));
    };

    ws.onclose = () => {
        console.log('WebSocket client disconnected');
        //ws = new WebSocket(`${webSocketAddress}`);
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
                //If message contains a URL, extract it
                if(messageText.match(urlRegex)) {
                    let url = messageText.match(urlRegex)[0];
                    //If URL is a clip, add it to the clips array
                    
                    //Twitch
                    if(url.includes("twitch.tv")) {
                        //extract slug from url
                        let slug = url.split("/")[5];
                        //add embed url to clips array
                        clips.push(`https://clips.twitch.tv/embed?clip=${slug}&parent=${window.location.hostname}&autoplay=true&mute=false`);
                        console.log(clips);
                    }

                    //Youtube
                    if(url.includes("youtu.be")) {
                        //extract slug from url
                        let slug = url.split("/")[3];
                        //add embed url to clips array
                        clips.push(`https://www.youtube.com/embed/${slug}?autoplay=1&mute=0?controls=0`);
                    }
                    if(url.includes("youtube.com")) {
                        //extract slug from url
                        let slug = url.split("/")[3];
                        slug = slug.split("=")[1];
                        //add embed url to clips array
                        clips.push(`https://www.youtube.com/embed/${slug}?autoplay=1&mute=0?controls=0`);
                    }
                }
                //If user is mod, vip or broadcaster
                if(message.userstate.mod || message.userstate.badges.vip || message.userstate.badges.broadcaster) {
                    //If message contains !clip command make iframe visible and play clips in order
                    if(messageText.includes("!clips")) {
                        console.log(messageText);
                        //if command is "clip play" make iframe visible and play clips in order
                        if(messageText.includes("play")) {
                            console.log(clips);
                            $('#clip').css("visibility", "visible");
                            $('#clip').attr("src", clips[clipIndex]);
                            clipIndex++;
                            // if(clipIndex >= clips.length) {
                            //     clipIndex = 0;
                            //     //stop playing clips and hide iframe
                            //     $('#clip').attr("src", "");
                            //     $('#clip').css("visibility", "hidden");
                        }
                        //if command is "clips stop" stop playing clips and hide iframe
                        if(messageText.includes("stop")) {
                            console.log(clips);
                            $('#clip').css("visibility", "hidden");
                            $('#clip').attr("src", "");
                        }
                    }                
                }
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
        var alertElement = $("#customAlert");

        alertElement.text(message);
        alertElement.slideDown(500, function () {
            setTimeout(function () {
                alertElement.slideUp(500);
        
            }, 2000);
        });
    }
    

});