// scripts/weather.ts
import { showToast } from './utils.js';
import { WEATHER_API_KEY } from './config.js';

let weatherLocationName = '';


/**
 * Führt die Initialisierung der Wetterfunktion durch.
 * @returns 
 */
export async function initializeWeather(): Promise<void> {
    const settings = await chrome.storage.sync.get({
        userWeatherEnabled: true, // Standardmäßig aktiviert
        WEATHER_API_KEY: null
    });

    // Prüfen, ob die Wetterfunktion überhaupt aktiviert ist
    if (!settings.userWeatherEnabled) {
        console.log("Wetterfunktion ist deaktiviert.");
        hideWeatherWidget(); // Widget ausblenden, falls es sichtbar war
        return;
    }

    // API Key Check
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'DEIN_PERSÖNLLICHER_API_SCHLÜSSEL_HIER' || !WEATHER_API_KEY.trim()) {
        console.warn("Kein Wetter-API-Schlüssel eingetragen.");
        showToast('Kein Wetter-API-Schlüssel eingetragen.', 'info');
        hideWeatherWidget();
        return;
    }

    // Wenn aktiviert und API Key vorhanden, lade die Daten
    await loadWeatherData();
}

/**
 * Lädt Wetterdaten basierend auf den Einstellungen (automatisch oder manuell).
 */
async function loadWeatherData() {
    const settings = await chrome.storage.sync.get({
        userWeatherLocationMode: false, // false = auto, true = manual
        userWeatherManualLocation: ''
    });

    const mainContainer = document.getElementById('main-container');

    if (settings.userWeatherLocationMode && settings.userWeatherManualLocation.trim()) {
        // Manueller Modus
        if (mainContainer) { mainContainer.style.marginTop = '10rem'; }
        await fetchWeatherByLocationName(settings.userWeatherManualLocation.trim());
        updateWeather(); // Startet Intervall für Updates
    } else if (!settings.userWeatherLocationMode && "geolocation" in navigator) {
        // Automatischer Modus (Geolocation)
        if (mainContainer) { mainContainer.style.marginTop = '10rem'; }
        navigator.geolocation.getCurrentPosition(fetchWeatherByCoords, handleLocationError);
        updateWeather(); // Startet Intervall für Updates
    } else if (!settings.userWeatherLocationMode) {
        // Automatischer Modus, aber Geolocation nicht verfügbar
        if (mainContainer) { mainContainer.style.marginTop = '6rem'; }
        console.warn("Geolocation wird von diesem Browser nicht unterstützt oder wurde abgelehnt.");
        showToast("Automatischer Standort nicht verfügbar.", 'error');
        hideWeatherWidget();
    } else {
        // Manueller Modus, aber kein Ort eingegeben
        if (mainContainer) { mainContainer.style.marginTop = '6rem'; }
         showToast("Bitte gib einen Ort in den Wetter-Einstellungen ein.", 'info');
        hideWeatherWidget();
    }
}

/**
 * Holt Wetterdaten basierend auf Koordinaten (vorher fetchWeather).
 * @param position GeolocationPosition Objekt.
 */
