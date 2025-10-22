// scripts/importLog.ts

import { type LogEntry, getLog, saveLog } from './logbook-data.js';
import { timeStringToMinutes, showToast, showConfirm } from './utils.js';

/**
 * Verarbeitet eine importierte Datei (JSON oder CSV) und fügt die Daten dem Logbuch hinzu.
 * @param {File} file - Die zu importierende Datei.
 */
export async function handleFileImport(file: File): Promise<void> {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let importedLog: LogEntry[] = [];
            const content = e.target?.result as string;
            if (!content) throw new Error("File content is empty.");

            if (file.name.endsWith('.json')) {
                importedLog = JSON.parse(content);
            } else if (file.name.endsWith('.csv')) {
                const header = content.trim().split('\n')[0].trim();
                if (header.includes('Datum') && header.includes('Kommen') && header.includes('Gehen')) {
                    importedLog = await parseInternalCsv(content);
                } else if (header.includes('Datum') && header.includes('Uhrzeit') && header.includes('Typ')) {
                    importedLog = await parseExternalCsv(content);
                } else {
                    showToast('Unbekanntes CSV-Format. Spalten nicht erkannt.', 'error');
                    return;
                }
            } else {
                showToast('Ungültiger Dateityp. Bitte eine .json oder .csv Datei auswählen.', 'error');
                return;
            }

            const isValidLog = Array.isArray(importedLog) && importedLog.every(
                (entry: any) => typeof entry === 'object' && entry !== null && 'id' in entry && 'date' in entry
            );

            if (isValidLog) {
                const merge = await showConfirm(
                    "Logbuch importieren",
                    "Möchtest du die importierten Daten mit dem aktuellen Logbuch zusammenführen?<br>Bestehende Tage werden dabei überschrieben."
                );
                if (merge) {
                    const currentLog = await getLog();
                    const logMap = new Map<number, LogEntry>();
                    currentLog.forEach(entry => logMap.set(entry.id, entry));
                    importedLog.forEach(entry => logMap.set(entry.id, entry));
                    const mergedLog = Array.from(logMap.values());
                    await saveLog(mergedLog);
                    document.dispatchEvent(new CustomEvent('logbookUpdated'));
                    showToast('Logbuch erfolgreich importiert und zusammengeführt.', 'success');
                }
            } else if (importedLog && importedLog.length > 0) {
                showToast('Die ausgewählte Datei hat kein gültiges Logbuch-Format.', 'error');
            }
        } catch (error) {
            console.error("Import error:", error);
            showToast('Fehler beim Lesen oder Parsen der Datei.', 'error');
        }
    };
    reader.readAsText(file);
}

async function parseInternalCsv(csvText: string): Promise<LogEntry[]> {
    const lines = csvText.trim().split('\n').slice(1);
    const newLogEntries: LogEntry[] = [];
    const settings = await chrome.storage.sync.get({ userSollzeit: '8', userIsMinderjaehrig: false });
    const targetHours = parseFloat(settings.userSollzeit);
    const isMinderjaehrig = settings.userIsMinderjaehrig;
    const pausenDauer = isMinderjaehrig ? 60 : 45;

    for (const line of lines) {
        const values = line.split(';');
        if (values.length < 3) continue;
        const [dateStr, arrivalStr, leavingStr, , label] = values.map(v => v.trim());

        if (dateStr && arrivalStr && leavingStr) {
            const [day, month, year] = dateStr.split('.').map(Number);
            const dateObj = new Date(year, month - 1, day);
            dateObj.setHours(0, 0, 0, 0);

            const arrivalMinutes = timeStringToMinutes(arrivalStr);
            const leavingMinutes = timeStringToMinutes(leavingStr);
            const gearbeiteteMinuten = leavingMinutes - arrivalMinutes - pausenDauer;
            const sollzeitInMinuten = targetHours * 60;
            const dailySaldoMinutes = gearbeiteteMinuten - sollzeitInMinuten;

            newLogEntries.push({
                id: dateObj.getTime(), date: dateStr, arrival: arrivalStr, leaving: leavingStr,
                targetHours: targetHours, dailySaldoMinutes: Math.round(dailySaldoMinutes), label: label || 'Arbeit'
            });
        }
    }
    return newLogEntries;
}

async function parseExternalCsv(csvText: string): Promise<LogEntry[]> {
    const lines = csvText.trim().split('\n');
    const header = lines[0].split(';').map(h => h.trim());
    const dateIndex = header.indexOf('Datum');
    const timeIndex = header.indexOf('Uhrzeit');
    const typeIndex = header.indexOf('Typ');

    if (dateIndex === -1 || timeIndex === -1 || typeIndex === -1) {
        showToast('CSV-Datei konnte nicht verarbeitet werden. Benötigte Spalten: Datum, Uhrzeit, Typ', 'error');
        return [];
    }

    const dailyData: { [key: string]: { Kommen?: string, Gehen?: string } } = {};

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const date = values[dateIndex].trim();
        const time = values[timeIndex].trim();
        const type = values[typeIndex].trim();

        if (!dailyData[date]) dailyData[date] = {};
        if (type === 'Kommen') dailyData[date].Kommen = time;
        else if (type === 'Gehen') dailyData[date].Gehen = time;
    }

    const newLogEntries: LogEntry[] = [];
    const settings = await chrome.storage.sync.get({ userSollzeit: '8', userIsMinderjaehrig: false });
    const targetHours = parseFloat(settings.userSollzeit);
    const isMinderjaehrig = settings.userIsMinderjaehrig;
    const pausenDauer = isMinderjaehrig ? 60 : 45;

    for (const dateStr in dailyData) {
        const data = dailyData[dateStr];
        if (data.Kommen && data.Gehen) {
            const [day, month, year] = dateStr.split('.').map(Number);
            const dateObj = new Date(year, month - 1, day);
            dateObj.setHours(0, 0, 0, 0);

            const arrivalMinutes = timeStringToMinutes(data.Kommen);
            const leavingMinutes = timeStringToMinutes(data.Gehen);
            const gearbeiteteMinuten = leavingMinutes - arrivalMinutes - pausenDauer;
            const sollzeitInMinuten = targetHours * 60;
            const dailySaldoMinutes = gearbeiteteMinuten - sollzeitInMinuten;

            newLogEntries.push({
                id: dateObj.getTime(), date: dateStr, arrival: data.Kommen, leaving: data.Gehen,
                targetHours: targetHours, dailySaldoMinutes: Math.round(dailySaldoMinutes), label: 'Arbeit'
            });
        }
    }
    return newLogEntries;
}