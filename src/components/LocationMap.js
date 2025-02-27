import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default location (Mumbai)
const defaultPosition = [19.076, 72.8777];

const customMarker = new L.divIcon({
    className: "custom-icon",
    html: `
      <svg width="35" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path transform="rotate(180, 12, 12)"
          d="M12 24c-4.97 0-9-4.03-9-9 0-7 9-15 9-15s9 8 9 15c0 4.97-4.03 9-9 9zm0-11.5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          fill="#00008B"/>
      </svg>`,
    iconSize: [35, 45],
    iconAnchor: [17, 45], // Keep the anchor at the bottom
    popupAnchor: [1, -30],
  });
  

// Function to create a text label near the marker
const createLabelIcon = (label) => {
  return L.divIcon({
    className: "custom-label",
    html: `<div style="
      background-color: white;
      padding: 5px 10px;
      border-radius: 5px;
      box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
      font-size: 14px;
      font-weight: bold;
    ">${label}</div>`,
  });
};

const LocationMap = () => {
  const [initialLocation, setInitialLocation] = useState("Mumbai");
  const [destination, setDestination] = useState("Pune");
  const [initialCoords, setInitialCoords] = useState(defaultPosition);
  const [destinationCoords, setDestinationCoords] = useState([18.5204, 73.8567]);
  const [distance, setDistance] = useState(null);

  // Fetch coordinates from location name
  const fetchCoordinates = async (location, setCoords) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
      );
      const data = await response.json();
      if (data.length > 0) {
        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  // Handle manual location search
  const handleSearch = () => {
    fetchCoordinates(initialLocation, setInitialCoords);
    fetchCoordinates(destination, setDestinationCoords);
  };

  // Get current location (GPS)
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInitialCoords([latitude, longitude]);
          setInitialLocation("Current Location");
        },
        (error) => console.error("Error fetching current location:", error),
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Swap start and destination
  const swapLocations = () => {
    setInitialLocation(destination);
    setDestination(initialLocation);
    setInitialCoords(destinationCoords);
    setDestinationCoords(initialCoords);
  };

  // Calculate distance between two coordinates
  useEffect(() => {
    if (initialCoords && destinationCoords) {
      calculateDistance(initialCoords, destinationCoords);
    }
  }, [initialCoords, destinationCoords]);

  const calculateDistance = (coords1, coords2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (coords2[0] - coords1[0]) * (Math.PI / 180);
    const dLon = (coords2[1] - coords1[1]) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1[0] * (Math.PI / 180)) *
        Math.cos(coords2[0] * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    setDistance(distance.toFixed(2));
  };

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

      <MapContainer center={initialCoords} zoom={6} style={{ height: "500px", width: "100%" }}>
        {/* ✅ Satellite View for Bold Look */}
        <TileLayer 
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
        />

        {/* 📍 Markers with Custom Labels */}
        <Marker position={initialCoords} icon={customMarker}>
          <Popup><b>{initialLocation}</b></Popup>
        </Marker>
        <Marker position={destinationCoords} icon={customMarker}>
          <Popup><b>{destination}</b></Popup>
        </Marker>

        {/* 🔖 Name Labels Near Markers */}
        <Marker position={[initialCoords[0] + 0.2, initialCoords[1]]} icon={createLabelIcon(initialLocation)} />
        <Marker position={[destinationCoords[0] + 0.2, destinationCoords[1]]} icon={createLabelIcon(destination)} />

        {/* 🔴 Bold Route (Polyline) */}
        <Polyline 
          positions={[initialCoords, destinationCoords]} 
          color="red" 
          weight={6} // Thicker line
          opacity={0.8} 
        />
      </MapContainer>

      {distance && <div className="distance-info"> Distance: {distance} km</div>}
    </div>
  );
};

export default LocationMap;
