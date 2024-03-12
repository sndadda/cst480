import { useState, useEffect } from "react";
import { socket } from "../socket.tsx";
import SOCKET_EVENTS from "../socketEnums.js";
import { CuteCatPost, getAxiosErrorMessages } from "./utils.ts";
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

    // TODO figure out why page only works if manually refreshed at first
    useEffect(() => {
        (async () => {
            try {
                let {
                    data: { cuteCatPosts },
                } = await axios.get<{ cuteCatPosts: CuteCatPost[] }>(
                    "/api/cuteCatPosts"
                );
                setPosts(cuteCatPosts);
                setMessages([]);
            } catch (error) {
                setMessages(getAxiosErrorMessages(error));
            }
        })();
    }, []);

    useEffect(() => {
        socket.on(SOCKET_EVENTS.CUTE_CAT_UPDATE, (data) => {
            setPosts(data);
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
            socket.off(SOCKET_EVENTS.CUTE_CAT_ERROR);
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
                                <FaHeart
                                    className="like-button"
                                    onClick={() => {
                                        handleLike(id);
                                        // TODO set button to disabled
                                    }}
                                />
                            </div>
                            <div className="likes">{likes} likes</div>
                            <div className="caption-box">
                                <p className="username">{username}</p>
                                <p className="caption">{caption}</p>
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
