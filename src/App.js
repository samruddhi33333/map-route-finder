import React from "react";
import LocationMap from "./components/LocationMap";

import "./App.css";
function App() {
  return (
    <div className="App">
      <h1 className="text-center text-2xl font-bold my-4">Interactive Location Map</h1>
      <LocationMap />
    </div>
  );
}

export default App;
