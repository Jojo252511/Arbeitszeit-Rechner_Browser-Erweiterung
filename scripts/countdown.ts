// scripts/countdown.ts

/**
 * @module countdown
 * @description Dieses Modul implementiert einen Countdown-Timer, der die verbleibende Zeit bis zu einer bestimmten Zielzeit anzeigt.
 *              Der Timer kann entweder auf die berechnete Feierabendzeit oder auf eine benutzerdefinierte Wunsch-Gehzeit gesetzt werden.
 *              Der Countdown wird in einem modalen Fenster angezeigt und aktualisiert sich jede Sekunde.
 *             Der Timer ändert die Farbe der Anzeige, wenn die Zeit abgelaufen ist.
 * @author Jörn Unverzagt
 */

import { timeStringToMinutes } from './utils.js';

// Mache TypeScript die globale Variable aus calculator1.ts bekannt
declare global {
    interface Window {
        feierabendZeit?: number;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente holen und typisieren
    const startPlus0Btn = document.getElementById('start-countdown-plus0') as HTMLButtonElement;
    const startWunschBtn = document.getElementById('start-countdown-wunsch') as HTMLButtonElement;
    const countdownModal = document.getElementById('countdown-modal') as HTMLDivElement;
    const closeCountdownBtn = document.getElementById('close-countdown') as HTMLSpanElement;
    const countdownTitleEl = document.getElementById('countdown-title') as HTMLHeadingElement;
    const countdownTimerEl = document.getElementById('countdown-timer') as HTMLDivElement;
    const wunschGehzeitInput = document.getElementById('wunsch-gehzeit') as HTMLInputElement;


    // Gib der Intervall-Variable den korrekten Typ
    let countdownInterval: number | undefined;

    /**
     * Startet den Countdown zu einer Zielzeit.
     * @param {number} zielzeitInMinuten - Die Zielzeit in Minuten seit Mitternacht.
     * @param {string} titel - Der Titel, der über dem Countdown angezeigt wird.
     */
    function startCountdown(zielzeitInMinuten: number, titel: string): void {
        if (!countdownModal || !countdownTitleEl) return;
        countdownModal.style.display = 'flex';
        countdownTitleEl.textContent = titel;

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = window.setInterval(() => {
            const jetzt = new Date();
            const jetztInSekunden = (jetzt.getHours() * 3600) + (jetzt.getMinutes() * 60) + jetzt.getSeconds();
            const zielInSekunden = zielzeitInMinuten * 60;
            const restSekunden = zielInSekunden - jetztInSekunden;

            if (restSekunden <= 0) {
                clearInterval(countdownInterval);
                countdownTimerEl.textContent = "00:00:00";
                countdownTimerEl.style.color = 'var(--success-color)';
                return;
            }

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
    function closeCountdown(): void {
        if (!countdownModal) return;
        countdownModal.style.display = 'none';
        document.body.style.overflowY = 'auto';
        clearInterval(countdownInterval);
        countdownTimerEl.style.color = 'var(--primary-color)';
    }

    // Event Listeners
    if (closeCountdownBtn) closeCountdownBtn.addEventListener('click', closeCountdown);
    if (countdownModal) countdownModal.addEventListener('click', (event: MouseEvent) => {
        if (event.target === countdownModal) {
            closeCountdown();
        }
    });

    if (startPlus0Btn) startPlus0Btn.addEventListener('click', () => {
        if (window.feierabendZeit) {
            document.body.style.overflowY = 'hidden';
            startCountdown(window.feierabendZeit, "Restzeit bis Feierabend");
        } else {
            alert("Bitte berechne zuerst im 'Wann kann ich gehen?'-Rechner deinen Feierabend.");
        }
    });

    if (startWunschBtn) startWunschBtn.addEventListener('click', () => {
        if (wunschGehzeitInput && wunschGehzeitInput.value) {
            const wunschInMinuten = timeStringToMinutes(wunschGehzeitInput.value);
            document.body.style.overflowY = 'hidden';
            startCountdown(wunschInMinuten, "Restzeit bis zur Wunsch-Gehzeit");
        } else {
            alert("Bitte gib zuerst im 'Plus / Minus'-Rechner eine Wunsch-Gehzeit ein.");
        }
    });
});