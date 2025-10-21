// scripts/diagramLog.ts

import { type LogEntry } from './logbook-data.js';
import { formatMinutesToString } from './utils.js';

declare const Chart: any;

let logbookChart: Chart | null = null;

/**
 * Rendert das Balkendiagramm für die Tagessalden der letzten 7 Tage.
 * @param {LogEntry[]} logData - Das gesamte Logbuch-Array.
 */
export function renderChart(logData: LogEntry[]): void {
    const chartContainer = document.querySelector('.chart-container') as HTMLDivElement;
    if (!chartContainer || typeof Chart === 'undefined') return;

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
                backgroundColor: dataPoints.map(value => value < 0 ? '#dc3545b3' : '#01ac4eb3'),
                borderColor: dataPoints.map(value => value < 0 ? '#dc3545ff' : '#01ac4eb5'),
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