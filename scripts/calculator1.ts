// scripts/calculator1.ts

/**
 * @module calculator1
 * @description Logik für den ersten Rechner "Wann kann ich gehen?".
 * @requires utils
 * @requires logbook
 * @author Joern Unverzagt
 */

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, formatMinutesToString, showResult, berechneRestzeitBis, saveUeberH } from './utils.js';
import { type LogEntry } from './logbook-data.js'; // Importiert die Struktur eines Log-Eintrags

declare global {
    interface Window {
        feierabendZeit?: number; // Das '?' bedeutet, die Eigenschaft ist optional
    }
}

/**
 * @file Enthält die Logik für den ersten Rechner "Wann kann ich gehen?".
 */
document.addEventListener('DOMContentLoaded', () => {
    // NEU: Weise den Konstanten die korrekten HTML-Typen zu
    const berechneGehzeitBtn = document.getElementById('berechne-gehzeit') as HTMLButtonElement;
    const ergebnisGehzeitEl = document.getElementById('ergebnis-gehzeit') as HTMLDivElement;
    const hauptSollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const nowAnkunftBtn = document.getElementById('now-ankunft') as HTMLButtonElement;
    const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;

    if (!berechneGehzeitBtn || !ergebnisGehzeitEl) {
        console.error("Haupt-Elemente für Rechner 1 konnten nicht gefunden werden.");
        return;
    }
    
    if (nowAnkunftBtn && ankunftszeitInput) {
        nowAnkunftBtn.addEventListener('click', () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            ankunftszeitInput.value = `${hours}:${minutes}`;
        });
    }

    berechneGehzeitBtn.addEventListener('click', () => {
        const sollzeit = parseFloat(hauptSollzeitSelect.value);
        const ankunftszeit = ankunftszeitInput.value;
        const isMinderjaehrig = hauptMinderjaehrigCheckbox.checked;
        const aktuelleUeberstunden = parseFloat(hauptUeberstundenInput.value) || 0;

        if (!ankunftszeit) {
            showResult(ergebnisGehzeitEl, "Bitte gib eine Ankunftszeit ein.", 'error');
            return;
        }

        const zeiten = getKernzeitUndGleitzeit();
        const ankunftInMinutenTotal = timeStringToMinutes(ankunftszeit);
        const kalkulationsStartMinuten = Math.max(ankunftInMinutenTotal, zeiten.gleitzeitStart);
        const pausenDauer = isMinderjaehrig ? 60 : 45;
        const sollzeitInMinuten = sollzeit * 60;
        const rechnerischeGehzeitInMinuten = kalkulationsStartMinuten + sollzeitInMinuten + pausenDauer;

        let finaleGehzeitInMinuten: number;
        let gehzeitNachricht: string;

        if (rechnerischeGehzeitInMinuten > zeiten.gleitzeitEnde) {
            finaleGehzeitInMinuten = zeiten.gleitzeitEnde;
            gehzeitNachricht = `Du musst spätestens um <strong>${minutesToTimeString(zeiten.gleitzeitEnde)} Uhr</strong> gehen (Gleitzeitende).`;
        } else {
            finaleGehzeitInMinuten = Math.max(rechnerischeGehzeitInMinuten, zeiten.kernzeitEnde);
            gehzeitNachricht = `Du kannst frühestens um <strong>${minutesToTimeString(finaleGehzeitInMinuten)} Uhr</strong> gehen.`;
        }

        window.feierabendZeit = finaleGehzeitInMinuten;
        const anwesenheitsMinuten = finaleGehzeitInMinuten - kalkulationsStartMinuten;
        const gearbeiteteMinuten = anwesenheitsMinuten - pausenDauer;
        const tagesDifferenz = gearbeiteteMinuten - sollzeitInMinuten;
        const aktuellerSaldoInMin = aktuelleUeberstunden * 60;
        const neuerGesamtSaldo = aktuellerSaldoInMin + tagesDifferenz;
        const formatierteRestzeit = berechneRestzeitBis(minutesToTimeString(finaleGehzeitInMinuten));
        const saldoDezimalFuerFunktion = (neuerGesamtSaldo / 60).toFixed(2);
        
        let kernzeitHinweis = '';
        if (ankunftInMinutenTotal > zeiten.kernzeitStart) {
            kernzeitHinweis = `<small class="error-text">Hinweis: Kernzeit verletzt!</small><hr class="result-hr">`;
        }

        let nachricht = '';
        if (formatierteRestzeit) {
            nachricht += `Du musst noch min. <strong>${formatierteRestzeit}</strong> arbeiten.<hr class="result-hr">`;
        } else {
            nachricht += `Du kannst sofort gehen!<hr class="result-hr">`;
        }

        nachricht += kernzeitHinweis;
        nachricht += `${gehzeitNachricht}<hr class="result-hr">`;

        const tagesSaldoStyle = (tagesDifferenz < 0) ? ' class="negative-saldo"' : '';
        nachricht += `Tages-Saldo: <strong${tagesSaldoStyle}>${(tagesDifferenz >= 0 ? "+" : "") + formatMinutesToString(tagesDifferenz)}</strong>`;

        if (hauptUeberstundenInput.value) {
            const gesamtSaldoStyle = (neuerGesamtSaldo < 0) ? ' class="negative-saldo"' : '';
            nachricht += `<br>Neuer Gesamt-Saldo: <strong${gesamtSaldoStyle}>${(neuerGesamtSaldo >= 0 ? "+" : "") + formatMinutesToString(neuerGesamtSaldo)} (${(neuerGesamtSaldo / 60).toFixed(2).replace('.', ',')} h)</strong>`;
        }

        if (ankunftInMinutenTotal < zeiten.gleitzeitStart) {
            nachricht += `<br><small>(Berechnung ab Gleitzeitbeginn 06:45 Uhr)</small>`;
        }

        showResult(ergebnisGehzeitEl, nachricht);

        const logEntry: LogEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            arrival: ankunftszeit,
            leaving: minutesToTimeString(finaleGehzeitInMinuten),
            targetHours: sollzeit,
            dailySaldoMinutes: Math.round(tagesDifferenz)
        };

        const saveLogButton = document.createElement('button');
        saveLogButton.textContent = 'Tag im Logbuch speichern';
        saveLogButton.className = 'save-saldo-btn';

        saveLogButton.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('saveLogEntry', { detail: logEntry }));
            saveLogButton.disabled = true;
            saveLogButton.textContent = 'Gespeichert!';
            saveUeberH(parseFloat(saldoDezimalFuerFunktion));
        });

        ergebnisGehzeitEl.appendChild(saveLogButton);
    });
});