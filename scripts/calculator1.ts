// scripts/calculator1.ts

/**
 * @module calculator1
 * @description Logik für den ersten Rechner "Wann kann ich gehen?".
 * @requires utils
 * @requires logbook
 * @author Joern Unverzagt
 */

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, formatMinutesToString, showResult, berechneRestzeitBis, saveUeberH, showDayTypePrompt } from './utils.js';
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
    const berechneGehzeitBtn = document.getElementById('berechne-gehzeit') as HTMLButtonElement;
    const ergebnisGehzeitEl = document.getElementById('ergebnis-gehzeit') as HTMLDivElement;
    const hauptSollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const nowAnkunftBtn = document.getElementById('now-ankunft') as HTMLButtonElement;
    const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;
    const moreOptionsLink = document.getElementById('calculator1-more') as HTMLAnchorElement;

    let resultMessage = '';
    
    nowAnkunftBtn?.addEventListener('click', () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        ankunftszeitInput.value = `${hours}:${minutes}`;
    });

    berechneGehzeitBtn?.addEventListener('click', () => {
        handleDayEntry('Arbeit'); 
    });

    // NEU: Ruft unser wiederverwendbares Modal auf
    moreOptionsLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const choices = [
            { value: 'Arbeit', text: 'Normaler Arbeitstag' },
            { value: 'Krank', text: 'Krankheitstag' },
            { value: 'Urlaub', text: 'Urlaubstag' },
            { value: 'Berufsschule', text: 'Berufsschule' },
            { value: 'Überstundenabbau', text: 'Überstundenabbau' },
        ];

        const selectedType = await showDayTypePrompt(
            "Art des Eintrags wählen",
            "Wähle aus, welche Art von Tag du eintragen möchtest.",
            choices
        );

        if (selectedType) {
            handleDayEntry(selectedType);
        }
    });

    
    /**
     * Zentrale Funktion, die je nach gewähltem Typ einen Logbucheintrag erstellt.
     */
    function handleDayEntry(type: string) {
        // --- Holt alle benötigten Werte aus der UI ---
        const sollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
        const minderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
        const ueberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;

        const sollzeit = parseFloat(sollzeitSelect.value);
        const ankunftszeit = ankunftszeitInput.value;
        const isMinderjaehrig = minderjaehrigCheckbox.checked;
        const aktuelleUeberstunden = parseFloat(ueberstundenInput.value) || 0;
        
        let logEntry: LogEntry;

        const baseEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            targetHours: sollzeit,
        };

        switch (type) {
            case 'Arbeit':
                calculateWorkingDay();
                break;
            case 'Krank':
            case 'Urlaub':
                logEntry = {
                    ...baseEntry,
                    arrival: '00:00',
                    leaving: '00:00',
                    dailySaldoMinutes: 0,
                    label: type,
                };
                resultMessage = `Ein <strong>${type}stag</strong> wird eingetragen.`;
                break;
            case 'Berufsschule':
                logEntry = {
                    ...baseEntry,
                    arrival: '00:00',
                    leaving: '00:00',
                    dailySaldoMinutes: 0,
                    label: type,
                };
                resultMessage = `Ein <strong>${type}stag</strong> wird für heute eingetragen.`;
                break;
            case 'Überstundenabbau':
                logEntry = {
                    ...baseEntry,
                    arrival: '00:00',
                    leaving: '00:00',
                    dailySaldoMinutes: -(sollzeit * 60),
                    label: type,
                };
                const saldoStr = formatMinutesToString(logEntry.dailySaldoMinutes);
                resultMessage = `<strong>Überstundenabbau</strong> wird mit <strong>${saldoStr}</strong> eingetragen.`;
                break;
            
            default:
                return;
        }

        showResult(ergebnisGehzeitEl, resultMessage);

        const saveLogButton = document.createElement('button');
        saveLogButton.textContent = 'Tag im Logbuch speichern';
        saveLogButton.className = 'save-saldo-btn';
        saveLogButton.onclick = () => {
            document.dispatchEvent(new CustomEvent('saveLogEntry', { detail: logEntry }));
            saveLogButton.disabled = true;
            saveLogButton.textContent = 'Gespeichert!';
        };
        ergebnisGehzeitEl.appendChild(saveLogButton);
    }

    function calculateWorkingDay() {
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
        
        resultMessage = nachricht;
        showResult(ergebnisGehzeitEl, nachricht);

        const logEntry: LogEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            arrival: ankunftszeit,
            leaving: minutesToTimeString(finaleGehzeitInMinuten),
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

        ergebnisGehzeitEl.appendChild(saveLogButton);
    }

    berechneGehzeitBtn.addEventListener('click', () => {
       calculateWorkingDay();
    });
});