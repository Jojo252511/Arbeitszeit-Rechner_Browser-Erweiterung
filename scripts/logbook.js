// scripts/logbook.js

document.addEventListener('DOMContentLoaded', () => {
    const logbookBody = document.getElementById('logbook-body');
    const clearLogbookBtn = document.getElementById('clear-logbook-btn');
    const LOGBOOK_KEY = 'workLogbook';

    let logbookChart = null;

    function getLog() {
        const log = localStorage.getItem(LOGBOOK_KEY);
        return log ? JSON.parse(log) : [];
    }

    function saveLog(logData) {
        localStorage.setItem(LOGBOOK_KEY, JSON.stringify(logData));
    }

    function renderChart(logData) {
        const chartContainer = document.querySelector('.chart-container');
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

        const ctx = document.getElementById('logbook-chart').getContext('2d');
        const labels = [];
        const dataPoints = [];
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
                            label: function(context) {
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

    function renderLog() {
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

    function addLogEntry(newEntry) {
        const logData = getLog();
        const existingEntryIndex = logData.findIndex(entry => entry.date === newEntry.date);
        if (existingEntryIndex > -1) {
            if (!confirm(`Es existiert bereits ein Eintrag für heute. Möchtest du ihn überschreiben?`)) {
                return;
            }
            logData[existingEntryIndex] = newEntry;
        } else {
            logData.push(newEntry);
        }
        saveLog(logData);
        renderLog();
    }

    clearLogbookBtn.addEventListener('click', () => {
        if (confirm('Bist du sicher, dass du alle Logbuch-Einträge unwiderruflich löschen möchtest?')) {
            localStorage.removeItem(LOGBOOK_KEY);
            renderLog();
        }
    });

    document.addEventListener('saveLogEntry', (event) => {
        addLogEntry(event.detail);
    });

    /**
     * Prüft beim Laden der Seite, ob für den heutigen Tag bereits ein Eintrag im Logbuch existiert.
     * Wenn ja, wird das "Ankunftszeit"-Feld automatisch mit dem gespeicherten Wert befüllt.
     */
    function prefillArrivalFromLog() {
        const logData = getLog();
        const todayDateString = new Date().toLocaleDateString('de-DE');
        
        const todayEntry = logData.find(entry => entry.date === todayDateString);
        
        if (todayEntry) {
            const ankunftszeitInput = document.getElementById('ankunftszeit');
            // Nur befüllen, wenn das Feld auch existiert und noch leer ist.
            if (ankunftszeitInput && !ankunftszeitInput.value) {
                ankunftszeitInput.value = todayEntry.arrival;
            }
        }
    }


    // Initiales Rendern des Logbuchs beim Seitenaufruf
    renderLog();

    // Rufe die neue Funktion direkt nach dem ersten Rendern auf.
    prefillArrivalFromLog();
});