$(document).ready(() => {
    const ws = new WebSocket(`${webSocketAddress}`);
    
    const refresh_token = document.cookie.split('; ').find(row => row.startsWith('twitchRefreshToken')).split('=')[1];
    const oauth_token = document.cookie.split('; ').find(row => row.startsWith('twitchOAuthToken')).split('=')[1];
    let expiry = document.cookie.split('; ').find(row => row.startsWith('twitchExpiry')).split('=')[1];

    const hackerTextElement = $('#hacker-text');
    
    
    ws.onerror = (event) => {
        console.error('WebSocket error:', event);
    };

    ws.onopen = () => {
        console.log('WebSocket client connected');
        //ws.send(JSON.stringify({ type : 'startBot' }));
        ws.send(JSON.stringify({ type : 'getInfo' }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'message':
                //Check number of <p> tags in <div> with id="messages"
                if ($('#messages p').length >= 10) {
                    //Remove first <p> tag in <div> with id="messages"
                    $('#messages p:first').remove();
                }
                //Create chat message in <p> tag
                let username = message.userstate['display-name'];
                let color = message.userstate.color;
                let messageText = message.message;
                let messageHtml = `<p class="messageText"><span style="color: ${color}">${username}</span>: <span style="color: #FFFFFF">${messageText}</span></p>`;
                //Append message to <div> with id="messages"
                $('#messages').append(messageHtml);
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
                // Extract relevant information from message
                let game = message.channelData.data[0].game_name;
                let title = message.channelData.data[0].title;
                let viewers = (message.streamData && message.streamData.data && message.streamData.data[0].viewer_count) ?? 0;
                let followers = message.followerCount ?? 0;
                let koth = message.kothData;
                let roulette = message.rouletteData;
                let coinflip = message.coinflipData;
                let goals = message.goals;
                let mostRecentFollower = message.mostRecentFollower;
                let mostRecentSubscriber = message.mostRecentSubscriber;
                let mostRecentViewer = message.mostRecentViewer;
                console.log(message);
                // Update information on page
                $('#game').text(game);
                $('#title').text(title);
                $('#viewers').text(viewers);
                $('#followers').text(followers);
                $('#koth').text(koth.kothWinner);
                $('#roulette').text(roulette.rouletteWinner);
                $('#coinflip').text(coinflip.firstWinner);
                $('#goal1').text(goals[0]);
                $('#goal2').text(goals[1]);
                $('#goal3').text(goals[2]);
                $('#goal4').text(goals[3]);
                $('#mostRecentFollower').text(mostRecentFollower.username);
                $('#mostRecentSubscriber').text(mostRecentSubscriber.username);
                $('#mostRecentViewer').text(mostRecentViewer.username);
                
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
        ws.send(JSON.stringify({ type : 'disclaimer' }));
    }, 1800000);

});