// scripts/logbook-data.ts

/**
 * @module logbook-data
 * @description Enthält die Kernfunktionen und Typendefinitionen für den Zugriff auf Logbuchdaten.
 * @author Joern Unverzagt
 */

export const LOGBOOK_KEY = 'workLogbook';

/**
 * Logbuch-Typdefinition
 */
export interface LogEntry {
    id: number;
    date: string;
    arrival: string;
    leaving: string;
    targetHours: number;
    dailySaldoMinutes: number;
}

/**
 * Gibt das Logbuch aus dem Local Storage zurück.
 * @returns {LogEntry[]}
 */
export function getLog(): LogEntry[] {
    const log = localStorage.getItem(LOGBOOK_KEY);
    return log ? JSON.parse(log) : [];
}

/**
 * Prüft, ob für den heutigen Tag ein Eintrag im Logbuch existiert.
 * @returns {LogEntry | undefined} Den heutigen Eintrag oder undefined.
 */
export function getTodayLogEntry(): LogEntry | undefined {
    const logData = getLog();
    const todayDateString = new Date().toLocaleDateString('de-DE');
    return logData.find(entry => entry.date === todayDateString);
}
