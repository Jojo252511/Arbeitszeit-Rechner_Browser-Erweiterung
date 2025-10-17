// scripts/printLog.ts

/**
 * @module printLog
 * @description Dieses Modul rendert die Druckansicht des Logbuchs, einschließlich der Tabelle und des Diagramms.
 * Es ermöglicht dem Benutzer, die Druckeinstellungen anzupassen und das Logbuch zu drucken.
 * @author Jörn Unverzagt
 */

import { formatMinutesToString } from './utils.js';
import { type LogEntry, getLog } from './logbook-data.js';

declare const Chart: any;

/**
 * Initialisiert die Druckansicht
 */
document.addEventListener('DOMContentLoaded', async () => {
    const printLogBody = document.getElementById('print-log-body') as HTMLTableSectionElement;
    const printContent = document.getElementById('print-content') as HTMLDivElement;
    const toggleChartCheck = document.getElementById('toggle-chart') as HTMLInputElement;
    const orientationSelect = document.getElementById('orientation-select') as HTMLSelectElement;
    const executePrintBtn = document.getElementById('execute-print-btn') as HTMLButtonElement;
    const chartContainer = document.getElementById('print-chart-container') as HTMLDivElement;

    // Lade Logbuchdaten
    const logData: LogEntry[] = await(getLog());

    /**
     * Rendert die Logbuch-Tabelle
     */
    function renderTable() {
        if (!printLogBody) return;
        printLogBody.innerHTML = '';
        logData.sort((a, b) => a.id - b.id); // Für die Druckansicht chronologisch sortieren

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
            printLogBody.appendChild(row);
        });
    }

    /**
     * Rendert das Diagramm
     */
    function renderChart() {
        const canvas = document.getElementById('print-log-chart') as HTMLCanvasElement;
        if (!canvas || !Chart) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const labels = logData.map(entry => entry.date);
        const dataPoints = logData.map(entry => entry.dailySaldoMinutes);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tagessaldo in Minuten',
                    data: dataPoints,
                    backgroundColor: dataPoints.map(value => value < 0 ? 'rgba(220, 53, 69, 0.7)' : 'rgba(0, 123, 255, 0.7)'),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Saldo in Minuten' }
                    }
                }
            }
        });
    }

    // Event Listeners für die Einstellungsleiste
    toggleChartCheck.addEventListener('change', () => {
        chartContainer.style.display = toggleChartCheck.checked ? 'flex' : 'none';
    });

    /* Funktionalität zur Seitenausrichtung vorerst deaktiviert
        orientationSelect.addEventListener('change', () => {
            printContent.className = orientationSelect.value;
        });
    */
    executePrintBtn.addEventListener('click', () => {
        window.print();
    });

    // Initiales Rendern
    renderTable();
    renderChart();
});
