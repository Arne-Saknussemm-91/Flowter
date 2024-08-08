const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8000 });

console.log('WebSocket server running on ws://0.0.0.0:8000');

// Store all connected clients
let clients = [];

wss.on('connection', function connection(ws) {
    console.log('Client connected.');

    // Add new client to the clients array
    clients.push(ws);

    ws.on('message', function incoming(message) {
        console.log('Received: %s', message);

        // Broadcast the received message to all clients
        clients.forEach(function(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString()); // Send received message as a string to clients
            }
        });
    });

    ws.on('close', function() {
        console.log('Client disconnected.');

        // Remove disconnected client from clients array
        clients = clients.filter(function(client) {
            return client.readyState === WebSocket.OPEN;
        });
    });
});

