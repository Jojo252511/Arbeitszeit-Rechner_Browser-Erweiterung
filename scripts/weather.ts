// scripts/weather.ts

import { showToast } from './utils.js';

const API_KEY = 'DEIN_PERSÖNLICHER_API_SCHLÜSSEL'; // <-- HIER DEINEN API-SCHLÜSSEL EINTRAGEN

// Diese Funktion startet den gesamten Prozess
export function initializeWeather(): void {
    if (!API_KEY || API_KEY === "DEIN_PERSÖNLICHER_API_SCHLÜSSEL") {
        console.warn("Kein Wetter-API-Schlüssel eingetragen.");
        showToast('Kein Wetter-API-Schlüssel eingetragen.', 'info')
        return;
    }

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(fetchWeather, handleLocationError);
    } else {
        console.warn("Geolocation wird von diesem Browser nicht unterstützt.");
    }
}

async function fetchWeather(position: GeolocationPosition): Promise<void> {
    const { latitude, longitude } = position.coords;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=de`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API-Fehler: ${response.statusText}`);
        }
        const weatherData = await response.json();
        updateWeatherUI(weatherData);
    } catch (error) {
        console.error("Fehler beim Abrufen der Wetterdaten:", error);
        showToast("Wetterdaten konnten nicht geladen werden.", 'error');
    }
}

function handleLocationError(error: GeolocationPositionError): void {
    console.warn(`Fehler bei der Standortermittlung: ${error.message}`);
    showToast("Standort konnte nicht ermittelt werden.", 'error');
}

function updateWeatherUI(data: any): void {
    const widget = document.getElementById('weather-widget') as HTMLDivElement;
    const icon = document.getElementById('weather-icon') as HTMLImageElement;
    const temp = document.getElementById('weather-temp') as HTMLSpanElement;
    const desc = document.getElementById('weather-desc') as HTMLSpanElement;

    if (!widget || !icon || !temp || !desc) return;

    const iconCode = data.weather[0].icon;
    icon.src = `https://openweathermap.org/img/wn/${iconCode}.png`;
    temp.textContent = `${Math.round(data.main.temp)}°C`;
    desc.textContent = data.weather[0].description;

    widget.style.display = 'flex';
}