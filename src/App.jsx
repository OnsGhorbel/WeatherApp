import React, { useState, useEffect } from "react";
import { fetchWeather, fetchWeatherByCoords } from "./api/fetchWeather";
import NotificationSettings from "./components/NotificationSettings";
import OfflineStatus from "./components/OfflineStatus";
import initializeNotifications from "./utils/initNotifications";
import "./App.css";

const App = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [cityName, setCityName] = useState("");
  const [error, setError] = useState(null);
  const [isCelsius, setIsCelsius] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    const savedSearches =
      JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(savedSearches);
    
    // Initialize notifications
    initializeNotifications();
    
    // Try to get user's location on app load
    getUserLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationPermission("not_supported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationPermission("granted");
        fetchWeatherByLocation(latitude, longitude);
      },
      (error) => {
        setLocationPermission("denied");
        setLoading(false);
        console.log("Location access denied:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const fetchWeatherByLocation = async (lat, lon) => {
    try {
      const data = await fetchWeatherByCoords(lat, lon);
      setWeatherData(data);
      setError(null);
    } catch (error) {
      if (!navigator.onLine) {
        setError("Location weather request has been queued. Data will be loaded when internet connection is restored.");
      } else {
        setError("Unable to fetch weather for your location.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (city) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchWeather(city);
      setWeatherData(data);
      setCityName("");
      updateRecentSearches(data.location.name);
    } catch (error) {
      if (!navigator.onLine) {
        setError(`Request for "${city}" has been queued. Weather data will be loaded when internet connection is restored.`);
        setCityName("");
      } else {
        setError("City not found. Please try again.");
      }
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchData(cityName);
    }
  };

  const updateRecentSearches = (city) => {
    const updatedSearches = [
      city,
      ...recentSearches.filter((c) => c !== city),
    ].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  const handleRecentSearch = (city) => {
    setCityName(city);
    fetchData(city);
  };

  const toggleTemperatureUnit = (city) => {
    setIsCelsius(!isCelsius);
  };

  const getTemperature = () => {
    if (!weatherData) return "";
    return isCelsius
      ? `${weatherData.current.temp_c} °C`
      : `${weatherData.current.temp_f} °F`;
  };

  return (
    <div>
      <div className="app">
        <h1>Weather App</h1>
        
        <OfflineStatus />
        
        <div className="search">
          <input
            type="text"
            placeholder="Enter city name..."
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={() => fetchData(cityName)} disabled={!cityName || loading}>
            Search
          </button>
        </div>
        <div className="location-section">
          <button 
            onClick={getUserLocation} 
            disabled={loading}
            className="location-btn"
          >
            📍 Use My Location
          </button>
          {locationPermission === "denied" && (
            <p className="location-message">
              Location access denied. Please enable location or search manually.
            </p>
          )}
          {locationPermission === "not_supported" && (
            <p className="location-message">
              Geolocation is not supported by this browser.
            </p>
          )}
        </div>
        <div className="unit-toggle">
          <span>°C</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={!isCelsius}
              onChange={toggleTemperatureUnit}
            />
            <span className="slider round"></span>
          </label>
          <span>°F</span>
        </div>
        {loading && <div className="loading">Loading...</div>}
        {error && (
          <div className={`error ${!navigator.onLine ? 'offline' : ''}`}>
            {error}
          </div>
        )}
        {!weatherData && !loading && !error && (
          <div className="welcome-message">
            <p>Welcome! Click "Use My Location" to see local weather or search for a city.</p>
          </div>
        )}
        {weatherData && (
          <div className="weather-info">
            <h2>
              {weatherData.location.name}, {weatherData.location.region},{" "}
              {weatherData.location.country}
            </h2>
            <p>Temperature: {getTemperature()}</p>
            <p>Condition: {weatherData.current.condition.text}</p>
            <img
              src={weatherData.current.condition.icon}
              alt={weatherData.current.condition.text}
            />
            <p>Humidity: {weatherData.current.humidity}%</p>
            <p>Pressure: {weatherData.current.pressure_mb} mb</p>
            <p>Visibility: {weatherData.current.vis_km} km</p>
          </div>
        )}
        {recentSearches.length > 0 && (
          <div className="recent-searches">
            <h3>Recent Searches</h3>
            <ul>
              {recentSearches.map((city, index) => (
                <li key={index} onClick={() => handleRecentSearch(city)}>
                  {city}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <NotificationSettings />
      </div>
    </div>
  );
};

export default App;
