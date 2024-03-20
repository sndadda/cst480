import { io } from "socket.io-client";
let URL =
    process.env.NODE_ENV === "production"
        ? window.location.host
        : "http://localhost:3000";
export const socket = io(URL, {
    withCredentials: true,
    autoConnect: false,
});
