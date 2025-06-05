import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import * as path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

const server = app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
    console.log('Serving static files from:', path.join(__dirname, '../public'));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    // Event listener for messages received from a client
    ws.on('message', (message: string) => {
        const messageString = message.toString();
        console.log(`Received message: ${messageString}`);

        // Broadcast the message to all currently connected clients
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    });

    // Event listener for when a client closes their connection
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Event listener for WebSocket errors
    ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
    });

    // Send a welcome message to the newly connected client
    ws.send('Welcome to the WebSocket chat!');
});

console.log('WebSocket server initialized, waiting for connections...');