async function fetchWeatherByCoords(position: GeolocationPosition): Promise<void> {
    const { latitude, longitude } = position.coords;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=de`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
             throw new Error(`API Fehler (${response.status}): ${response.statusText}`);
        }
        const weatherData = await response.json();
        if (weatherData.cod && weatherData.cod !== 200) { // OpenWeatherMap Fehlercodes prüfen
            throw new Error(`API Fehler (${weatherData.cod}): ${weatherData.message}`);
        }
        weatherLocationName = weatherData.name; // Für Klick-Handler speichern
        updateWeatherUI(weatherData);
    } catch (error) {
        console.error(`Fehler beim Abrufen der Wetterdaten für Koordinaten ${latitude}|${longitude}:`, error);
        showToast("Wetterdaten (Auto) konnten nicht geladen werden.", 'error');
        hideWeatherWidget(); // Widget ausblenden bei Fehler
    }
}

/**
 * Holt Wetterdaten basierend auf einem Ortsnamen.
 * @param locationName Der Name des Ortes.
 */
async function fetchWeatherByLocationName(locationName: string): Promise<void> {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationName)}&appid=${WEATHER_API_KEY}&units=metric&lang=de`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API Fehler (${response.status}): ${response.statusText}`);
        }
        const weatherData = await response.json();
         if (weatherData.cod && weatherData.cod !== 200) { // OpenWeatherMap Fehlercodes prüfen
             if (weatherData.cod === 404) {
                 throw new Error(`Ort "${locationName}" nicht gefunden.`);
             } else {
                throw new Error(`API Fehler (${weatherData.cod}): ${weatherData.message}`);
             }
        }
        weatherLocationName = weatherData.name; // Für Klick-Handler speichern
        updateWeatherUI(weatherData);
    } catch (error) {
        console.error(`Fehler beim Abrufen der Wetterdaten für Ort "${locationName}":`, error);
        const errorMsg = (error instanceof Error) ? error.message : "Wetterdaten (Manuell) konnten nicht geladen werden.";
        showToast(errorMsg, 'error');
        hideWeatherWidget(); // Widget ausblenden bei Fehler
    }
}


/**
 * Behandelt Fehler bei der Standortermittlung.
 * @param error GeolocationPositionError Objekt.
 */
function handleLocationError(error: GeolocationPositionError): void {
    console.warn(`Fehler bei der Standortermittlung: ${error.message}`);
    showToast("Automatischer Standort konnte nicht ermittelt werden.", 'error');
    hideWeatherWidget();
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) { mainContainer.style.marginTop = '6rem'; } // Margin zurücksetzen
}

/**
 * Aktualisiert das UI des Wetter-Widgets.
 */
function updateWeatherUI(data: any): void {
    const widget = document.getElementById('weather-widget') as HTMLDivElement;
    const icon = document.getElementById('weather-icon') as HTMLImageElement;
    const locationNameEl = document.getElementById('weather-location-name') as HTMLSpanElement; // Umbenannt für Klarheit
    const temp = document.getElementById('weather-temp') as HTMLSpanElement;
    const desc = document.getElementById('weather-desc') as HTMLSpanElement;

    if (!widget || !icon || !locationNameEl || !temp || !desc) return;

    // Prüfen ob Datenstruktur wie erwartet ist
    if (!data || !data.weather || !data.weather[0] || !data.main) {
        console.error("Unerwartete Wetterdatenstruktur:", data);
        showToast("Fehlerhafte Wetterdaten erhalten.", "error");
        hideWeatherWidget();
        return;
    }


    const iconCode = data.weather[0].icon;
    icon.src = `https://openweathermap.org/img/wn/${iconCode}.png`;
    icon.alt = data.weather[0].description || 'Wetter-Icon';
    locationNameEl.textContent = data.name + ":";
    temp.textContent = `${Math.round(data.main.temp)}°C`;
    desc.textContent = data.weather[0].description;

    widget.style.display = 'flex'; // Widget anzeigen
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) { mainContainer.style.marginTop = '10rem'; }
}

/**
 * Blendet das Wetter-Widget aus und setzt ggf. Margin zurück.
 */
function hideWeatherWidget(): void {
    const widget = document.getElementById('weather-widget') as HTMLDivElement;
    if (widget) {
        widget.style.display = 'none';
    }
    const mainContainer = document.getElementById('main-container');
    if (mainContainer && mainContainer.style.marginTop === '10rem') {
         mainContainer.style.marginTop = '6rem'; // Margin zurücksetzen, falls es wegen Wetter gesetzt war
    }
}

/**
 * Startet die automatische Wetteraktualisierung alle 10 Minuten,
 * aber nur, wenn die Wetterfunktion aktiviert ist.
 */
let weatherIntervalId: number | undefined; // ID für das Intervall speichern
async function updateWeather() {
    // Intervall stoppen, falls es bereits läuft
    if (weatherIntervalId) {
        clearInterval(weatherIntervalId);
        weatherIntervalId = undefined;
    }

     const settings = await chrome.storage.sync.get({ userWeatherEnabled: true });

    if (settings.userWeatherEnabled) {
        // Automatisches Wetter-Update (alle 10 Minuten) starten
        weatherIntervalId = window.setInterval(async () => {
             // Erneut prüfen, ob Wetter noch aktiviert ist, bevor Daten geladen werden
            const currentSettings = await chrome.storage.sync.get({ userWeatherEnabled: true });
            if (currentSettings.userWeatherEnabled) {
                await loadWeatherData();
                const now = new Date();
                console.log(`${now.toLocaleTimeString()} | Wetterdaten wurden automatisch aktualisiert.`);
            } else {
                 console.log("Wetter-Update übersprungen, Funktion wurde deaktiviert.");
                 hideWeatherWidget(); // Widget ausblenden, wenn deaktiviert
                 if (weatherIntervalId) {
                     clearInterval(weatherIntervalId); // Intervall stoppen
                     weatherIntervalId = undefined;
                 }
            }
        }, 600000); // 600000 ms = 10 Minuten
    } else {
        console.log("Automatisches Wetter-Update nicht gestartet (deaktiviert).");
        hideWeatherWidget(); // Sicherstellen, dass Widget ausgeblendet ist
    }
}

// Event Listener für Klick auf Widget (bleibt)
const widget = document.getElementById('weather-widget') as HTMLDivElement;
if (widget) {
    widget.addEventListener('click', () => {
        if (weatherLocationName) { // Nur öffnen, wenn ein Ort bekannt ist
            window.open(`https://www.google.com/search?q=Wetter+${encodeURIComponent(weatherLocationName)}`, '_blank');
        }
    });
}