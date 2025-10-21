// scripts/calculator1.ts

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, formatMinutesToString, showResult, berechneRestzeitBis, saveUeberH, showDayTypePrompt } from './utils.js';
import { type LogEntry } from './logbook-data.js';

declare global {
    interface Window {
        feierabendZeit?: number;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM-Elemente ---
    const berechneGehzeitBtn = document.getElementById('berechne-gehzeit') as HTMLButtonElement;
    const ergebnisGehzeitEl = document.getElementById('ergebnis-gehzeit') as HTMLDivElement;
    const hauptSollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const ankunftszeitInput = document.getElementById('ankunftszeit') as HTMLInputElement;
    const nowAnkunftBtn = document.getElementById('now-ankunft') as HTMLButtonElement;
    const moreOptionsLink = document.getElementById('calculator1-more') as HTMLAnchorElement;

    // --- Typdefinitionen für mehr Klarheit ---
    interface UserInputs {
        sollzeit: number;
        ankunftszeit: string;
        isMinderjaehrig: boolean;
        aktuelleUeberstunden: number;
    }

    interface CalculationResults {
        finaleGehzeitInMinuten: number;
        tagesDifferenz: number;
        neuerGesamtSaldo: number;
        logEntry: LogEntry;
    }

    /**
     * Sammelt alle Benutzereingaben aus dem Formular.
     */
    function getUserInputs(): UserInputs {
        return {
            sollzeit: parseFloat(hauptSollzeitSelect.value),
            ankunftszeit: ankunftszeitInput.value,
            isMinderjaehrig: hauptMinderjaehrigCheckbox.checked,
            aktuelleUeberstunden: parseFloat(hauptUeberstundenInput.value) || 0,
        };
    }

    /**
     * Führt die Kernberechnung für einen Arbeitstag durch.
     * @param inputs - Die gesammelten Benutzereingaben.
     * @returns Ein Objekt mit den Berechnungsergebnissen oder null bei einem Fehler.
     */
    function calculateTimes(inputs: UserInputs): CalculationResults | null {
        if (!inputs.ankunftszeit) {
            showResult(ergebnisGehzeitEl, "Bitte gib eine Ankunftszeit ein.", 'error');
            return null;
        }

        const zeiten = getKernzeitUndGleitzeit();
        const ankunftInMinutenTotal = timeStringToMinutes(inputs.ankunftszeit);
        const kalkulationsStartMinuten = Math.max(ankunftInMinutenTotal, zeiten.gleitzeitStart);
        const pausenDauer = inputs.isMinderjaehrig ? 60 : 45;
        const sollzeitInMinuten = inputs.sollzeit * 60;
        const rechnerischeGehzeitInMinuten = kalkulationsStartMinuten + sollzeitInMinuten + pausenDauer;

        const finaleGehzeitInMinuten = Math.max(rechnerischeGehzeitInMinuten, zeiten.kernzeitEnde);
        window.feierabendZeit = finaleGehzeitInMinuten;

        const anwesenheitsMinuten = finaleGehzeitInMinuten - kalkulationsStartMinuten;
        const gearbeiteteMinuten = anwesenheitsMinuten - pausenDauer;
        const tagesDifferenz = gearbeiteteMinuten - sollzeitInMinuten;
        const aktuellerSaldoInMin = inputs.aktuelleUeberstunden * 60;
        const neuerGesamtSaldo = aktuellerSaldoInMin + tagesDifferenz;

        const logEntry: LogEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            arrival: inputs.ankunftszeit,
            leaving: minutesToTimeString(finaleGehzeitInMinuten),
            targetHours: inputs.sollzeit,
            dailySaldoMinutes: Math.round(tagesDifferenz),
            label: "Arbeit"
        };
        
        return { finaleGehzeitInMinuten, tagesDifferenz, neuerGesamtSaldo, logEntry };
    }

    /**
     * Erstellt die formatierte HTML-Nachricht für die Ergebnisanzeige.
     * @param inputs - Die Benutzereingaben.
     * @param results - Die Berechnungsergebnisse.
     * @returns Den fertigen HTML-String für die Anzeige.
     */
    function buildResultMessage(inputs: UserInputs, results: CalculationResults): string {
        const { finaleGehzeitInMinuten, tagesDifferenz, neuerGesamtSaldo } = results;
        const zeiten = getKernzeitUndGleitzeit();
        const ankunftInMinutenTotal = timeStringToMinutes(inputs.ankunftszeit);
        const formatierteRestzeit = berechneRestzeitBis(minutesToTimeString(finaleGehzeitInMinuten));
        
        let nachricht = '';

        if (formatierteRestzeit) {
            nachricht += `Du musst noch min. <strong>${formatierteRestzeit}</strong> arbeiten.<hr class="result-hr">`;
        } else {
            nachricht += `Du kannst sofort gehen!<hr class="result-hr">`;
        }

        if (ankunftInMinutenTotal > zeiten.kernzeitStart) {
            nachricht += `<small class="error-text">Hinweis: Kernzeit verletzt!</small><hr class="result-hr">`;
        }
        
        nachricht += `Du kannst frühestens um <strong>${minutesToTimeString(finaleGehzeitInMinuten)} Uhr</strong> gehen.<hr class="result-hr">`;

        const tagesSaldoStyle = tagesDifferenz < 0 ? ' class="negative-saldo"' : '';
        nachricht += `Tages-Saldo: <strong${tagesSaldoStyle}>${(tagesDifferenz >= 0 ? "+" : "") + formatMinutesToString(tagesDifferenz)}</strong>`;

        if (hauptUeberstundenInput.value) {
            const gesamtSaldoStyle = neuerGesamtSaldo < 0 ? ' class="negative-saldo"' : '';
            nachricht += `<br>Neuer Gesamt-Saldo: <strong${gesamtSaldoStyle}>${(neuerGesamtSaldo >= 0 ? "+" : "") + formatMinutesToString(neuerGesamtSaldo)} (${(neuerGesamtSaldo / 60).toFixed(2).replace('.', ',')} h)</strong>`;
        }

        if (ankunftInMinutenTotal < zeiten.gleitzeitStart) {
            nachricht += `<br><small>(Berechnung ab Gleitzeitbeginn ${minutesToTimeString(zeiten.gleitzeitStart)} Uhr)</small>`;
        }
        
        return nachricht;
    }

    /**
     * Erstellt den "Speichern"-Button und fügt ihn dem Ergebnis-Container hinzu.
     * @param logEntry - Der zu speichernde Logbucheintrag.
     * @param neuerGesamtSaldo - Der neue Saldo zur Übergabe an saveUeberH.
     */
    function createSaveButton(logEntry: LogEntry, neuerGesamtSaldo: number) {
        const saveLogButton = document.createElement('button');
        saveLogButton.textContent = 'Tag im Logbuch speichern';
        saveLogButton.className = 'save-saldo-btn';

        saveLogButton.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('saveLogEntry', { detail: logEntry }));
            saveLogButton.disabled = true;
            saveLogButton.textContent = 'Gespeichert!';
            saveUeberH(neuerGesamtSaldo / 60);
        });

        ergebnisGehzeitEl.appendChild(saveLogButton);
    }

    /**
     * Hauptfunktion zur Verarbeitung eines Arbeitstages.
     */
    function calculateAndDisplayWorkingDay() {
        const inputs = getUserInputs();
        const results = calculateTimes(inputs);

        if (results) {
            const message = buildResultMessage(inputs, results);
            showResult(ergebnisGehzeitEl, message);
            createSaveButton(results.logEntry, results.neuerGesamtSaldo);
        }
    }

    /**
     * Verarbeitet die Erstellung eines Logbucheintrags basierend auf dem gewählten Typ.
     */
    function handleDayEntry(type: string) {
        if (type === 'Arbeit') {
            calculateAndDisplayWorkingDay();
            return;
        }

        const sollzeit = parseFloat(hauptSollzeitSelect.value);
        let logEntry: LogEntry;
        let resultMessage = '';

        const baseEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            targetHours: sollzeit,
            label: type,
        };

        switch (type) {
            case 'Krank':
            case 'Urlaub':
            case 'Berufsschule':
                logEntry = { ...baseEntry, arrival: '00:00', leaving: '00:00', dailySaldoMinutes: 0 };
                resultMessage = `Ein <strong>${type}stag</strong> wird für heute eingetragen.`;
                break;
            
            case 'Überstundenabbau':
                const abzubauendeMinuten = -(sollzeit * 60);
                logEntry = { ...baseEntry, arrival: '00:00', leaving: '00:00', dailySaldoMinutes: abzubauendeMinuten };
                resultMessage = `<strong>Überstundenabbau</strong> wird mit <strong>${formatMinutesToString(abzubauendeMinuten)}</strong> eingetragen.`;
                break;
            
            default:
                return;
        }

        showResult(ergebnisGehzeitEl, resultMessage);
        createSaveButton(logEntry, 0); // Hier ist der neue Gesamtsaldo nicht relevant
    }

    // --- Event-Listener ---
    nowAnkunftBtn?.addEventListener('click', () => {
        const now = new Date();
        ankunftszeitInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });

    berechneGehzeitBtn?.addEventListener('click', () => {
        handleDayEntry('Arbeit');
    });

    moreOptionsLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        const choices = [
            { value: 'Arbeit', text: 'Normaler Arbeitstag' },
            { value: 'Krank', text: 'Krankheitstag' },
            { value: 'Urlaub', text: 'Urlaubstag' },
            { value: 'Berufsschule', text: 'Berufsschule' },
            { value: 'Überstundenabbau', text: 'Überstundenabbau' },
        ];
        const selectedType = await showDayTypePrompt("Art des Eintrags wählen", "Wähle aus, welche Art von Tag du eintragen möchtest.", choices);
        if (selectedType) {
            handleDayEntry(selectedType);
        }
    });
});