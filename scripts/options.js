// scripts/options.js

/**
 * @file Optionen-Seite für den Arbeitszeit-Rechner.
 * @description Ermöglicht dem Benutzer das Anpassen und Speichern von Einstellungen wie Sollzeit, Überstunden, Minderjährigen-Pause, Rechner-Anzeige und Zeitdefinitionen.
 * @author Jörn Unverzagt
 * @date 2025-10-13
 */
document.addEventListener('DOMContentLoaded', () => {
    // Alle Einstellungs-Elemente holen
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveFeedback = document.getElementById('save-feedback');
    const standardSollzeitSelect = document.getElementById('standard-sollzeit');
    const standardUeberstundenInput = document.getElementById('standard-ueberstunden');
    const standardMinderjaehrigCheckbox = document.getElementById('standard-pause-minderjaehrig');
    const rechnerToggle = document.getElementById('rechner-toggle');
    const wunschGehzeitModeToggle = document.getElementById('wunsch-gehzeit-mode-toggle');
    const customWunschGehzeitContainer = document.getElementById('custom-wunsch-gehzeit-container');
    const customWunschGehzeitInput = document.getElementById('custom-wunsch-gehzeit');
    const gleitzeitStartInput = document.getElementById('gleitzeit-start');
    const kernzeitStartInput = document.getElementById('kernzeit-start');
    const kernzeitEndeInput = document.getElementById('kernzeit-ende');
    const kernzeitEndeFrInput = document.getElementById('kernzeit-ende-fr');
    const gleitzeitEndeInput = document.getElementById('gleitzeit-ende');

    const toggleCustomWunschGehzeit = () => {
        customWunschGehzeitContainer.style.display = wunschGehzeitModeToggle.checked ? 'block' : 'none';
    };

    /**
     * Lädt alle Einstellungen aus dem Local Storage und füllt die Felder auf der Optionsseite.
     */
    const loadSettingsForOptionsPage = () => {
        standardSollzeitSelect.value = localStorage.getItem('userSollzeit') || '8';
        standardUeberstundenInput.value = localStorage.getItem('userUeberstunden') || '';
        standardMinderjaehrigCheckbox.checked = localStorage.getItem('userIsMinderjaehrig') === 'true';
        rechnerToggle.checked = localStorage.getItem('userRechnerAnzeigen') === 'true';
        wunschGehzeitModeToggle.checked = localStorage.getItem('userWunschGehzeitMode') === 'true';
        customWunschGehzeitInput.value = localStorage.getItem('userCustomWunschGehzeit') || '';
        gleitzeitStartInput.value = localStorage.getItem('userGleitzeitStart') || '06:45';
        kernzeitStartInput.value = localStorage.getItem('userKernzeitStart') || '08:45';
        kernzeitEndeInput.value = localStorage.getItem('userKernzeitEnde') || '15:30';
        kernzeitEndeFrInput.value = localStorage.getItem('userKernzeitEndeFr') || '15:00';
        gleitzeitEndeInput.value = localStorage.getItem('userGleitzeitEnde') || '19:00';

        toggleCustomWunschGehzeit();
    };

    saveSettingsBtn.addEventListener('click', () => {
        // Validierungen...
        if (wunschGehzeitModeToggle.checked && customWunschGehzeitInput.value) { /* ... bleibt gleich ... */ }

        // Speichern
        localStorage.setItem('userSollzeit', standardSollzeitSelect.value);
        localStorage.setItem('userUeberstunden', standardUeberstundenInput.value);
        localStorage.setItem('userIsMinderjaehrig', standardMinderjaehrigCheckbox.checked);
        localStorage.setItem('userRechnerAnzeigen', rechnerToggle.checked);
        localStorage.setItem('userWunschGehzeitMode', wunschGehzeitModeToggle.checked);
        localStorage.setItem('userCustomWunschGehzeit', customWunschGehzeitInput.value);
        localStorage.setItem('userGleitzeitStart', gleitzeitStartInput.value);
        localStorage.setItem('userKernzeitStart', kernzeitStartInput.value);
        localStorage.setItem('userKernzeitEnde', kernzeitEndeInput.value);
        localStorage.setItem('userKernzeitEndeFr', kernzeitEndeFrInput.value);
        localStorage.setItem('userGleitzeitEnde', gleitzeitEndeInput.value);

        // Visuelles Feedback
        saveFeedback.style.opacity = '1';
        setTimeout(() => { saveFeedback.style.opacity = '0'; }, 2000);
    });

    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);
    loadSettingsForOptionsPage();
});