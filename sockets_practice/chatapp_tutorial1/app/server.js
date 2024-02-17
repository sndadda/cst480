import express from "express";
import { Server } from "socket.io";
import http from "http";

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);


io.on('connection', client => {
   client.emit('chat-message', 'Hello World');

   client.on('send-message', data => {
        client.broadcast.emit('update-chat', data);
   });
});


server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });