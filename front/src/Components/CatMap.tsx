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

mapboxgl.accessToken = 'pk.eyJ1Ijoic25kYWRkYTYzIiwiYSI6ImNsc3RtdnZrODBxaDkya21xdDUyMzVseWYifQ.1LO5AE0xSXX9ndA9l1lcZw'

function CatMap() {
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
    const mapContainer = useRef<HTMLDivElement | null>(null);
    // Add a new state for the last created marker
    const [lastMarker, setLastMarker] = useState<mapboxgl.Marker | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const geolocate = useRef<mapboxgl.GeolocateControl | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clickedLocation, setClickedLocation] = useState<mapboxgl.LngLat | null>(null);
    const [formData, setFormData] = useState({ user_id: '', marker_id: '', subject: '', content: '', image: null });

    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [0, 0],
          zoom: 0,
          pitch: 0, // tilt the map
          bearing: 0, // rotate the map
          antialias: true // this is important for the 3D effect
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
        socket.emit(SOCKET_EVENTS.FETCH_MARKERS);

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
            .addTo(map.current!);

          setLastMarker(marker);
          // Open the modal and save the clicked location
          setIsModalOpen(true);
          setClickedLocation(event.lngLat);
        });
    }, []);

    useEffect(() => {
        socket.on('UPDATE_FEED', (data) => {
            // Create a new marker and add it to the map at the post's location
            new mapboxgl.Marker()
                .setLngLat([data.message.marker_id.lng, data.message.marker_id.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<h1>${data.message.subject}</h1><p>${data.message.content}</p>`)) // add a popup
                .addTo(map.current!);
        });

        return () => {
            socket.off('UPDATE_FEED');
        };
    }, []);
      useEffect(() => {
        socket.on('RECEIVE_MARKERS', (markers: any[]) => {
          markers.forEach((markerData: any) => {
            new mapboxgl.Marker()
              .setLngLat([markerData.lng, markerData.lat])
              .setPopup(new mapboxgl.Popup().setHTML(`<h1>${markerData.subject}</h1><p>${markerData.content}</p>`)) // add a popup
              .addTo(map.current!);
          });
        });
      
        return () => {
          socket.off('RECEIVE_MARKERS');
        };
      }, []);

    const handlePostClick = () => {
        if (formData.content.trim()) {
            socket.emit('CREATE_POST', {
                marker_id: clickedLocation,
                content: formData.content,
            });
            setIsModalOpen(false);
        }
    };

    return (
        <div ref={mapContainer} style={{ width: '96%', height: '100vh' }}>
            <Modal
                open={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  if (lastMarker) {
                    lastMarker.remove();
                    setLastMarker(null);
                  }
                  setFormData({
                    user_id: '',
                    marker_id: '',
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
                              setFormData({
                                user_id: '',
                                marker_id: '',
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