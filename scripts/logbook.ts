// scripts/logbook.ts

/**
 * @module logbook
 * @description Hauptmodul für die Interaktion mit dem Logbuch-UI.
 * @author Joern Unverzagt
 */

import { formatMinutesToString, timeStringToMinutes, showToast, showConfirm} from './utils.js';
import { type LogEntry, getLog, saveLog, getTodayLogEntry } from './logbook-data.js';
import { renderChart } from './diagramLog.js';
import { handleExport } from './exportLog.js';
import { handleFileImport } from './importLog.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM-Elemente holen ---
    const logbookList = document.getElementById('logbook-list') as HTMLDivElement;
    const clearLogbookBtn = document.getElementById('clear-logbook-btn') as HTMLButtonElement;
    const exportLogbookBtn = document.getElementById('export-logbook-btn') as HTMLButtonElement;
    const importLogbookBtn = document.getElementById('import-logbook-btn') as HTMLButtonElement;
    const logbookCard = document.getElementById('logbook-card') as HTMLDivElement;
    const printLogBtn = document.getElementById('print-log-btn') as HTMLButtonElement;
    const nowEditLogGo = document.getElementById('now-wunsch-log-edit-go') as HTMLButtonElement;
    const nowEditLogCome = document.getElementById('now-wunsch-log-edit-come') as HTMLButtonElement;

    // --- Elemente für das Bearbeiten-Modal ---
    const editLogModal = document.getElementById('edit-log-modal') as HTMLDivElement;
    const editLogSaveBtn = document.getElementById('edit-log-save-btn') as HTMLButtonElement;
    const editLogCancelBtn = document.getElementById('edit-log-cancel-btn') as HTMLButtonElement;
    const editLogDateDisplay = document.getElementById('edit-log-date-display') as HTMLParagraphElement;
    const editLogTypeSelect = document.getElementById('edit-log-type') as HTMLSelectElement;
    const editLogArrivalInput = document.getElementById('edit-log-arrival') as HTMLInputElement;
    const editLogLeavingInput = document.getElementById('edit-log-leaving') as HTMLInputElement;
    const editLogTimesContainer = document.getElementById('edit-log-times') as HTMLDivElement;

    // --- DOM-Elemente für das Hinzufügen-Modal ---
    const addLogBtn = document.getElementById('add-log-entry-btn') as HTMLButtonElement;
    const addLogModal = document.getElementById('add-log-modal') as HTMLDivElement;
    const addLogDateInput = document.getElementById('add-log-date') as HTMLInputElement;
    const addLogTypeSelect = document.getElementById('add-log-type') as HTMLSelectElement;
    const addLogArrivalInput = document.getElementById('add-log-arrival') as HTMLInputElement;
    const addLogLeavingInput = document.getElementById('add-log-leaving') as HTMLInputElement;
    const addLogTimesContainer = document.getElementById('add-log-times') as HTMLDivElement;
    const addLogSaveBtn = document.getElementById('add-log-save-btn') as HTMLButtonElement;
    const addLogCancelBtn = document.getElementById('add-log-cancel-btn') as HTMLButtonElement;

    let currentEditEntryId: number | null = null;

    /**
     * Rendert die Logbuch-Liste im Karten-Design.
     */
    async function renderLog(): Promise<void> {
        if (!logbookList) return;
        logbookList.innerHTML = '';
        const logData = await getLog();
        logData.sort((a, b) => b.id - a.id);
        renderChart(logData);

        if (logData.length === 0) {
            logbookList.innerHTML = '<p style="text-align: center; color: #6c757d;">Noch keine Einträge vorhanden.</p>';
            return;
        }

        const icons: { [key: string]: string } = {
            'Arbeit': 'fa-solid fa-briefcase',
            'Urlaub': 'fa-solid fa-umbrella-beach',
            'Krank': 'fa-solid fa-notes-medical',
            'Feiertag': 'fa-solid fa-calendar-xmark',
            'Berufsschule': 'fa-solid fa-school',
            'Überstundenabbau': 'fa-solid fa-hourglass-half',
        };

        logData.forEach((entry) => {
            const item = document.createElement('div');
            item.className = 'log-item';
            item.dataset.entryId = entry.id.toString();
            const label = entry.label || 'Arbeit';
            item.dataset.label = label;
            
            const iconClass = icons[label] || 'fa-solid fa-question-circle';
            const isWorkDay = label === 'Arbeit';
            const saldoDisplay = isWorkDay ? `${entry.dailySaldoMinutes >= 0 ? '+' : ''}${formatMinutesToString(entry.dailySaldoMinutes)}` : '';
            const saldoColor = entry.dailySaldoMinutes < 0 ? 'var(--error-color)' : 'var(--success-color)';
            const detailsDisplay = isWorkDay ? `${entry.arrival} - ${entry.leaving} Uhr` : 'Ganztägig';

            item.innerHTML = `
                <div class="log-item-icon"><i class="${iconClass}"></i></div>
                <div class="log-item-date">${entry.date}</div>
                <div class="log-item-type">${label}</div>
                <div class="log-item-saldo" style="color: ${isWorkDay ? saldoColor : 'inherit'};">${saldoDisplay}</div>
                <div class="log-item-details">${detailsDisplay}</div>
            `;
            logbookList.appendChild(item);
        });
    }

    /**
     * Fügt einen neuen Eintrag zum Logbuch hinzu oder überschreibt einen existierenden.
     */
    async function addLogEntry(newEntry: LogEntry): Promise<void> {
        const logData = await getLog();
        const existingEntryIndex = logData.findIndex(entry => entry.date === newEntry.date);
        if (existingEntryIndex > -1) {
            const overwrite = await showConfirm("Eintrag überschreiben?", "Es existiert bereits ein Eintrag für heute.<br>Möchtest du ihn wirklich überschreiben?");
            if (!overwrite) return;
            logData[existingEntryIndex] = newEntry;
        } else {
            logData.push(newEntry);
        }
        await saveLog(logData);
        await renderLog();
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

    const openEditModal = (entry: LogEntry) => {
        currentEditEntryId = entry.id;
        editLogDateDisplay.textContent = `Eintrag vom ${entry.date}`;
        const labelOptions = ["Arbeit", "Urlaub", "Krank", "Feiertag", "Berufsschule", "Überstundenabbau"];
        editLogTypeSelect.innerHTML = labelOptions.map(opt => `<option value="${opt}" ${entry.label === opt ? 'selected' : ''}>${opt}</option>`).join('');
        editLogArrivalInput.value = entry.arrival;
        editLogLeavingInput.value = entry.leaving;
        toggleTimeInputs(entry.label || 'Arbeit');
        editLogModal.style.display = 'flex';
    };

    const closeEditModal = () => {
        editLogModal.style.display = 'none';
        currentEditEntryId = null;
    };

    const toggleTimeInputs = (type: string) => {
        editLogTimesContainer.style.display = type === 'Arbeit' ? 'flex' : 'none';
    };

    // --- LOGIK FÜR MANUELLES HINZUFÜGEN ---

    const openAddModal = () => {
        // Standardwerte setzen
        addLogDateInput.valueAsDate = new Date(); // Heute
        addLogTypeSelect.value = 'Arbeit';
        addLogArrivalInput.value = '';
        addLogLeavingInput.value = '';
        toggleAddTimeInputs(); // Zeiten anzeigen/verstecken basierend auf Typ
        if (addLogModal) {
            addLogModal.style.display = 'flex';
            addLogModal.style.opacity = '1';
        }
    };

    const closeAddModal = () => {
        if (addLogModal) addLogModal.style.display = 'none';
    };

    const toggleAddTimeInputs = () => {
        if (addLogTimesContainer && addLogTypeSelect) {
            addLogTimesContainer.style.display = addLogTypeSelect.value === 'Arbeit' ? 'flex' : 'none';
        }
    };

    // Event Listener für den + Button
    if (addLogBtn) {
        addLogBtn.addEventListener('click', openAddModal);
    }

    // Event Listener für Typ-Änderung (Zeiten ein-/ausblenden)
    if (addLogTypeSelect) {
        addLogTypeSelect.addEventListener('change', toggleAddTimeInputs);
    }

    // Event Listener für Abbrechen
    if (addLogCancelBtn) {
        addLogCancelBtn.addEventListener('click', closeAddModal);
    }

    // Event Listener für Speichern (Die Hauptlogik)
    if (addLogSaveBtn) {
        addLogSaveBtn.addEventListener('click', async () => {
            const dateValue = addLogDateInput.value;
            if (!dateValue) {
                showToast('Bitte ein Datum wählen.', 'error');
                return;
            }

            // Datum von YYYY-MM-DD in DD.MM.YYYY umwandeln
            const [year, month, day] = dateValue.split('-');
            const formattedDate = `${day}.${month}.${year}`;
            const dateId = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).setHours(0,0,0,0);

            const type = addLogTypeSelect.value;
            let arrival = '00:00';
            let leaving = '00:00';
            let dailySaldoMinutes = 0;

            // Einstellungen laden für Berechnung
            const settings = await chrome.storage.sync.get({ userSollzeit: '8', userIsMinderjaehrig: false });
            const targetHours = parseFloat(settings.userSollzeit);
            const sollzeitInMinuten = targetHours * 60;
            const isMinderjaehrig = settings.userIsMinderjaehrig;
            const pausenDauer = isMinderjaehrig ? 60 : 45;

            // Berechnung basierend auf Typ
            if (type === 'Arbeit') {
                arrival = addLogArrivalInput.value;
                leaving = addLogLeavingInput.value;

                if (!arrival || !leaving) {
                    showToast('Bitte Kommen- und Gehen-Zeit für Arbeitstage angeben.', 'error');
                    return;
                }

                const arrivalMin = timeStringToMinutes(arrival);
                const leavingMin = timeStringToMinutes(leaving);
                
                // Einfache Berechnung (ohne komplexe Gleitzeit/Kernzeit Logik für manuelle Einträge, 
                // da man davon ausgeht, dass der User korrekte Zeiten einträgt)
                const gearbeiteteMinuten = leavingMin - arrivalMin - pausenDauer;
                dailySaldoMinutes = Math.round(gearbeiteteMinuten - sollzeitInMinuten);

            } else if (type === 'Überstundenabbau') {
                // Bei Überstundenabbau verliert man die Sollzeit an Stunden vom Gleitzeitkonto
                dailySaldoMinutes = -Math.round(sollzeitInMinuten);
            } else {
                // Urlaub, Krank, Feiertag, Berufsschule = 0 Saldo (Neutral)
                dailySaldoMinutes = 0;
            }

            const newEntry: LogEntry = {
                id: dateId,
                date: formattedDate,
                arrival: arrival,
                leaving: leaving,
                targetHours: targetHours,
                dailySaldoMinutes: dailySaldoMinutes,
                label: type
            };

            // Prüfen ob Eintrag existiert
            const logData = await getLog();
            const existingIndex = logData.findIndex(e => e.date === formattedDate);

            if (existingIndex > -1) {
                const overwrite = await showConfirm(
                    "Eintrag existiert bereits", 
                    `Für den ${formattedDate} gibt es schon einen Eintrag. Überschreiben?`
                );
                if (!overwrite) return;
                
                logData[existingIndex] = newEntry;
            } else {
                logData.push(newEntry);
            }

            await saveLog(logData);
            await renderLog(); // UI neu laden
            
            closeAddModal();
            showToast('Eintrag erfolgreich hinzugefügt!', 'success');
        });
    }

    // --- Event-Listener ---

    logbookList.addEventListener('dblclick', async (event) => {
        const target = event.target as HTMLElement;
        const logItem = target.closest('.log-item') as HTMLDivElement;
        if (!logItem) return;
        const entryId = parseInt(logItem.dataset.entryId || '0', 10);
        if (isNaN(entryId)) return;
        const logData = await getLog();
        const entryToEdit = logData.find(e => e.id === entryId);
        if (entryToEdit) openEditModal(entryToEdit);
    });
    if (editLogTypeSelect) {
         editLogTypeSelect.addEventListener('change', () => toggleTimeInputs(editLogTypeSelect.value));
    }
    if(editLogCancelBtn) {
        editLogCancelBtn.addEventListener('click', closeEditModal);
    }
   
    if (editLogSaveBtn) {
        editLogSaveBtn.addEventListener('click', async () => {
        if (currentEditEntryId === null) return;
        const logData = await getLog();
        const entryIndex = logData.findIndex(e => e.id === currentEditEntryId);
        if (entryIndex === -1) return;
        const entryToUpdate = logData[entryIndex];
        const newLabel = editLogTypeSelect.value;
        entryToUpdate.label = newLabel;
        if (newLabel === 'Arbeit') {
            entryToUpdate.arrival = editLogArrivalInput.value;
            entryToUpdate.leaving = editLogLeavingInput.value;
            const settings = await chrome.storage.sync.get({ userIsMinderjaehrig: false });
            const pausenDauer = settings.userIsMinderjaehrig ? 60 : 45;
            const gearbeiteteMinuten = timeStringToMinutes(entryToUpdate.leaving) - timeStringToMinutes(entryToUpdate.arrival) - pausenDauer;
            const sollzeitInMinuten = entryToUpdate.targetHours * 60;
            entryToUpdate.dailySaldoMinutes = Math.round(gearbeiteteMinuten - sollzeitInMinuten);
        } else {
            entryToUpdate.arrival = '00:00';
            entryToUpdate.leaving = '00:00';
            entryToUpdate.dailySaldoMinutes = 0;
        }
        await saveLog(logData);
        await renderLog();
        closeEditModal();
        showToast('Eintrag erfolgreich gespeichert!', 'success');
    });
    }
    

    nowEditLogGo.addEventListener('click', () => {
        const input = document.getElementById('edit-log-leaving') as HTMLInputElement;
        if (input) {
            const now = new Date();
            input.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    });

    nowEditLogCome.addEventListener('click', () => {
        const input = document.getElementById('edit-log-arrival') as HTMLInputElement;
        if (input) {
            const now = new Date();
            input.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
    });

    document.addEventListener('saveLogEntry', (event: Event) => {
        const customEvent = event as CustomEvent<LogEntry>;
        addLogEntry(customEvent.detail);
    });

    clearLogbookBtn?.addEventListener('click', async () => {
        const confirmed = await showConfirm("Logbuch leeren", "Bist du sicher, dass du alle Logbuch-Einträge unwiderruflich löschen möchtest?", true);
        if (confirmed) {
            await saveLog([]);
            await renderLog();
            showToast("Logbuch wurde geleert.", "info");
        }
    });
    
    exportLogbookBtn?.addEventListener('click', handleExport);
    
    importLogbookBtn?.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.csv';
        fileInput.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) handleFileImport(file);
        };
        fileInput.click();
    });

    const openStatsBtn = document.getElementById('open-stats-btn');
    openStatsBtn?.addEventListener('click', () => {
        window.open('statistics.html', '_blank');
    });

    logbookCard?.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        logbookCard.classList.add('drag-over');
    });

    logbookCard?.addEventListener('dragleave', (event) => {
        event.preventDefault();
        event.stopPropagation();
        logbookCard.classList.remove('drag-over');
    });

    logbookCard?.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        logbookCard.classList.remove('drag-over');
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            handleFileImport(files[0]);
        }
    });

    printLogBtn?.addEventListener('click', () => {
        window.open('/Print/index.html', '_blank');
    });

    document.addEventListener('logbookUpdated', () => renderLog());

    // --- Initialisierung ---
    await renderLog();
    await prefillArrivalFromLog();
});