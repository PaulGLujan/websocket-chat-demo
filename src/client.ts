const messagesDiv = document.getElementById('messages') as HTMLDivElement;
const messageInput = document.getElementById('messageInput') as HTMLInputElement;
const sendButton = document.getElementById('sendButton') as HTMLButtonElement;

const socket = new WebSocket('wss://gr08q8lc49.execute-api.us-west-2.amazonaws.com/dev');

// Event listener for when the WebSocket connection is successfully opened
socket.onopen = (event) => {
    console.log('WebSocket connected!');
    appendMessage('System', 'Connected to chat.');
};

// Event listener for messages received from the server
socket.onmessage = (event) => {
    console.log('Message from server:', event.data);
    appendMessage('Other', event.data);
};

// Event listener for when the WebSocket connection is closed
socket.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    appendMessage('System', 'Disconnected from chat. (Code: ' + event.code + ')');
};

// Event listener for WebSocket errors
socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    appendMessage('System', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
};

// Event listener for the Send button click
sendButton.addEventListener('click', () => {
    sendMessage();
});

// Event listener for the Enter key press in the input field
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Function to send a message via WebSocket
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.send(message);
        appendMessage('You', message);
        messageInput.value = '';
        messageInput.focus();
    }
}

// Function to append messages to the display div
function appendMessage(sender: string, message: string) {
    const p = document.createElement('p');
    p.classList.add('message-line');
    if (sender === 'System') {
        p.classList.add('system-message');
    } else if (sender === 'You') {
        p.classList.add('you-message');
    }
    p.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the bottom
}