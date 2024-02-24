import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as url from "url";
import crypto from "crypto";
import argon2 from "argon2";
import cookieParser from "cookie-parser";
import * as utils from "./utils.js";
import multer from "multer";
let app = express();
app.use(express.json());
app.use(cookieParser());
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
//temporary directory to store image files for user posts
const upload = multer({ dest: 'uploads/' });
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
///////////////////////////////////////////
// START OF ENDPOINTS RELATED TO USER POSTS 
//  
app.post("/api/userPosts", upload.single('image'), async (req, res) => {
    const { username, content } = req.body;
    let user_id;
    const image = req.file ? req.file.buffer : null; // Check if image is uploaded
    if (req.file) {
        console.log(`the file buffer: ${req.file.buffer}`);
    }
    else {
        console.log('it is null.');
    }
    try {
        const result = await db.all("SELECT id FROM users WHERE username = ?", [username]);
        if (result.length > 0) {
            user_id = result[0].id;
            await db.run("INSERT INTO user_posts(user_id, content, image) VALUES (?, ?, ?)", [user_id, content, image]);
            return res.status(201).json({ message: 'Post created successfully' });
        }
        return res.status(404).json({ message: 'Username not found' });
    }
    catch (err) {
        return res.status(500).json({ error: 'Error inserting post into database' });
    }
});
app.get("/api/userPosts", async (req, res) => {
    try {
        const result = await db.all('SELECT * FROM user_posts');
        return res.status(200).json({ message: result });
    }
    catch (err) {
        return res.status(500).json({ error: 'Error displaying posts' });
    }
});
app.get("/api/postComments", async (req, res) => {
    try {
        //console.log("trying to get comments");
        const result = await db.all('SELECT * FROM comments ORDER BY time ASC');
        return res.status(200).json({ message: result });
    }
    catch (err) {
        return res.status(500).json({ error: 'Error getting comments' });
    }
});
app.post('/profile', upload.single('avatar'), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    console.log(req.file);
});
// END OF ENDPOINTS RELATED TO USER POSTS 
///////////////////////////////////////////
// run server
let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
