// scripts/statistics.ts

import { getLog, type LogEntry } from './logbook-data.js';
import { formatMinutesToString } from './utils.js';

declare var Chart: any;

let trendChartInstance: any = null;
let pieChartInstance: any = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initStatistics();
});

async function initStatistics(): Promise<void> {
    const logData = await getLog();

    const monthFilter = document.getElementById('stats-month-filter') as HTMLSelectElement;
    if (monthFilter) {
        populateMonthFilter(logData, monthFilter);
        monthFilter.addEventListener('change', () => {
            renderStatistics(logData, monthFilter.value);
        });
    }

    renderStatistics(logData, 'all');
}

function populateMonthFilter(logData: LogEntry[], selectEl: HTMLSelectElement): void {
    const months = new Set<string>();
    logData.forEach(entry => {
        if (entry.date) {
            const parts = entry.date.split('.');
            if (parts.length === 3) {
                const monthYear = `${parts[1]}.${parts[2]}`;
                months.add(monthYear);
            }
        }
    });

    const sortedMonths = Array.from(months).sort().reverse();
    sortedMonths.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = `Monat ${m}`;
        selectEl.appendChild(option);
    });
}

function renderStatistics(logData: LogEntry[], selectedMonth: string): void {
    let filteredData = logData;
    if (selectedMonth !== 'all') {
        filteredData = logData.filter(entry => entry.date && entry.date.includes(selectedMonth));
    }

    // Sort by date ascending
    filteredData.sort((a, b) => a.id - b.id);

    // 1. Calculate KPI Metrics
    let totalSaldoMinutes = 0;
    let workedDaysCount = 0;
    let vacationDaysCount = 0;
    let sickDaysCount = 0;
    let totalWorkedMinutes = 0;

    filteredData.forEach(entry => {
        totalSaldoMinutes += (entry.dailySaldoMinutes || 0);

        if (entry.label === 'Arbeit') {
            workedDaysCount++;
            if (entry.arrival && entry.leaving) {
                const arr = parseTimeToMinutes(entry.arrival);
                const lev = parseTimeToMinutes(entry.leaving);
                if (lev > arr) {
                    totalWorkedMinutes += (lev - arr);
                }
            }
        } else if (entry.label === 'Urlaub') {
            vacationDaysCount++;
        } else if (entry.label === 'Krank') {
            sickDaysCount++;
        }
    });

    const avgMinutesPerDay = workedDaysCount > 0 ? Math.round(totalWorkedMinutes / workedDaysCount) : 0;

    // Update KPI UI Elements
    const totalSaldoEl = document.getElementById('stat-total-saldo');
    if (totalSaldoEl) {
        const prefix = totalSaldoMinutes >= 0 ? '+' : '';
        totalSaldoEl.textContent = `${prefix}${formatMinutesToString(totalSaldoMinutes)}`;
        totalSaldoEl.style.color = totalSaldoMinutes >= 0 ? 'var(--success-color)' : 'var(--error-color)';
    }

    const avgWorktimeEl = document.getElementById('stat-avg-worktime');
    if (avgWorktimeEl) {
        avgWorktimeEl.textContent = formatMinutesToString(avgMinutesPerDay);
    }

    const workedDaysEl = document.getElementById('stat-worked-days');
    if (workedDaysEl) {
        workedDaysEl.textContent = String(workedDaysCount);
    }

    const vacSickEl = document.getElementById('stat-vacation-sick');
    if (vacSickEl) {
        vacSickEl.textContent = `${vacationDaysCount} / ${sickDaysCount}`;
    }

    // 2. Render Charts
    renderTrendChart(filteredData);
    renderPieChart(filteredData);
}

function parseTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function renderTrendChart(logData: LogEntry[]): void {
    const canvas = document.getElementById('stats-trend-chart') as HTMLCanvasElement;
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayData = logData.slice(-14); // show last 14 entries for trend readability
    const labels = displayData.map(e => e.date);
    const dataPoints = displayData.map(e => e.dailySaldoMinutes || 0);

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tagessaldo (Minuten)',
                data: dataPoints,
                backgroundColor: dataPoints.map(v => v >= 0 ? '#28a745b3' : '#dc3545b3'),
                borderColor: dataPoints.map(v => v >= 0 ? '#28a745' : '#dc3545'),
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
                            const val = context.parsed.y;
                            const prefix = val >= 0 ? '+' : '';
                            return `Saldo: ${prefix}${formatMinutesToString(val)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Saldo (Minuten)' }
                }
            }
        }
    });
}

function renderPieChart(logData: LogEntry[]): void {
    const canvas = document.getElementById('stats-pie-chart') as HTMLCanvasElement;
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labelCounts: { [key: string]: number } = {
        'Arbeit': 0,
        'Urlaub': 0,
        'Feiertag': 0,
        'Krank': 0,
        'Berufsschule': 0,
        'Überstundenabbau': 0
    };

    logData.forEach(entry => {
        const lbl = entry.label || 'Arbeit';
        if (labelCounts[lbl] !== undefined) {
            labelCounts[lbl]++;
        } else {
            labelCounts[lbl] = 1;
        }
    });

    const labels = Object.keys(labelCounts);
    const dataPoints = Object.values(labelCounts);

    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                backgroundColor: [
                    '#007bff', // Arbeit (blau)
                    '#ff0000', // Urlaub (rot)
                    '#ffc107', // Feiertag (gelb)
                    '#fd7e14', // Krank (orange)
                    '#17a2b8', // Berufsschule (blaugrün)
                    '#6f42c1'  // Überstundenabbau (lila)
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
