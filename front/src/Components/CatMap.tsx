
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useState, useEffect } from 'react';

mapboxgl.accessToken = 'pk.eyJ1Ijoic25kYWRkYTYzIiwiYSI6ImNsc3RtdnZrODBxaDkya21xdDUyMzVseWYifQ.1LO5AE0xSXX9ndA9l1lcZw'

function CatMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(9);

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

        map.current.on('click', () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
              const { latitude, longitude } = position.coords;
              setLng(longitude);
              setLat(latitude);
              setZoom(14);
              map.current?.flyTo({ center: [longitude, latitude], zoom: 14 });
            });
          } else {
            alert('Geolocation is not supported by this browser.');
          }
        });
    }, []);

    return (
        <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
    );
}

export default CatMap;