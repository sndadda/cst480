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

import Chip from '@mui/material/Chip';

// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {Card, 
        CardContent, 
        TextField, 
        //Collapse, 
        //List, 
        //ListItem, 
        //ListItemText, 
        InputLabel, 
        //OutlinedInput, 
        FormControl,
        Select, 
        MenuItem,
        Alert 
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
        category: string | null
        likes: number | null;
        image: File | string | null; 
        userLikes: any[] | null;
    }
    // const initialFeedPost: FeedPost = {
    //     id: null,
    //     username: null,
    //     subject: null,
    //     content: null,
    //     timestamp: null,
    //     category: null,
    //     likes: null,
    //     image: null,
    //     userLikes: null
    // };
    

    type Comment = {
        post_id: number | null;
        parent_comment_id: number | null; 
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
        category: string;
        
    }
    const [data, setData] = useState<PostData>({
        //user_id: '',
        marker_id: defaultMarkerId,
        subject: '',
        content: '',
        image: null,
        category: '',
    });
    const [commentData, setCommentData] = useState<Comment>(initialCommentData);
    const [showPostForm, setShowPostForm] = useState(false);

    const [feedContent, setFeedContent] = useState<FeedContentItem>();

    const [displaySpecificPost, setDisplaySpecificPost] = useState(false)
    const [selectedPost, setSelectedPost] = useState<FeedPost>();
    
    const [likedPosts, setLikedPosts] = useState<number[]>([]);

    const [postComments, setPostComments] = useState<any[]>([]);
    const [updateLikeIcon, setUpdateLikeIcon] = useState<number>(0);
    // const [forceRerender, setForceRerender] = useState(false);
    const [isLikedModalforPost, setIsLikedModalforPost] = useState<boolean>(false);


    const [postIdForModal, setpostIdForModal] = useState<number | null >(null);
    const [showCommentField, setShowCommentField] = useState<boolean>(true);
    const [replyTo, setReplyTo] = useState<{username: string | null; user_id: number | null, comment_id: number | null}>({username: "", user_id: -1, comment_id: -1});
    
    const [selectedOption, setSelectedOption] = useState('newest_to_oldest');
    const [sortedPosts, setSortedPosts] = useState<any[]>([]);
    const [accountUsername, setAccountUsername] = useState<string>('');
    const [category, setCategory] = useState('');
    const [showErrorMsgPost, setShowErrorMsgPost] = useState(false);

    const sortPosts = () => {
        if (feedContent) {
            let sorted = [...feedContent.message]; 
    
            
            if (selectedOption === 'newest_to_oldest') {
                sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            } else if (selectedOption === 'oldest_to_newest') {
                sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            } else if (categories.includes(selectedOption)) {
                console.log("selectedOption", selectedOption)
                sorted = sorted.filter(post => post.category === selectedOption);
                console.log("sorted", sorted);
            }
    
            setSortedPosts(sorted);
        }
    };

    // const filterPostsByCategory = () => {
    //     if (feedContent && selectedOption) {
    //         const filteredPosts = feedContent.message.filter(post => selectedOption.includes(post.category));
    //         setSortedPosts(filteredPosts);
            

    //     }
    // };
    

    useEffect(() => {
        socket.connect();
        console.log("connected");
        console.log(likedPosts);
        console.log(updateLikeIcon);
        console.log(postIdForModal);
        setShowCommentField(true);
        console.log(replyTo);

        //Get the posts to display upon load the feed page.
        socket.emit(SOCKET_EVENTS.UPDATE_FEED);
        socket.emit(SOCKET_EVENTS.DISPLAY_FEED_POST_COMMENTS);
        socket.emit(SOCKET_EVENTS.GET_USERNAME);

        socket.on(SOCKET_EVENTS.UPDATE_FEED, (data : FeedContentItem)=> {
            console.log("data", data);
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
            //console.log("feedcontent", feedContent);
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

        socket.on(SOCKET_EVENTS.SEND_USERNAME, data => {
            setAccountUsername(data.message);
            console.log("my username:", data.message);
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
            socket.off(SOCKET_EVENTS.SEND_USERNAME);
            socket.disconnect();
            console.log("disconnected");
        };
    }, [socket]);

    useEffect(() => {
        
        sortPosts();
    }, [selectedOption, feedContent]);

   

    const handleSubmit = (e: any) => {
        e.preventDefault();

        if (data.content && data.subject && data.category && data.content) {
            setShowErrorMsgPost(false);
            setShowPostForm(false);
            socket.emit(SOCKET_EVENTS.CREATE_POST, data);

        } else {
            setShowErrorMsgPost(true);
        }
        
    };

    // const handleCommentSubmit = (e: any) => {
    //     e.preventDefault();
    //     socket.emit(SOCKET_EVENTS.CREATE_COMMENT, commentData);
    // };

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        //console.log(`name: ${name} and value: ${value}`)
        setData(prevData => ({
            ...prevData,
            [name]: value
        }));
    }; 

    const filterOptions = [
        { label: 'Newest to Oldest', value: 'newest_to_oldest' },
        { label: 'Oldest to Newest', value: 'oldest_to_newest' },
        { label: 'Urgent', value: 'URGENT' },
        { label: 'TNR', value: 'TNR' },
        { label: 'Lost Pet', value: 'LOST PET' },
        { label: 'Need Advice', value: 'NEED ADVICE' },
        { label: 'Supplies', value: 'SUPPLIES' },
        { label: 'None', value: 'none' },

        
    ];



    const categories = ['URGENT', 'TNR', 'LOST PET', 'NEED ADVICE', 'SUPPLIES'];

   


    // function arrayBufferToBase64(buffer:any) {
    //     let binary = '';
    //     const bytes = new Uint8Array(buffer);
    //     const len = bytes.byteLength;
    //     for (let i = 0; i < len; i++) {
    //         binary += String.fromCharCode(bytes[i]);
    //     }
    //     return btoa(binary);
    // }

    function formatTimestamp(timestamp: string) {
        const postDate = new Date(timestamp);
        const currentDate = new Date();
        const diffInMilliseconds = Math.abs(currentDate.getTime() - postDate.getTime());
      
        const diffInMinutes = diffInMilliseconds / 60000;
        if (diffInMinutes < 60) {
          return `${Math.round(diffInMinutes)}m`;
        }
      
        const diffInHours = diffInMilliseconds / 3600000;
        if (diffInHours < 24) {
          return `${Math.round(diffInHours)}h`;
        } else {
          return `${Math.round(diffInHours / 24)}d`;
        }
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
                        category: '',
                    });
                    setCategory("");
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
                                    category: '',
                                });
                                
                            }}
                        >X</Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Create post</Typography>
                        </Box>
                        <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2 }}></Avatar>
                            <Typography variant="h6">{accountUsername}</Typography>
                        </Box>
                        

                        {/* Catagories Menu */}
                        <FormControl fullWidth style={{paddingBottom: '15px'}}>
                            <InputLabel id="category-label">Select Category</InputLabel>
                            <Select
                                labelId="category-label"
                                id="category"
                                value={category}
                                label="Select Category"
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setData({...data, category: e.target.value})
                                }}
                            >
                                {categories.map((categoryItem) => (
                                <MenuItem key={categoryItem} value={categoryItem}>
                                    {categoryItem}
                                </MenuItem>
                                ))}
                            </Select>
                        </FormControl>


                        <TextField
                            id="Subject"
                            label="Subject"
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
                            label={data.content ? '' : 'Write here...'}
                            multiline
                            rows={4}
                            variant="outlined"
                            fullWidth
                            onChange={handleChange}
                            name="content"
                            value={data.content}
                            style={{paddingTop: '10px', paddingBottom: '10px'}}
                            // InputLabelProps={{
                            //     style: {
                                    
                            //         fontSize: '22px', 
                            //         color: 'grey'
                            //     },
                            //     shrink: data.content ? true : false
                            // }}
                            // InputProps={{
                            //     disableUnderline: true,
                            //     style: {
                            //         fontSize: '22px',
                            //     },
                            // }}
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


                        <input type="file" style={{paddingBottom: '10px'}} onChange={(e) => {
                            setData({ ...data, image: e.target.files && e.target.files.length > 0 ? e.target.files[0] : null })
                        }} />

                        {
                            showErrorMsgPost && 
                            <Alert severity="error" sx={{ border: '1px solid red', borderRadius: '4px', alignItems: 'center', display: 'flex' }}>
                                {/* <ErrorOutline sx={{ mr: 1 }} /> */}
                                Please check that all fields are completed.
                            </Alert>

                        }
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

            {/* Filtering */}
            {/* <FormControl style={{ minWidth: 120, padding: '1px'}}>
                <InputLabel id="filter-label">Filter</InputLabel> */}
            <FormControl style={{ minWidth: 120, paddingTop: '30px', paddingBottom: '30px'}}>
                <InputLabel id="filter-label" sx={{ paddingTop: '20px' }}>Filter</InputLabel>
                <Select
                    labelId="filter-label"
                    id="filter-select"
                    value={selectedOption}
                    onChange={(e) => {
                        setSelectedOption(e.target.value);
                    }}
                    
                >
                    {filterOptions.map((option, index) => (
                        <MenuItem key={index} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {sortedPosts && sortedPosts.map((post, index) => (
               
                    <Card 
                        key={index} 
                        // onClick={() => {
                        //     setSelectedPost({...post,userLikes: feedContent.userLikes});
                        //     setDisplaySpecificPost(true);
                        // }}
                        //style={{ marginBottom: '20px', paddingTop: '10px', paddingBottom: '10px' }}
                        style={{ marginBottom: '20px', width: '500px', height: '550px' }}
                    >
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                        <div>
                           
                        </div>
                        {/* Expand button */}
                        
                    </div>
                        {/**new changes */}
                    <CardContent>
                        
                        
                        

                        
                               

                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{post.subject}</Typography>
                            </Box>
                                <Divider variant="middle" style={{ marginTop: 2, marginBottom: 2 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ mr: 2 }}></Avatar>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6">{post.username}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2">{formatTimestamp(post.timestamp)}</Typography>
                                    <Chip label={post.category} variant="outlined" size="small" sx={{ marginLeft: 1 }} />

                                    
                                </Box>
                            </Box>
                        </Box>
                
                        
                        <Box style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <Typography variant="body1" component="div" style={{ marginBottom: '20px', wordWrap: 'break-word' }}>
                                {post.content}
                            </Typography>
                        </Box>
                        
                            
                        
                        {post.image && (
                            <div>
                                <img

                                    src={post.image}
                                    //src={typeof post.image === 'string' ? `data:image/jpeg;base64,${post.image}` : `data:image/jpeg;base64,${arrayBufferToBase64(post.image)}`}
                                    //style={{ width: '500px', height: '200px' }}
                                    style={{ maxWidth: '100%', maxHeight: '200px', width: 'auto', height: 'auto' }}
                                    alt="Post Image"
                                />


                                {/* <p>{post.image ? `${typeof post.image}`: `${typeof post.image}`}</p> */}
                            </div>
                        )}


                        {/* <Divider />
                        <Typography variant="subtitle1">Likes {post.likes}</Typography> */}
                        
                        
                        <div onClick={() => 
                            {
                                // console.log(post.id);
                                // socket.emit(SOCKET_EVENTS.LIKE_POST, post.id);
                                
                                
                            
                            }}
                        >
                            {/* <Divider variant="middle" sx={{ marginTop: 2, width: '100%', paddingBottom: '50px', margin: 0 }} /> */}
                            <Divider
                                variant="middle"
                                sx={{
                                position: 'absolute',
                                top: '50%', 
                                left: 0,
                                width: '100%',
                                marginTop: '-1px' 
                                }}
                            />
                            {feedContent?.userLikes?.some(like => like.post_id === post.id) ? (
                                <FavoriteIcon id={`post-${post.id}-heart-icon`} style={{ color: 'red' }} onClick={() => socket.emit(SOCKET_EVENTS.LIKE_POST, post.id)}/>
                            ) : (
                                <FavoriteBorderIcon id={`post-${post.id}-heart-icon`} onClick={() => socket.emit(SOCKET_EVENTS.LIKE_POST, post.id)}/>
                            )}

                            <span id={`post-${post.id}-like-count`} style={{paddingRight: '15px'}}>{post.likes}</span>
                            <CommentIcon onClick={() => {
                                //setSelectedPost({...post, userLikes: feedContent.userLikes, image: arrayBufferToBase64(post.image)});
                                socket.emit(SOCKET_EVENTS.DISPLAY_FEED_POST_COMMENTS, selectedPost?.id);
                                console.log("selectedPost?.id", selectedPost?.id);
                                setSelectedPost({...post, userLikes: feedContent?.userLikes});
                                console.log("setSelectedPost", {...post, userLikes: feedContent?.userLikes})
                                setDisplaySpecificPost(true);
                                setIsLikedModalforPost(selectedPost?.userLikes?.some(like => like.post_id === selectedPost?.id) ? true : false);
                                //setpostIdForModal(post.id);
                            }} />
                            
                        </div>


                        {/* <Divider />
                        <Typography variant="subtitle1">Posted: {post.timestamp}</Typography> */}
                        
                        {/* <Button 
                            variant="contained"
                            onClick={() => socket.emit(SOCKET_EVENTS.DELETE_FEED_POST, post.id)}
                            style={{marginTop: "55px", marginLeft: "350px"}}
                            >
                                Delete
                        </Button> */}
                    </CardContent>
                    </Card>
                ))}


                {/* Modal 2 - Modal for individual posts*/}
                <Modal
                    open={displaySpecificPost}
                    onClose={() => {
                        //setSelectedPost();
                        //setCommentData(initialCommentData);
                        setDisplaySpecificPost(false);
                        setpostIdForModal(null);
                        //setShowCommentField(false);
                        //setSelectedPost()
                        setCommentData({...commentData, content: ''});
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
                                    overflowY: 'scroll', 
                                    maxHeight: '80vh', 
                                }}
                            >
                               
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
                                    //setShowCommentField(false);
                                    setCategory("");
                                    setCommentData({...commentData, content: ''});
                                }}
                            > X
                            </Button>
                            



                            

                        {selectedPost && 
                        
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">{selectedPost && selectedPost.subject}</Typography>
                                </Box>
                                    <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ mr: 2 }}></Avatar>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="h6">{selectedPost && selectedPost.username}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2">{selectedPost.timestamp ? formatTimestamp(selectedPost.timestamp) : 'N/A'}</Typography>
                                        <Chip label={selectedPost && selectedPost.category} variant="outlined" size="small" sx={{ marginLeft: 1 }} />

                                        
                                    </Box>
                                </Box>
                            </Box> 

                            
                        </>
                        

                        }
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
                                        //style={{ width: '100px', height: '100px' }}
                                        style={{ maxWidth: '100%', maxHeight: '200px', width: 'auto', height: 'auto' }}
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

                            <CommentIcon 
                                onClick={() => {
                                    //setShowCommentField(!showCommentField);
                                    console.log(selectedPost?.username)
                                    console.log(selectedPost?.id)
                                    setReplyTo({
                                        username: selectedPost?.username ? selectedPost.username : null, 
                                        user_id: selectedPost?.id ? selectedPost.id : null, 
                                        comment_id: null
                                    });
                                }}
                            />
                           
                            {/*Comment box for post */}
                            
                            {showCommentField && 
                            <>
                                {/* <p>Reply to @{replyTo.username}</p> */}
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
                                {/* <CommentIcon onClick={() => {console.log('what!!');}}/> */}
                                <Button 
                                    variant="contained" 
                                    onClick={() => {

                                        console.log("what is this!!!", selectedPost ? selectedPost.id : null)

                                        if (selectedPost) {
                                            console.log("manual data entry");
                                            console.log("Post_id: ", selectedPost.id);
                                            console.log("content", commentData.content);

                                            socket.emit(SOCKET_EVENTS.CREATE_COMMENT, 
                                                {
                                                    post_id: selectedPost.id, 
                                                    content: commentData.content,
                                                    parent_comment_id: null,
                                                }
                                            )
                                            setCommentData({...commentData, content: ''});
                                            //commentData.content = "";
                                        }
                                        // if (selectedPost) {
                                        //     setCommentData({
                                        //         ...commentData,
                                        //         post_id: selectedPost.id,
                                        //         parent_comment_id: replyTo.comment_id,
    
                                        //     });
                                        //     console.log("commentData to be sent", commentData);
                                        // }
                                        
                                        
                                        // const interval = setInterval(() => {
                                        //     if (commentData.post_id === selectedPost?.id) {
                                        //         clearInterval(interval); 
                                        //         console.log("commentData to be sent", commentData);
                                        //         socket.emit(SOCKET_EVENTS.CREATE_COMMENT, commentData);
                                        //     }
                                        // }, 100);
                                        
                                        

                                        // setCommentData({...commentData, content: ''});
                                    }}
                                    disabled={!commentData.content || !commentData.content.trim()}
                                    sx={{ 
                                    display: 'block', 
                                    width: '100%', 
                                    mx: 'auto',
                                    color: commentData.content ? 'white' : '#BCC0C4',
                                    backgroundColor: commentData.content ? '#0861F2'  : '#E5E6EB',
                                    '&:hover': {
                                        backgroundColor: commentData.content ? '#0861F2' : '#E5E6EB',
                                    },
                                    }}
                                >
                                    Comment
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
                            
                            

                            {/* {selectedPost && postComments
                                .filter(comment => comment.post_id === selectedPost.id) 
                                .filter(comment => !comment.parent_comment_id)
                                .map((parentComment, parentIndex) => (
                                    <div key={parentIndex}>
                                       
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
                                      
                                        {postComments
                                            .filter(comment => comment.parent_comment_id === parentComment.id) // Filter child comments for this parent
                                            .map((childComment, childIndex) => (
                                                <div key={childIndex} style={{ marginLeft: 50 }}>
                                                    
                                                    <Typography variant="body1">User: {childComment.username}</Typography>
                                                    <Typography variant="body1">Content: {childComment.content}</Typography>
                                                    <Typography variant="body1">Timestamp: {childComment.timestamp}</Typography>
                                                    <CommentIcon 
                                                        onClick={() => {
                                                            setShowCommentField(!showCommentField);
                                                            setReplyTo({username: childComment.username, user_id: childComment.user_id, comment_id: childComment.id});
                                                            console.log("replyTo", replyTo);
                                                            console.log('hello');
                                                        }}
                                                    />
                                                    <Divider />
                                                </div>
                                            ))
                                        }
                                    </div>
                                ))
                            } */}
                            {selectedPost && postComments
                                .filter(comment => comment.post_id === selectedPost.id)
                                .map((comment, index) => (
                                    <div key={index}>
                                       <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                            <Avatar sx={{ mr: 2 }} style={{marginTop: '10px'}}></Avatar>
                                            <Typography variant="h6">{comment.username}</Typography>
                                            <Typography variant="body1" style={{paddingLeft: '10px'}}>Posted {formatTimestamp(comment.timestamp)} ago</Typography>
                                        </Box>
                                        
                                    
                                        

                                        <Typography variant="body1">{comment.content}</Typography>
                                      
                                        <Divider />
                                    </div>
                                ))
                            }


{/* <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{post.subject}</Typography>
                            </Box>
                                <Divider variant="middle" style={{ marginTop: 2, marginBottom: 2 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ mr: 2 }}></Avatar>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6">{post.username}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2">{formatTimestamp(post.timestamp)}</Typography>
                                    <Chip label={post.category} variant="outlined" size="small" sx={{ marginLeft: 1 }} />

                                    
                                </Box>
                            </Box>
                        </Box> */}
                            
                        

                            
                            
                        </Box>
                        {/* </Box> */}
                        
                    </Fade>
                </Modal>
                    
            
        </div>
    );
}

export default UserFeed;