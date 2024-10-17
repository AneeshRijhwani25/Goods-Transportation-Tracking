// import { useRef, useEffect } from "react";
// import mapboxgl from "mapbox-gl";
// const MAPBOX_TOKEN =
//   "pk.eyJ1IjoiZG9jdG9yYnVkIiwiYSI6ImNqMmduc216YjAwMnEycXI2NzN5M291Y3QifQ.Ac0WMEuowA5AgxwqNrsmdw";
// mapboxgl.accessToken = MAPBOX_TOKEN; // Your Mapbox token here

// const Map = ({ driverLocation, pickupLocation, dropoffLocation }) => {
//   const mapContainerRef = useRef(null);
//     console.log(driverLocation)
//     console.log(pickupLocation)
//     console.log(dropoffLocation)
//   useEffect(() => {
//     const map = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v11",
//       center: [driverLocation[0], driverLocation[1]],
//       zoom: 12,
//     });

//     // Add driver marker
//     if (driverLocation[0] && driverLocation[1]) {
//       new mapboxgl.Marker({ color: "blue" })
//         .setLngLat([driverLocation[0], driverLocation[1]])
//         .addTo(map);
//     }

//     // Add pickup marker if available
//     if (pickupLocation?.coordinates) {
//       new mapboxgl.Marker({ color: "green" })
//         .setLngLat(pickupLocation.coordinates)
//         .addTo(map);
//     }

//     // Add dropoff marker if available
//     if (dropoffLocation?.coordinates) {
//       new mapboxgl.Marker({ color: "red" })
//         .setLngLat(dropoffLocation.coordinates)
//         .addTo(map);
//     }

//     return () => map.remove(); // Cleanup on unmount
//   }, [driverLocation, pickupLocation, dropoffLocation]);

//   return (
//     <div ref={mapContainerRef} style={{ width: "100%", height: "400px" }} />
//   );
// };

// export default Map;



import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZG9jdG9yYnVkIiwiYSI6ImNqMmduc216YjAwMnEycXI2NzN5M291Y3QifQ.Ac0WMEuowA5AgxwqNrsmdw";
mapboxgl.accessToken = MAPBOX_TOKEN;

const Map = ({ driverLocation, pickupLocation, dropoffLocation }) => {
    const mapContainerRef = useRef(null);
  
    useEffect(() => {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [driverLocation[0], driverLocation[1]],
        zoom: 12,
      });
  
      const bounds = new mapboxgl.LngLatBounds();
  
      // Add driver marker and popup
      if (driverLocation?.length === 2) {
        const driverMarker = new mapboxgl.Marker({ color: "blue" })
          .setLngLat([driverLocation[0], driverLocation[1]])
          .addTo(map);
  
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat([driverLocation[0], driverLocation[1]])
          .setText("Driver Location")
          .addTo(map);
  
        bounds.extend([driverLocation[0], driverLocation[1]]);
      }
  
      // Add pickup marker and popup
      if (pickupLocation?.latitude && pickupLocation?.longitude) {
        const pickupCoordinates = [pickupLocation.latitude, pickupLocation.longitude];
        const pickupMarker = new mapboxgl.Marker({ color: "green" })
          .setLngLat(pickupCoordinates)
          .addTo(map);
  
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(pickupCoordinates)
          .setText("Pickup Location")
          .addTo(map);
  
        bounds.extend(pickupCoordinates);
      }
  
      // Add dropoff marker and popup
      if (dropoffLocation?.latitude && dropoffLocation?.longitude) {
        const dropoffCoordinates = [dropoffLocation.latitude, dropoffLocation.longitude];
        const dropoffMarker = new mapboxgl.Marker({ color: "red" })
          .setLngLat(dropoffCoordinates)
          .addTo(map);
  
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(dropoffCoordinates)
          .setText("Dropoff Location")
          .addTo(map);
  
        bounds.extend(dropoffCoordinates);
      }
  
      // Fit map to bounds if markers are present
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
  
      return () => map.remove(); // Cleanup on unmount
    }, [driverLocation, pickupLocation, dropoffLocation]);
  
    return (
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "400px", overflow: "hidden" }}
      />
    );
  };
  
  export default Map;

