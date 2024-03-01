import { useState, useEffect } from 'react';
import { socket } from '../socket.tsx';
import SOCKET_EVENTS from "../socketEnums.js";
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import './UserFeed.css';

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
    const [showPostForm, setShowPostForm] = useState(false);

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
        <div className="user-feed-container">
            <img src="cat_background.png" style={{ width: '100%', height: '100%'}}></img>

            <div style={{width: '55%'}}>
                <h1 className="feed-title">Activity Feed</h1>
            </div>
            <div className="new-post-input" onClick={() => setShowPostForm(true)}>
                <Avatar></Avatar>
                <input type="text" placeholder="Share what's on your mind..." readOnly />
            </div>

            <Modal
                open={showPostForm}
                onClose={() => setShowPostForm(false)}
            >
                <Box sx={{ width: '50%', bgcolor: 'background.paper', p: 2, mx: 'auto', my: '10%', borderRadius: 2 }}>
                    <Avatar></Avatar>
                    <h2>Username</h2>
                    <TextField
                        id="outlined-multiline-static"
                        label="Share what's on your mind..."
                        multiline
                        rows={4}
                        variant="outlined"
                        fullWidth
                        onChange={handleChange}
                        name="content"
                        value={data.content}
                    />
                    <Button variant="contained" onClick={handleSubmit}>Post</Button>
                </Box>
            </Modal>

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

        </div>
    );
}

export default UserFeed;