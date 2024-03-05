import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as url from "url";
import crypto from "crypto";
import argon2 from "argon2";
import cookieParser from "cookie-parser";
import * as utils from "./utils.js";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import SOCKET_EVENTS from "./socketEnums.js";
let app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
let server = http.createServer(app);
let io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
    maxHttpBufferSize: 1e8, // 100 MB
});
// create database "connection"
// use absolute path to avoid this issue
// https://github.com/TryGhost/node-sqlite3/issues/441
let __dirname = url.fileURLToPath(new URL("..", import.meta.url));
let dbfile = `${__dirname}database.db`;
let db = await open({
    filename: dbfile,
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");
let cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
};
function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}
let authorize = async (req, res, next) => {
    let { token } = req.cookies;
    if (token === undefined) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    let result;
    try {
        result = await db.all("SELECT * FROM tokens WHERE token=?", [token]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    if (result.length === 0) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    next();
};
app.get("/api/loggedin", async (req, res) => {
    let { token } = req.cookies;
    if (token === undefined) {
        return res.json({ loggedIn: false });
    }
    let result;
    try {
        result = await db.all("SELECT * FROM tokens WHERE token=?", [token]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    if (result.length === 0) {
        return res.json({ loggedIn: false });
    }
    return res.json({ loggedIn: true });
});
app.post("/api/create", async (req, res) => {
    let parseResult = utils.userBodySchema.safeParse(req.body);
    let result;
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    let { username, password } = parseResult.data;
    try {
        result = await db.all("SELECT * FROM users WHERE username=?", [username]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    if (result.length !== 0) {
        return res.status(400).json({ error: "Username already exists." });
    }
    let hash;
    try {
        hash = await argon2.hash(password);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    try {
        result = await db.all("INSERT INTO users(username, password) VALUES(?, ?)", [username, hash]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    return res.status(201).json();
});
app.post("/api/login", async (req, res) => {
    let parseResult = utils.userBodySchema.safeParse(req.body);
    let result;
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    let { username, password } = parseResult.data;
    try {
        result = await db.all("SELECT * FROM users WHERE username=?", [username]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    if (result.length === 0) {
        return res.status(404).json({ error: "Username does not exist." });
    }
    let hash = result[0].password;
    let verifyResult;
    try {
        verifyResult = await argon2.verify(hash, password);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    if (!verifyResult) {
        return res.status(400).json({ error: "Password does not match." });
    }
    let token = makeToken();
    try {
        await db.all("INSERT INTO tokens(token, username) VALUES(?, ?)", [
            token,
            username,
        ]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    return res.status(200).cookie("token", token, cookieOptions).json();
});
app.post("/api/logout", async (req, res) => {
    let { token } = req.cookies;
    if (token === undefined) {
        return res.status(400).json({ error: "You are already logged out." });
    }
    let result;
    try {
        result = await db.all("SELECT * FROM tokens WHERE token=?", [token]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    if (result.length === 0) {
        return res.status(404).json({ error: "Invalid token." });
    }
    try {
        await db.all("DELETE FROM tokens WHERE token=?", [token]);
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    return res.status(204).clearCookie("token", cookieOptions).json();
});
app.get("/api/cuteCatPosts", authorize, async (req, res) => {
    let result;
    try {
        result = await db.all("SELECT cute_cat_posts.id, username, image, likes, caption, timestamp FROM cute_cat_posts INNER JOIN users ON users.id = cute_cat_posts.user_id");
    }
    catch (err) {
        let error = err;
        return res.status(500).json({ error: error.toString() });
    }
    return res.status(200).json({ cuteCatPosts: result });
});
//////START OF SOCKETS//////////
io.use(async (socket, next) => {
    if (!socket.handshake.headers.cookie) {
        next(new Error("Unauthorized."));
    }
    else {
        let token = socket.handshake.headers.cookie.slice(6);
        let result = [];
        let username = "";
        try {
            result = await db.all("SELECT * FROM tokens WHERE token=?", [token]);
            username = result[0].username;
        }
        catch (err) {
            let error = err;
            next(new Error(error.toString()));
        }
        if (result.length === 0) {
            next(new Error("Unauthorized."));
        }
        let userId = 0;
        try {
            result = await db.all("SELECT id FROM users WHERE username=?", [
                username,
            ]);
            userId = result[0].id;
        }
        catch (err) {
            let error = err;
            next(new Error(error.toString()));
        }
        socket.data = userId;
        next();
    }
});
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = socket.data; // userId is accessible in every socket event
    socket.on(SOCKET_EVENTS.CREATE_POST, async (data) => {
        try {
            const { user_id, marker_id, subject, content, image } = data;
            const result = await db.all("INSERT INTO posts (user_id, marker_id, subject, content, timestamp, image) VALUES (?, ?, ?, ?, DATETIME('now'), ?) RETURNING id", [user_id, marker_id, subject, content, image]);
            const insertedPost = await db.all("SELECT * FROM posts WHERE id = ?", [
                result[0].id,
            ]);
            io.emit(SOCKET_EVENTS.UPDATE_FEED, { message: insertedPost });
        }
        catch (error) {
            socket.emit(SOCKET_EVENTS.ERROR, { message: "An error occurred." });
        }
    });
    socket.on(SOCKET_EVENTS.CREATE_COMMENT, async (data) => {
        try {
            const { post_id, parent_comment_id, user_id, content } = data;
            const result = await db.all("INSERT INTO comments(post_id, parent_comment_id, user_id, content, timestamp) VALUES(?, ?, ?, ?, DATETIME('now')) RETURNING id", [post_id, parent_comment_id, user_id, content]);
            const insertedComment = await db.all("SELECT * FROM comments WHERE id = ?", [result[0].id]);
            io.emit(SOCKET_EVENTS.UPDATE_POST, { message: insertedComment });
        }
        catch (error) {
            socket.emit(SOCKET_EVENTS.ERROR, { message: "An error occurred." });
        }
    });
    /* Cute Cat Post Socket Events */
    socket.on(SOCKET_EVENTS.CUTE_CAT_POST, async (data) => {
        let { buffer, caption } = data;
        let cuteCatFeed = [];
        let imageRef;
        let result;
        let base64image = "";
        try {
            if (!buffer) {
                throw new Error("Must upload an image to post.");
            }
            try {
                base64image = btoa(new Uint8Array(buffer).reduce(function (data, byte) {
                    return data + String.fromCharCode(byte);
                }, ""));
                result = await db.all("INSERT INTO cute_cat_posts(user_id, image, caption, timestamp) VALUES(?, ?, ?, datetime('now')) RETURNING id", [userId, base64image, caption]);
                imageRef = result[0].id;
                cuteCatFeed = await db.all("SELECT cute_cat_posts.id, username, image, likes, caption, timestamp FROM cute_cat_posts INNER JOIN users ON users.id = cute_cat_posts.user_id");
                io.emit(SOCKET_EVENTS.CUTE_CAT_UPDATE, cuteCatFeed);
            }
            catch (err) {
                let error = err;
                socket.emit(SOCKET_EVENTS.CUTE_CAT_ERROR, { error: error.toString() });
            }
        }
        catch (err) {
            let error = err;
            io.to(socket.id).emit(SOCKET_EVENTS.CUTE_CAT_ERROR, {
                error: error.toString(),
            });
        }
    });
    socket.on(SOCKET_EVENTS.CUTE_CAT_LIKE, async (data) => {
        let { postId, increment } = data;
        let cuteCatFeed = [];
        let result;
        let likes;
        try {
            result = await db.all("SELECT likes FROM cute_cat_posts WHERE id=?", [
                postId,
            ]);
            likes = result[0].likes;
            likes += increment;
            await db.all("UPDATE cute_cat_posts SET likes=? WHERE id=?", [
                likes,
                postId,
            ]);
            cuteCatFeed = await db.all("SELECT cute_cat_posts.id, username, image, likes, caption, timestamp FROM cute_cat_posts INNER JOIN users ON users.id = cute_cat_posts.user_id");
            io.emit(SOCKET_EVENTS.CUTE_CAT_UPDATE, cuteCatFeed);
        }
        catch (err) {
            let error = err;
            io.to(socket.id).emit(SOCKET_EVENTS.CUTE_CAT_ERROR, {
                error: error.toString(),
            });
        }
    });
    /* End of Cute Cat Post Socket Events */
});
//////END OF SOCKETS//////////
// run server
let port = 3000;
let host = "localhost";
let protocol = "http";
// app.listen(port, host, () => {
//   console.log(`${protocol}://${host}:${port}`);
// });
server.listen(port, () => {
    console.log(`${protocol}://${host}:${port}`);
});
