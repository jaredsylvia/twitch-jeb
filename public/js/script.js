$(document).ready(() => {
    const ws = new WebSocket(`${webSocketAddress}`);
    
    const refresh_token = document.cookie.split('; ').find(row => row.startsWith('twitchRefreshToken')).split('=')[1];
    const oauth_token = document.cookie.split('; ').find(row => row.startsWith('twitchOAuthToken')).split('=')[1];
    let expiry = document.cookie.split('; ').find(row => row.startsWith('twitchExpiry')).split('=')[1];
    let msgCount = 0;
    const hackerTextElement = $('#hacker-text');
    
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
        //ws.send(JSON.stringify({ type : 'startBot' }));
        ws.send(JSON.stringify({ type : 'getInfo' }));
        ws.send(JSON.stringify({ type : 'disclaimer' }));
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
                msgCount++;
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
                //Extract username from message
                let joinUsername = message.username;

                //Check number of <li> tags in <ul> with id="users"
                if ($('#recentJoined li').length >= 3) {
                    //Remove first <li> tag in <ul> with id="users"
                    $('#recentJoined li:first').remove();
                }
                //Create user in <li> tag
                let userHtml = `<li class="userText"><span style="color: white">${joinUsername}</span></li>`;
                //Append user to <ul> with id="users"
                $('#recentJoined').append(userHtml);
                $('#alert').empty();
                $('#alert').append(`<div class="alert alert-success" role="alert"><span style="color: black">${joinUsername} has joined the chat!</span></div>`);

                break;
            case 'follow':
                // Extract username from message
                let followUsername = message.username;
                
                // Check number of <li> tags in <ul> with id="users"
                if ($('#recentFollowed li').length >= 3) {
                    // Remove first <li> tag in <ul> with id="users"
                    $('#recentFollowed li:first').remove();
                }
                // Create user in <li> tag
                let followHtml = `<li class="userText"><span style="color: white">${followUsername}</span></li>`;
                // Append user to <ul> with id="users"
                $('#recentFollowed').append(followHtml);
                $('#alert').empty();
                $('#alert').append(`<div class="alert alert-success" role="alert"><span style="color: black">${joinUsername} has followed!!!</span></div>`);


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
            case 'refreshOauth':
                console.log(message);
                expiry = message.token.expires_in;
                document.cookie = `twitchRefreshToken=${message.token.refresh_token}; SameSite=Strict`;
                document.cookie = `twitchOAuthToken=${message.token.access_token}; SameSite=Strict`;
                document.cookie = `twitchExpiry=${message.token.expires_in}; SameSite=Strict`;
                
                break;
            default:
                
                break;
        }
    };
    // Set update button to send getInfo message
    $('#update').click(() => {
        ws.send(JSON.stringify({ type : 'getInfo' }));
        
    });

    $('#startBot').click(() => {
        ws.send(JSON.stringify({ type : 'startBot' }));
    });

    $('#stopBot').click(() => {
        ws.send(JSON.stringify({ type : 'stopBot' }));
    });

    $('#sendAlert').click(() => {
        let alertText = $('#alertText').val();
        console.log($('#alertText'));
        console.log(alertText);
        ws.send(JSON.stringify({ type : 'alert', message: alertText }));
    });

    $('#setGameTitle').click(() => {
        let gameTitle = $('#gameTitle').val();
        ws.send(JSON.stringify({ type : 'setGameTitle', game: gameTitle }));
    });

    $('#setStreamTitle').click(() => {
        let streamTitle = $('#streamTitle').val();
        ws.send(JSON.stringify({ type : 'setStreamTitle', title: streamTitle }));
    });



    $(window).on('beforeunload', () => {
        //ws.close();
    });
    
    setInterval(() => {
        ws.send(JSON.stringify({ type : 'getInfo' }));
    }, 5000);

    setInterval(() => {
        expiry = document.cookie.split('; ').find(row => row.startsWith('twitchExpiry')).split('=')[1] - 1;
        document.cookie = `twitchExpiry=${expiry}; SameSite=Strict`;
        if (expiry <= 60) {
            ws.send(JSON.stringify({ type : 'refreshOauth', token: refresh_token }));
        }       
    }, 1000);

    setInterval (() => {
        ws.send(JSON.stringify({ type : 'updateUserInformation' }));
    }, 60000);
        
    setInterval(() => {
        if (msgCount >= 10) {
            msgCount = 0;
            ws.send(JSON.stringify({ type : 'disclaimer' }));
        }
        
    }, 1800000);

});