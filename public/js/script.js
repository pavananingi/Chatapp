$(() => {
    // Helper Functions
    function messageTemplate(username, user, msg, color) {
        /* template for chat message */
        let tag = "<div class='chatMessage " + user +"'>" + 
        "<h3 style='color:" + color + "'>" + username +" </h3>" + "<p>" + msg + "</p></div>";
        return tag;
    }

    function joinTemplate(username) {
        /* template for new user joining */
        let tag = "<div class='joinMessage'><p class='center join'>"+ username +" joined the chat.</p></div>";
        return tag;
    }

    function callModal() {
        /* Modal Controls */
        $("#usernameModal").modal({
            backdrop: 'static',
            keyboard: false
        });
        $('#usernameModal').on('shown.bs.modal', function () {
            $('#username').focus()
        });
        $("#usernameModal").modal('show');
    }

    function validateUsername() {
        /* Check that username is not empty */
        $("#usernameForm").submit((e) => {
            e.preventDefault();

            let username = $("#username").val();
            if (username == '') {
                $(".error-msg").html("You must enter a username!");
            }
            else {
                currentUser = username;
                users.push(currentUser);
                $("#usernameModal").modal('hide');
                $("#message").focus();

                socket.emit("join", currentUser);
            }
        });
    }

    function sendMessage() {
        /* sends a message */
        $("#messageForm").submit((e) => {
            e.preventDefault();

            // send message to other users
            let user = currentUser;
            let message = $("#message").val();
            let msg = {"user": user, "message": message};
            socket.emit('msg', msg);

            $("#message").val('');

            // set chat color
            let index = users.indexOf(user);
            if (index == -1) {
                users.push(user);
                index = colorCount % chatColors.length;
                colorCount += 1;
            }

            // add message to chatbox
            $(messageTemplate(currentUser, 'currentUser', message, chatColors[index])).appendTo("#chatBox");
            
            var chatBox = document.getElementById("chatBox");
            chatBox.scrollTop = chatBox.scrollHeight;
            return false;
        });    
    }

    function getMessage() {
        /* Shows the message sent by some other user on the screen */
        socket.on('msg', (msg) => {
            // set chat color
            let index = users.indexOf(msg.user);
            if (index == -1) {
                users.push(msg.user);
                index = colorCount % chatColors.length;
                colorCount += 1;
            }
            $(messageTemplate(msg.user, 'otherUser', msg.message, chatColors[index])).appendTo("#chatBox");
            
            var chatBox = document.getElementById("chatBox");
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    function sendUserTyping() {
        /* tells others that the current user is typing */
        $("#message").on('keypress', () => {
            socket.emit('userTyping', currentUser);
        });
    }

    function showUserTyping() {
        /* displays on the screen which user is typing */
        socket.on('userTyping', (username) => {
            $("#userTyping").html(username + " is typing...");
            var timeout = setTimeout(() => {
                $("#userTyping").html('');
            }, 1000);

            function calledAgain() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    $("#userTyping").html('');
                }, 1000);
            }
            calledAgain();
        });
    }

    function showWhichUserJoin() {
        /* Shows on the screen which user joined the chatroom */
        socket.on('join', (username) => {
            $(joinTemplate(username)).appendTo("#chatBox");
        });    
    }

    // Emoji Picker Logic
    function initializeEmojiPicker() {
        // Dummy emoji picker logic - integrate a real library like emoji-picker-element or similar
        $('#emojiBtn').on('click', () => {
            $('#emojiPicker').toggle(); // Toggle the emoji picker display
        });

        // Simulate emoji selection
        $('#emojiPicker').on('click', 'span', function() {
            const emoji = $(this).text();
            $('#message').val($('#message').val() + emoji); // Append the selected emoji to the input
        });
    }

    // Voice Recording Logic
    function initializeVoiceRecording() {
        let isRecording = false;
        let recorder, audioStream;

        $('#recordBtn').on('click', async () => {
            if (!isRecording) {
                // Start recording
                isRecording = true;
                $('#recordBtn').text('Stop Recording');
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recorder = new MediaRecorder(audioStream);
                recorder.start();

                recorder.ondataavailable = (e) => {
                    // Send recorded audio to the server
                    const audioBlob = new Blob([e.data], { type: 'audio/webm' });
                    socket.emit('voiceMsg', { user: currentUser, audio: audioBlob });
                };
            } else {
                // Stop recording
                isRecording = false;
                $('#recordBtn').text('🎤');
                recorder.stop();
                audioStream.getTracks().forEach(track => track.stop());
            }
        });

        // Play received voice messages
        socket.on('voiceMsg', (data) => {
            const audioURL = URL.createObjectURL(data.audio);
            const audioElement = new Audio(audioURL);
            $(messageTemplate(data.user, 'otherUser', 'Sent a voice message', chatColors[users.indexOf(data.user)])).appendTo("#chatBox");
            audioElement.play();
        });
    }

    // initialize socket
    var socket = io();
    
    // current user's username
    var currentUser = '';

    // set chat colors
    var chatColors = [
        '#F44336',
        '#673AB7',
        '#EF6C00',
        '#795548',
        '#607D8B',
        '#004D40',
        '#880E4F',
        '#FFC107',
        '#03A9F4',
        '#1A237E'
    ];
    var colorCount = 1;
    var users = [];

    // call Modal for username
    callModal();            

    // validates username when modal is submitted
    validateUsername();

    // sends a message to other users
    sendMessage();

    // receive message from user and display on screen
    getMessage();
    
    // tells others that current user is typing
    sendUserTyping();

    // displays on the screen which user is typing currently
    showUserTyping();
    
    // displays on the screen which user joined the chat room
    showWhichUserJoin();

    // Initialize Emoji Picker
    initializeEmojiPicker();

    // Initialize Voice Recording
    initializeVoiceRecording();
});
