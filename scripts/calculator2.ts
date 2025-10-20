// scripts/calculator2.ts

/**
 * @module calculator2
 * @description Enthält die Logik für den zweiten Rechner "Plus / Minus bei Wunsch-Gehzeit".
 * @requires utils
 * @requires logbook
 * @author Joern Unverzagt
 */

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, formatMinutesToString, showResult, berechneRestzeitBis, saveUeberH } from './utils.js';
import { type LogEntry } from './logbook-data.js'; // Importiert die Struktur eines Log-Eintrags

/**
 * @file Enthält die Logik für den zweiten Rechner "Plus / Minus bei Wunsch-Gehzeit".
 */
document.addEventListener('DOMContentLoaded', () => {
    const berechnePlusMinusBtn = document.getElementById('berechne-plusminus') as HTMLButtonElement;
    const ergebnisPlusMinusEl = document.getElementById('ergebnis-plusminus') as HTMLDivElement;
    const wunschGehzeitInput = document.getElementById('wunsch-gehzeit') as HTMLInputElement;
    const hauptSollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const nowWunschBtn = document.getElementById('now-wunsch') as HTMLButtonElement;
    const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;


    if (nowWunschBtn && wunschGehzeitInput) {
        nowWunschBtn.addEventListener('click', () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            wunschGehzeitInput.value = `${hours}:${minutes}`;
        });
    }

    if (!berechnePlusMinusBtn || !ergebnisPlusMinusEl) return;

    function loadWunschGehzeit(): void {
        const wunschGehzeitMode = localStorage.getItem('userWunschGehzeitMode') === 'true';
        const customWunschGehzeit = localStorage.getItem('userCustomWunschGehzeit');

        if (wunschGehzeitMode && customWunschGehzeit) {
            wunschGehzeitInput.value = customWunschGehzeit;
        } else {
            if (!wunschGehzeitInput.value) {
                wunschGehzeitInput.value = minutesToTimeString(getKernzeitUndGleitzeit().kernzeitEnde);
            }
        }
    }
    loadWunschGehzeit();

    berechnePlusMinusBtn.addEventListener('click', () => {
        const sollzeit = parseFloat(hauptSollzeitSelect.value);
        const ankunftszeit = ankunftszeitInput.value;
        const wunschGehzeit = wunschGehzeitInput.value;
        const isMinderjaehrig = hauptMinderjaehrigCheckbox.checked;
        const aktuelleUeberstunden = parseFloat(hauptUeberstundenInput.value) || 0;

        if (!ankunftszeit || !wunschGehzeit) {
            showResult(ergebnisPlusMinusEl, "Bitte fülle Ankunfts- und Wunsch-Gehzeit aus.", 'error');
            return;
        }
        if (wunschGehzeit < ankunftszeit) {
            showResult(ergebnisPlusMinusEl, 'Fehler: Die Gehzeit kann nicht vor der Ankunftszeit liegen.', 'error');
            return;
        }

        const zeiten = getKernzeitUndGleitzeit();
        const wunschGehzeitInMinuten = timeStringToMinutes(wunschGehzeit);

        if (wunschGehzeitInMinuten < zeiten.kernzeitEnde) {
             showResult(ergebnisPlusMinusEl, `Gehen nicht möglich. Die Kernzeit endet erst um ${minutesToTimeString(zeiten.kernzeitEnde)} Uhr.`, 'error');
             return;
        }
        if (wunschGehzeitInMinuten > zeiten.gleitzeitEnde) {
             showResult(ergebnisPlusMinusEl, `Fehler: Die Gehzeit liegt außerhalb der Gleitzeit (nach ${minutesToTimeString(zeiten.gleitzeitEnde)} Uhr).`, 'error');
             return;
        }

        const kalkulationsStartMinuten = Math.max(timeStringToMinutes(ankunftszeit), zeiten.gleitzeitStart);
        const pausenDauer = isMinderjaehrig ? 60 : 45;
        const gearbeiteteMinuten = wunschGehzeitInMinuten - kalkulationsStartMinuten - pausenDauer;

        const maxArbeitszeitMinuten = isMinderjaehrig ? (8 * 60) : (10 * 60);
        if (gearbeiteteMinuten > maxArbeitszeitMinuten) {
             showResult(ergebnisPlusMinusEl, `Fehler: Die Höchstarbeitszeit von ${isMinderjaehrig ? 8 : 10} Stunden wird überschritten.`, 'error');
             return;
        }

        const sollzeitInMinuten = sollzeit * 60;
        const tagesDifferenz = gearbeiteteMinuten - sollzeitInMinuten;
        const aktuellerSaldoInMin = aktuelleUeberstunden * 60;
        const neuerGesamtSaldo = aktuellerSaldoInMin + tagesDifferenz;
        const saldoDezimalFuerFunktion = (neuerGesamtSaldo / 60).toFixed(2);
        const neuerGesamtSaldoDezimal = saldoDezimalFuerFunktion.replace('.', ',');

        let nachricht = '';
        const restzeit = berechneRestzeitBis(wunschGehzeit);
        if (restzeit === null) {
            nachricht += `Wunsch-Gehzeit bereits erreicht!<hr class="result-hr">`;
        } else {
            nachricht += `Du musst noch <strong>${restzeit}</strong> arbeiten, um die Wunsch-Gehzeit zu erreichen.<hr class="result-hr">`;
        }

        const tagesSaldoStyle = (tagesDifferenz < 0) ? ' class="negative-saldo"' : '';
        nachricht += `Tages-Saldo: <strong${tagesSaldoStyle}>${(tagesDifferenz >= 0 ? "+" : "") + formatMinutesToString(tagesDifferenz)}</strong>`;

        const savedUeberstunden = `<button type="button" data-saldo="${saldoDezimalFuerFunktion}" class="save-saldo-btn">Neuen Saldo speichern</button>`;

        if (hauptUeberstundenInput.value) {
            const gesamtSaldoStyle = (neuerGesamtSaldo < 0) ? ' class="negative-saldo"' : '';
            nachricht += `<br>Neuer Gesamt-Saldo: <strong${gesamtSaldoStyle}>${(neuerGesamtSaldo >= 0 ? "+" : "") + formatMinutesToString(neuerGesamtSaldo)} (${neuerGesamtSaldoDezimal} h)</strong>`;
        }

        showResult(ergebnisPlusMinusEl, nachricht);
        if (hauptUeberstundenInput.value) {
            ergebnisPlusMinusEl.insertAdjacentHTML('beforeend', savedUeberstunden);
        }

        const logEntry: LogEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            arrival: ankunftszeit,
            leaving: wunschGehzeit,
            targetHours: sollzeit,
            dailySaldoMinutes: Math.round(tagesDifferenz),
            label: "Arbeit"
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

        ergebnisPlusMinusEl.appendChild(saveLogButton);
    });

    ergebnisPlusMinusEl.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        if (target && target.classList.contains('save-saldo-btn') && target.dataset.saldo) {
            const saldo = parseFloat(target.dataset.saldo);
            saveUeberH(saldo);
        }
    });
});