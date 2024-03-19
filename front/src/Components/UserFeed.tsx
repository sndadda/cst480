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
import CommentIcon from '@mui/icons-material/Comment';

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
        Select, 
        MenuItem
    } from '@mui/material'

    


const UserFeed = () => {

    const defaultMarkerId = 1;

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
        image: File | string | null; 
        userLikes: any[] | null;
    }
    const initialFeedPost: FeedPost = {
        id: null,
        username: null,
        subject: null,
        content: null,
        timestamp: null,
        likes: null,
        image: null,
        userLikes: null
    };
    

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
    
    interface PostData {
        marker_id: number | null;
        subject: string | null;
        content: string | null;
        image: any; 
        
    }
    const [data, setData] = useState<PostData>({
        //user_id: '',
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
    const [updateLikeIcon, setUpdateLikeIcon] = useState<number>(0);
    const [forceRerender, setForceRerender] = useState(false);
    const [isLikedModalforPost, setIsLikedModalforPost] = useState<boolean>(false);


    const [postIdForModal, setpostIdForModal] = useState<number | null >(null);
    const [showCommentField, setShowCommentField] = useState<boolean>(false);
    const [replyTo, setReplyTo] = useState<{username: string; user_id: number, comment_id: number}>({username: "", user_id: -1, comment_id: -1});
    
   

    

    useEffect(() => {
        socket.connect();
        console.log("connected");

        //Get the posts to display upon load the feed page.
        socket.emit(SOCKET_EVENTS.UPDATE_FEED);
        socket.emit(SOCKET_EVENTS.DISPLAY_FEED_POST_COMMENTS);

        socket.on(SOCKET_EVENTS.UPDATE_FEED, (data : FeedContentItem)=> {
            //console.log("data", data);
            setFeedContent(data);
            // console.log(typeof postIdForModal);
            // if (typeof postIdForModal === 'number') {
            //     if (selectedPost && feedContent) {
            //         let updatedPost = feedContent?.message.find(post => post.id === postIdForModal);
            //         console.log(updatedPost);
            //         setSelectedPost({...updatedPost, userLikes: feedContent.userLikes})
            //         setDisplaySpecificPost(true);
            //         console.log('hi there');
            //     }
                
                
            // }
            
            // if (typeof selectedPost?.id === 'number') {
            //     // console.log('whyyyy');

            //     if (selectedPost && feedContent) {
            //         let updatedPost = feedContent?.message.find(post => post.id === selectedPost.id);
            //         //console.log(updatedPost);
            //         setSelectedPost({...updatedPost, userLikes: feedContent.userLikes})
            //         //setDisplaySpecificPost(true);
            //         console.log('hi there');
            //         console.log("inside the if-condition",selectedPost);
            //     }
                
                
            // }
            console.log("feedcontent", feedContent);
            if (selectedPost && data) {
                // console.log('whyyyy');
                // console.log("what is the selecetedPost id I have right now: ", selectedPost.id);
                let updatedPost = data?.message.find(post => post.id === selectedPost.id);
                //console.log(updatedPost);
                //setSelectedPost({...updatedPost, userLikes: feedContent.userLikes})
                setSelectedPost({...updatedPost, userLikes: data.userLikes})
                //setDisplaySpecificPost(true);
                // console.log('hi there');
                // console.log("inside the if-condition",selectedPost);
                
                
            }

            setLikedPosts(data.userLikes);
            //console.log(data.userLikes);

            
            setUpdateLikeIcon(1);

            // console.log(feedContent?.userLikes);
        });

        //update the comments for the current selected post.
        socket.on(SOCKET_EVENTS.UPDATE_POST, data => {
            //console.log("update_post", data);
            console.log("update_comments", data);
            setPostComments(data.message);
            
        });

        return () => {
            socket.off(SOCKET_EVENTS.UPDATE_FEED);
            socket.off(SOCKET_EVENTS.UPDATE_POST);
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

        //console.log(`name: ${name} and value: ${value}`)
        setData(prevData => ({
            ...prevData,
            [name]: value
        }));
    }; 
    function arrayBufferToBase64(buffer:any) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
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
                        //user_id: '',
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
                                    //user_id: '',
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


                        <input type="file" onChange={(e) => {
                            setData({ ...data, image: e.target.files && e.target.files.length > 0 ? e.target.files[0] : null })
                        }} />
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            disabled={!data.content?.trim()}
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
                        // onClick={() => {
                        //     setSelectedPost({...post,userLikes: feedContent.userLikes});
                        //     setDisplaySpecificPost(true);
                        // }}
                    >
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                        <div>
                           
                        </div>
                        {/* Expand button */}
                        <Button
                            variant="outlined"
                            onClick={() => {
                                // Handle expand button click
                                //setSelectedPost({...post, userLikes: feedContent.userLikes, image: arrayBufferToBase64(post.image)});
                                socket.emit(SOCKET_EVENTS.DISPLAY_FEED_POST_COMMENTS, selectedPost?.id);
                                setSelectedPost({...post, userLikes: feedContent.userLikes});
                                setDisplaySpecificPost(true);
                                setIsLikedModalforPost(selectedPost?.userLikes?.some(like => like.post_id === selectedPost?.id) ? true : false);
                                //setpostIdForModal(post.id);
                                
                            }}
                        >
                            Expand
                        </Button>
                    </div>
                        {/**new changes */}
                    <CardContent>
                        {/* <Button
                            variant="outlined"
                            style={{ position: 'relative', top: 10, right: 10 }}
                            onClick={() => {
                                // Handle expand button click
                                setSelectedPost({...post, userLikes: feedContent.userLikes});
                                setDisplaySpecificPost(true);
                            }}
                            >
                                Expand
                        </Button> */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                            <Avatar>{/* Avatar component goes here */}</Avatar>
                            <Typography variant="subtitle1">{post.username}</Typography>
                        </div>
                        <Typography variant="subtitle1">Subject: {post.subject}</Typography>
                        <Divider />
                        <Typography variant="body1">Post: {post.content}</Typography>
                        <Divider />
                        
                        {post.image && (
                            <div>
                                <img

                                    src={post.image}
                                    //src={typeof post.image === 'string' ? `data:image/jpeg;base64,${post.image}` : `data:image/jpeg;base64,${arrayBufferToBase64(post.image)}`}
                                    style={{ width: '100px', height: '100px' }}
                                    alt="Post Image"
                                />


                                <p>{post.image ? `${typeof post.image}`: `${typeof post.image}`}</p>
                            </div>
                        )}
                        <Divider />
                        <Typography variant="subtitle1">Likes {post.likes}</Typography>
                        
                        
                        <div onClick={() => 
                            {
                                console.log(post.id);
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
                        setpostIdForModal(null);
                        setShowCommentField(false);
                        //setSelectedPost()
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
                        {/* <Box sx={{ position: 'relative', width: '50%', bgcolor: 'background.paper', p: 2, mx: 'auto', my: '10%', borderRadius: 2 }}> */}
                            
                            {/* Exit button */}

                            
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '50%',
                                    bgcolor: 'background.paper',
                                    p: 2,
                                    mx: 'auto',
                                    my: '10%',
                                    borderRadius: 2,
                                    overflowY: 'scroll', // Enable vertical scrolling
                                    maxHeight: '80vh', // Limit maximum height to 80% of viewport height
                                }}
                            >
                                {/* Your modal content */}
                                {/* Include all the content you have in the modal here */}
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
                                    setShowCommentField(false);
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
                            {selectedPost?.image && (
                                <div>
                                    <img
                                    
                                        //src={typeof post.image === 'string' ? `data:image/jpeg;base64,${post.image}` : `${post.image}`}
                                        // src={typeof selectedPost.image === 'string' ? 
                                        //     `data:image/jpeg;base64,${selectedPost.image}` : 
                                        //     `data:image/jpeg;base64,${arrayBufferToBase64(selectedPost.image)}`
                                        // }
                                        // src={selectedPost.image}
                                        src={typeof selectedPost.image === 'string' ? 
                                            selectedPost.image : 
                                            URL.createObjectURL(selectedPost.image)
                                        }
                                        style={{ width: '100px', height: '100px' }}
                                        alt="Post Image"
                                    />


                                    
                                </div>
                            )}

                            <Divider />
                            <Typography variant="subtitle1">Likes {selectedPost && selectedPost.likes}</Typography>
                            <div onClick={() => 
                                {
                                    console.log("selectedPost id", selectedPost?.id);
                                    socket.emit(SOCKET_EVENTS.LIKE_POST, selectedPost?.id);

                                    setIsLikedModalforPost(!isLikedModalforPost);
                                    
                                    // if (selectedPost && feedContent){

                                    //     setSelectedPost({...selectedPost, userLikes: feedContent.userLikes });
                                    //     // let updatedSelectedPost = feedContent?.message.find(post => post.post_id === selectedPost?.id);
                                    //     // setSelectedPost({...updatedSelectedPost, userLikes: feedContent.userLikes })

                                    //     {selectedPost?.userLikes?.some(like => like.post_id === selectedPost?.id) ? (
                                    //         <FavoriteIcon id={`post-${selectedPost?.id}-heart-icon`} style={{ color: 'red' }} />
                                    //     ) : (
                                    //         <FavoriteBorderIcon id={`post-${selectedPost?.id}-heart-icon`} />
                                    //     )}
                                    // }                                    
                                  
                                    // {selectedPost?.userLikes?.some(like => like.post_id === selectedPost?.id) ? (
                                    //     <FavoriteBorderIcon id={`post-${selectedPost?.id}-heart-icon`} />
                                        
                                    // ) : (
                                    //     <FavoriteIcon id={`post-${selectedPost?.id}-heart-icon`} style={{ color: 'red' }} />
                                    // )}
                                    
                                    if (selectedPost) {
                                        setpostIdForModal(selectedPost?.id);
                                    }
                                    //setDisplaySpecificPost(false);
                                    
                                    
                                    // socket.on(SOCKET_EVENTS.UPDATE_FEED, data => {
                                        
                                    //     setSelectedPost({...post, userLikes: feedContent.userLikes});
                                    //     setDisplaySpecificPost(true);
                                
                                    // });
                                    
                                
                                }}
                            >   
                                {selectedPost?.userLikes?.some(like => like.post_id === selectedPost?.id) ? (
                                    <FavoriteIcon id={`post-${selectedPost?.id}-heart-icon`} style={{ color: 'red' }} />
                                ) : (
                                    <FavoriteBorderIcon id={`post-${selectedPost?.id}-heart-icon`} />
                                )}

                                {/* {
                                    isLikedModalforPost ? 
                                    <FavoriteIcon id={`post-${selectedPost?.id}-heart-icon`} style={{ color: 'red' }} /> : 
                                    <FavoriteBorderIcon id={`post-${selectedPost?.id}-heart-icon`} />
                                } */}
                                
                            </div>
                           
                            {/*Comment box for post */}
                            
                            {showCommentField && 
                            <>
                                <p>Reply to @{replyTo.username}</p>
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
                                
                                <Button 
                                    variant="contained" 
                                    onClick={() => {
                                        setCommentData({
                                            ...commentData,
                                            post_id: selectedPost ? selectedPost.id : null,
                                            parent_comment_id: replyTo.comment_id,

                                        });
                                        console.log("commentData to be sent", commentData);
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
                            </>
                            }   

                            {/* Display comments */}
                            {/* {postComments && postComments.map((comment, index) => (
                                <div key={index}>
                                    <Typography variant="body1">User: {comment.user_id}</Typography>
                                    <Typography variant="body1">Content: {comment.content}</Typography>
                                    <Typography variant="body1">Timestamp: {comment.timestamp}</Typography>
                                    <Divider />
                                </div>
                                
                            ))} */}
                            
                            

                            {selectedPost && postComments
                                .filter(comment => comment.post_id === selectedPost.id) // Filter comments by post_id
                                .filter(comment => !comment.parent_comment_id) // Filter only parent comments
                                .map((parentComment, parentIndex) => (
                                    <div key={parentIndex}>
                                        {/* Display parent comment */}
                                        <Typography variant="body1">User: {parentComment.username}</Typography>
                                        <Typography variant="body1">Content: {parentComment.content}</Typography>
                                        <Typography variant="body1">Timestamp: {parentComment.timestamp}</Typography>
                                        <CommentIcon 
                                            onClick={() => {
                                                setShowCommentField(!showCommentField);
                                                setReplyTo({username: parentComment.username, user_id: parentComment.user_id, comment_id: parentComment.id});
                                            }}
                                        />
                                        <Divider />
                                        {/* Display child comments */}
                                        {postComments
                                            .filter(comment => comment.parent_comment_id === parentComment.id) // Filter child comments for this parent
                                            .map((childComment, childIndex) => (
                                                <div key={childIndex} style={{ marginLeft: 50 }}>
                                                    {/* Display child comment */}
                                                    <Typography variant="body1">User: {childComment.username}</Typography>
                                                    <Typography variant="body1">Content: {childComment.content}</Typography>
                                                    <Typography variant="body1">Timestamp: {childComment.timestamp}</Typography>
                                                    <CommentIcon 
                                                        onClick={() => {
                                                            setShowCommentField(!showCommentField);
                                                            setReplyTo({username: childComment.username, user_id: childComment.user_id, comment_id: childComment.id});
                                                        }}
                                                    />
                                                    <Divider />
                                                </div>
                                            ))
                                        }
                                    </div>
                                ))
                            }

                            
                        

                            
                            
                        </Box>
                        {/* </Box> */}
                        
                    </Fade>
                </Modal>
                    
            
        </div>
    );
}

export default UserFeed;