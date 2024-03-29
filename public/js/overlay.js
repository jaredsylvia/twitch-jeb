$(document).ready(() => {
    let ws = new WebSocket(`${webSocketAddress}`);
    
    const hackerTextElement = $('#hacker-text');
    
    const wheel = $('#wheel');
    let spinning = false;
    let roulettePlayers = [];
    let rouletteWinner = '';

    let videoOne = $('#videoOne');

    let commandQueue = ['koth', 'roulette', 'trivia', 'coinflip'];
    let gaming = false;
    let gameActive = false;
    let gameCount = 0;

    if(Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource('https://tv.joeerror.com/stream/channelnumber/3.1');
        hls.attachMedia($('#video')[0]);
        hls.on(Hls.Events.MANIFEST_PARSED,function() {
            videoOne.play();
        });
    }
    
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

    function updateGauge(gauge, value) {
        gauge.value = value;
        gauge.update({ animationDuration: 1000 });
    }

    ws.onerror = (event) => {
        console.error('WebSocket error:', event);
    };

    ws.onopen = () => {
        console.log('WebSocket client connected');
        //ws.send(JSON.stringify({ type : 'getInfo' }));
    };

    ws.onclose = () => {
        console.log('WebSocket client disconnected');
        //ws = new WebSocket(`${webSocketAddress}`);
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if(message.active){
            gameActive = message.active;
        }
        switch (message.type) {
            case 'message':
                if(message.message == '!gameOn') {
                    gaming = true;                    
                } else if(message.message == '!gameOff') {
                    gaming = false;
                }                
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
                let subUsername = message.username;
                let subMonths = message.months;
                $('#recentSubbed').text("Last subscriber: " + subUsername);
                showAlert(subUsername + " has subscribed for " + subMonths + " months!");
                break;
            case 'subgift':
                console.log(message);
                break;
            case 'info':
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
                updateGauge(hotEndGauge, printerStatus.temperature?.tool0?.actual || 0);
                updateGauge(bedGauge, printerStatus.temperature?.bed?.actual || 0);
                
                //Check if game is active and gaming is true                
                if(gaming == true && gameActive == false) {
                    if(gameCount == 5) {
                        let command = commandQueue[Math.floor(Math.random() * commandQueue.length)];
                        ws.send(JSON.stringify({ type : 'command', command : command }));
                        gameCount = 0;
                    } else {
                        gameCount++;
                    }
                }

            break;
                
            case 'koth':
                gameActive = message.active;
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
                let spinControl = message.data.spinning;
                let incomingPlayers = message.data.players;
                if(spinControl == 'start') {
                    console.log("start");                    
                    startSpin();                    
                    spinning = true;
                } else if(spinControl == 'stop') {
                    stopSpin();
                    spinning = false;
                    rouletteWinner = message.data.winner;
                }

                if(incomingPlayers.length > 0) {
                    roulettePlayers = incomingPlayers;
                    console.log(`Incoming players: ${incomingPlayers}`);
                    console.log(`Current players: ${roulettePlayers}`);
                    
                }

                console.log(message.data);
            break;

            case 'coinflip':
                gameActive = message.active;
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
            case 'clip':
                console.log(message);
                if(message.data.visible) {
                    $('#clip').attr('src', message.data.url);
                    $('#clip').show();
                } else {
                    $('#clip').attr('src', '');
                    $('#clip').hide();
                }
            break;
            case 'trivia':
                console.log(message);
                gameActive = message.active;
                let triviaActive = message.active;
                let triviaQuestion = message.question;
                let triviaAnswers = message.answers;
                let triviaCategory = message.category;
                let triviaDifficulty = message.difficulty;

                if(triviaActive) {                    
                    updateElement('#triviaCategory', "Category: " + triviaCategory);
                    updateElement('#triviaDifficulty', "Difficulty: " + triviaDifficulty);
                    updateElement('#triviaQuestion', "Question: " + triviaQuestion);
                    $('#triviaAnswers').empty();
                    triviaAnswers.forEach(answer => {
                        $('#triviaAnswers').append(`<p>${answer.letter}: ${answer.answer}</p>`);
                    });
                    $('#trivia').slideDown('slow');         
                } else if(!triviaActive && message.winner) {
                    $('#trivia').slideUp('slow');
                    updateElement('#triviaCategory', "");
                    updateElement('#triviaDifficulty', "");
                    updateElement('#triviaQuestion', "");
                    updateElement('#triviaAnswers', "");                                        
                    const alertMessage = message.winner + " has won trivia!<br>The answer was: " + message.answer;
                    showAlert(alertMessage);                    
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

        alertElement.html(message);
        //alertElement.text(message);
        alertElement.slideDown(500, function () {
            setTimeout(function () {
                alertElement.slideUp(500);
        
            }, 2000);
        });
    }
    
    var hotEndGauge = new RadialGauge({
        renderTo: 'hot-end-gauge',
        width: 120,
        height: 120,
        units: "°C",
        title: "Hot End",
        minValue: 0,
        maxValue: 250,
        majorTicks: [0, 50, 100, 150, 200, 250],
        minorTicks: 5,
        strokeTicks: true,
        highlights: [
            {"from": 0, "to": 100, "color": "rgba(255, 0, 0, 0.3)"},
            {"from": 100, "to": 180, "color": "rgba(255, 255, 0, 0.3)"},
            {"from": 180, "to": 220, "color": "rgba(0, 255, 0, 0.3)"},
            {"from": 220, "to": 250, "color": "rgba(255, 255, 0, 0.3)"},
            {"from": 250, "to": 300, "color": "rgba(255, 0, 0, 0.3)"}
        ],
        ticksAngle: 225,
        startAngle: 67.5,
        colorMajorTicks: "#ddd",
        colorMinorTicks: "#ddd",
        colorTitle: "#eee",
        colorUnits: "#ccc",
        colorNumbers: "#eee",
        colorPlate: "#222",
        borderShadowWidth: 0,
        borders: true,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear",
        colorBorderOuter: "#333",
        colorBorderOuterEnd: "#111",
        colorBorderMiddle: "#222",
        colorBorderMiddleEnd: "#111",
        colorBorderInner: "#111",
        colorBorderInnerEnd: "#333",
        colorNeedleShadowDown: "#333",
        colorNeedleCircleOuter: "#333",
        colorNeedleCircleOuterEnd: "#111",
        colorNeedleCircleInner: "#111",
        colorNeedleCircleInnerEnd: "#222",
        valueBoxBorderRadius: 0,
        colorValueBoxRect: "#222",
        colorValueBoxRectEnd: "#333"
    }).draw();

    var bedGauge = new RadialGauge({
        renderTo: 'bed-gauge',
        width: 120,
        height: 120,
        units: "°C",
        title: "Bed Temperature",
        minValue: 0,
        maxValue: 100,
        majorTicks: [0, 20, 40, 60, 80, 100],
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
            {"from": 0, "to": 20, "color": "rgba(255, 0, 0, 0.3)"},
            {"from": 20, "to": 40, "color": "rgba(255, 255, 0, 0.3)"},
            {"from": 40, "to": 60, "color": "rgba(0, 255, 0, 0.3)"},
            {"from": 60, "to": 80, "color": "rgba(255, 255, 0, 0.3)"},
            {"from": 80, "to": 100, "color": "rgba(255, 0, 0, 0.3)"}
        ],
        ticksAngle: 225,
        startAngle: 67.5,
        colorMajorTicks: "#ddd",
        colorMinorTicks: "#ddd",
        colorTitle: "#eee",
        colorUnits: "#ccc",
        colorNumbers: "#eee",
        colorPlate: "#222",
        borderShadowWidth: 0,
        borders: true,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear",
        colorBorderOuter: "#333",
        colorBorderOuterEnd: "#111",
        colorBorderMiddle: "#222",
        colorBorderMiddleEnd: "#111",
        colorBorderInner: "#111",
        colorBorderInnerEnd: "#333",
        colorNeedleShadowDown: "#333",
        colorNeedleCircleOuter: "#333",
        colorNeedleCircleOuterEnd: "#111",
        colorNeedleCircleInner: "#111",
        colorNeedleCircleInnerEnd: "#222",
        valueBoxBorderRadius: 0,
        colorValueBoxRect: "#222",
        colorValueBoxRectEnd: "#333"
    }).draw();

    function startSpin() {
        if (!spinning) {
          spinning = true;
          wheel.css('animation', 'spin 1s linear infinite');
          wheel.show().slideUp(0).slideDown('slow');
          $('#playerName').show();
          startPlayerDisplay();          
        }
      }
  
      function stopSpin() {
        if (spinning) {
          spinning = false;
            
          const transformValue = wheel.css('transform');
          const matrix = transformValue.match(/matrix\((.+)\)/);
  
          if (matrix) {
            const matrixValues = matrix[1].split(', ');
            const angle = Math.round(Math.atan2(parseFloat(matrixValues[1]), parseFloat(matrixValues[0])) * (180 / Math.PI));
            currentRotation = (angle < 0) ? angle + 360 : angle; // Convert to positive angle
          }
  
          wheel.css('animation', 'none'); // Stop spinning animation
          wheel.css('transform', `rotate(${currentRotation}deg)`); // Set current rotation angle
        setTimeout(function() {
            wheel.slideUp('slow');
            $('#playerName').hide();
          }, 2000);
        }
      }

      function startPlayerDisplay() {
        let intervalId;
        
        intervalId = setInterval(function () {
            const player = roulettePlayers[Math.floor(Math.random() * roulettePlayers.length)];
            console.log(player);
            $('#playerName').text(player);    
            // Stop the interval if spinning is false
            if (!spinning) {
                clearInterval(intervalId);
                $('#playerName').text(rouletteWinner);
            }
        }, 100);
    }





});
