const socket = io.connect();

const sendButton = document.getElementById("send-button");
const messageLog = document.getElementById("message-log");
const nameInput = document.getElementById("name-input");
const messageInput = document.getElementById("message-input");

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    const name = nameInput.value;

    addChatMessage(name, message);

    socket.emit('send-message', {name: name, message: message});
    messageInput.value = "";
    nameInput.value = "";

    

});

socket.on('chat-message', data => {
    console.log(data);
});

socket.on('update-chat', data => {
    
    addChatMessage(data.name, data.message);
    
});

const addChatMessage = (name, message) => {
    const newMessage = document.createElement('div');
    newMessage.textContent = `${name.toUpperCase()}: ${message}`;
    messageLog.append(newMessage);
};


