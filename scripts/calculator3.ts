// scripts/calculator3.ts

/**
 * @module Calculator3 - Überstunden-Planer
 * @description Berechnet das tägliche Plus/Minus an Überstunden, um ein bestimmtes Ziel zu erreichen,
 * @author Joern Unverzagt
 */

import { formatMinutesToString, showResult, getSollArbeitszeit } from './utils.js';

/**
 * @file Enthält die Logik für den dritten Rechner "Überstunden-Planer".
 */
document.addEventListener('DOMContentLoaded', () => {
    const berechneTaeglichesPlusBtn = document.getElementById('berechne-taegliches-plus') as HTMLButtonElement;
    const ergebnisTaeglichesPlusEl = document.getElementById('ergebnis-taegliches-plus') as HTMLDivElement;
    const berechneGesamtPlusBtn = document.getElementById('berechne-gesamt-plus') as HTMLButtonElement;
    const ergebnisGesamtPlusEl = document.getElementById('ergebnis-gesamt-plus') as HTMLDivElement;
    
    if (!berechneTaeglichesPlusBtn || !berechneGesamtPlusBtn) return;

    berechneTaeglichesPlusBtn.addEventListener('click', async () => {
        const stundenZielInput = document.getElementById('stunden-ziel') as HTMLInputElement;
        const tageZielInput = document.getElementById('tage-ziel') as HTMLInputElement;

        const settings = await chrome.storage.sync.get({ userUeberstunden: '0' });
        const aktuelleUeberstunden = parseFloat(settings.userUeberstunden) || 0;

        const stundenZiel = parseFloat(stundenZielInput.value);
        const tageZiel = parseInt(tageZielInput.value, 10);

        if (isNaN(stundenZiel) || isNaN(tageZiel) || tageZiel <= 0) {
            showResult(ergebnisTaeglichesPlusEl, "Bitte gib gültige Zahlen ein.", 'error'); return;
        }
        if (stundenZiel < 0 && Math.abs(stundenZiel) > aktuelleUeberstunden) {
            showResult(ergebnisTaeglichesPlusEl, `Du kannst nicht mehr Stunden abbauen (${Math.abs(stundenZiel)}h), als du hast (${aktuelleUeberstunden.toFixed(2)}h).`, 'error');
            return;
        }
        const taeglichesPlusMinuten = (stundenZiel * 60) / tageZiel;
        if (taeglichesPlusMinuten > 600 || taeglichesPlusMinuten < -600 ) { // +/- 10 Stunden pro Tag
            showResult(ergebnisTaeglichesPlusEl, "Unrealistische Angabe: Mehr als 10 Stunden pro Tag.", 'error');
            return;
        }

        const sollArbeitszeit = await getSollArbeitszeit();
        if (sollArbeitszeit && sollArbeitszeit != 0) {
            const sollArbeitszeitInMinuten = sollArbeitszeit * 60;
            if (taeglichesPlusMinuten + sollArbeitszeitInMinuten > 600) { // Max 10 Stunden Arbeit pro Tag
                showResult(ergebnisTaeglichesPlusEl, "Unrealistische Angabe: Mehr als 10 Stunden Arbeit pro Tag.", 'error');
                return;
            }
        }

        const symbol = stundenZiel >= 0 ? '+' : '';
        const aktion = stundenZiel >= 0 ? 'mehr arbeiten' : 'weniger arbeiten';
        showResult(ergebnisTaeglichesPlusEl, `Du musst täglich <strong>${symbol}${formatMinutesToString(taeglichesPlusMinuten)}</strong> ${aktion}.`);
    });

    berechneGesamtPlusBtn.addEventListener('click', () => {
        const taeglichesPlusInput = document.getElementById('taegliches-plus') as HTMLInputElement;
        const tageAnzahlInput = document.getElementById('tage-anzahl') as HTMLInputElement;

        const taeglichesPlus = parseInt(taeglichesPlusInput.value, 10);
        const tageAnzahl = parseInt(tageAnzahlInput.value, 10);

        if (isNaN(taeglichesPlus) || isNaN(tageAnzahl) || tageAnzahl <= 0) {
            showResult(ergebnisGesamtPlusEl, "Bitte gib gültige Zahlen ein.", 'error'); return;
        }
        const gesamtPlusMinuten = taeglichesPlus * tageAnzahl;
        const symbol = gesamtPlusMinuten >= 0 ? "+" : "";
        const negativStyle = (gesamtPlusMinuten < 0) ? ' class="negative-saldo"' : '';
        showResult(ergebnisGesamtPlusEl, `Du hast insgesamt <strong${negativStyle}>${symbol}${formatMinutesToString(gesamtPlusMinuten)}</strong> angesammelt.`);
    });
});
