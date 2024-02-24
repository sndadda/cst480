import { useState, useEffect } from 'react';
import { socket } from '../socket.tsx';
import SOCKET_EVENTS from "../socketEnums.js";

const UserFeed = () => {

    const [data, setData] = useState({
        user_id: '',
        marker_id: '',
        subject: '',
        content: '',
        image: null,
    });
    const [commentData, setCommentData] = useState({
        post_id: '',
        parent_comment_id: '',
        user_id: '',
        content: ''
    });

    useEffect(() => {
        socket.on("send-message", data => {
            console.log(data);
        });

        socket.on(SOCKET_EVENTS.UPDATE_FEED, data => {
            console.log(data);
        });

        socket.on(SOCKET_EVENTS.UPDATE_POST, data => {
            console.log(data);
        });
      }, [socket]);


    const handleSubmit = (e: any) => {
        e.preventDefault();
        socket.emit(SOCKET_EVENTS.CREATE_POST, data);
    };

    const handleCommentSubmit = (e: any) => {
        e.preventDefault();
        socket.emit(SOCKET_EVENTS.CREATE_COMMENT, commentData);
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setData(prevData => ({
            ...prevData,
            [name]: value
        }));
    }; 

    const handleCommentChange = (e: any) => {
        const { name, value } = e.target;
        setCommentData(prevData => ({
            ...prevData,
            [name]: value
        }));

        
    };

    return (
        <>
            <div className="post-form" style={{ border: "2px solid black", padding: "10px", display: "flex", flexDirection: "column"}}>
                <h3>Create a New Post</h3>

                <label htmlFor="user_id">User ID:</label>
                <input type="text" id="user_id" name="user_id" value={data.user_id} onChange={handleChange} />

                <label htmlFor="marker_id">Marker ID:</label>
                <input type="text" id="marker_id" name="marker_id" value={data.marker_id} onChange={handleChange} />

                <label htmlFor="subject">Subject:</label>
                <input type="text" id="subject" name="subject" value={data.subject} onChange={handleChange} />

                <label htmlFor="content">Content:</label>
                <textarea id="content" name="content" value={data.content} onChange={handleChange}></textarea>

                <button onClick={handleSubmit}>Submit</button>
            </div>

            <div className="comment-form" style={{ border: "2px solid black", padding: "10px", display: "flex", flexDirection: "column"}}>
                <h3>Create a New Comment</h3>

                <label htmlFor="post_id">Post ID:</label>
                <input type="text" id="post_id" name="post_id" value={commentData.post_id} onChange={handleCommentChange} />

                <label htmlFor="parent_comment_id">Parent Comment ID:</label>
                <input type="text" id="parent_comment_id" name="parent_comment_id" value={commentData.parent_comment_id} onChange={handleCommentChange} />

                <label htmlFor="user_id">User ID:</label>
                <input type="text" id="user_id" name="user_id" value={commentData.user_id} onChange={handleCommentChange} />

                <label htmlFor="content">Content:</label>
                <textarea id="content" name="content" value={commentData.content} onChange={handleCommentChange}></textarea>

                <button onClick={handleCommentSubmit}>Submit</button>
            </div>

        </>
    );
}

export default UserFeed;