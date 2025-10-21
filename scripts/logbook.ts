// scripts/logbook.ts

/**
 * @module logbook
 * @description Hauptmodul für die Interaktion mit dem Logbuch-UI.
 * @author Joern Unverzagt
 */

import { formatMinutesToString, timeStringToMinutes, showToast, showConfirm } from './utils.js';
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
            'Feiertag': 'fa-solid fa-calendar-star',
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

    editLogTypeSelect.addEventListener('change', () => toggleTimeInputs(editLogTypeSelect.value));
    editLogCancelBtn.addEventListener('click', closeEditModal);

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