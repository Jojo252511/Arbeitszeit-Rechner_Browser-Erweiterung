// scripts/logbook.ts

/**
 * @module logbook
 * @description Verwaltung und Anzeige des Arbeitszeit-Logbuchs mit Import/Export-Funktionalität.
 * @author Joern Unverzagt
 */

import { formatMinutesToString, timeStringToMinutes, showToast, showConfirm, showPrompt } from './utils.js';
import { LOGBOOK_KEY, type LogEntry, getLog, saveLog, getTodayLogEntry } from './logbook-data.js';

// Deklariere die globalen Bibliotheken für TypeScript
declare const html2canvas: any;
declare const jspdf: any;

declare const Chart: any;

document.addEventListener('DOMContentLoaded', async () => {
    const logbookBody = document.getElementById('logbook-body') as HTMLTableSectionElement;
    const clearLogbookBtn = document.getElementById('clear-logbook-btn') as HTMLButtonElement;
    const exportLogbookBtn = document.getElementById('export-logbook-btn') as HTMLButtonElement;
    const importLogbookBtn = document.getElementById('import-logbook-btn') as HTMLButtonElement;
    const editLogbookBtn = document.getElementById('edit-logbook-btn') as HTMLButtonElement;
    const logbookCard = document.getElementById('logbook-card') as HTMLDivElement;
    const printLogBtn = document.getElementById('print-log-btn') as HTMLButtonElement;

    let logbookChart: Chart | null = null;

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

    async function renderLog(editMode = false): Promise<void> {
        if (!logbookBody) return;
        logbookBody.innerHTML = '';
        const logData = await getLog();
        logData.sort((a, b) => b.id - a.id);
        renderChart(logData);

        if (logData.length === 0) {
            logbookBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Noch keine Einträge. Zum Importieren Datei hierher ziehen.</td></tr>';
            return;
        }

        logData.forEach((entry) => {
            const row = document.createElement('tr');
            row.dataset.entryId = entry.id.toString();

            // Standardwerte für normale Arbeitstage
            let arrival = entry.arrival;
            let leaving = entry.leaving;
            let saldoDisplay = `${entry.dailySaldoMinutes >= 0 ? '+' : ''}${formatMinutesToString(entry.dailySaldoMinutes)}`;
            let saldoStyle = entry.dailySaldoMinutes < 0 ? ' class="negative-saldo"' : '';

            // Logik für Sondertage
            if (entry.label && entry.label !== 'Arbeit') {
                arrival = '00:00';
                leaving = '00:00';
                saldoDisplay = '0';
                saldoStyle = '';
                row.classList.add('special-day-row');
            }
            const labelOptions = ["Arbeit", "Urlaub", "Krank", "Feiertag", "Überstundenabbau"];
            const labelSelectHtml = `
            <select class="label-select">
                ${labelOptions.map(opt => `<option value="${opt}" ${entry.label === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>`;
            const actionsHtml = editMode
                ? `
                <button type="button" class="small-btn save-edit-btn" data-entry-id="${entry.id}">Speichern</button>
                <button type="button" class="small-btn cancel-edit-btn">Abbrechen</button>
            `
                : '';

            row.innerHTML = `
                <td>${entry.date}</td>
                <td><span class="time-display">${arrival}</span><input type="time" class="time-input" value="${arrival}" style="display: none;"> Uhr</td>
                <td><span class="time-display">${leaving}</span><input type="time" class="time-input" value="${leaving}" style="display: none;"> Uhr</td>
                <td${saldoStyle}>${saldoDisplay}</td>
                <td><span class="label-display">${entry.label || 'Arbeit'}</span>${editMode ? labelSelectHtml : ''}</td>
                <td class="logbook-actions">${actionsHtml}</td>
            `;
            logbookBody.appendChild(row);
        });
        // Logik, um im Edit-Mode die richtigen Elemente anzuzeigen
        if (editMode) {
        logbookBody.querySelectorAll('.label-display').forEach(el => (el as HTMLElement).style.display = 'none');
    }
    }

    /**
     * Fügt einen neuen Logbucheintrag hinzu oder überschreibt einen bestehenden Eintrag.
     * @param newEntry 
     * @returns 
     */
    async function addLogEntry(newEntry: LogEntry): Promise<void> {
        const logData = await getLog();
        const existingEntryIndex = logData.findIndex(entry => entry.date === newEntry.date);
        if (existingEntryIndex > -1) {
            // ALT: if (!confirm(`...`)) { return; }
            const overwrite = await showConfirm(
                "Eintrag überschreiben?",
                "Es existiert bereits ein Eintrag für heute.<br>Möchtest du ihn wirklich überschreiben?"
            );
            if (!overwrite) return;

            logData[existingEntryIndex] = newEntry;
        } else {
            logData.push(newEntry);
        }
        saveLog(logData);
        document.dispatchEvent(new CustomEvent('logbookUpdated'));
        renderLog();
        showToast('Eintrag dem Logbuch hinzugefügt', 'success');
    }

    async function prefillArrivalFromLog(): Promise<void> {
        const todayEntry = await getTodayLogEntry();
        if (todayEntry) {
            const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;
            if (ankunftszeitInput && !ankunftszeitInput.value) {
                ankunftszeitInput.value = todayEntry.arrival;
            }
        }
    }

    document.addEventListener('logbookUpdated', () => {
       prefillArrivalFromLog();
    });

    /**
     * Zum auslesen der exportierten CSV
     * @param csvText 
     * @returns 
     */
    async function parseInternalCsv(csvText: string): Promise<LogEntry[]> {
        const lines = csvText.trim().split('\n').slice(1); // Header überspringen
        const newLogEntries: LogEntry[] = [];

        const settings = await chrome.storage.sync.get({
            userSollzeit: '8',
            userIsMinderjaehrig: false
        });
        const targetHours = parseFloat(settings.userSollzeit);
        const isMinderjaehrig = settings.userIsMinderjaehrig;
        const pausenDauer = isMinderjaehrig ? 60 : 45;

        for (const line of lines) {
            const values = line.split(';');
            if (values.length < 3) continue;

            const dateStr = values[0].trim();
            const arrivalStr = values[1].trim();
            const leavingStr = values[2].trim();
            const label = values[4] ? values[4].trim() : 'Arbeit';

            if (dateStr && arrivalStr && leavingStr) {
                const [day, month, year] = dateStr.split('.').map(Number);
                const dateObj = new Date(year, month - 1, day);
                dateObj.setHours(0, 0, 0, 0);

                const arrivalMinutes = timeStringToMinutes(arrivalStr);
                const leavingMinutes = timeStringToMinutes(leavingStr);
                const gearbeiteteMinuten = leavingMinutes - arrivalMinutes - pausenDauer;
                const sollzeitInMinuten = targetHours * 60;
                let dailySaldoMinutes = gearbeiteteMinuten - sollzeitInMinuten;

                if(label == "Krank" || label == "Urlaub") {
                    dailySaldoMinutes = 0;
                }

                newLogEntries.push({
                    id: dateObj.getTime(),
                    date: dateStr,
                    arrival: arrivalStr,
                    leaving: leavingStr,
                    targetHours: targetHours,
                    dailySaldoMinutes: Math.round(dailySaldoMinutes),
                    label: label
                });
            }
        }
        return newLogEntries;
    }

    function parseCsvAndGenerateLog(csvText: string): LogEntry[] {
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
                    dailySaldoMinutes: Math.round(dailySaldoMinutes),
                    label: ""
                });
            }
        }
        return newLogEntries;
    }


    async function handleFile(file: File) {
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
                        importedLog = await parseCsvAndGenerateLog(content);
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
                        (importedLog as LogEntry[]).forEach(entry => logMap.set(entry.id, entry));

                        const mergedLog = Array.from(logMap.values());

                        await saveLog(mergedLog);
                        await renderLog();
                        showToast('Logbuch erfolgreich importiert und zusammengeführt.', 'success');
                    }
                } else {
                    if (importedLog && importedLog.length > 0) {
                        showToast('Die ausgewählte Datei hat kein gültiges Logbuch-Format.', 'error');
                    }
                }
            } catch (error) {
                console.error("Import error:", error);
                showToast('Fehler beim Lesen oder Parsen der Datei.', 'error');
            }
        };
        reader.readAsText(file);
    }

    if (printLogBtn) {
        printLogBtn.addEventListener('click', async () => {
            const logData = await getLog();
            if (logData.length === 0) {
                showToast('Das Logbuch ist leer. Es gibt nichts zu drucken.', 'info')
                return;
            }
            window.open('/Print/index.html', '_blank');
        });
    }

    if (clearLogbookBtn) {
        clearLogbookBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm(
                "Logbuch leeren",
                "Bist du sicher, dass du alle Logbuch-Einträge unwiderruflich löschen möchtest?",
                true
            );
            if (confirmed) {
                await saveLog([]);
                document.dispatchEvent(new CustomEvent('logbookUpdated'));
                await renderLog();
                showToast("Logbuch wurde geleert.", "info");
            }
        });
    }
    if (exportLogbookBtn) {
        exportLogbookBtn.addEventListener('click', async () => {
            const logData = await getLog();
            if (logData.length === 0) {
                showToast('Das Logbuch ist leer. Es gibt nichts zu exportieren.', 'info');
                return;
            }

            const format = await showPrompt(
                "Exportformat wählen",
                "In welchem Format möchtest du das Logbuch exportieren?",
                ['json', 'csv', 'pdf']
            );

            if (format === null) { // Benutzer hat auf "Abbrechen" geklickt
                return;
            }

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
                const header = 'Datum;Kommen;Gehen;Tagessaldo;Typ\n';
                const rows = logData.map(entry => {
                    const saldoPrefix = entry.dailySaldoMinutes >= 0 ? '+' : '';
                    const formattedSaldo = saldoPrefix + formatMinutesToString(entry.dailySaldoMinutes);
                    return `${entry.date};${entry.arrival};${entry.leaving};"${formattedSaldo}";${entry.label || 'Arbeit'}`;
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
            } else if (format === 'pdf') {
                await generatePdf();
            } else if (format !== null) {
                showToast("Ungültiges Format. Bitte 'json' oder 'csv' eingeben.", "error");
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

    /**
     * Speicherbutton beim bearbeiten vom Logbuch
     */
    logbookBody.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;

        if (target.classList.contains('save-edit-btn')) {
            const row = target.closest('tr');
            if (row) {
                const entryId = parseInt(row.dataset.entryId || '0', 10);
                const logData = await getLog();
                const entryIndex = logData.findIndex(e => e.id === entryId);
                if (entryIndex > -1) {
                    const labelSelect = row.querySelector('.label-select') as HTMLSelectElement;
                    const newLabel = labelSelect.value;

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

                    if (newLabel !== 'Arbeit') {
                        logData[entryIndex].label = newLabel;
                        logData[entryIndex].arrival = '00:00';
                        logData[entryIndex].leaving = '00:00';
                        logData[entryIndex].dailySaldoMinutes = 0;
                    } else {
                        logData[entryIndex].label = newLabel;
                        logData[entryIndex].arrival = newArrival;
                        logData[entryIndex].leaving = newLeaving;
                        logData[entryIndex].dailySaldoMinutes = Math.round(tagesDifferenz);
                    }
                    await saveLog(logData);
                    document.dispatchEvent(new CustomEvent('logbookUpdated'));
                    await renderLog(true);
                }
            }
        }

        if (target.classList.contains('cancel-edit-btn')) {
            renderLog(true);
        }
    });

    document.addEventListener('saveLogEntry', async (event: Event) => {
        const customEvent = event as CustomEvent<LogEntry>;
        await addLogEntry(customEvent.detail);
    });

    // Erster Aufruf beim laden
    await renderLog();
    await prefillArrivalFromLog();

    /**
     * Funktion für den PDF Export (BETA)
     */
    async function generatePdf() {
        showToast('PDF wird generiert...', 'info', 2000);

        // 1. Erstelle ein unsichtbares Iframe, um die Druckansicht zu laden
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.src = '/Print/index.html';
        document.body.appendChild(iframe);

        // 2. Warte, bis der Inhalt des Iframes geladen ist
        iframe.onload = async () => {
            try {
                const printDocument = iframe.contentDocument;
                if (!printDocument) {
                    showToast('PDF-Erstellung fehlgeschlagen (Iframe-Inhalt).', 'error');
                    return;
                }

                const printContent = printDocument.getElementById('print-content');
                if (!printContent) {
                    showToast('PDF-Erstellung fehlgeschlagen (print-content).', 'error');
                    return;
                }

                const printControls = printDocument.querySelector('.print-controls') as HTMLElement;
                if (printControls) printControls.style.display = 'none';

                // 3. Nutze html2canvas, um das Element zu "fotografieren"
                const canvas = await html2canvas(printContent, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                // 4. Erstelle das PDF mit jsPDF
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;

                let imgWidth = pdfWidth;
                let imgHeight = imgWidth / ratio;

                if (imgHeight > pdfHeight) {
                    imgHeight = pdfHeight;
                    imgWidth = imgHeight * ratio;
                }

                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2;

                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

                // 5. Speichere das PDF
                pdf.save('Arbeitszeit-Logbuch.pdf');

            } catch (error) {
                console.error("PDF generation error:", error);
                showToast('Ein Fehler ist beim Erstellen des PDFs aufgetreten.', 'error');
            } finally {
                // 6. Räume das Iframe wieder auf
                document.body.removeChild(iframe);
            }
        };
    }
});

