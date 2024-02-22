CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
);

CREATE TABLE tokens (
    token TEXT,
    username TEXT
);