import axios from "axios";
import OfflineService from "../services/OfflineService";

const URL = "https://api.weatherapi.com/v1/current.json";
const API_KEY = "b0a7bad410d5400c8c3145734251107";

// Initialize offline service
const offlineService = new OfflineService();

export const fetchWeather = async (cityName) => {
    // Check if we're online
    if (!offlineService.canMakeRequest()) {
        // Queue the request for later
        const requestId = offlineService.queueRequest({
            type: 'weather_by_city',
            data: { cityName }
        });
        
        // Return a promise that will be resolved when the request is processed
        return new Promise((resolve, reject) => {
            offlineService.onRequestProcessed(requestId, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    try {
        const { data } = await axios.get(URL, {
            params: {
                q: cityName,
                key: API_KEY
            }
        });
        return data;
    } catch (error) {
        // If network error, queue the request
        if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
            const requestId = offlineService.queueRequest({
                type: 'weather_by_city',
                data: { cityName }
            });
            
            return new Promise((resolve, reject) => {
                offlineService.onRequestProcessed(requestId, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
        throw error;
    }
}

export const fetchWeatherByCoords = async (lat, lon) => {
    // Check if we're online
    if (!offlineService.canMakeRequest()) {
        // Queue the request for later
        const requestId = offlineService.queueRequest({
            type: 'weather_by_coords',
            data: { lat, lon }
        });
        
        // Return a promise that will be resolved when the request is processed
        return new Promise((resolve, reject) => {
            offlineService.onRequestProcessed(requestId, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    try {
        const { data } = await axios.get(URL, {
            params: {
                q: `${lat},${lon}`,
                key: API_KEY
            }
        });
        return data;
    } catch (error) {
        // If network error, queue the request
        if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
            const requestId = offlineService.queueRequest({
                type: 'weather_by_coords',
                data: { lat, lon }
            });
            
            return new Promise((resolve, reject) => {
                offlineService.onRequestProcessed(requestId, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
        throw error;
    }
}

// Export offline service for use in components
export { offlineService };