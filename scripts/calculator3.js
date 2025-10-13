// scripts/calculator3.js

/**
 * @file Enthält die Logik für den dritten Rechner "Überstunden-Planer".
 * @description Berechnet, wie viele Überstunden pro Tag nötig sind, um ein Gesamtziel zu erreichen, und wie viele Überstunden insgesamt anfallen, wenn man über einen Zeitraum jeden Tag ein festes Plus macht.
 * @author Jörn Unverzagt
 * @date 2025-10-13
 */
document.addEventListener('DOMContentLoaded', () => {
    const berechneTaeglichesPlusBtn = document.getElementById('berechne-taegliches-plus');
    const ergebnisTaeglichesPlusEl = document.getElementById('ergebnis-taegliches-plus');
    const berechneGesamtPlusBtn = document.getElementById('berechne-gesamt-plus');
    const ergebnisGesamtPlusEl = document.getElementById('ergebnis-gesamt-plus');
    
    if (!berechneTaeglichesPlusBtn) return;

    /**
     * Event Listener für den ersten Teil des Planers.
     * Berechnet, wie viele Überstunden pro Tag nötig sind, um ein Gesamtziel zu erreichen.
     */
    berechneTaeglichesPlusBtn.addEventListener('click', () => {
        const stundenZiel = parseFloat(document.getElementById('stunden-ziel').value);
        const tageZiel = parseInt(document.getElementById('tage-ziel').value, 10);
        if (isNaN(stundenZiel) || isNaN(tageZiel) || tageZiel <= 0 || stundenZiel < 0) {
            showResult(ergebnisTaeglichesPlusEl, "Bitte gib gültige Zahlen ein.", 'error'); return;
        }
        const taeglichesPlusMinuten = (stundenZiel * 60) / tageZiel;
        if (taeglichesPlusMinuten < 1) { showResult(ergebnisTaeglichesPlusEl, "Unrealistische Angabe: Täglich weniger als 1min", 'error'); return; }
        if (taeglichesPlusMinuten > 600) { showResult(ergebnisTaeglichesPlusEl, "Unrealistische Angabe: Täglich mehr als 10h", 'error'); return; }
        showResult(ergebnisTaeglichesPlusEl, `Du musst täglich <strong>+${formatMinutesToString(taeglichesPlusMinuten)}</strong> machen.`);
    });

    /**
     * Event Listener für den zweiten Teil des Planers.
     * Berechnet, wie viele Überstunden insgesamt anfallen, wenn man über einen Zeitraum
     * jeden Tag ein festes Plus macht.
     */
    berechneGesamtPlusBtn.addEventListener('click', () => {
        const taeglichesPlus = parseInt(document.getElementById('taegliches-plus').value, 10);
        const tageAnzahl = parseInt(document.getElementById('tage-anzahl').value, 10);
        if (isNaN(taeglichesPlus) || isNaN(tageAnzahl) || tageAnzahl <= 0) {
            showResult(ergebnisGesamtPlusEl, "Bitte gib gültige Zahlen ein.", 'error'); return;
        }
        const gesamtPlusMinuten = taeglichesPlus * tageAnzahl;
        const symbol = gesamtPlusMinuten >= 0 ? "+" : "";
        const negativStyle = (gesamtPlusMinuten < 0) ? ' class="negative-saldo"' : '';
        showResult(ergebnisGesamtPlusEl, `Du hast insgesamt <strong${negativStyle}>${symbol}${formatMinutesToString(gesamtPlusMinuten)}</strong> angesammelt.`);
    });
});