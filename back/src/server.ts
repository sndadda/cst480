import express, { Response, CookieOptions, RequestHandler } from "express";
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

import multer = require('multer');
const upload = multer({
  limits: {
    fieldSize: 5 * 1024 * 1024, // 5 Mb
  },
});
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
declare module 'express-serve-static-core' {
  interface Request {
    file: any;
  }
}

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

let cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
};

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

let authorize: RequestHandler = async (req, res, next) => {
  let { token } = req.cookies;
  if (token === undefined) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  let result;
  try {
    result = await db.all("SELECT * FROM tokens WHERE token=?", [token]);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  if (result.length === 0) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  res.locals.id = result[0].user_id; // user id will be accessible in any request handler that uses authorize
  next();
};

app.get("/api/loggedin", async (req, res) => {
  let { token } = req.cookies;
  if (token === undefined) {
    return res.json({ loggedIn: false });
  }
  let result;
  try {
    result = await db.all("SELECT users.id, users.name FROM tokens JOIN users ON tokens.user_id = users.id WHERE token=?", [token]);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  if (result.length === 0) {
    return res.json({ loggedIn: false });
  }
  let userId = result[0].id;
  let name = result[0].name;
  return res.json({ loggedIn: true, name, userId });
});

app.post("/api/create", async (req, res) => {
  let parseResult = utils.userBodySchema.safeParse(req.body);
  let result;
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }
  let { name, username, password } = parseResult.data;
  try {
    result = await db.all("SELECT * FROM users WHERE username=?", [username]);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  if (result.length !== 0) {
    return res.status(400).json({ error: "Username already exists." });
  }
  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  try {
    result = await db.run(
      "INSERT INTO users(name, username, password, image) VALUES(?, ?, ?, ?)",
      [name, username, hash, null]
    );
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  return res.status(201).json();
});

app.post("/api/login", async (req, res) => {
  let parseResult = utils.loginUserBodySchema.safeParse(req.body);
  let result;
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }
  let { username, password } = parseResult.data;
  try {
    result = await db.all("SELECT * FROM users WHERE username=?", [username]);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  if (result.length === 0) {
    return res.status(404).json({ error: "Username does not exist." });
  }
  let id = result[0].id;
  let hash = result[0].password;
  let verifyResult: boolean;
  try {
    verifyResult = await argon2.verify(hash, password);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  if (!verifyResult) {
    return res.status(400).json({ error: "Password does not match." });
  }
  let token = makeToken();
  try {
    await db.all(
      "INSERT INTO tokens(token, user_id, username) VALUES(?, ?, ?)",
      [token, id, username]
    );
  } catch (err) {
    let error = err as Object;
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
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  if (result.length === 0) {
    return res.status(404).json({ error: "Invalid token." });
  }
  try {
    await db.all("DELETE FROM tokens WHERE token=?", [token]);
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  return res.status(204).clearCookie("token", cookieOptions).json();
});


app.get("/api/cuteCatPosts", authorize, async (req, res) => {
  let result: utils.CuteCatPost[];
  try {
    result = await db.all(
      "SELECT cute_cat_posts.id, username, cute_cat_posts.image, likes, caption, timestamp FROM cute_cat_posts INNER JOIN users ON users.id = cute_cat_posts.user_id"
    );
  } catch (err) {
    console.error(err); // Log the error
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  return res.status(200).json({ cuteCatPosts: result });
});

app.get("/api/cuteCatLikes", authorize, async (req, res) => {
  let result: utils.CuteCatLike[];
  let id = res.locals.id;
  try {
    result = await db.all(
      "SELECT post_id FROM cute_cat_likes WHERE user_id=?",
      [id]
    );
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  return res.status(200).json({ cuteCatLikes: result });
});

app.get("/api/postLikes", authorize, async (req, res) => {
  let result: utils.CuteCatLike[];
  let id = res.locals.id;
  try {
    result = await db.all(
      "SELECT post_id FROM cute_cat_likes WHERE user_id=?",
      [id]
    );
  } catch (err) {
    let error = err as Object;
    return res.status(500).json({ error: error.toString() });
  }
  return res.status(200).json({ cuteCatLikes: result });
});



//////START OF SOCKETS//////////

io.use(async (socket, next) => {
  if (!socket.handshake.headers.cookie) {
    next(new Error("Unauthorized."));
  } else {
    let token = socket.handshake.headers.cookie.slice(6);
    let result = [];
    let username = "";
    try {
      result = await db.all("SELECT * FROM tokens WHERE token=?", [token]);
      username = result[0].username;
    } catch (err) {
      let error = err as Object;
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
    } catch (err) {
      let error = err as Object;
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

      const result = await db.all(
        "INSERT INTO posts (user_id, marker_id, subject, content, timestamp, image) VALUES (?, ?, ?, ?, DATETIME('now'), ?) RETURNING id",
        [userId, marker_id, subject, content, image]
      );
      // console.log(result);
      // console.log(`Post id: ${result[0].id}`);
      const allPosts = await db.all("SELECT posts.id, users.username, posts.subject, posts.content, posts.timestamp, posts.likes, posts.image FROM posts LEFT JOIN users ON posts.user_id = users.id");
      io.emit(SOCKET_EVENTS.UPDATE_FEED, { message: allPosts });
    } catch (error) {

      socket.emit(SOCKET_EVENTS.ERROR, { message: "An error occurred." });
    }
  });

  socket.on(SOCKET_EVENTS.CREATE_COMMENT, async (data) => {
    try {
      const { post_id, parent_comment_id, content } = data;

      const result = await db.all(
        "INSERT INTO comments(post_id, parent_comment_id, user_id, content, timestamp) VALUES(?, ?, ?, ?, DATETIME('now')) RETURNING id",
        [post_id, parent_comment_id, userId, content]
      );
      console.log(result);
      // const insertedComment = await db.all(
      //   "SELECT * FROM comments WHERE id = ?",
      //   [result[0].id]
      // );
      const postComments = await db.all(
        "SELECT * FROM comments WHERE post_id = ?",
        [post_id]
      );
      console.log("postComments", postComments);
      // io.emit(SOCKET_EVENTS.UPDATE_POST, { message: insertedComment });
      io.emit(SOCKET_EVENTS.UPDATE_POST, {message: postComments})
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "An error occurred." });
    }
  });

  socket.on(SOCKET_EVENTS.UPDATE_FEED, async (data) => {
    try {
      const allPosts = await db.all("SELECT posts.id, users.username, posts.subject, posts.content, posts.timestamp, posts.likes, posts.image FROM posts LEFT JOIN users ON posts.user_id = users.id");
      const userLikes = await db.all(
        "SELECT * FROM post_likes WHERE user_id = ?",
        [userId]
      );

      console.log(userId);
      console.log(userLikes);
      io.emit(SOCKET_EVENTS.UPDATE_FEED, { message: allPosts, userLikes: userLikes});
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "An error occurred." });
    }
  });

  socket.on(SOCKET_EVENTS.LIKE_POST, async (data) => {
    try {
      const post_id = data;
      
      // Check if the user has already liked the post.
      const existingLike = await db.get(
        "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
        [post_id, userId]
      );

      if (existingLike) {
          //Unlike the post since the like is button is hit when the post is already liked.
          await db.run(
              "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
              [post_id, userId]
          );

          // Decrement the total likes in the posts db.
          await db.run(
              "UPDATE posts SET likes = likes - 1 WHERE id = ?",
              [post_id]
          );
      } else {
          // Like the post since user did not liked it yet.
          await db.run(
              "INSERT INTO post_likes(post_id, user_id) VALUES(?, ?)",
              [post_id, userId]
          );

          // Increment total likes for the specific post.
          await db.run(
              "UPDATE posts SET likes = likes + 1 WHERE id = ?",
              [post_id]
          );
      }
      
      const allPosts = await db.all("SELECT posts.id, users.username, posts.subject, posts.content, posts.timestamp, posts.likes, posts.image FROM posts LEFT JOIN users ON posts.user_id = users.id");
      const userLikes = await db.all(
        "SELECT * FROM post_likes WHERE user_id = ?",
        [userId]
      );
      io.emit(SOCKET_EVENTS.UPDATE_FEED, { message: allPosts, userLikes: userLikes });

    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "An error occurred." });
    }
  });


  socket.on(SOCKET_EVENTS.MARKER, async (data) => {
    let { latitude, longitude } = data;
    let marker: utils.Marker[] = [];
    let result;
    
    try {
      result = await db.all(
        "INSERT INTO markers(user_id, latitude, longitude) VALUES (?, ?, ?) RETURNING id",
        [userId, latitude, longitude]
      );
  
      socket.emit(SOCKET_EVENTS.MARKER_CREATED, { id: result[0].id, latitude, longitude });
  
      let updatedMarkers: utils.Marker[];
      updatedMarkers = await db.all(
        "SELECT markers.id, latitude, longitude FROM markers INNER JOIN users ON users.id = markers.user_id"
      );
      io.emit(SOCKET_EVENTS.MARKERS_FETCHED, updatedMarkers);
    } catch (err) {
      let error = err as Object;
      socket.emit(SOCKET_EVENTS.MARKER_ERROR, { error: error.toString() });
    }
  });
  
  socket.on(SOCKET_EVENTS.CREATE_MAP_POST, async (data) => {
    let { marker_id, subject, content, image } = data;
    let mapPost: utils.MapPost[] = [];
    let result;
    let base64Image = "";
    console.log(data);
  
    if (!marker_id || !content) {
      socket.emit(SOCKET_EVENTS.MAP_ERROR, { error: 'Missing required data' });
      return;
    }
  
    try {
   


      result = await db.all(
        "INSERT INTO posts(user_id, marker_id, subject, content, timestamp, image) VALUES(?, ?, ?, ?, DATETIME('now'), ?) RETURNING id",
        [userId, marker_id, subject, content, image]
      );
      console.log('post saved');
  
      if (!result || result.length === 0) {
        socket.emit(SOCKET_EVENTS.MAP_ERROR, { error: 'Failed to create post' });
        return;
      }
  
      
      mapPost = await db.all(
        "SELECT posts.id, username, subject, content, image, timestamp FROM posts INNER JOIN users ON users.id = posts.user_id WHERE marker_id = ?",
        [marker_id]
      );
      io.emit(SOCKET_EVENTS.MAP_UPDATE, mapPost);
  
      // Fetch and log the newly created post
      const newPost = await db.all("SELECT * FROM posts WHERE id = ?", [result[0].id]);
      console.log(newPost);
      console.log('Creating post with marker_id:', marker_id);
    } catch (err) {
      let error = err as Object;
      socket.emit(SOCKET_EVENTS.MAP_ERROR, { error: error.toString() });
    }
  });
  
  socket.on(SOCKET_EVENTS.FETCH_MAP_POSTS, async (data) => {
    let { marker_id } = data;
    let posts;
    console.log('Fetching posts for marker_id:', marker_id);
  
    try {
      posts = await db.all(
        "SELECT posts.*, users.name FROM posts INNER JOIN users ON users.id = posts.user_id WHERE marker_id = ?",
        [marker_id]
      );
      console.log('Fetched posts:', posts);
      // Convert the Buffer image data back to a base64 string
      posts.forEach(post => {
        if (post.image) {
          post.image = `data:image/jpeg;base64,${post.image.toString('base64')}`;
        }
      });
  
      socket.emit(SOCKET_EVENTS.MAP_POSTS_FETCHED, posts);
    } catch (err) {
      let error = err as Object;
      console.log(`Error fetching posts: ${error.toString()}`); 
      socket.emit(SOCKET_EVENTS.MAP_ERROR, { error: error.toString() });
    }
  });
  socket.on('likePost', async (data) => {
    const { postId, userId } = data;
  
    // Check if a like from the current user already exists for the post
    const userLike = await db.get(
      "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );
    if (userLike) {
      // Remove the like
      await db.run(
        "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
        [postId, userId]
      );
    } else {
      // Add a new like
      await db.run(
        "INSERT INTO post_likes(post_id, user_id) VALUES (?, ?)",
        [postId, userId]
      );
    }
  
    // Get the new like count
    const likes = await db.get(
      "SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?",
      [postId]
    );
  
    // Update the like count in the posts table
    await db.run(
      "UPDATE posts SET likes = ? WHERE id = ?",
      [likes.count, postId]
    );
  
    // Emit a 'postLiked' event to the client with the postId and the new like count
    socket.emit('postLiked', { postId, likes: likes.count });
  });

  socket.on('fetchUserLikes', async (data) => {
    const { userId } = data;
  
    // Get the ids of the posts the user has liked
    const userLikes = await db.all(
      "SELECT post_id FROM post_likes WHERE user_id = ?",
      [userId]
    );
  
    // Emit a 'userLikesFetched' event to the client with the ids of the posts the user has liked
    socket.emit('userLikesFetched', { userLikes: userLikes.map((like) => like.post_id) });
  });


  /* Cute Cat Post Socket Events */
  socket.on(SOCKET_EVENTS.CUTE_CAT_POST, async (data) => {
    let { buffer, caption } = data;
    let cuteCatFeed: utils.CuteCatPost[] = [];
    let imageRef: number;
    let result;
    let base64image = "";
    try {
      if (!buffer) {
        throw new Error("Must upload an image to post.");
      }
      try {
        // https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string/42334410#42334410
        // base64image = btoa(
        //   new Uint8Array(buffer).reduce(function (data, byte) {
        //     return data + String.fromCharCode(byte);
        //   }, "")
        // );
        base64image = Buffer.from(
          new Uint8Array(buffer).reduce(function (data, byte) {
            return data + String.fromCharCode(byte);
          }, ""),
          "binary"
        ).toString("base64");
        result = await db.all(
          "INSERT INTO cute_cat_posts(user_id, image, caption, timestamp) VALUES(?, ?, ?, datetime('now')) RETURNING id",
          [userId, base64image, caption]
        );
        imageRef = result[0].id;
        cuteCatFeed = await db.all(
          "SELECT cute_cat_posts.id, username, cute_cat_posts.image, likes, caption, timestamp FROM cute_cat_posts INNER JOIN users ON users.id = cute_cat_posts.user_id"
        );
        io.emit(SOCKET_EVENTS.CUTE_CAT_UPDATE, cuteCatFeed);
      } catch (err) {
        let error = err as Object;
        socket.emit(SOCKET_EVENTS.CUTE_CAT_ERROR, { error: error.toString() });
      }
    } catch (err) {
      let error = err as Object;
      io.to(socket.id).emit(SOCKET_EVENTS.CUTE_CAT_ERROR, {
        error: error.toString(),
      });
    }
  });

  socket.on(SOCKET_EVENTS.CUTE_CAT_LIKE, async (data) => {
    let { postId, increment } = data;
    let cuteCatFeed: utils.CuteCatPost[] = [];
    let cuteCatLikes: utils.CuteCatLike[] = [];
    let result;
    let likes: number;
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
      await db.all(
        "INSERT INTO cute_cat_likes(post_id, user_id) VALUES(?, ?)",
        [postId, userId]
      );
      cuteCatLikes = await db.all(
        "SELECT post_id FROM cute_cat_likes WHERE user_id=?",
        [userId]
      );
      cuteCatFeed = await db.all(
        "SELECT cute_cat_posts.id, username, cute_cat_posts.image, likes, caption, timestamp FROM cute_cat_posts INNER JOIN users ON users.id = cute_cat_posts.user_id"
      );
      io.to(socket.id).emit(SOCKET_EVENTS.CUTE_CAT_UPDATE_LIKES, cuteCatLikes);
      io.emit(SOCKET_EVENTS.CUTE_CAT_UPDATE, cuteCatFeed);
    } catch (err) {
      let error = err as Object;
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