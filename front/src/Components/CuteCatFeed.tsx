import { useState, useEffect } from "react";
import { socket } from "../socket.tsx";
import SOCKET_EVENTS from "../socketEnums.js";
import { CuteCatPost, getAxiosErrorMessages } from "./utils.ts";
import axios from "axios";

function CuteCatFeed() {
    let [messages, setMessages] = useState<string[]>([]);
    let [newPost, setNewPost] = useState({
        image: "",
        caption: "",
    });
    let [posts, setPosts] = useState<CuteCatPost[]>([]); // TODO create type for list of posts

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
        // TODO get all the posts
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
    }, [socket]);

    let handlePost = () => {
        setMessages([]);
        socket.emit(SOCKET_EVENTS.CUTE_CAT_POST, newPost);
    };

    let feed = (
        <div className="cute-cat-feed">
            <h1>Cute Cat Feed:</h1>
            {posts.map(({ id, username, likes, caption, timestamp }) => (
                <div key={id}>
                    {id}: Posted by: '{username}', Likes: '{likes}', Caption: '
                    {caption}', Date/Time: '{timestamp}'
                </div>
            ))}
        </div>
    );

    let postForm = (
        <div className="cute-cat-post-form">
            <h1>Post Your Cat:</h1>
            <label>Upload an image: </label>
            <input
                type="file"
                value={newPost.image}
                id="image"
                onChange={(e) => {
                    setNewPost({ ...newPost, [e.target.id]: e.target.value });
                }}
            ></input>
            <input
                type="textarea"
                value={newPost.caption}
                placeholder="Caption"
                id="caption"
                onChange={(e) => {
                    setNewPost({ ...newPost, [e.target.id]: e.target.value });
                }}
            ></input>
            <button onClick={handlePost}>Post</button>
        </div>
    );

    return (
        <>
            <div id="cute-cat-page">
                {feed}
                {postForm}
                <div className="error-message">
                    {messages.map((message, i) => (
                        <div key={i}>{message}</div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default CuteCatFeed;
