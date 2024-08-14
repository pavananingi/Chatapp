var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

// set static folder
app.use(express.static(__dirname + "/public"));

// homepage
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// socket connection
io.on('connection', (socket) => {
    console.log("A user connected!");

    // Executes when a user starts typing
    socket.on('userTyping', (username) => {
        socket.broadcast.emit('userTyping', username);
    });

    // Executes when a user sends a message
    socket.on('msg', (msg) => {
        console.log("message: ", msg);
        socket.broadcast.emit('msg', msg);
    });

    // Executes when a new user joins the chat room
    socket.on('join', (username) => {
        socket.broadcast.emit('join', username);
    });

    // Executes when a user sends a voice message
    socket.on('voiceMsg', (data) => {
        console.log("voice message received from user:", data.user);
        // Broadcast the voice message to all other users
        socket.broadcast.emit('voiceMsg', {
            user: data.user,
            audio: data.audio
        });
    });

    // Disconnect event
    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });
});

const PORT = process.env.PORT || 5000;

// port to listen
http.listen(PORT, function(){
    console.log('listening on port:', PORT);
});
