// scripts/utils.js

/**
 * @file Utility-Funktionen für den Arbeitszeit-Rechner.
 * @description Diese Datei enthält wiederverwendbare Hilfsfunktionen für Zeitberechnungen, Formatierungen und die Anzeige von Ergebnissen, die von mehreren Skripten der Anwendung genutzt werden.
 * @author Jörn Unverzagt
 * @date 2025-10-13
*/

/**
 * Ermittelt die geltenden Kern- und Gleitzeiten für den aktuellen Tag in Minuten seit Mitternacht.
 * Berücksichtigt, dass die Kernzeit am Freitag früher endet.
 * @returns {object} Ein Objekt mit den Zeitangaben.
 * @property {number} gleitzeitStart - Beginn der Gleitzeit (in Minuten).
 * @property {number} kernzeitStart - Beginn der Kernzeit (in Minuten).
 * @property {number} kernzeitEnde - Ende der Kernzeit (in Minuten), variiert für Freitage.
 * @property {number} gleitzeitEnde - Ende der Gleitzeit (in Minuten).
 */
const getKernzeitUndGleitzeit = () => {
    const heute = new Date();
    const wochentag = heute.getDay();
    const gleitzeitStartMinuten = 6 * 60 + 45;
    const kernzeitStartMinuten = 8 * 60 + 45;
    const gleitzeitEndeMinuten = 19 * 60;
    let kernzeitEndeMinuten;
    if (wochentag === 5) { kernzeitEndeMinuten = 15 * 60; } 
    else { kernzeitEndeMinuten = 15 * 60 + 30; }
    return {
        gleitzeitStart: gleitzeitStartMinuten,
        kernzeitStart: kernzeitStartMinuten,
        kernzeitEnde: kernzeitEndeMinuten,
        gleitzeitEnde: gleitzeitEndeMinuten
    };
};

/**
 * Wandelt einen Zeit-String im Format "HH:MM" in die Gesamtminuten seit Mitternacht um.
 * @param {string} timeString - Der Zeit-String, der umgewandelt werden soll (z.B. "08:30").
 * @returns {number} Die Gesamtanzahl der Minuten seit Mitternacht.
 */
const timeStringToMinutes = (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Wandelt eine Gesamtminutenzahl in einen formatierten Zeit-String im Format "HH:MM" um.
 * @param {number} totalMinutes - Die Gesamtminuten seit Mitternacht.
 * @returns {string} Der formatierte Zeit-String (z.B. "16:45").
 */
const minutesToTimeString = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Formatiert eine Gesamtminutenzahl in einen lesbaren String (z.B. "-1 Std. 30 Min.").
 * Berücksichtigt positive und negative Werte und passt das Format an (nur Stunden, nur Minuten, oder beides).
 * @param {number} totalMinutes - Die zu formatierende Minutenzahl.
 * @returns {string} Der formatierte String für die Anzeige.
 */
const formatMinutesToString = (totalMinutes) => {
    if (isNaN(totalMinutes)) return "Ungültige Eingabe";
    const sign = totalMinutes < 0 ? "-" : "";
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = Math.round(absMinutes % 60);
    if (hours === 0) return `${sign}${minutes} Min.`;
    if (minutes === 0) return `${sign}${hours} Std.`;
    return `${sign}${hours} Std. ${minutes} Min.`;
};

/**
 * Zeigt eine formatierte Nachricht in einem dafür vorgesehenen Ergebnis-Container an.
 * Steuert auch die Einblende-Animation und die farbliche Gestaltung.
 * @param {HTMLElement} element - Das DOM-Element, in dem die Nachricht angezeigt werden soll.
 * @param {string} message - Die anzuzeigende Nachricht (kann HTML enthalten).
 * @param {string} [type='success'] - Der Typ der Nachricht ('success' oder 'error'), steuert die Farbe.
 */
const showResult = (element, message, type = 'success') => {
    element.innerHTML = message;
    element.className = 'ergebnis';
    element.classList.add(type);
    element.classList.add('show');
};

/**
 * Berechnet die verbleibende Zeit von der aktuellen Uhrzeit bis zu einer Ziel-Uhrzeit.
 * @param {string} zielZeitString - Die Ziel-Uhrzeit im Format "HH:MM".
 * @returns {string|null} Die formatierte Restzeit (z.B. "2 Std. und 15 Min.") oder `null`, wenn die Ziel-Uhrzeit bereits vergangen ist.
 */
const berechneRestzeitBis = (zielZeitString) => {
    if (!zielZeitString) return null;
    const jetzt = new Date();
    const jetztInMinuten = jetzt.getHours() * 60 + jetzt.getMinutes();
    const zielInMinuten = timeStringToMinutes(zielZeitString);
    const verbleibendeMinuten = Math.max(0, zielInMinuten - jetztInMinuten);
    if (verbleibendeMinuten > 0) {
        const stunden = Math.floor(verbleibendeMinuten / 60);
        const minuten = Math.round(verbleibendeMinuten % 60);
        return `${stunden} Std. und ${minuten} Min.`;
    }
    return null;
};

/**
 * Speichert den neuen Überstundensaldo im Local Storage und lädt die Seite neu.
 * Diese Funktion wird global verfügbar gemacht, um von `onclick`-Attributen im HTML aufgerufen werden zu können.
 * @param {number} time - Der neue Überstundensaldo als Dezimalzahl (z.B. 8.75 für 8h 45min).
 * @global
 */
function saveUeberH(time) {
    localStorage.setItem('userUeberstunden', time);
    alert(`Überstunden erfolgreich auf ${time} h gesetzt! Die Seite wird neu geladen, um die Werte zu übernehmen.`);
    window.location.reload(); 
}

// Macht die Funktion global verfügbar, damit `onclick` sie finden kann.
window.saveUeberH = saveUeberH;