// scripts/weather.ts

import { showToast } from './utils.js';
import { WEATHER_API_KEY } from './config.js';

let weatherLocationName = '';

// Status der Weatherfunktion
let weatherOK: boolean = false;

// Diese Funktion startet den gesamten Prozess
export function initializeWeather(): void {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'DEIN_PERSÖNLICHER_API_SCHLÜSSEL_HIER') {
        console.warn("Kein Wetter-API-Schlüssel eingetragen.");
        showToast('Kein Wetter-API-Schlüssel eingetragen.', 'info');
        weatherOK = false;
        return;
    }
    loadWeatherData();
}

/**
 * 
 */
async function loadWeatherData() {
    const mainContainer = document.getElementById('main-container');
    if ("geolocation" in navigator) {
        weatherOK = true;
        if (mainContainer) { mainContainer.style.marginTop = '10rem'; }
        navigator.geolocation.getCurrentPosition(fetchWeather, handleLocationError);
    } else {
        weatherOK = false;
        if (mainContainer) { mainContainer.style.marginTop = '6rem'; }
        console.warn("Geolocation wird von diesem Browser nicht unterstützt.");
    }
}

/**
 * 
 * @param position 
 */
async function fetchWeather(position: GeolocationPosition): Promise<void> {
    const { latitude, longitude } = position.coords;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=de`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API-Fehler: ${response.statusText}`);
        }
        const weatherData = await response.json();
        weatherLocationName = weatherData.name;
        updateWeatherUI(weatherData);
    } catch (error) {
        console.error("Fehler beim Abrufen der Wetterdaten:", error);
        showToast("Wetterdaten konnten nicht geladen werden.", 'error');
    }
}

/**
 * 
 * @param error 
 */
function handleLocationError(error: GeolocationPositionError): void {
    console.warn(`Fehler bei der Standortermittlung: ${error.message}`);
    showToast("Standort konnte nicht ermittelt werden.", 'error');
}

/**
 * 
 */
const widget = document.getElementById('weather-widget') as HTMLDivElement;
function updateWeatherUI(data: any): void {
    const icon = document.getElementById('weather-icon') as HTMLImageElement;
    const locationName = document.getElementById('weather-location-name') as HTMLSpanElement;
    const temp = document.getElementById('weather-temp') as HTMLSpanElement;
    const desc = document.getElementById('weather-desc') as HTMLSpanElement;

    if (!widget || !icon || !temp || !desc) return;

    const iconCode = data.weather[0].icon;
    icon.src = `https://openweathermap.org/img/wn/${iconCode}.png`;
    locationName.textContent = data.name + ":";
    temp.textContent = `${Math.round(data.main.temp)}°C`;
    desc.textContent = data.weather[0].description;

    widget.style.display = 'flex';
}

// Automatische Wetter Aktualisierung (alle 10min)
if (weatherOK) {
    setInterval(() => {
        loadWeatherData();
    }, 600000);
}

// Öffnet eine Google suche für das lokale Wetter
if (widget) {
    widget.addEventListener('click', async () => {
        window.open(`https://www.google.com/search?q=Wetter+${weatherLocationName}`, '_blank');
    });
}