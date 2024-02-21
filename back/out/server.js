import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as url from "url";
import crypto from "crypto";
import argon2 from "argon2";
import cookieParser from "cookie-parser";
import * as utils from "./utils.js";
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
let tokenStorage = {}; // TODO use different token storage system???
let cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
};
function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}
let authorize = (req, res, next) => {
    let { token } = req.cookies;
    if (token === undefined || !tokenStorage.hasOwnProperty(token)) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    next();
};
app.get("/api/loggedin", (req, res) => {
    let { token } = req.cookies;
    if (token === undefined || !tokenStorage.hasOwnProperty(token)) {
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
    tokenStorage[token] = username;
    return res.status(200).cookie("token", token, cookieOptions).json();
});
app.post("/api/logout", (req, res) => {
    let { token } = req.cookies;
    if (token === undefined || !tokenStorage.hasOwnProperty(token)) {
        return res.status(400).json({ error: "You are already logged out." });
    }
    delete tokenStorage[token];
    return res.status(204).clearCookie("token", cookieOptions).json();
});
// run server
let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
