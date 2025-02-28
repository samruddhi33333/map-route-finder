import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultPosition = [19.076, 72.8777]; // Mumbai

const customMarker = new L.divIcon({
  className: "custom-icon",
  html: `
    <svg width="35" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path transform="rotate(180, 12, 12)"
        d="M12 24c-4.97 0-9-4.03-9-9 0-7 9-15 9-15s9 8 9 15c0 4.97-4.03 9-9 9zm0-11.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
        fill="#00008B"/>
    </svg>`,
  iconSize: [35, 45],
  iconAnchor: [17, 45],
  popupAnchor: [1, -30],
});

const LocationMap = () => {
  const [initialLocation, setInitialLocation] = useState("Mumbai");
  const [destination, setDestination] = useState("Pune");
  const [initialCoords, setInitialCoords] = useState(defaultPosition);
  const [destinationCoords, setDestinationCoords] = useState([18.5204, 73.8567]);
  const [distance, setDistance] = useState(null);

  // Fetch coordinates from location name
  const fetchCoordinates = async (location) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
      );
      const data = await response.json();
      if (data.length > 0) {
        return {
          coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
          placeDetails: data[0].display_name,
        };
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
    return null;
  };

  // Fetch place name (village, city, pin code) from coordinates
  const fetchPlaceName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      if (data && data.address) {
        const { postcode, village, town, city, state } = data.address;
        const placeName = `${village || town || city || state || "Unknown Place"} (${postcode || "No Pin"})`;
        return placeName;
      }
    } catch (error) {
      console.error("Error fetching place name:", error);
    }
    return "Unknown Location";
  };

  // Handle location search
  const handleSearch = async () => {
    const startData = await fetchCoordinates(initialLocation);
    const endData = await fetchCoordinates(destination);

    if (startData) {
      setInitialCoords(startData.coords);
      setInitialLocation(await fetchPlaceName(startData.coords[0], startData.coords[1]));
    }
    if (endData) {
      setDestinationCoords(endData.coords);
      setDestination(await fetchPlaceName(endData.coords[0], endData.coords[1]));
    }
  };

  // Get user's current location and fetch village/town name
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setInitialCoords([latitude, longitude]);

          // Fetch place name using pin code
          const placeName = await fetchPlaceName(latitude, longitude);
          setInitialLocation(placeName);
        },
        (error) => console.error("Error fetching current location:", error),
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Swap locations
  const swapLocations = () => {
    setInitialLocation(destination);
    setDestination(initialLocation);
    setInitialCoords(destinationCoords);
    setDestinationCoords(initialCoords);
  };

  // Calculate distance
  useEffect(() => {
    if (initialCoords && destinationCoords) {
      const R = 6371;
      const dLat = (destinationCoords[0] - initialCoords[0]) * (Math.PI / 180);
      const dLon = (destinationCoords[1] - initialCoords[1]) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(initialCoords[0] * (Math.PI / 180)) *
          Math.cos(destinationCoords[0] * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistance((R * c).toFixed(2));
    }
  }, [initialCoords, destinationCoords]);

  return (
    <div className="container">
      <div className="input-container">
        <input
          type="text"
          value={initialLocation}
          onChange={(e) => setInitialLocation(e.target.value)}
          placeholder="Enter starting location"
        />
        <button onClick={handleCurrentLocation}>📍 Use Current Location</button>
        <button onClick={swapLocations}>🔄 Swap</button>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination"
        />
        <button onClick={handleSearch}>🔍 Search</button>
      </div>

      <MapContainer center={initialCoords} zoom={7} style={{ height: "500px", width: "100%" }}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Markers */}
        <Marker position={initialCoords} icon={customMarker}>
          <Popup><b>{initialLocation}</b></Popup>
        </Marker>
        <Marker position={destinationCoords} icon={customMarker}>
          <Popup><b>{destination}</b></Popup>
        </Marker>

        {/* Route Line */}
        <Polyline 
          positions={[initialCoords, destinationCoords]} 
          color="blue" 
          weight={6} 
          opacity={0.7} 
        />
      </MapContainer>

      {distance && <div className="distance-info"> Distance: {distance} km</div>}
    </div>
  );
};

export default LocationMap;
