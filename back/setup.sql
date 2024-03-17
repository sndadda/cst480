CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    username TEXT,
    password TEXT,
    image BLOB
);

CREATE TABLE tokens (
    token TEXT,
    user_id INTEGER,
    username TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    post_id INTEGER,
    parent_comment_id INTEGER,
    user_id INTEGER,
    content TEXT,
    timestamp TIMESTAMP,
    likes INT DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE markers (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cute_cat_posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    image BLOB,
    likes INT DEFAULT 0,
    caption TEXT,
    timestamp TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    marker_id INTEGER,
    subject VARCHAR(255),
    content TEXT,
    timestamp TIMESTAMP,
    likes INT DEFAULT 0,
    image BLOB,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (marker_id) REFERENCES markers(id)
);

CREATE TABLE post_likes (
    id INTEGER PRIMARY KEY,
    post_id INTEGER,
    user_id INTEGER
);

CREATE TABLE cute_cat_likes (
    id INTEGER PRIMARY KEY,
    post_id INTEGER,
    user_id INTEGER
);

CREATE TABLE cute_cat_comments (
    id INTEGER PRIMARY KEY,
    post_id INTEGER,
    user_id INTEGER,
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

