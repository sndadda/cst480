import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useEffect } from 'react';

mapboxgl.accessToken = 'pk.eyJ1Ijoic25kYWRkYTYzIiwiYSI6ImNsc3RtdnZrODBxaDkya21xdDUyMzVseWYifQ.1LO5AE0xSXX9ndA9l1lcZw'

function CatMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const geolocate = useRef<mapboxgl.GeolocateControl | null>(null);

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
            enableHighAccuracy: true
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

          // Create a new marker and add it to the map at the clicked location
          var marker = new mapboxgl.Marker()
            .setLngLat(event.lngLat)
            .addTo(map.current!);

        });
    }, []);

    return (
        <div ref={mapContainer} style={{ width: '96%', height: '100vh' }} />
    );
}

export default CatMap;