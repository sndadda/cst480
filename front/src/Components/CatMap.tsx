import { useEffect, useRef, useState } from 'react';
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
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { Marker, MapPost, getAxiosErrorMessages } from './utils.ts';
import axios from 'axios';

// Helper function to format the timestamp
function formatTimestamp(timestamp: string) {
  const postDate = new Date(timestamp);
  const currentDate = new Date();
  const diffInHours = Math.abs(currentDate.getTime() - postDate.getTime()) / 3600000;

  if (diffInHours < 24) {
    return `${Math.round(diffInHours)}h`;
  } else {
    return `${Math.round(diffInHours / 24)}d`;
  }
}

mapboxgl.accessToken = 'pk.eyJ1Ijoic25kYWRkYTYzIiwiYSI6ImNsc3RtdnZrODBxaDkya21xdDUyMzVseWYifQ.1LO5AE0xSXX9ndA9l1lcZw'
function CatMap() {
 
    const [commentData, setCommentData] = useState({
        parent_comment_id: '',
        content: ''
    });
    const [username, setUsername] = useState('');
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const [markers, setMarkers] = useState<Marker[]>([]);
    // Add a new state for the last created marker
    const [lastMarker, setLastMarker] = useState<mapboxgl.Marker | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const geolocate = useRef<mapboxgl.GeolocateControl | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<{subject: string, content: string, image: File | null}>({subject: '', content: '', image: null });
    const [markerPos, setMarkerPos] = useState({ latitude: 0, longitude: 0 });
    const [isPostsModalOpen, setIsPostsModalOpen] = useState(false);
    const [isPostsOpen, setIsPostsOpen] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<MapPost[]>([]);
    const [lastMarkerId, setLastMarkerId] = useState(0);
    let [posts, setPosts] = useState<MapPost[]>([]);
    const [name, setName] = useState('');

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

          // Open the modal and save the clicked location
          setIsModalOpen(true);
          setMarkerPos({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
        });
       

        socket.emit(SOCKET_EVENTS.FETCH_MARKERS);

        socket.on(SOCKET_EVENTS.MARKER_CREATED, (marker) => {

          const mapboxMarker = new mapboxgl.Marker()
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map.current!);

          // Associate a click event with the marker
          mapboxMarker.getElement().addEventListener('click', () => {
          // Fetch the posts associated with the marker
            socket.emit(SOCKET_EVENTS.FETCH_MAP_POSTS, { marker_id: marker.id });
          });
        });

        socket.on(SOCKET_EVENTS.MARKERS_FETCHED, (markers: Marker[]) => {
          setMarkers(markers);
          markers.forEach((marker: Marker) => {
            const mapboxMarker = new mapboxgl.Marker()
              .setLngLat([marker.longitude, marker.latitude])
              .addTo(map.current!);
        
            // Associate a click event with the marker
            mapboxMarker.getElement().addEventListener('click', (event) => {
              event.stopPropagation();
              // Fetch the posts associated with the marker
              socket.emit(SOCKET_EVENTS.FETCH_MAP_POSTS, { marker_id: marker.id });
              // Open the posts modal
              setIsPostsModalOpen(true);
            });
          });
        });

        socket.on(SOCKET_EVENTS.MAP_POSTS_FETCHED, (posts) => {
          // Update the selectedPosts state with the fetched posts
          console.log(posts);
          setSelectedPosts(posts);
          console.log(selectedPosts);
          // Open the posts modal
          setIsPostsModalOpen(true);
        });

        axios.get('/api/loggedin')
          .then(response => {
            if (response.data.loggedIn) {
              setName(response.data.name);
            }
          })
          .catch(error => {
            console.log(error);
          });
       
         
    }, []);

 

    const handlePostClick = () => {
      // Emit the SOCKET_EVENTS.MARKER event with the marker position
      socket.emit(SOCKET_EVENTS.MARKER, markerPos);
    
      // Listen for the SOCKET_EVENTS.MARKER_CREATED event
      socket.once(SOCKET_EVENTS.MARKER_CREATED, (marker) => {
        // Update the marker_id of the post
        const postData = { ...formData, marker_id: marker.id };
    
        // Emit the SOCKET_EVENTS.CREATE_MAP_POST event with the post data
        socket.emit(SOCKET_EVENTS.CREATE_MAP_POST, postData);
    
        // Reset the form data
        setFormData({ subject: '', content: '', image: null });
      });
    
      // Close the modal
      setIsModalOpen(false);
    };

    return (
        <div ref={mapContainer} style={{ width: '96%', height: '100vh' }}>
          <Modal
            open={isPostsModalOpen}
            onClose={() => setIsPostsModalOpen(false)}
            closeAfterTransition
            BackdropProps={{
              timeout: 500,
            }}
          >
            <Fade in={isPostsModalOpen}>
              <Box sx={{ position: 'relative', width: '50%', bgcolor: 'background.paper', p: 2, mx: 'auto', my: '10%', borderRadius: 2 }}>
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
                      <Avatar sx={{ mr: 2 }}></Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6">{post.name}</Typography>
                        <Typography variant="body2">{formatTimestamp(post.timestamp)}</Typography>
                      </Box>
                    </Box>
                
                    <p>{post.content}</p>

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
                
                  setFormData({ subject: '', content: '', image: null });
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
                              setFormData({ subject: '', content: '', image: null });
                            
                          }}
                        >X</Button>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Create post</Typography>
                        </Box>
                        <Divider variant="middle" sx={{ marginTop: 2, marginBottom: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2 }}></Avatar>
                            <Typography variant="h6">{name}</Typography>
                        </Box>
                        
                        <FormControl variant='outlined' fullWidth sx={{ mb: 2 }}>
                            <InputLabel htmlFor="subject" sx={{ position: 'relative' }}>Subject</InputLabel>
                            <OutlinedInput
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                <input
                  type="file"
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      image: e.target.files ? e.target.files[0] : null,
                    });
                  }}
                />
                <Button 
                    variant="contained" 
                    onClick={handlePostClick}
                    disabled={!formData.content.trim()}
                    sx={{ 
                      display: 'block', 
                      width: '100%', 
                      mx: 'auto',
                      color: formData.content ? 'white' : '#BCC0C4',
                      backgroundColor: formData.content ? '#0861' : '#E5E6EB',
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