document.addEventListener('DOMContentLoaded', () => {
    // Socket (socket.io) [
        // const socket = io('http://localhost:3000');
    // ]
    // Global variables [
        var username = '';
    // ]
    // Socket (WebSocket) [
        // const webSocket = new WebSocket('ws://localhost:3000');
        // const webSocket = new WebSocket('ws://192.168.1.12:3000');
        const webSocket = new WebSocket('ws://10.14.160.1:3000');
        
        // Evt: open => connection finished!!!
        webSocket.addEventListener('open', () => {
            // alert('Welcome to this chat!!!');

            // webSocket.send(JSON.stringify({ type: "new-user", username: "Vinicius" }));
            // We need to force the user to type his name to enter to the chat
            do {
                username = prompt('What\'s your username: ');
            }
            while (username === '' || username === null);

            webSocket.send(JSON.stringify({
                type: "new-user",
                username: username,
            }));

        });
    // ]

    const messageInput = document.getElementById('message-input');
    const targetSocket = document.getElementById('target-socket');
    const form = document.getElementById('form');

    function displayMessage(message)
    {
        const messageContainer = document.getElementById('message-container');
        const newMessageElement = document.createElement('div');

        newMessageElement.textContent = message;
        messageContainer.append(newMessageElement);

        // Clean the input field
        messageInput.value = '';
    }

    
    // Listen for message (send coming for the server)
    webSocket.addEventListener('message', (package) => {
        // console.log(package.data);
        const parsedPackage = JSON.parse(package.data);

        if (parsedPackage.type === 'broadcast-message') {
            displayMessage(parsedPackage.message);
        }

        else if (parsedPackage.type === 'load-message') {
            const sender = parsedPackage.sender;
            const message = parsedPackage.message;
            const loadedMessage = `${sender}: ${message}`;
            displayMessage(loadedMessage);
        }

        else if (parsedPackage.type === 'private-message') {
            const sender = parsedPackage.sender;
            const message = parsedPackage.message;
            const loadedMessage = `[PRIVATE] ${sender}: ${message}`;
            displayMessage(loadedMessage);
        }
    })

    form.addEventListener('submit', (evt) => {

        // Avoid to refresh the page on submit
        evt.preventDefault();

        const message = messageInput.value;
        const receiver = targetSocket.value;

        // There is no message to send
        if (message === '') {
            return;
        }

        if (receiver === '') {
            // Send a broadcast message
            webSocket.send(JSON.stringify({ 
                type: "new-message-broadcast",
                message: message,
                sender: username,
            }));

        } else {
            // Send a private message
            // console.log(`sending the message ${message} to the user ${receiver}`)
            webSocket.send(JSON.stringify({ 
                type: "new-message-private",
                message: message,
                sender: username,
                receiver: receiver
            }));
        }

        displayMessage(`You: ${message}`);
    });
});