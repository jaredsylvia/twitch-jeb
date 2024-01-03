$(document).ready(() => {
    let ws = new WebSocket(`${webSocketAddress}`);
    const hackerTextElement = $('#hacker-text');
    let clips = [];
    let clipIndex = 0;
    var urlRegex = /(https?:\/\/[^ ]*)/;
    
    function updateElement(selector, value) {
        const element = $(selector);
        if (element.length) {
            const newValue = value !== null && value !== undefined ? value : 'N/A';
            element.text(newValue);
        }
    }

    function updateProgressBar(selector, progress, current, goal) {
        const progressBar = $(selector);
        const progressText = $(`${selector}Text`);
        
        if (goal <= 0) {
            progressBar.parent().parent().hide();
        } else {
            progressBar.parent().parent().show();
        }
        if (progressBar.length) {
          progressBar.width(`${progress}%`);
          progressText.text(`${current}/${goal}`);
        }
        
    }    

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const formattedTime = `${hours}h ${minutes}m`;
        return formattedTime;
    }

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
                                              
                    }
                    /*
                    //Youtube
                    if(url.includes("youtu.be")) {
                        //extract slug from url
                        let slug = url.split("/")[3];
                        //add embed url to clips array
                        clips.push(`https://www.youtube.com/embed/${slug}?autoplay=1&mute=0`);
                    }
                    if(url.includes("youtube.com")) {
                        //extract slug from url
                        let slug = url.split("/")[3];
                        slug = slug.split("=")[1];
                        //add embed url to clips array
                        clips.push(`https://www.youtube.com/embed/${slug}?autoplay=1&mute=0`);
                    }*/
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
                            if(clipIndex >= clips.length) {
                                clipIndex = 0;
                                //stop playing clips and hide iframe
                                $('#clip').attr("src", "");
                                $('#clip').css("visibility", "hidden");
                                clips = [];
                            } else {
                                clipIndex++;
                            }                            
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
                let subUsername = message.username;
                let subMonths = message.months;
                $('#recentSubbed').text("Last subscriber: " + subUsername);
                showAlert(subUsername + " has subscribed for " + subMonths + " months!");
                break;
            case 'subgift':
                console.log(message);
                break;
            case 'info':
                console.log(message);
            
                // Update information on page
                updateElement('#game', message.stream?.channel?.data?.[0]?.game_name);
                updateElement('#title', message.stream?.channel?.data?.[0]?.title);
                updateElement('#viewers', message.stream?.channel?.data?.[0]?.viewer_count || 0);
                            
                const koth = message.game?.koth || { kothWinner: 'N/A', kothPlayers: 'N/A' };
                updateElement('#kothWinner', `Current KoTH: ${koth.kothWinner}`);
                updateElement('#kothPlayers', `Players: ${koth.kothPlayers.substring(0, koth.kothPlayers.length - 1).replace(/,/g, ', ')}`);
            
                const roulette = message.game?.roulette || { rouletteWinner: 'N/A', roulettePlayers: 'N/A', roulettePool: 'N/A' };
                updateElement('#rouletteWinner', `Last roulette winner: ${roulette.rouletteWinner}`);
                updateElement('#roulettePlayers', `Players: ${roulette.roulettePlayers}`);
                updateElement('#roulettePool', `Pool: ${roulette.roulettePool}`);
            
                const coinflip = message.game?.coinflip || { firstWinner: 'N/A', winningCoin: 'N/A', headsGuesses: 'N/A', tailsGuesses: 'N/A' };
                updateElement('#coinflipWinner', `Last coinflip winner: ${coinflip.firstWinner}`);
                updateElement('#winningCoin', `Winning coin: ${coinflip.winningCoin}`);
            
                const goals = message.stream?.goals || { follow: { goal: 'N/A' }, sub: { goal: 'N/A' }, bits: { goal: 'N/A' }, dono: { goal: 'N/A' } };

                // Calculate progress for each goal
                const followProgress = Math.round((message.stream?.followerCount || 0) / goals.follow.goal * 100);
                const subProgress = Math.round((message.stream?.subCount || 0) / goals.sub.goal * 100);
                const bitsProgress = Math.round((message.stream?.bitCount || 0) / goals.bits.goal * 100);
                const donoProgress = Math.round((message.stream?.donationCount || 0) / goals.dono.goal * 100);

                // Update the progress bars
                updateProgressBar('#followersProgress', followProgress, message.stream?.followerCount || 0, goals.follow.goal);
                updateProgressBar('#subsProgress', subProgress, message.stream?.subCount || 0, goals.sub.goal);
                updateProgressBar('#bitsProgress', bitsProgress, message.stream?.bitCount || 0, goals.bits.goal);
                updateProgressBar('#donosProgress', donoProgress, message.stream?.donationCount || 0, goals.dono.goal);
            
                const mostRecentFollower = message.mostRecent?.follower?.username || 'N/A';
                const mostRecentSubscriber = message.mostRecent?.subscriber?.username || 'N/A';
                const mostRecentViewer = message.mostRecent?.viewer?.username || 'N/A';
                updateElement('#recentFollowed', `Last follower: ${mostRecentFollower}`);
                updateElement('#recentSubbed', `Last subscriber: ${mostRecentSubscriber}`);
                updateElement('#recentJoined', `Last joined: ${mostRecentViewer}`);
            
                const printerStatus = message.printer?.status || { sd: { ready: false }, state: { error: '', flags: {} }, temperature: {}, job: {} };
                const printerJob = message.printer?.job || { job: {}, progress: {} };

                const completionPercentage = Math.round(printerJob.progress?.completion) || 0;
                const estimatedTime = formatTime(printerJob.progress?.printTimeLeft || 0);
                const elapsedTime = formatTime(printerJob.progress?.printTime || 0);
                const totalTime = formatTime(printerJob.progress?.printTimeLeft + printerJob.progress?.printTime || 0);

                updateProgressBar('#printProgress', completionPercentage, elapsedTime, totalTime);
                updateElement('#printerStatus', `Printer Status: ${printerStatus.state?.text || 'N/A'}`);
                
                updateElement('#estimatedTime', `Estimated Time: ${estimatedTime}`);
                updateElement('#elapsedTime', `Elapsed Time: ${elapsedTime}`);
                updateElement('#currentFile', `Current File: ${printerJob.job?.file?.display || 'N/A'}`);
                updateElement('#hotendTemp', `Hotend Temperature: ${printerStatus.temperature?.tool0?.actual || 'N/A'}°C`);
                updateElement('#bedTemp', `Bed Temperature: ${printerStatus.temperature?.bed?.actual || 'N/A'}°C`);

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