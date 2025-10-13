// scripts/countdown.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente holen
    const startPlus0Btn = document.getElementById('start-countdown-plus0');
    const startWunschBtn = document.getElementById('start-countdown-wunsch');
    const countdownModal = document.getElementById('countdown-modal');
    const closeCountdownBtn = document.getElementById('close-countdown');
    const countdownTitleEl = document.getElementById('countdown-title');
    const countdownTimerEl = document.getElementById('countdown-timer');

    let countdownInterval; // Globale Variable für das Intervall

    /**
     * Startet den Countdown zu einer Zielzeit.
     * @param {number} zielzeitInMinuten - Die Zielzeit in Minuten seit Mitternacht.
     * @param {string} titel - Der Titel, der über dem Countdown angezeigt wird.
     */
    function startCountdown(zielzeitInMinuten, titel) {
        countdownModal.style.display = 'flex';
        countdownTitleEl.textContent = titel;

        // Altes Intervall löschen, falls eines läuft
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            const jetzt = new Date();
            const jetztInSekunden = (jetzt.getHours() * 3600) + (jetzt.getMinutes() * 60) + jetzt.getSeconds();
            const zielInSekunden = zielzeitInMinuten * 60;
            const restSekunden = zielInSekunden - jetztInSekunden;

            if (restSekunden <= 0) {
                clearInterval(countdownInterval);
                countdownTimerEl.textContent = "00:00:00";
                // Optional: Sound abspielen oder Farbe ändern
                countdownTimerEl.style.color = 'var(--success-color)';
                return;
            }

            // Reset color in case it was changed
            countdownTimerEl.style.color = 'var(--primary-color)';

            const stunden = Math.floor(restSekunden / 3600);
            const minuten = Math.floor((restSekunden % 3600) / 60);
            const sekunden = restSekunden % 60;

            countdownTimerEl.textContent = 
                `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}:${String(sekunden).padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * Schließt das Countdown-Fenster und stoppt den Timer.
     */
    function closeCountdown() {
        countdownModal.style.display = 'none';
        clearInterval(countdownInterval);
        countdownTimerEl.style.color = 'var(--primary-color)'; // Farbe zurücksetzen
    }

    // Event Listeners
    closeCountdownBtn.addEventListener('click', closeCountdown);
    countdownModal.addEventListener('click', (event) => {
        if (event.target === countdownModal) {
            closeCountdown();
        }
    });

    startPlus0Btn.addEventListener('click', () => {
        // Prüfen, ob eine Feierabendzeit vom ersten Rechner berechnet wurde.
        if (window.feierabendZeit) {
            startCountdown(window.feierabendZeit, "Restzeit bis Feierabend");
        } else {
            alert("Bitte berechne zuerst im 'Wann kann ich gehen?'-Rechner deinen Feierabend.");
        }
    });

    startWunschBtn.addEventListener('click', () => {
        const wunschGehzeit = document.getElementById('wunsch-gehzeit').value;
        if (wunschGehzeit) {
            const wunschInMinuten = timeStringToMinutes(wunschGehzeit);
            startCountdown(wunschInMinuten, "Restzeit bis zur Wunsch-Gehzeit");
        } else {
            alert("Bitte gib zuerst im 'Plus / Minus'-Rechner eine Wunsch-Gehzeit ein.");
        }
    });
});