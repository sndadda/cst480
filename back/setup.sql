CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
);

CREATE TABLE tokens (
    token TEXT,
    username TEXT
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    marker_id VARCHAR(255),
    subject VARCHAR(255),
    content TEXT,
    timestamp TIMESTAMP,
    likes INT DEFAULT 0,
    image BLOB,
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
    name VARCHAR(255),
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