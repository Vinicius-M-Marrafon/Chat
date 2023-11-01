// require('dotenv').config();

const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const path = require('path');
const WebSocket = require('ws');
// const jwt = require('jsonwebtoken'); // Authentication stuffs...
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const handlebars = require('express-handlebars');

const PORT = 3000;
// const HOST = '192.168.1.12';
const HOST = '10.14.160.1';
const WebSocketServer = new WebSocket.Server({ server: httpServer });

// Configure the route to the socket.io
// app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io-client/dist')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configure body-parser [
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
// ]
// Express-Handlebars { Config: [
    app.engine('handlebars', handlebars.create({extname: 'handlebars', defaultLayout: 'layout'}).engine);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'handlebars');
// ]
// Cookie-parser [
    // app.use(cookieParser());

    // Middleware cookie checker
    // app.use((request, response, nextHop) => {
    //     const username = request.cookies.username;
        
    //     if (username && onlineUsers.has(username)) {
    //         request.isOnline = true;
    //     }
    //     else {
    //         request.isOnline = false;
    //     }

    //     nextHop();
    // });
// ]
app.get('/', (request, response) => {
    if (request.isOnline) {
        response.sendFile('index.html', { root: __dirname + '/public' });
    }
    else {
        response.redirect('login');
    }
});


const onlineUsers = new Map();
const broadcastMessageHistory = [];

function getOnlineUsersLog() {
    // Display users
    console.log('[');
    for (const [username, usersocket] of onlineUsers) {
        console.log(`\t${username} {${usersocket}},`);
    }
    console.log(']');
}

function loadBroadcastMessageHistory(newUser) {
    for (const broadcastMessage of broadcastMessageHistory) {
        onlineUsers.get(newUser).send(JSON.stringify({
            type: "load-message",
            sender: broadcastMessage.sender,
            message: broadcastMessage.message
        }));
    }
}

function broadcastMessage(sourceUser, message) {
    for (const [username, usersocket] of onlineUsers) {
        if (username !== sourceUser) {
            usersocket.send(JSON.stringify({
                type: "broadcast-message",
                message: message
            }));
        }
    }
}

// ID will be the username (username: ws)
WebSocketServer.on('connection', (WebSocket) => {

    // Listen for socket.send in the client side
    WebSocket.on('message', (package) => {
        const parsedData = JSON.parse(package);

        if (parsedData.type === "new-user")
        {
            WebSocket.id = parsedData.username;

            onlineUsers.set(WebSocket.id, WebSocket);
            
            // call back
            // WebSocket.senderSocket.send({ username: parsedData.username });
            // onlineUsers.get(WebSocket.id).send(JSON.stringify({ type: "callback", username: parsedData.username }));

            broadcastMessage(WebSocket.id, `${WebSocket.id} is online`);
            loadBroadcastMessageHistory(WebSocket.id);
        }

        if (parsedData.type === "new-message-broadcast") {
            // BroadCast Message logic
            // console.log(`Broadcast message ${parsedData.message} from ${parsedData.sender}`);
            const message = parsedData.message;
            const sender = parsedData.sender;

            broadcastMessageHistory.push({
                sender: sender,
                message: message
            });

            broadcastMessage(sender, `${sender}: ${message}`);
        }

        if (parsedData.type === "new-message-private") {
            const sender = parsedData.sender;
            const receiver = parsedData.receiver;
            const message = parsedData.message;

            if (onlineUsers.get(receiver)) {
                // Send message to the receiver user!!! 
                onlineUsers.get(receiver).send(JSON.stringify({
                    type: 'private-message',
                    sender: sender,
                    message: message
                }));
            } else {
                // User not found
            }
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`The server is running at http://${HOST}:${PORT}`)
})