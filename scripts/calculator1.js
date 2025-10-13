// scripts/calculator1.js

/**
 * @file Enthält die Logik für den ersten Rechner "Wann kann ich gehen?".
 * @description Berechnet die frühestmögliche Gehzeit, die verbleibende Arbeitszeit und den Tagessaldo unter Berücksichtigung aller Zeitregeln (Gleitzeit, Kernzeit etc.).
 * @author Jörn Unverzagt
 * @date 2025-10-13
 */
document.addEventListener('DOMContentLoaded', () => {
    const berechneGehzeitBtn = document.getElementById('berechne-gehzeit');
    const ergebnisGehzeitEl = document.getElementById('ergebnis-gehzeit');
    const hauptSollzeitSelect = document.getElementById('sollzeit');
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig');
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden');
    const nowAnkunftBtn = document.getElementById('now-ankunft');
    const ankunftszeitInput = document.getElementById('ankunftszeit');

    if(nowAnkunftBtn) {
        nowAnkunftBtn.addEventListener('click', () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            ankunftszeitInput.value = `${hours}:${minutes}`;
        });
    }

    if (!berechneGehzeitBtn) return;

    /**
     * Event Listener für den "Berechnen"-Button des ersten Rechners.
     * Berechnet die frühestmögliche Gehzeit, die verbleibende Arbeitszeit und den Tagessaldo
     * unter Berücksichtigung aller Zeitregeln (Gleitzeit, Kernzeit etc.).
     */
    berechneGehzeitBtn.addEventListener('click', () => {
        // 1. Alle relevanten Werte aus den Eingabefeldern auslesen.
        const sollzeit = parseFloat(hauptSollzeitSelect.value);
        const ankunftszeit = document.getElementById('ankunftszeit').value;
        const isMinderjaehrig = hauptMinderjaehrigCheckbox.checked;
        const aktuelleUeberstunden = parseFloat(hauptUeberstundenInput.value) || 0;

        // 2. Eingaben validieren.
        if (!ankunftszeit) {
            showResult(ergebnisGehzeitEl, "Bitte gib eine Ankunftszeit ein.", 'error');
            return;
        }

        // 3. Zeitberechnungen durchführen.
        const zeiten = getKernzeitUndGleitzeit();
        const ankunftInMinutenTotal = timeStringToMinutes(ankunftszeit);
        const kalkulationsStartMinuten = Math.max(ankunftInMinutenTotal, zeiten.gleitzeitStart);
        const pausenDauer = isMinderjaehrig ? 60 : 45;
        const sollzeitInMinuten = sollzeit * 60;
        const rechnerischeGehzeitInMinuten = kalkulationsStartMinuten + sollzeitInMinuten + pausenDauer;

        let finaleGehzeitInMinuten;
        let gehzeitNachricht;

        // 4. Prüfen, ob das Gleitzeitende überschritten wird und Ergebnis ggf. kappen.
        if (rechnerischeGehzeitInMinuten > zeiten.gleitzeitEnde) {
            finaleGehzeitInMinuten = zeiten.gleitzeitEnde;
            gehzeitNachricht = `Du musst spätestens um <strong>${minutesToTimeString(zeiten.gleitzeitEnde)} Uhr</strong> gehen (Gleitzeitende).`;
        } else {
            // Sicherstellen, dass die Gehzeit nicht vor dem Kernzeitende liegt.
            finaleGehzeitInMinuten = Math.max(rechnerischeGehzeitInMinuten, zeiten.kernzeitEnde);
            gehzeitNachricht = `Du kannst frühestens um <strong>${minutesToTimeString(finaleGehzeitInMinuten)} Uhr</strong> gehen.`;
        }

        // 5. Salden und Restzeit berechnen.
        window.feierabendZeit = finaleGehzeitInMinuten; // Für den Countdown speichern
        const anwesenheitsMinuten = finaleGehzeitInMinuten - kalkulationsStartMinuten;
        const gearbeiteteMinuten = anwesenheitsMinuten - pausenDauer;
        const tagesDifferenz = gearbeiteteMinuten - sollzeitInMinuten;
        const aktuellerSaldoInMin = aktuelleUeberstunden * 60;
        const neuerGesamtSaldo = aktuellerSaldoInMin + tagesDifferenz;
        const formatierteRestzeit = berechneRestzeitBis(minutesToTimeString(finaleGehzeitInMinuten));

        // 6. Ergebnisnachricht inklusive aller Hinweise zusammenbauen.
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

        // 7. Ergebnis anzeigen.
        showResult(ergebnisGehzeitEl, nachricht);

        const logEntry = {
            id: new Date().setHours(0, 0, 0, 0), // Eindeutige ID pro Tag
            date: new Date().toLocaleDateString('de-DE'),
            arrival: ankunftszeit,
            leaving: minutesToTimeString(finaleGehzeitInMinuten),
            targetHours: sollzeit,
            dailySaldoMinutes: Math.round(tagesDifferenz)
        };

        const saveLogButton = document.createElement('button');
        saveLogButton.textContent = 'Tag im Logbuch speichern';
        saveLogButton.className = 'save-saldo-btn'; // Wiederverwendet den Stil des anderen Buttons

        saveLogButton.addEventListener('click', () => {
            // Sendet ein "Custom Event" mit den Tagesdaten. logbook.js wird darauf hören.
            document.dispatchEvent(new CustomEvent('saveLogEntry', { detail: logEntry }));
        });

        ergebnisGehzeitEl.appendChild(saveLogButton);
    });


});