// scripts/calculator2.js

/**
 * @file Enthält die Logik für den zweiten Rechner "Plus / Minus bei Wunsch-Gehzeit".
 * @description Berechnet den Tagessaldo für eine vom Benutzer festgelegte Gehzeit und führt dabei umfangreiche Validierungen durch.
 * @author Jörn Unverzagt
 * @date 2025-10-13
 */
document.addEventListener('DOMContentLoaded', () => {
    const berechnePlusMinusBtn = document.getElementById('berechne-plusminus');
    const ergebnisPlusMinusEl = document.getElementById('ergebnis-plusminus');
    const wunschGehzeitInput = document.getElementById('wunsch-gehzeit');
    const hauptSollzeitSelect = document.getElementById('sollzeit');
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig');
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden');
    const nowWunschBtn = document.getElementById('now-wunsch');

    if(nowWunschBtn) {
        nowWunschBtn.addEventListener('click', () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            wunschGehzeitInput.value = `${hours}:${minutes}`;
        });
    }

    if (!berechnePlusMinusBtn) return;

    /**
     * Füllt das Feld "Wunsch-Gehzeit" basierend auf den gespeicherten Einstellungen vor.
     * Entweder mit einer festen Zeit oder dem automatischen Kernzeitende.
     */
    function loadWunschGehzeit() {
        const wunschGehzeitMode = localStorage.getItem('userWunschGehzeitMode') === 'true';
        const customWunschGehzeit = localStorage.getItem('userCustomWunschGehzeit');

        if (wunschGehzeitMode && customWunschGehzeit) {
            wunschGehzeitInput.value = customWunschGehzeit;
        } else {
            // Nur füllen, wenn das Feld leer ist, um manuelle Eingaben nicht zu überschreiben.
            if (!wunschGehzeitInput.value) {
                wunschGehzeitInput.value = minutesToTimeString(getKernzeitUndGleitzeit().kernzeitEnde);
            }
        }
    }
    loadWunschGehzeit();

    /**
     * Event Listener für den "Zeitdifferenz berechnen"-Button.
     * Berechnet den Tagessaldo für eine vom Benutzer festgelegte Gehzeit und führt
     * dabei umfangreiche Validierungen durch.
     */
    berechnePlusMinusBtn.addEventListener('click', () => {
        // 1. Werte auslesen.
        const sollzeit = parseFloat(hauptSollzeitSelect.value);
        const ankunftszeit = document.getElementById('ankunftszeit').value;
        const wunschGehzeit = wunschGehzeitInput.value;
        const isMinderjaehrig = hauptMinderjaehrigCheckbox.checked;
        const aktuelleUeberstunden = parseFloat(hauptUeberstundenInput.value) || 0;

        // 2. Eingaben validieren (leere Felder, Gehzeit vor Ankunftszeit, Zeitgrenzen).
        if (!ankunftszeit || !wunschGehzeit) { /* ... */ return; }
        if (wunschGehzeit < ankunftszeit) { /* ... */ return; }

        const zeiten = getKernzeitUndGleitzeit();
        const wunschGehzeitInMinuten = timeStringToMinutes(wunschGehzeit);

        if (wunschGehzeitInMinuten < zeiten.kernzeitEnde) { /* ... */ return; }
        if (wunschGehzeitInMinuten > zeiten.gleitzeitEnde) { /* ... */ return; }

        // 3. Arbeitszeit berechnen und auf Höchstarbeitszeit prüfen.
        const kalkulationsStartMinuten = Math.max(timeStringToMinutes(ankunftszeit), zeiten.gleitzeitStart);
        const pausenDauer = isMinderjaehrig ? 60 : 45;
        const gearbeiteteMinuten = wunschGehzeitInMinuten - kalkulationsStartMinuten - pausenDauer;

        const maxArbeitszeitMinuten = isMinderjaehrig ? (8 * 60) : (10 * 60);
        if (gearbeiteteMinuten > maxArbeitszeitMinuten) { /* ... */ return; }

        // 4. Salden berechnen.
        const sollzeitInMinuten = sollzeit * 60;
        const tagesDifferenz = gearbeiteteMinuten - sollzeitInMinuten;
        const aktuellerSaldoInMin = aktuelleUeberstunden * 60;
        const neuerGesamtSaldo = aktuellerSaldoInMin + tagesDifferenz;
        const saldoDezimalFuerFunktion = (neuerGesamtSaldo / 60).toFixed(2);

        // 5. Ergebnisnachricht zusammenbauen.
        let nachricht = '';
        const restzeit = berechneRestzeitBis(wunschGehzeit);
        if (restzeit === null) {
            nachricht += `Wunsch-Gehzeit bereits erreicht!<hr class="result-hr">`;
        } else {
            nachricht += `Du musst noch <strong>${restzeit}</strong> arbeiten, um die Wunsch-Gehzeit zu erreichen.<hr class="result-hr">`;
        }

        const tagesSaldoStyle = (tagesDifferenz < 0) ? ' class="negative-saldo"' : '';
        nachricht += `Tages-Saldo: <strong${tagesSaldoStyle}>${(tagesDifferenz >= 0 ? "+" : "") + formatMinutesToString(tagesDifferenz)}</strong>`;

        const savedUeberstunden = `<button type="button" onclick="saveUeberH(${saldoDezimalFuerFunktion})" class="save-saldo-btn">Neuen Saldo speichern</button>`;

        if (hauptUeberstundenInput.value) {
            const gesamtSaldoStyle = (neuerGesamtSaldo < 0) ? ' class="negative-saldo"' : '';
            nachricht += `<br>Neuer Gesamt-Saldo: <strong${gesamtSaldoStyle}>${(neuerGesamtSaldo >= 0 ? "+" : "") + formatMinutesToString(neuerGesamtSaldo)} (${(neuerGesamtSaldo / 60).toFixed(2).replace('.', ',')} h)</strong>`;
        }

        // 6. Ergebnis anzeigen und "Speichern"-Button hinzufügen.
        showResult(ergebnisPlusMinusEl, nachricht);
        if (hauptUeberstundenInput.value) {
            ergebnisPlusMinusEl.insertAdjacentHTML('beforeend', savedUeberstunden);
        }

        const logEntry = {
            id: new Date().setHours(0, 0, 0, 0),
            date: new Date().toLocaleDateString('de-DE'),
            arrival: ankunftszeit,
            leaving: wunschGehzeit,
            targetHours: sollzeit,
            dailySaldoMinutes: Math.round(tagesDifferenz)
        };

        const saveLogButton = document.createElement('button');
        saveLogButton.textContent = 'Tag im Logbuch speichern';
        saveLogButton.className = 'save-saldo-btn';

        saveLogButton.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('saveLogEntry', { detail: logEntry }));
        });

        // Füge den neuen Button nach dem "Saldo speichern"-Button hinzu
        ergebnisPlusMinusEl.appendChild(saveLogButton);
    });


});