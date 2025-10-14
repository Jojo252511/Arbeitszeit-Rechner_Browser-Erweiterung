// scripts/logbook.ts

import { formatMinutesToString } from './utils.js';

// Wir verwenden jetzt den einfachen 'auto'-Import.
// Dieser sollte dank der geänderten tsconfig.json jetzt gefunden werden.
import Chart, { type TooltipItem } from 'chart.js/auto';

// Definiere die Struktur eines Logbuch-Eintrags.
export interface LogEntry {
    id: number;
    date: string;
    arrival: string;
    leaving: string;
    targetHours: number;
    dailySaldoMinutes: number;
}

document.addEventListener('DOMContentLoaded', () => {
    const logbookBody = document.getElementById('logbook-body') as HTMLTableSectionElement;
    const clearLogbookBtn = document.getElementById('clear-logbook-btn') as HTMLButtonElement;
    const LOGBOOK_KEY = 'workLogbook';

    let logbookChart: Chart | null = null;

    function getLog(): LogEntry[] {
        const log = localStorage.getItem(LOGBOOK_KEY);
        return log ? JSON.parse(log) : [];
    }

    function saveLog(logData: LogEntry[]): void {
        localStorage.setItem(LOGBOOK_KEY, JSON.stringify(logData));
    }

    function renderChart(logData: LogEntry[]): void {
        const chartContainer = document.querySelector('.chart-container') as HTMLDivElement;
        if (!chartContainer) return;

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
                            label: function(context: TooltipItem<'bar'>) {
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

    // --- Der Rest der Datei bleibt unverändert ---
    function renderLog(): void {
        if (!logbookBody) return;
        logbookBody.innerHTML = '';
        const logData = getLog();
        logData.sort((a, b) => b.id - a.id);
        renderChart(logData);
        if (logData.length === 0) {
            logbookBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Noch keine Einträge vorhanden.</td></tr>';
            return;
        }
        logData.forEach(entry => {
            const row = document.createElement('tr');
            const saldoStyle = entry.dailySaldoMinutes < 0 ? ' class="negative-saldo"' : '';
            const saldoPrefix = entry.dailySaldoMinutes >= 0 ? '+' : '';
            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.arrival} Uhr</td>
                <td>${entry.leaving} Uhr</td>
                <td${saldoStyle}>${saldoPrefix}${formatMinutesToString(entry.dailySaldoMinutes)}</td>
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
        const logData = getLog();
        const todayDateString = new Date().toLocaleDateString('de-DE');
        const todayEntry = logData.find(entry => entry.date === todayDateString);
        if (todayEntry) {
            const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;
            if (ankunftszeitInput && !ankunftszeitInput.value) {
                ankunftszeitInput.value = todayEntry.arrival;
            }
        }
    }
    if (clearLogbookBtn) {
        clearLogbookBtn.addEventListener('click', () => {
            if (confirm('Bist du sicher, dass du alle Logbuch-Einträge unwiderruflich löschen möchtest?')) {
                localStorage.removeItem('workLogbook');
                renderLog();
            }
        });
    }
    document.addEventListener('saveLogEntry', (event: Event) => {
        const customEvent = event as CustomEvent<LogEntry>;
        addLogEntry(customEvent.detail);
    });
    renderLog();
    prefillArrivalFromLog();
});