import { useState, useEffect } from 'react';
import { socket } from '../socket.tsx';
import SOCKET_EVENTS from "../socketEnums.js";
import Avatar from '@mui/material/Avatar';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import Divider from '@mui/material/Divider';
import './UserFeed.css';

// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {Card, 
        CardContent, 
        TextField, 
        Collapse, 
        List, 
        ListItem, 
        ListItemText, 
        InputLabel, 
        OutlinedInput, 
        FormControl,
    } from '@mui/material'

    


const UserFeed = () => {

    const defaultMarkerId = 1

    interface FeedContentItem {
        message: any[];
        userLikes: any[];
    }
    interface FeedPost {
        id: number | null;
        username: string | null;
        subject: string | null;
        content: string | null;
        timestamp: string | null;
        likes: number | null;
        image: Blob | null; 
        userLikes: any[] | null;
    }
    // const initialFeedPost: FeedPost = {
    //     id: null,
    //     username: null,
    //     subject: null,
    //     content: null,
    //     timestamp: null,
    //     likes: null,
    //     image: null,
    //     userLikes: null
    // };
    

    type Comment = {
        post_id: number | null;
        parent_comment_id: number | null; // Nullable since a comment might not have a parent
        content: string | null;
    };

    const initialCommentData: Comment = {
        post_id: null,
        parent_comment_id: null,
        content: null,
    };
    
    const [data, setData] = useState({
        user_id: '',
        marker_id: defaultMarkerId,
        subject: '',
        content: '',
        image: null,
    });
    const [commentData, setCommentData] = useState<Comment>(initialCommentData);
    const [showPostForm, setShowPostForm] = useState(false);

    const [feedContent, setFeedContent] = useState<FeedContentItem>();

    const [displaySpecificPost, setDisplaySpecificPost] = useState(false)
    const [selectedPost, setSelectedPost] = useState<FeedPost>();
    
    const [likedPosts, setLikedPosts] = useState<number[]>([]);

    const [postComments, setPostComments] = useState<any[]>([]);
   

    

    useEffect(() => {
        socket.connect();
        console.log("connected");

        //Get the posts to display upon load the feed page.
        socket.emit(SOCKET_EVENTS.UPDATE_FEED)

        socket.on(SOCKET_EVENTS.UPDATE_FEED, data => {
            console.log(data);
            setFeedContent(data);
            setLikedPosts(data.userLikes);
            console.log(data.userLikes);

            // console.log(feedContent?.userLikes);
        });

        socket.on(SOCKET_EVENTS.UPDATE_POST, data => {
            console.log("update_post", data);

            setPostComments(data.message);
        });

        return () => {
            socket.off(SOCKET_EVENTS.UPDATE_FEED);
            socket.disconnect();
            console.log("disconnected");
        };
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

        console.log(`name: ${name} and value: ${value}`)
        setData(prevData => ({
            ...prevData,
            [name]: value
        }));
    }; 

    // const handleCommentChange = (e: any) => {
    //     const { name, value } = e.target;
        
    //     setCommentData(prevData => ({
    //         ...prevData,
    //         [name]: value
    //     }));

        
    // };

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
                onClose={() => {
                    setShowPostForm(false);
                    setData({
                        user_id: '',
                        marker_id: defaultMarkerId ,
                        subject: '',
                        content: '',
                        image: null,
                    });
                }}
                closeAfterTransition
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={showPostForm} onEntered={() => {
                    setTimeout(() => {
                        const input = document.getElementById('filled-multiline-static');
                        if (input) input.focus();
                    }, 0);
                }}>
                    <Box sx={{ position: 'relative', width: '50%', bgcolor: 'background.paper', p: 2, mx: 'auto', my: '10%', borderRadius: 2 }}>
                        <Button 
                            sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                right: 0, 
                                color: 'black', 
                                fontSize: 'large' 
                            }} 
                            onClick={() => {
                                setShowPostForm(false);
                                setData({
                                    user_id: '',
                                    marker_id: defaultMarkerId,
                                    subject: '',
                                    content: '',
                                    image: null,
                                });
                            }}
                        >X</Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Create post</Typography>
                        </Box>
                        <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2 }}></Avatar>
                            <Typography variant="h6">Username</Typography>
                        </Box>
                        {/* <FormControl variant='outlined' fullWidth sx={{ mb: 2 }}>
                            <InputLabel htmlFor="subject" sx={{ position: 'relative' }}>Subject</InputLabel>
                            <OutlinedInput
                                id="subject"
                                value={data.subject}
                                onChange={handleChange}
                                placeholder="Subject"
                                sx={{
                                  height: 30, // Adjust the height as needed
                                  borderRadius: 20, // Adjust the border radius as needed
                                  '.MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'grey',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'black',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'blue',
                                  },
                                }}
                            />
                        </FormControl> */}
                        <TextField
                            id="subject"
                            label="subject"
                            name="subject"
                            variant="outlined"
                            fullWidth
                            value={data.subject}
                            // onChange={(e) => setData({ ...data, subject: e.target.value })}
                            onChange={handleChange}
                        />
                        
                        <TextField
                            autoFocus
                            id="filled-multiline-static"
                            label={data.content ? '' : 'Write something...'}
                            multiline
                            rows={4}
                            variant="filled"
                            fullWidth
                            onChange={handleChange}
                            name="content"
                            value={data.content}
                            InputLabelProps={{
                                style: {
                                    
                                    fontSize: '22px', 
                                    color: 'grey'
                                },
                                shrink: data.content ? true : false
                            }}
                            InputProps={{
                                disableUnderline: true,
                                style: {
                                    fontSize: '22px',
                                },
                            }}
                            sx={{ 
                                '.MuiFilledInput-root': { 
                                    backgroundColor: 'white',
                                    borderRadius: 0,
                                    '&:hover': {
                                        backgroundColor: 'white',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'white',
                                    },
                                },
                                '.MuiFilledInput-input': {
                                    backgroundColor: 'white',
                                    '&:hover': {
                                        backgroundColor: 'white',
                                    },
                                    '&.Mui-focused': {
                                        backgroundColor: 'white',
                                    },
                                },
                                '.MuiFilledInput-underline:before': { borderBottom: 'none' },
                                '.MuiFilledInput-underline:after': { borderBottom: 'none' }
                            }}
                        />

                        
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            disabled={!data.content.trim()}
                            sx={{ 
                                display: 'block', 
                                width: '100%', 
                                mx: 'auto',
                                color: data.content ? 'white' : '#BCC0C4',
                              
                                backgroundColor: data.content ? '#0861F2' : '#E5E6EB',
                                '&:hover': {
                                    backgroundColor: data.content ? '#0861F2' : '#E5E6EB',
                                },
                            }}
                        >
                            Post
                        </Button>
                    </Box>
                </Fade>
            </Modal>



            {feedContent && feedContent.message.map((post, index) => (
                    <Card 
                        key={index} 
                        onClick={() => {
                            setSelectedPost({...post,userLikes: feedContent.userLikes});
                            setDisplaySpecificPost(true);
                        }}
                    >

                        {/**new changes */}
                    <CardContent>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                        <Avatar>{/* Avatar component goes here */}</Avatar>
                        <Typography variant="subtitle1">{post.username}</Typography>
                        </div>
                        <Typography variant="subtitle1">Subject: {post.subject}</Typography>
                        <Divider />
                        <Typography variant="body1">Post: {post.content}</Typography>
                        <Divider />
                        <Typography variant="subtitle1">Likes {post.likes}</Typography>
                        
                        
                        <div onClick={() => 
                            {
                                //console.log(post.id);
                                socket.emit(SOCKET_EVENTS.LIKE_POST, post.id);
                                
                            
                            }}
                        >
                            {feedContent.userLikes?.some(like => like.post_id === post.id) ? (
                                <FavoriteIcon id={`post-${post.id}-heart-icon`} style={{ color: 'red' }} />
                            ) : (
                                <FavoriteBorderIcon id={`post-${post.id}-heart-icon`} />
                            )}
                            
                        </div>


                        <Divider />
                        <Typography variant="subtitle1">Posted: {post.timestamp}</Typography>
                        
                        
                    </CardContent>
                    </Card>
                ))}
                {/* Modal 2 - Modal for individual posts*/}
                <Modal
                    open={displaySpecificPost}
                    onClose={() => {
                        //setSelectedPost();
                        setCommentData(initialCommentData);
                        setDisplaySpecificPost(false);
                    }}
                    closeAfterTransition
                    BackdropProps={{
                        timeout: 500,
                    }}
                >
                    <Fade in={displaySpecificPost} onEntered={() => {
                        setTimeout(() => {
                            const input = document.getElementById('modal-post-comment');
                            if (input) input.focus();
                        }, 0);
                    }}>
                        <Box sx={{ position: 'relative', width: '50%', bgcolor: 'background.paper', p: 2, mx: 'auto', my: '10%', borderRadius: 2 }}>
                            <Button 
                                sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    right: 0, 
                                    color: 'black', 
                                    fontSize: 'large' 
                                }} 
                                onClick={() => {
                                    setDisplaySpecificPost(false);
                                }}
                            > X
                            </Button>
                            {/* <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Create post</Typography>
                            </Box>
                            <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} /> */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ mr: 2 }}></Avatar>
                                <Typography variant="h6">{selectedPost && selectedPost.username}</Typography>
                            </Box>
                            <Typography variant="h5" gutterBottom>
                               Subject: {selectedPost && selectedPost.subject} {/* Display post subject */}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {selectedPost && selectedPost.content} {/* Display post content */}
                            </Typography>
                            <Divider />
                            <Typography variant="subtitle1">Likes {selectedPost && selectedPost.likes}</Typography>
                            <div onClick={() => 
                                {
                                    //console.log(post.id);
                                    socket.emit(SOCKET_EVENTS.LIKE_POST, selectedPost?.id);
                                    
                                
                                }}
                            >   
                                {selectedPost?.userLikes?.some(like => like.post_id === selectedPost?.id) ? (
                                    <FavoriteIcon id={`post-${selectedPost?.id}-heart-icon`} style={{ color: 'red' }} />
                                ) : (
                                    <FavoriteBorderIcon id={`post-${selectedPost?.id}-heart-icon`} />
                                )}
                                
                            </div>
                           
                            {/*Comment box for post */}
                            <TextField
                                id="modal-post-comment"
                                label="Write a comment"
                                name="modal-post-comment"
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={4}
                                margin="normal"
                                value={commentData.content || ''}
                                onChange={(e) => {
                                    setCommentData({
                                        ...commentData,
                                        content: e.target.value
                                    });
                                }}
                            />
                            

                            {/* Display comments */}
                            {postComments && postComments.map((comment, index) => (
                                <div key={index}>
                                    <Typography variant="body1">User: {comment.user_id}</Typography>
                                    <Typography variant="body1">Content: {comment.content}</Typography>
                                    <Typography variant="body1">Timestamp: {comment.timestamp}</Typography>
                                </div>
                            ))}
                            <Button 
                                variant="contained" 
                                onClick={() => {
                                    setCommentData({
                                        ...commentData,
                                        post_id: selectedPost ? selectedPost.id : null,
                                    });
                                    socket.emit(SOCKET_EVENTS.CREATE_COMMENT, commentData);
                                }}
                                disabled={!commentData.content || !commentData.content.trim()}
                                sx={{ 
                                display: 'block', 
                                width: '100%', 
                                mx: 'auto',
                                color: commentData.content ? 'white' : '#BCC0C4',
                                backgroundColor: commentData.content ? '#0861' : '#E5E6EB',
                                '&:hover': {
                                    backgroundColor: commentData.content ? '#0861F2' : '#E5E6EB',
                                },
                                }}
                            >
                                Post
                            </Button>
                            
                            
                        </Box>
                    </Fade>
                </Modal>
                    
            
        </div>
    );
}

export default UserFeed;