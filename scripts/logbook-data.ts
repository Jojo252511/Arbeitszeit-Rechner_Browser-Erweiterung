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
 * Lädt das Logbuch aus dem Speicher (sync oder local).
 * @returns {Promise<LogEntry[]>}
 */
export async function getLog(): Promise<LogEntry[]> {
    const syncEnabled = (await chrome.storage.sync.get('userLogbookSync')).userLogbookSync === true;
    const storageArea = syncEnabled ? chrome.storage.sync : chrome.storage.local;
    const result = await storageArea.get(LOGBOOK_KEY);
    return result[LOGBOOK_KEY] || [];
}

/**
 * Speichert das Logbuch im Speicher (sync oder local).
 * @param {LogEntry[]} logData - Die zu speichernden Log-Einträge.
 */
export async function saveLog(logData: LogEntry[]): Promise<void> {
    const syncEnabled = (await chrome.storage.sync.get('userLogbookSync')).userLogbookSync === true;
    const storageArea = syncEnabled ? chrome.storage.sync : chrome.storage.local;
    
    try {
        await storageArea.set({ [LOGBOOK_KEY]: logData });
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            alert('Fehler beim Speichern des Logbuchs! Eventuell ist der Speicher voll.');
            return;
        }
        document.dispatchEvent(new CustomEvent('logbookUpdated'));
    } catch (e) {
        // Dieser Fehler tritt auf, wenn das Sync-Limit überschritten wird.
        console.error(e);
        alert('Sync-Fehler! Dein Logbuch ist wahrscheinlich zu groß für die Cloud-Synchronisation. Deaktiviere sie in den Einstellungen.');
    }
}


/**
 * Prüft, ob für den heutigen Tag ein Eintrag im Logbuch existiert.
 * @returns {Promise<LogEntry | undefined>} Den heutigen Eintrag oder undefined.
 */
export async function getTodayLogEntry(): Promise<LogEntry | undefined> {
    const logData = await getLog();
    const todayDateString = new Date().toLocaleDateString('de-DE');
    return logData.find(entry => entry.date === todayDateString);
}
