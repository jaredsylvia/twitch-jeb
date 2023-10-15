$(document).ready(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onerror = (event) => {
        console.error('WebSocket error:', event);
    };

    ws.onopen = () => {
        console.log('WebSocket client connected');
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
                if ($('#recentJoined li').length >= 10) {
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
                if ($('#recentFollowed li').length >= 10) {
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
                let viewers = (message.streamData && message.streamdata.data && message.streamdata.data[0].viewer_count) ?? 0;
                let followers = message.followerCount ?? 0;
                              

                // Update information on page
                $('#game').text(game);
                $('#title').text(title);
                $('#viewers').text(viewers);
                $('#followers').text(followers);


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

    // Update information every 5 seconds
    setInterval(() => {
        ws.send(JSON.stringify({ type : 'getInfo' }));
    }, 500000);
    
    // Reload page every 20 minutes
    setInterval(() => {
        location.reload(true);
    }, 1200000);

});