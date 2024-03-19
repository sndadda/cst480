import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import { socket } from "../socket.tsx";
import SOCKET_EVENTS from "../socketEnums.js";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import { Marker, MapPost, MapPostComment } from './utils.ts';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import IconButton from '@mui/material/IconButton';
import CommentIcon from '@mui/icons-material/Comment';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PetsIcon from '@mui/icons-material/Pets';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import axios from 'axios';
import "./CatMap.css";

// Helper function to format the timestamp
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
  

function getMarkerColor(timestamp: string) {
  const postDate = new Date(timestamp);
  const currentDate = new Date();
  const diffInMilliseconds = Math.abs(currentDate.getTime() - postDate.getTime());

  const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
  if (diffInDays < 1) {
    return 'red';
  } else if (diffInDays < 5) {
    return 'orange';
  } else {
    return 'grey';
  }
}

mapboxgl.accessToken = 'pk.eyJ1Ijoic25kYWRkYTYzIiwiYSI6ImNsc3RtdnZrODBxaDkya21xdDUyMzVseWYifQ.1LO5AE0xSXX9ndA9l1lcZw'
function CatMap() {
 
    const [commentFormData, setCommentFormData] = useState({
        content: '',
    });
    const [comments, setComments] = useState<MapPostComment[]>([]);
    const [formData, setFormData] = useState<{subject: string, content: string, image: File | null, category: string}>({subject: '', content: '', image: null, category: '' });
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [renderedMarkers, setRenderedMarkers] = useState<mapboxgl.Marker[]>([]);
    const [lastMarker, setLastMarker] = useState<mapboxgl.Marker | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const geolocate = useRef<mapboxgl.GeolocateControl | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [markerPos, setMarkerPos] = useState({ latitude: 0, longitude: 0 });
    const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<MapPost[]>([]);
    let [, setPosts] = useState<MapPost[]>([]);
    const [name, setName] = useState('');
    const [userId, setUserId] = useState(null);
    const [userLikes, setUserLikes] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [imageURL, setImageURL] = useState<string | null>(null);
    const [userProfilePic, setUserProfilePic] = useState<string | undefined>(undefined);
    const [filter, setFilter] = useState('all');
    const [category, setCategory] = useState('');
    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        socket.connect();
       
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [0, 0],
          zoom: 0,
          pitch: 0, // tilt the map
          bearing: 0, // rotate the map
          antialias: true // 3D effect
        });

        // Add navigation control (the +/- zoom buttons)
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add geolocate control to the map.
        geolocate.current = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: false
          },
          trackUserLocation: true
        });
        map.current.addControl(geolocate.current, 'top-right');

        map.current.on('load', () => {
          socket.emit(SOCKET_EVENTS.FETCH_MARKERS);

          socket.on(SOCKET_EVENTS.MARKERS_FETCHED, (markers: Marker[]) => {
            setMarkers(markers);
            renderMarkers(markers); 
          });
        });

        map.current.on('click', (event) => {
          // If the map is not zoomed in enough
          if (map.current!.getZoom() < 10) {
            // Trigger the geolocation event to zoom in to the user's current location
            geolocate.current!.trigger();
            return;
          }
          
           // Create a new marker at the clicked location
          const marker = new mapboxgl.Marker()
            .setLngLat(event.lngLat)
            
          setLastMarker(marker);

          setIsModalOpen(true);
          setMarkerPos({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
        });
        
       

        socket.on(SOCKET_EVENTS.MARKER_CREATED, (marker) => {

          const mapboxMarker = new mapboxgl.Marker()
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map.current!);

          mapboxMarker.getElement().addEventListener('click', () => {
            socket.emit(SOCKET_EVENTS.FETCH_MAP_POSTS, { marker_id: marker.id });
          });
        });
        

        socket.on(SOCKET_EVENTS.MAP_POSTS_FETCHED, (posts) => {
          console.log(posts);
          setComments([]);
          setSelectedPosts(posts);
          console.log(selectedPosts);

          setIsPostsModalOpen(true);
          for (let post of posts) {
            socket.emit(SOCKET_EVENTS.FETCH_COMMENTS, { post_id: post.id });
          }
        });
        socket.on(SOCKET_EVENTS.COMMENTS_FETCHED, (fetchedComments) => {
          setComments((prevComments) => [...prevComments, ...fetchedComments]);
        });

      
        socket.on('postLiked', (data) => {
          const { postId, likeCount } = data;
        
          const likeCountElement = document.querySelector(`#post-${postId}-like-count`);
          if (likeCountElement) {
            likeCountElement.textContent = likeCount;
          }
        
          setSelectedPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, likeCount } : post
            )
          );
        });

        socket.emit('fetchUserLikes', { userId });

        socket.on('userLikesFetched', (data) => {
          const { userLikes } = data;

          setUserLikes(userLikes);
        });
        socket.on('postLiked', (data) => {
          const { postId, likes } = data;
        
          setSelectedPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, likes } : post
            )
          );
        
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, likes } : post
            )
          );
        
          setUserLikes((prevLikes) =>
            prevLikes.includes(postId) ? prevLikes.filter((id) => id !== postId) : [...prevLikes, postId]
          );
        });

        axios.get('/api/loggedin')
          .then(response => {
              if (response.data.loggedIn) {
                  setName(response.data.name);
                  setUserId(response.data.userId);
                  setUserProfilePic(response.data.image);

                  socket.emit('fetchUserLikes', { userId: response.data.userId });
              }
            })
          .catch(error => {
            console.log(error);
          });
       
         
    }, []);

    useEffect(() => {
      if (map.current) {
        renderMarkers(markers);
      }
    }, [markers, filter]);




