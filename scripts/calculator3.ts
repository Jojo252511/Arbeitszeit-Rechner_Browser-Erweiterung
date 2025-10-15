// scripts/calculator3.ts

/**
 * @module calculator3
 * @author Joern Unverzagt
 * @description Logik für den dritten Rechner "Überstunden-Planer".
 */

import { formatMinutesToString, showResult } from './utils.js';

/**
 * @file Enthält die Logik für den dritten Rechner "Überstunden-Planer".
 */
document.addEventListener('DOMContentLoaded', () => {
    const berechneTaeglichesPlusBtn = document.getElementById('berechne-taegliches-plus') as HTMLButtonElement;
    const ergebnisTaeglichesPlusEl = document.getElementById('ergebnis-taegliches-plus') as HTMLDivElement;
    const berechneGesamtPlusBtn = document.getElementById('berechne-gesamt-plus') as HTMLButtonElement;
    const ergebnisGesamtPlusEl = document.getElementById('ergebnis-gesamt-plus') as HTMLDivElement;
    
    if (!berechneTaeglichesPlusBtn || !berechneGesamtPlusBtn) return;

    berechneTaeglichesPlusBtn.addEventListener('click', () => {
        const stundenZielInput = document.getElementById('stunden-ziel') as HTMLInputElement;
        const tageZielInput = document.getElementById('tage-ziel') as HTMLInputElement;

        const stundenZiel = parseFloat(stundenZielInput.value);
        const tageZiel = parseInt(tageZielInput.value, 10);

        if (isNaN(stundenZiel) || isNaN(tageZiel) || tageZiel <= 0 || stundenZiel < 0) {
            showResult(ergebnisTaeglichesPlusEl, "Bitte gib gültige Zahlen ein.", 'error'); return;
        }
        const taeglichesPlusMinuten = (stundenZiel * 60) / tageZiel;
        if (taeglichesPlusMinuten < 1) { showResult(ergebnisTaeglichesPlusEl, "Unrealistische Angabe: Täglich weniger als 1min", 'error'); return; }
        if (taeglichesPlusMinuten > 600) { showResult(ergebnisTaeglichesPlusEl, "Unrealistische Angabe: Täglich mehr als 10h", 'error'); return; }
        showResult(ergebnisTaeglichesPlusEl, `Du musst täglich <strong>+${formatMinutesToString(taeglichesPlusMinuten)}</strong> machen.`);
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