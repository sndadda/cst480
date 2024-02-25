import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useRef, useEffect } from 'react';

mapboxgl.accessToken = 'pk.eyJ1Ijoic25kYWRkYTYzIiwiYSI6ImNsc3RtdnZrODBxaDkya21xdDUyMzVseWYifQ.1LO5AE0xSXX9ndA9l1lcZw'

function CatMap() {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const zoomedIn = useRef(false);

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
        map.current.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));

        map.current.on('click', (event) => {
          if (!zoomedIn.current) {
            zoomedIn.current = true;
          } else {
            // Create a new marker and add it to the map at the clicked location
            var marker = new mapboxgl.Marker()
              .setLngLat(event.lngLat)
              .addTo(map.current!);

            // Create a form for the popup
            var formElement = document.createElement('form');
            formElement.id = 'description-form';

            var label = document.createElement('label');
            label.htmlFor = 'description';
            label.textContent = 'Description:';
            formElement.appendChild(label);

            formElement.appendChild(document.createElement('br'));

            var input = document.createElement('input');
            input.type = 'text';
            input.id = 'description';
            input.name = 'description';
            formElement.appendChild(input);

            formElement.appendChild(document.createElement('br'));

            var submit = document.createElement('input');
            submit.type = 'submit';
            submit.value = 'Submit';
            formElement.appendChild(submit);

            // create a popup with the form and add it to the marker
            var popup = new mapboxgl.Popup({ offset: 25 })
                .setDOMContent(formElement);
            marker.setPopup(popup).togglePopup(); // Open the popup

            // listen for form submission
            formElement.addEventListener('submit', function(e) {
              e.preventDefault();
              var descriptionElement = document.getElementById('description');
              if (descriptionElement) {
                var description = (descriptionElement as HTMLInputElement).value;
                console.log(description);
              }
            });
          }
        });
    }, []);

    return (
        <div ref={mapContainer} style={{ width: '96%', height: '100vh' }} />
    );
}

export default CatMap;