import axios, { AxiosError } from "axios";
import sqlite3 from "sqlite3";
import argon2 from "argon2";
import { open } from "sqlite";
import * as url from "url";
import { dummyUsers } from "./utils.js";

let port = 3000;
let host = "localhost";
let protocol = "http";
let baseUrl = `${protocol}://${host}:${port}/api`;

axios.defaults.baseURL = baseUrl;

let __dirname = url.fileURLToPath(new URL("..", import.meta.url));
let dbfile = `${__dirname}database.db`;
let db = await open({
  filename: dbfile,
  driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

let testUser = {
  username: "userexample",
  password: "passwordexample",
};

beforeEach(async () => {
  await db.run("DELETE FROM users");
  for (let { username, password } of dummyUsers) {
    let hash = await argon2.hash(password);
    await db.run("INSERT INTO users(username, password) VALUES(?, ?)", [
      username,
      hash,
    ]);
  }
});

afterEach(async () => {
  await db.run("DELETE FROM users");
  for (let { username, password } of dummyUsers) {
    let hash = await argon2.hash(password);
    await db.run("INSERT INTO users(username, password) VALUES(?, ?)", [
      username,
      hash,
    ]);
  }
});

test("CREATE /create valid username and password creates new user: 201", async () => {
  let { status } = await axios.post(`/create`, testUser);
  expect(status).toBe(201);
});

test("CREATE /create invalid body returns error: 400", async () => {
  let invalidBody = {
    user: "invalid",
    pass: "invalid",
  };
  try {
    let response = await axios.post(`/create`, invalidBody);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.status).toBe(400);
  }
});

test("CREATE /create invalid username (below 3 characters) returns error: 400", async () => {
  let thisTestUser = { ...testUser };
  thisTestUser.username = "ab";
  try {
    let response = await axios.post(`/create`, thisTestUser);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.data).toEqual({
      error: "Username must be at least 3 characters long.",
    });
    expect(error.response.status).toBe(400);
  }
});

test("CREATE /create username already exists return error: 400", async () => {
  try {
    let response = await axios.post(`/create`, dummyUsers[0]);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.data).toEqual({
      error: "Username already exists.",
    });
    expect(error.response.status).toBe(400);
  }
});

test("CREATE /create invalid password (below 8 characters) returns error: 400", async () => {
  let thisTestUser = { ...testUser };
  thisTestUser.password = "passwor";
  try {
    let response = await axios.post(`/create`, thisTestUser);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.data).toEqual({
      error: "Password must be at least 8 characters long.",
    });
    expect(error.response.status).toBe(400);
  }
});

test("LOGIN /login valid username and password logins user in: 200", async () => {
  let { status, headers } = await axios.post(`/login`, dummyUsers[0]);
  expect(status).toBe(200);
  expect(headers).toHaveProperty("set-cookie");
});

test("LOGIN /login username doesn't exist returns error: 404", async () => {
  try {
    let response = await axios.post(`/login`, testUser);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.data).toEqual({
      error: "Username does not exist.",
    });
    expect(error.response.status).toBe(404);
  }
});

test("LOGIN /login password does not match returns error: 400", async () => {
  let thisTestUser = { ...dummyUsers[0] };
  thisTestUser.password = "wrong-password";
  try {
    let response = await axios.post(`/login`, thisTestUser);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.data).toEqual({
      error: "Password does not match.",
    });
    expect(error.response.status).toBe(400);
  }
});

test("LOGOUT /logout no token returns error: 400", async () => {
  try {
    let response = await axios.post(`/logout`);
    fail("Should have returned error message");
  } catch (err) {
    let error = err as AxiosError;
    if (error.response === undefined) {
      throw Error("Server never sent response");
    }
    expect(error.response.status).toBe(400);
  }
});
