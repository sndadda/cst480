CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
);

CREATE TABLE tokens (
    token TEXT,
    username TEXT
);

CREATE TABLE user_posts (
    post_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    content TEXT,
    image BLOB,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    comment_id INTEGER PRIMARY KEY,
    post_id INTEGER,
    user_id INTEGER,
    parent_comment_id INTEGER,
    content TEXT,
    time DATETIME,
    FOREIGN KEY (post_id) REFERENCES user_posts(post_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id)
);


INSERT INTO user_posts(user_id, content, image)
VALUES (1, 'This is the first post content.', NULL),
       (2, 'Second post here!', NULL),
       (1, 'Another post by user 1.', NULL);


INSERT INTO comments(post_id, user_id, parent_comment_id, content, time)
VALUES (1, 3, NULL, 'This is the first comment on the first post.', DATETIME('now')),
       (2, 1, NULL, 'Commenting on the second post.', DATETIME('now')),
       (1, 2, 1, 'Reply to the first comment.', DATETIME('now'));