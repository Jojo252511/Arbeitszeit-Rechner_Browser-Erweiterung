// scripts/utils.ts

/**
 * @file Utility-Funktionen für den Arbeitszeit-Rechner.
 * @description Diese Datei enthält wiederverwendbare Hilfsfunktionen für Zeitberechnungen, Formatierungen und die Anzeige von Ergebnissen.
 * @author Joern Unverzagt
 */


export interface ZeitPunkte {
    gleitzeitStart: number;
    kernzeitStart: number;
    kernzeitEnde: number;
    gleitzeitEnde: number;
}

declare global {
    interface Window {
        saveUeberH: (time: number) => void;
    }
}

// --- GLOBALE HILFSFUNKTIONEN ---

/**
 * Ermittelt die geltenden Kern- und Gleitzeiten für den aktuellen Tag in Minuten seit Mitternacht.
 * @returns {ZeitPunkte} Ein Objekt mit den Zeitangaben in Minuten.
 */
export const getKernzeitUndGleitzeit = (): ZeitPunkte => {
    const heute = new Date();
    const wochentag = heute.getDay();
    const gleitzeitStart = localStorage.getItem('userGleitzeitStart') || '06:45';
    const kernzeitStart = localStorage.getItem('userKernzeitStart') || '08:45';
    const kernzeitEndeMoDo = localStorage.getItem('userKernzeitEnde') || '15:30';
    const kernzeitEndeFr = localStorage.getItem('userKernzeitEndeFr') || '15:00';
    const gleitzeitEnde = localStorage.getItem('userGleitzeitEnde') || '19:00';
    const aktuellesKernzeitEnde = (wochentag === 5) ? kernzeitEndeFr : kernzeitEndeMoDo;
    return {
        gleitzeitStart: timeStringToMinutes(gleitzeitStart),
        kernzeitStart: timeStringToMinutes(kernzeitStart),
        kernzeitEnde: timeStringToMinutes(aktuellesKernzeitEnde),
        gleitzeitEnde: timeStringToMinutes(gleitzeitEnde)
    };
};

/**
 * Wandelt einen Zeit-String im Format "HH:MM" in die Gesamtminuten seit Mitternacht um.
 * @param {string} timeString - Der Zeit-String (z.B. "08:30").
 * @returns {number} Die Gesamtanzahl der Minuten.
 */
export const timeStringToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Wandelt eine Gesamtminutenzahl in einen formatierten Zeit-String im Format "HH:MM" um.
 * @param {number} totalMinutes - Die Gesamtminuten seit Mitternacht.
 * @returns {string} Der formatierte Zeit-String (z.B. "16:45").
 */
export const minutesToTimeString = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Formatiert eine Gesamtminutenzahl in einen lesbaren String (z.B. "-1 Std. 30 Min.").
 * @param {number} totalMinutes - Die zu formatierende Minutenzahl.
 * @returns {string} Der formatierte String für die Anzeige.
 */
export const formatMinutesToString = (totalMinutes: number): string => {
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
 * Zeigt eine formatierte Nachricht in einem Ergebnis-Container an.
 * @param {HTMLElement} element - Das DOM-Element für die Anzeige.
 * @param {string} message - Die anzuzeigende Nachricht (kann HTML enthalten).
 * @param {string} [type='success'] - Der Typ der Nachricht ('success' oder 'error').
 */
export const showResult = (element: HTMLElement, message: string, type: string = 'success'): void => {
    element.innerHTML = message;
    element.className = 'ergebnis';
    element.classList.add(type);
    element.classList.add('show');
};

/**
 * Berechnet die verbleibende Zeit von der aktuellen Uhrzeit bis zu einer Ziel-Uhrzeit.
 * @param {string} zielZeitString - Die Ziel-Uhrzeit im Format "HH:MM".
 * @returns {string|null} Die formatierte Restzeit oder `null`, wenn die Zeit vergangen ist.
 */
export const berechneRestzeitBis = (zielZeitString: string): string | null => {
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
 * Speichert den neuen Überstundensaldo im Local Storage und löst ein Event aus.
 * @param {number} time - Der neue Überstundensaldo als Dezimalzahl.
 */
export function saveUeberH(time: number): void {
    const timeAsString = String(time.toFixed(2));
    localStorage.setItem('userUeberstunden', timeAsString);
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const savedUeberstunden = localStorage.getItem('userUeberstunden');
        if (savedUeberstunden !== null) {
            hauptUeberstundenInput.value = savedUeberstunden;
        }
    // Löst ein Event aus, damit andere Teile der Anwendung reagieren können.
    document.dispatchEvent(new CustomEvent('ueberstundenUpdated', { detail: { newSaldo: timeAsString } }));
}