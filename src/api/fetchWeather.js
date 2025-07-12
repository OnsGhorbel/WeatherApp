import axios from "axios";

const URL = "https://api.weatherapi.com/v1/current.json";
const API_KEY = "b0a7bad410d5400c8c3145734251107";

export const fetchWeather = async (cityName) => {
    const { data } = await axios.get(URL, {
        params: {
            q: cityName,
            key: API_KEY
        }
    })
    return data;
}