const renderMarkers = (markers: Marker[]) => {
  // Remove all previously rendered markers from the map
  renderedMarkers.forEach((marker) => marker.remove());

  const newRenderedMarkers: mapboxgl.Marker[] = [];

  markers.forEach((marker: Marker) => {
    const postDate = new Date(marker.timestamp);
    const currentDate = new Date();
    const diffInMilliseconds = Math.abs(currentDate.getTime() - postDate.getTime());
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);

    if (filter === 'new' && diffInDays >= 2) {
      return;
    }

    if (filter === 'old' && diffInDays < 2) {
      return;
    }

    const color = getMarkerColor(marker.timestamp);
    const mapboxMarker = new mapboxgl.Marker({ color })
      .setLngLat([marker.longitude, marker.latitude])
      .addTo(map.current!);

    // Associate a click event with the marker
    mapboxMarker.getElement().addEventListener('click', (event) => {
      event.stopPropagation();
      socket.emit(SOCKET_EVENTS.FETCH_MAP_POSTS, { marker_id: marker.id });
      setIsPostsModalOpen(true);
    });

    newRenderedMarkers.push(mapboxMarker);
  });

  // Save the newly rendered markers in the state
  setRenderedMarkers(newRenderedMarkers);
};

    const handlePostClick = () => {
      // convert the image to a base64 string
      if (formData.image) {
        const reader = new FileReader();
        reader.onloadend = () => {
          socket.emit(SOCKET_EVENTS.MARKER, { ...markerPos, image: reader.result });
        };
        reader.readAsDataURL(formData.image);
      } else {
        socket.emit(SOCKET_EVENTS.MARKER, markerPos);
      }

      socket.once(SOCKET_EVENTS.MARKER_CREATED, (marker) => {
        const postData = { ...formData, marker_id: marker.id, category: category };
        socket.emit(SOCKET_EVENTS.CREATE_MAP_POST, postData);
        
        setFormData({ subject: '', content: '', image: null, category: ''});
        setImageURL(null); 
      });
        
      setIsModalOpen(false);
    };

    useEffect(() => {
      console.log(comments);
    }, [comments]);
   
    const handleLikePost = (postId: number) => {
      socket.emit('likePost', { postId, userId });
      const updatedUserLikes = userLikes.includes(postId)
        ? userLikes.filter((id) => id !== postId)
        : [...userLikes, postId];
      localStorage.setItem('userLikes', JSON.stringify(updatedUserLikes));
    };

    const handleCommentPost = (postId: number) => {
      const commentData = { ...commentFormData, post_id: postId, parent_comment_id: 0, user_id: userId };
      socket.emit(SOCKET_EVENTS.CREATE_MAP_COMMENT, commentData);

      setCommentFormData({ content: '' });
  
    };

    const handleClick = (event: any) => {
      setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
        <div ref={mapContainer} style={{ width: '96%', height: '100vh' }}>
        <div className="map-select">
          <Select
            labelId="filter-label"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
              style={{ backgroundColor: 'white', opacity: 1 }}
            >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="old">Old</MenuItem>
          </Select>
        </div>
          <Modal
            open={isPostsModalOpen}
            onClose={() => setIsPostsModalOpen(false)}
            closeAfterTransition
            BackdropProps={{
              timeout: 500,
            }}
          >
            <Fade in={isPostsModalOpen}>
            <Box sx={{ 
              position: 'relative', 
              width: '72%',
              maxHeight: '85vh',
              bgcolor: 'background.paper', 
              p: 2, 
              mx: 'auto', 
              my: '5%', 
              borderRadius: 2,
              overflowY: 'auto' //scroll
            }}>
                <Button 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    color: 'black', 
                    fontSize: 'large' 
                  }} 
                  onClick={() => setIsPostsModalOpen(false)}
                >X</Button>
                {selectedPosts.map((post, index) => (
                  <div key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{post.subject}</Typography>
                    </Box>
                    <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar src={post.userProfilePic} sx={{ mr: 2 }}></Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6">{post.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2">{formatTimestamp(post.timestamp)}</Typography>
                          <Chip label={post.category} variant="outlined" size="small" sx={{ marginLeft: 1 }} />
                        </Box>
                      </Box>
                    </Box>
                
                    <p style={{ marginBottom: '20px' }}>{post.content}</p>

                    {post.image && (
                      <>
                        <Divider variant="middle" sx={{ marginTop: 2, width: '100%', padding: 0, margin: 0 }} />
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <img className="preview-image" src={post.image} alt="Post" style={{ marginTop: '20px', width: '80%', height: 'auto' }} />
                        </div>
                      </>
                    )}

                    
                    <Divider variant="middle" sx={{ marginTop: 2, width: '100%', paddingBottom: '20px', margin: 0 }} />
                    {userLikes.includes(post.id) ? ( //heart
                      <FavoriteIcon id={`post-${post.id}-heart-icon`} onClick={() => handleLikePost(post.id)} style={{ color: 'red' }} />
                    ) : (
                      <FavoriteBorderIcon id={`post-${post.id}-heart-icon`} onClick={() => handleLikePost(post.id)} />
                    )}
                    <span id={`post-${post.id}-like-count`}>{post.likes}</span>

                    <IconButton
                      onMouseEnter={(event) => event.currentTarget.style.color = 'blue'}
                      onMouseLeave={(event) => event.currentTarget.style.color = ''}
                      
                    >
                    <CommentIcon />
                    </IconButton>

                    <Divider variant="middle" sx={{ marginTop: 2, width: '100%', margin: 0 }} />

                    {comments
                      .filter(({ post_id }) => post_id === post.id)
                      .map(({ name, content, timestamp }, index) => (
                        <div key={index}>
                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2 }}>
                            <Avatar src={post.userProfilePic} sx={{ mr: 2 }}></Avatar>
                            <Box sx={{ my: 1, borderRadius: 2, backgroundColor: '#F1F2F5', flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                                <Typography variant="body1">{content}</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ p: 1 }}>{formatTimestamp(timestamp)}</Typography>
                            </Box>
                          </Box>
                        </div>
                    ))}

                    <div style={{ position: 'sticky', bottom: 0, backgroundColor: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0, borderRadius: 2, p: 1 }}>
                        <Avatar sx={{ mr: 1 }}></Avatar>
                        <TextField
                          id="comment"
                          value={commentFormData.content}
                          onChange={(e) => setCommentFormData({ ...commentFormData, content: e.target.value })}
                          placeholder="Write a comment..."
                          variant="filled"
                          fullWidth
                          InputProps={{
                            disableUnderline: true,
                            style: {
                              backgroundColor: '#f5f5f5',
                              
                            },

                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton 
                                  onClick={() => {
                                    handleCommentPost(post.id);
                                  }}
                                  disabled={!commentFormData.content}
                                >
                                  <SendIcon color={commentFormData.content ? 'primary' : 'disabled'} /> 
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                       
                      </Box>
                    </div>
                    
                  </div>

                ))}
              </Box>
            </Fade>
          </Modal>
          
            <Modal
                open={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  if (lastMarker) {
                    lastMarker.remove();
                    setLastMarker(null);
                  }
                
                  setFormData({ subject: '', content: '', image: null, category: ''});
                }}
                closeAfterTransition
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={isModalOpen}>
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
                              setIsModalOpen(false);
                              if (lastMarker) {
                                  lastMarker.remove();
                                  setLastMarker(null);
                              }
                              setFormData({ subject: '', content: '', image: null, category: ''});
                            
                          }}
                        >X</Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Create post</Typography>
                        </Box>
                        <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar src={userProfilePic} sx={{ mr: 2 }}></Avatar>
                            <Typography variant="h6">{name}</Typography>
                        </Box>
                        
                        <FormControl variant='outlined' fullWidth sx={{ mb: 2 }}>
                          <OutlinedInput
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Subject"
                            sx={{
                              height: 30, 
                              borderRadius: 20, 
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
                        </FormControl>
                        <TextField
                            autoFocus
                            id="filled-multiline-static"
                            label={formData.content ? '' : 'Write something...'}
                            multiline
                            rows={4}
                            variant="filled"
                            fullWidth
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            name="content"
                            value={formData.content}
                            InputLabelProps={{
                              style: {
                                fontSize: '22px', 
                                color: 'grey'
                              },
                              shrink: formData.content ? true : false
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
                <Box display="flex" alignItems="center" p={1} bgcolor="background.paper" borderRadius={3} border={1} borderColor="grey.500" mb={2}>
                  <Box flexGrow={1} p={1}>
                    <Typography fontWeight={500}>Add to your post</Typography>
                  </Box>
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="span"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                  <IconButton
                    color="primary"
                    aria-label="select category"
                    component="span"
                    onClick={handleClick}
                  >
                    <PetsIcon />
                  </IconButton>
                  <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => { setCategory('URGENT'); handleClose(); }}>URGENT</MenuItem>
                    <MenuItem onClick={() => { setCategory('TNR'); handleClose(); }}>TNR</MenuItem>
                    <MenuItem onClick={() => { setCategory('Lost Pet'); handleClose(); }}>Lost Pet</MenuItem>
                    <MenuItem onClick={() => { setCategory('Need advice'); handleClose(); }}>Need advice</MenuItem>
                    <MenuItem onClick={() => { setCategory('Supplies'); handleClose(); }}>Supplies</MenuItem>
                  </Menu>
                </Box>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      image: e.target.files ? e.target.files[0] : null,
                    });

                    // Read the file and set the result to imageURL
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImageURL(event.target?.result as string);
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}  
                />
                {imageURL && <img className="preview-image" src={imageURL} />}
                <Button 
                    variant="contained" 
                    onClick={handlePostClick}
                    disabled={!formData.content.trim()}
                    sx={{ 
                      display: 'block', 
                      width: '100%', 
                      mx: 'auto',
                      color: formData.content ? 'white' : '#BCC0C4',
                      backgroundColor: formData.content ? '#0861F2' : '#E5E6EB',
                      '&:hover': {
                        backgroundColor: formData.content ? '#0861F2' : '#E5E6EB',
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

export default CatMap;