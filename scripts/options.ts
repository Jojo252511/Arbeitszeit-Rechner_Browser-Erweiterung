// scripts/options.ts

/**
 * @module options
 * @description Verwaltung der Optionen-Seite für den Arbeitszeit-Rechner.
 * @author Joern Unverzagt
 */

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString } from './utils.js';

/**
 * @file Optionen-Seite für den Arbeitszeit-Rechner.
 * @description Ermöglicht dem Benutzer das Anpassen und Speichern von Einstellungen.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Alle Einstellungs-Elemente holen
    const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;
    const saveFeedback = document.getElementById('save-feedback') as HTMLDivElement;
    const standardSollzeitSelect = document.getElementById('standard-sollzeit') as HTMLSelectElement;
    const standardUeberstundenInput = document.getElementById('standard-ueberstunden') as HTMLInputElement;
    const standardMinderjaehrigCheckbox = document.getElementById('standard-pause-minderjaehrig') as HTMLInputElement;
    const rechnerToggle = document.getElementById('rechner-toggle') as HTMLInputElement;
    const wunschGehzeitModeToggle = document.getElementById('wunsch-gehzeit-mode-toggle') as HTMLInputElement;
    const customWunschGehzeitContainer = document.getElementById('custom-wunsch-gehzeit-container') as HTMLDivElement;
    const customWunschGehzeitInput = document.getElementById('custom-wunsch-gehzeit') as HTMLInputElement;
    const gleitzeitStartInput = document.getElementById('gleitzeit-start') as HTMLInputElement;
    const kernzeitStartInput = document.getElementById('kernzeit-start') as HTMLInputElement;
    const kernzeitEndeInput = document.getElementById('kernzeit-ende') as HTMLInputElement;
    const kernzeitEndeFrInput = document.getElementById('kernzeit-ende-fr') as HTMLInputElement;
    const gleitzeitEndeInput = document.getElementById('gleitzeit-ende') as HTMLInputElement;
    const countdownWindowToggleOptions = document.getElementById('countdown-window-toggle-options') as HTMLInputElement;

    const toggleCustomWunschGehzeit = (): void => {
        customWunschGehzeitContainer.style.display = wunschGehzeitModeToggle.checked ? 'block' : 'none';
    };

    /**
     * Lädt alle Einstellungen aus dem Local Storage und füllt die Felder auf der Optionsseite.
     */
    const loadSettingsForOptionsPage = (): void => {
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
        countdownWindowToggleOptions.checked = localStorage.getItem('userCountdownWindow') === 'true';

        toggleCustomWunschGehzeit();
    };

    saveSettingsBtn.addEventListener('click', (): void => {
        if (wunschGehzeitModeToggle.checked && customWunschGehzeitInput.value) {
            const zeiten = getKernzeitUndGleitzeit();
            const customTimeInMinutes = timeStringToMinutes(customWunschGehzeitInput.value);
            if (customTimeInMinutes < zeiten.kernzeitEnde) {
                const kernzeitEndeFormatiert = minutesToTimeString(zeiten.kernzeitEnde);
                alert(`Fehler: Die feste Wunsch-Gehzeit (${customWunschGehzeitInput.value} Uhr) muss nach dem Kernzeitende (${kernzeitEndeFormatiert} Uhr) liegen.`);
                return;
            }
        }
        
        localStorage.setItem('userSollzeit', standardSollzeitSelect.value);
        localStorage.setItem('userUeberstunden', standardUeberstundenInput.value);
        localStorage.setItem('userIsMinderjaehrig', String(standardMinderjaehrigCheckbox.checked));
        localStorage.setItem('userRechnerAnzeigen', String(rechnerToggle.checked));
        localStorage.setItem('userWunschGehzeitMode', String(wunschGehzeitModeToggle.checked));
        localStorage.setItem('userCustomWunschGehzeit', customWunschGehzeitInput.value);
        localStorage.setItem('userGleitzeitStart', gleitzeitStartInput.value);
        localStorage.setItem('userKernzeitStart', kernzeitStartInput.value);
        localStorage.setItem('userKernzeitEnde', kernzeitEndeInput.value);
        localStorage.setItem('userKernzeitEndeFr', kernzeitEndeFrInput.value);
        localStorage.setItem('userGleitzeitEnde', gleitzeitEndeInput.value);
        localStorage.setItem('userCountdownWindow', String(countdownWindowToggleOptions.checked));

        saveFeedback.style.opacity = '1';
        setTimeout(() => { saveFeedback.style.opacity = '0'; }, 2000);
    });

    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);
    loadSettingsForOptionsPage();
});