import { io } from "socket.io-client";
///const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3001';
export const socket = io("http://localhost:3000", {
    withCredentials: true,
    autoConnect: false,
});
