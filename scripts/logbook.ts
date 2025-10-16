// scripts/logbook.ts

/**
 * @module logbook
 * @description Verwaltung und Anzeige des Arbeitszeit-Logbuchs mit Import/Export-Funktionalität.
 * @author Joern Unverzagt
 */

import { formatMinutesToString, timeStringToMinutes } from './utils.js';

declare const Chart: any;

export const LOGBOOK_KEY = 'workLogbook';

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


document.addEventListener('DOMContentLoaded', () => {
    const logbookBody = document.getElementById('logbook-body') as HTMLTableSectionElement;
    const clearLogbookBtn = document.getElementById('clear-logbook-btn') as HTMLButtonElement;
    const exportLogbookBtn = document.getElementById('export-logbook-btn') as HTMLButtonElement;
    const importLogbookBtn = document.getElementById('import-logbook-btn') as HTMLButtonElement;
    const editLogbookBtn = document.getElementById('edit-logbook-btn') as HTMLButtonElement;
    const logbookCard = document.getElementById('logbook-card') as HTMLDivElement;
    const printLogBtn = document.getElementById('print-log-btn') as HTMLButtonElement;

    let logbookChart: Chart | null = null;
    
    function saveLog(logData: LogEntry[]): void {
        localStorage.setItem(LOGBOOK_KEY, JSON.stringify(logData));
        document.dispatchEvent(new CustomEvent('logbookUpdated'));
    }

    function renderChart(logData: LogEntry[]): void {
        const chartContainer = document.querySelector('.chart-container') as HTMLDivElement;
        if (!chartContainer || !Chart) return;

        if (logData.length === 0) {
            chartContainer.style.display = 'none';
            if (logbookChart) {
                logbookChart.destroy();
                logbookChart = null;
            }
            return;
        }
        chartContainer.style.display = 'block';

        const canvas = document.getElementById('logbook-chart') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const labels: string[] = [];
        const dataPoints: number[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const label = date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
            labels.push(label);
            const dateId = date.getTime();
            const entryForDay = logData.find(entry => entry.id === dateId);
            dataPoints.push(entryForDay ? entryForDay.dailySaldoMinutes : 0);
        }

        if (logbookChart) {
            logbookChart.destroy();
        }

        logbookChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tagessaldo',
                    data: dataPoints,
                    backgroundColor: dataPoints.map(value => value < 0 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(0, 123, 255, 0.7)'),
                    borderColor: dataPoints.map(value => value < 0 ? 'rgba(220, 53, 69, 1)' : 'rgba(0, 123, 255, 1)'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context: any) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) {
                                    const totalMinutes = context.parsed.y;
                                    const prefix = totalMinutes >= 0 ? '+' : '';
                                    label += prefix + formatMinutesToString(totalMinutes);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {},
                    y: {
                        title: { display: true, text: 'Saldo in Minuten' },
                        suggestedMax: 60,
                        suggestedMin: -60,
                        ticks: { stepSize: 30 }
                    }
                }
            }
        });
    }

    function renderLog(editMode = false): void {
        if (!logbookBody) return;
        logbookBody.innerHTML = '';
        const logData = getLog();
        logData.sort((a, b) => b.id - a.id);
        renderChart(logData);

        if (logData.length === 0) {
            logbookBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Noch keine Einträge. Zum Importieren Datei hierher ziehen.</td></tr>';
            return;
        }

        logData.forEach((entry) => {
            const row = document.createElement('tr');
            row.dataset.entryId = entry.id.toString();
            const saldoStyle = entry.dailySaldoMinutes < 0 ? ' class="negative-saldo"' : '';
            const saldoPrefix = entry.dailySaldoMinutes >= 0 ? '+' : '';
            const actionsHtml = editMode
                ? `
                <button type="button" class="small-btn save-edit-btn" data-entry-id="${entry.id}">Speichern</button>
                <button type="button" class="small-btn cancel-edit-btn">Abbrechen</button>
            `
                : '';

            row.innerHTML = `
                <td>${entry.date}</td>
                <td><span class="time-display">${entry.arrival}</span><input type="time" class="time-input" value="${entry.arrival}" style="display: none;"> Uhr</td>
                <td><span class="time-display">${entry.leaving}</span><input type="time" class="time-input" value="${entry.leaving}" style="display: none;"> Uhr</td>
                <td${saldoStyle}>${saldoPrefix}${formatMinutesToString(entry.dailySaldoMinutes)}</td>
                <td class="logbook-actions">${actionsHtml}</td>
            `;
            logbookBody.appendChild(row);
        });
    }

    function addLogEntry(newEntry: LogEntry): void {
        const logData = getLog();
        const existingEntryIndex = logData.findIndex(entry => entry.date === newEntry.date);
        if (existingEntryIndex > -1) {
            if (!confirm(`Es existiert bereits ein Eintrag für heute. Möchtest du ihn überschreiben?`)) { return; }
            logData[existingEntryIndex] = newEntry;
        } else {
            logData.push(newEntry);
        }
        saveLog(logData);
        renderLog();
    }

    function prefillArrivalFromLog(): void {
        const todayEntry = getTodayLogEntry();
        if (todayEntry) {
            const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;
            if (ankunftszeitInput && !ankunftszeitInput.value) {
                ankunftszeitInput.value = todayEntry.arrival;
            }
        }
    }

    function parseCsvAndGenerateLog(csvText: string): LogEntry[] {
        const lines = csvText.trim().split('\n');
        const header = lines[0].split(';').map(h => h.trim());
        const dateIndex = header.indexOf('Datum');
        const timeIndex = header.indexOf('Uhrzeit');
        const typeIndex = header.indexOf('Typ');

        if (dateIndex === -1 || timeIndex === -1 || typeIndex === -1) {
            alert('CSV-Datei konnte nicht verarbeitet werden. Benötigte Spalten: Datum, Uhrzeit, Typ');
            return [];
        }

        const dailyData: { [key: string]: { Kommen?: string, Gehen?: string } } = {};

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            const date = values[dateIndex].trim();
            const time = values[timeIndex].trim();
            const type = values[typeIndex].trim();

            if (!dailyData[date]) {
                dailyData[date] = {};
            }

            if (type === 'Kommen') {
                dailyData[date].Kommen = time;
            } else if (type === 'Gehen') {
                dailyData[date].Gehen = time;
            }
        }

        const newLogEntries: LogEntry[] = [];
        const targetHours = parseFloat(localStorage.getItem('userSollzeit') || '8');
        const isMinderjaehrig = localStorage.getItem('userIsMinderjaehrig') === 'true';
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
                    id: dateObj.getTime(),
                    date: dateStr,
                    arrival: data.Kommen,
                    leaving: data.Gehen,
                    targetHours: targetHours,
                    dailySaldoMinutes: Math.round(dailySaldoMinutes)
                });
            }
        }
        return newLogEntries;
    }
    
    function handleFile(file: File) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let importedLog: LogEntry[] = [];
                const content = e.target?.result as string;
                if (!content) throw new Error("File content is empty.");

                if (file.name.endsWith('.json')) {
                    importedLog = JSON.parse(content);
                } else if (file.name.endsWith('.csv')) {
                    importedLog = parseCsvAndGenerateLog(content);
                } else {
                    alert('Ungültiger Dateityp. Bitte eine .json oder .csv Datei auswählen.');
                    return;
                }

                if (Array.isArray(importedLog) && importedLog.every(entry => 'id' in entry && 'date' in entry)) {
                    if (confirm('Möchtest du die importierten Daten mit dem aktuellen Logbuch zusammenführen? Bestehende Tage werden überschrieben.')) {
                        const currentLog = getLog();
                        const logMap = new Map<number, LogEntry>();

                        currentLog.forEach(entry => logMap.set(entry.id, entry));
                        importedLog.forEach(entry => logMap.set(entry.id, entry));

                        const mergedLog = Array.from(logMap.values());

                        saveLog(mergedLog);
                        renderLog();
                        alert('Logbuch erfolgreich importiert und zusammengeführt.');
                    }
                } else {
                    alert('Die ausgewählte Datei hat kein gültiges Logbuch-Format.');
                }
            } catch (error) {
                console.error("Import error:", error);
                alert('Fehler beim Lesen oder Parsen der Datei.');
            }
        };
        reader.readAsText(file);
    }

    if (printLogBtn) {
        printLogBtn.addEventListener('click', () => {
            const logData = getLog();
            if (logData.length === 0) {
                alert('Das Logbuch ist leer. Es gibt nichts zu drucken.');
                return;
            }
            window.open('print_log.html', '_blank');
        });
    }

    if (clearLogbookBtn) {
        clearLogbookBtn.addEventListener('click', () => {
            if (confirm('Bist du sicher, dass du alle Logbuch-Einträge unwiderruflich löschen möchtest?')) {
                localStorage.removeItem(LOGBOOK_KEY);
                renderLog();
            }
        });
    }

    if (exportLogbookBtn) {
        exportLogbookBtn.addEventListener('click', () => {
            const logData = getLog();
            if (logData.length === 0) {
                alert('Das Logbuch ist leer. Es gibt nichts zu exportieren.');
                return;
            }

            const format = prompt("In welchem Format möchten Sie exportieren? (json oder csv)", "json")?.toLowerCase();

            if (format === 'json') {
                const jsonString = JSON.stringify(logData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'arbeitszeit-logbuch.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (format === 'csv') {
                const header = 'Datum;Kommen;Gehen;Tagessaldo\n';
                const rows = logData.map(entry => {
                    const saldoPrefix = entry.dailySaldoMinutes >= 0 ? '+' : '';
                    const formattedSaldo = saldoPrefix + formatMinutesToString(entry.dailySaldoMinutes);
                    return `${entry.date};${entry.arrival};${entry.leaving};"${formattedSaldo}"`;
                }).join('\n');

                const csvString = header + rows;
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'arbeitszeit-logbuch.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (format !== null) {
                alert("Ungültiges Format. Bitte 'json' oder 'csv' eingeben.");
            }
        });
    }

    if (importLogbookBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.csv';
        fileInput.style.display = 'none';

        fileInput.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            handleFile(file!);
            fileInput.value = '';
        };
        document.body.appendChild(fileInput);

        importLogbookBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (logbookCard) {
        logbookCard.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            logbookCard.classList.add('drag-over');
        });

        logbookCard.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
            logbookCard.classList.remove('drag-over');
        });

        logbookCard.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            logbookCard.classList.remove('drag-over');

            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    if (editLogbookBtn) {
        editLogbookBtn.addEventListener('click', () => {
            logbookBody.classList.toggle('edit-mode');
            const isEditMode = logbookBody.classList.contains('edit-mode');
            renderLog(isEditMode);
        });
    }

    logbookBody.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        if (target.classList.contains('save-edit-btn')) {
            const row = target.closest('tr');
            if (row) {
                const entryId = parseInt(row.dataset.entryId || '0', 10);
                const logData = getLog();
                const entryIndex = logData.findIndex(e => e.id === entryId);
                if (entryIndex > -1) {
                    const arrivalInput = row.querySelector('input[type="time"]') as HTMLInputElement;
                    const leavingInput = row.querySelectorAll('input[type="time"]')[1] as HTMLInputElement;

                    const newArrival = arrivalInput.value;
                    const newLeaving = leavingInput.value;
                    
                    const arrivalMinutes = timeStringToMinutes(newArrival);
                    const leavingMinutes = timeStringToMinutes(newLeaving);
                    const targetHours = logData[entryIndex].targetHours;

                    const isMinderjaehrig = (localStorage.getItem('userIsMinderjaehrig') === 'true');
                    const pausenDauer = isMinderjaehrig ? 60 : 45;
                    const gearbeiteteMinuten = leavingMinutes - arrivalMinutes - pausenDauer;
                    const sollzeitInMinuten = targetHours * 60;
                    const tagesDifferenz = gearbeiteteMinuten - sollzeitInMinuten;

                    logData[entryIndex].arrival = newArrival;
                    logData[entryIndex].leaving = newLeaving;
                    logData[entryIndex].dailySaldoMinutes = Math.round(tagesDifferenz);

                    saveLog(logData);
                    renderLog(true);
                }
            }
        }

        if (target.classList.contains('cancel-edit-btn')) {
            renderLog(true); 
        }
    });

    document.addEventListener('saveLogEntry', (event: Event) => {
        const customEvent = event as CustomEvent<LogEntry>;
        addLogEntry(customEvent.detail);
    });

    renderLog();
    prefillArrivalFromLog();
});

