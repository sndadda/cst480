import sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as url from "url";
import * as argon2 from "argon2";
import { User } from "./utils.js";

let __dirname = url.fileURLToPath(new URL("..", import.meta.url));
let dbfile = `${__dirname}database.db`;
let db = await open({
  filename: dbfile,
  driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

let dummyUsers: User[] = [
  {
    username: "francisco",
    password: "Francisco123#",
  },
  {
    username: "sandra",
    password: "Sandra123#",
  },
  {
    username: "kevin",
    password: "Kevin123#",
  },
];

// insert dummy users
await db.run("DELETE FROM users");
for (let { username, password } of dummyUsers) {
  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (err) {
    let error = err as Object;
    console.log(`Error when hashing '${password}':`, error.toString());
    continue;
  }
  try {
    await db.run("INSERT INTO users(username, password) VALUES(?, ?)", [
      username,
      hash,
    ]);
  } catch (err) {
    let error = err as Object;
    console.log(
      `Error when inserting '${username}, ${hash}':`,
      error.toString()
    );
  }
}

// test it worked
let result = await db.all("SELECT * FROM users");
console.log(result);
