import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

let app = express();
app.use(cors()); // prevents from getting connection errors

let server = http.createServer(app);
let io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
}); // front-end is running on 3000

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`); // socket id of user

  socket.on("send_message", (data) => {
    socket.broadcast.emit("recieve_message", data); // broadcast sends to everyone connected besides ourselves
  });
});

server.listen(3001, () => {
  console.log("Server is running at: http://localhost:3001");
});
