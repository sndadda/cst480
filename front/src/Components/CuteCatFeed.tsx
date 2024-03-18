import { useState, useEffect } from "react";
import { socket } from "../socket.tsx";
import SOCKET_EVENTS from "../socketEnums.js";
import {
    CuteCatComment,
    CuteCatCommentSubmit,
    CuteCatLike,
    CuteCatPost,
    getAxiosErrorMessages,
} from "./utils.ts";
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";
import "./CuteCatFeed.css";

function CuteCatFeed() {
    let [messages, setMessages] = useState<string[]>([]);
    let [newPost, setNewPost] = useState({
        buffer: null,
        caption: "",
    });
    let [posts, setPosts] = useState<CuteCatPost[]>([]);
    let [likedPosts, setLikedPosts] = useState<CuteCatLike[]>([]);
    let [newComment, setNewComment] = useState<CuteCatCommentSubmit>({
        postId: 0,
        comment: "",
    });
    let [comments, setComments] = useState<CuteCatComment[]>([]);

    useEffect(() => {
        (async () => {
            try {
                let {
                    data: { cuteCatPosts },
                } = await axios.get<{ cuteCatPosts: CuteCatPost[] }>(
                    "/api/cuteCatPosts"
                );
                setPosts(cuteCatPosts);
                let {
                    data: { cuteCatLikes },
                } = await axios.get<{ cuteCatLikes: CuteCatLike[] }>(
                    "/api/cuteCatLikes"
                );
                setLikedPosts(cuteCatLikes);
                let {
                    data: { cuteCatComments },
                } = await axios.get<{ cuteCatComments: CuteCatComment[] }>(
                    "/api/cuteCatComments"
                );
                setComments(cuteCatComments);
                setMessages([]);
            } catch (error) {
                setMessages(getAxiosErrorMessages(error));
            }
        })();
    }, []);

    useEffect(() => {
        socket.connect();
        socket.on(SOCKET_EVENTS.CUTE_CAT_UPDATE, (data) => {
            setPosts(data);
        });
        socket.on(SOCKET_EVENTS.CUTE_CAT_UPDATE_LIKES, (data) => {
            setLikedPosts(data);
        });
        socket.on(SOCKET_EVENTS.CUTE_CAT_UPDATE_COMMENTS, (data) => {
            setComments(data);
        });
        socket.on(SOCKET_EVENTS.CUTE_CAT_ERROR, (data) => {
            if (!data) {
                setMessages([]);
            } else {
                setMessages([data.error]);
            }
        });
        return () => {
            socket.off(SOCKET_EVENTS.CUTE_CAT_UPDATE);
            socket.off(SOCKET_EVENTS.CUTE_CAT_UPDATE_LIKES);
            socket.off(SOCKET_EVENTS.CUTE_CAT_UPDATE_COMMENTS);
            socket.off(SOCKET_EVENTS.CUTE_CAT_ERROR);
            socket.disconnect();
        };
    }, [socket]);

    let handlePost = () => {
        setMessages([]);
        socket.emit(SOCKET_EVENTS.CUTE_CAT_POST, newPost);
        setNewPost({
            buffer: null,
            caption: "",
        });
    };

    function handleLike(postId: number) {
        setMessages([]);
        socket.emit(SOCKET_EVENTS.CUTE_CAT_LIKE, {
            postId: postId,
            increment: 1,
        });
    }

    function handleComment() {
        if (!newComment.comment) {
            return;
        } else {
            setMessages([]);
            socket.emit(SOCKET_EVENTS.CUTE_CAT_COMMENT, newComment);
            setNewComment({
                postId: 0,
                comment: "",
            });
        }
    }

    // https://stackoverflow.com/questions/4587061/how-to-determine-if-object-is-in-array
    function containsObject(obj: CuteCatLike, list: CuteCatLike[]) {
        let i: number;
        for (i = 0; i < list.length; i++) {
            if (list[i].post_id === obj.post_id) {
                return true;
            }
        }
        return false;
    }

    let feed = (
        <div className="cute-cat-feed">
            <h1>Cute Cat Feed:</h1>
            <div className="cute-cat-posts">
                {posts.map(
                    ({ id, username, image, likes, caption, timestamp }) => (
                        <div key={id} className="cute-cat-single-post">
                            <div className="user-profile">
                                <FaUserCircle className="user-profile-pic" />
                                <p className="username">{username}</p>
                            </div>
                            <div className="cute-cat-image">
                                <img src={`data:image/jpeg;base64,${image}`} />
                            </div>
                            <div className="interactions">
                                {containsObject({ post_id: id }, likedPosts) ? (
                                    <FaHeart className="liked" />
                                ) : (
                                    <FaHeart
                                        className="like-button"
                                        onClick={() => {
                                            handleLike(id);
                                        }}
                                    />
                                )}
                            </div>
                            <div className="likes">{likes} likes</div>
                            <div className="caption-box">
                                <p className="username">{username}</p>
                                <p className="caption">{caption}</p>
                            </div>
                            <div className="comment-section">
                                <div className="comments">
                                    {comments
                                        .filter(({ post_id }) => {
                                            return post_id === id;
                                        })
                                        .map(({ id, username, comment }) => (
                                            <div
                                                key={id}
                                                className="single-comment"
                                            >
                                                <p className="username">
                                                    {username}
                                                </p>
                                                <p className="text">
                                                    {comment}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                                <div className="add-comment">
                                    <div className="comment-box">
                                        <textarea
                                            value={
                                                newComment.postId === id
                                                    ? newComment.comment
                                                    : ""
                                            }
                                            placeholder="Add a comment..."
                                            id="comment"
                                            onClick={() => {
                                                setNewComment({
                                                    ...newComment,
                                                    postId: id,
                                                });
                                            }}
                                            onChange={(e) => {
                                                setNewComment({
                                                    ...newComment,
                                                    comment: e.target.value,
                                                });
                                            }}
                                            rows={2}
                                        ></textarea>
                                    </div>
                                    {newComment.comment &&
                                    newComment.postId === id ? (
                                        <button
                                            onClick={() => {
                                                handleComment();
                                            }}
                                        >
                                            Post comment
                                        </button>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                            </div>
                            <div className="time-stamp">
                                <div className="time">{timestamp}</div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );

    let postForm = (
        <div className="cute-cat-post-form">
            <h1>Post Your Cat:</h1>
            <p>Upload an image:</p>
            <input
                type="file"
                id="buffer"
                onChange={(e) => {
                    setNewPost({
                        ...newPost,
                        [e.target.id]: e.target.files
                            ? e.target.files[0]
                            : null,
                    });
                }}
            ></input>
            <div className="caption-box">
                <textarea
                    value={newPost.caption}
                    placeholder="Caption"
                    id="caption"
                    onChange={(e) => {
                        setNewPost({
                            ...newPost,
                            [e.target.id]: e.target.value,
                        });
                    }}
                    rows={2}
                ></textarea>
            </div>
            <button onClick={handlePost}>Post</button>
            <div className="error-message">
                {messages.map((message, i) => (
                    <div key={i}>{message}</div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div id="cute-cat-page-container">
                {feed}
                {postForm}
            </div>
        </>
    );
}

export default CuteCatFeed;
