// scripts/options.ts

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- Alle Einstellungs-Elemente von options.html holen ---
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
    const logbookSyncToggleOptions = document.getElementById('logbook-sync-toggle-options') as HTMLInputElement; // Neuer Schalter

    const toggleCustomWunschGehzeit = (): void => {
        customWunschGehzeitContainer.style.display = wunschGehzeitModeToggle.checked ? 'block' : 'none';
    };

    /**
     * Lädt alle Einstellungen aus dem Chrome Storage und füllt die Felder auf der Optionsseite.
     */
    const loadSettingsForOptionsPage = async (): Promise<void> => {
        const settings = await chrome.storage.sync.get([
            'userSollzeit', 'userUeberstunden', 'userIsMinderjaehrig',
            'userWunschGehzeitMode', 'userCustomWunschGehzeit', 'userRechnerAnzeigen',
            'userCountdownWindow', 'userLogbookSync',
            'userGleitzeitStart', 'userKernzeitStart', 'userKernzeitEnde', 
            'userKernzeitEndeFr', 'userGleitzeitEnde'
        ]);

        standardSollzeitSelect.value = settings.userSollzeit || '8';
        standardUeberstundenInput.value = settings.userUeberstunden || '';
        standardMinderjaehrigCheckbox.checked = settings.userIsMinderjaehrig === true;
        rechnerToggle.checked = settings.userRechnerAnzeigen === true;
        wunschGehzeitModeToggle.checked = settings.userWunschGehzeitMode === true;
        customWunschGehzeitInput.value = settings.userCustomWunschGehzeit || '';
        gleitzeitStartInput.value = settings.userGleitzeitStart || '06:45';
        kernzeitStartInput.value = settings.userKernzeitStart || '08:45';
        kernzeitEndeInput.value = settings.userKernzeitEnde || '15:30';
        kernzeitEndeFrInput.value = settings.userKernzeitEndeFr || '15:00';
        gleitzeitEndeInput.value = settings.userGleitzeitEnde || '19:00';
        countdownWindowToggleOptions.checked = settings.userCountdownWindow === true;
        logbookSyncToggleOptions.checked = settings.userLogbookSync === true;

        toggleCustomWunschGehzeit();
    };

    saveSettingsBtn.addEventListener('click', async (): Promise<void> => {
        // Kernzeit-Validierung
        if (wunschGehzeitModeToggle.checked && customWunschGehzeitInput.value) {
            const zeiten = getKernzeitUndGleitzeit(); 
            const customTimeInMinutes = timeStringToMinutes(customWunschGehzeitInput.value);
            if (customTimeInMinutes < zeiten.kernzeitEnde) {
                const kernzeitEndeFormatiert = minutesToTimeString(zeiten.kernzeitEnde);
                showToast(`Wunsch-Gehzeit (${customWunschGehzeitInput.value}) muss nach Kernzeitende (${kernzeitEndeFormatiert}) liegen.`, 'error');
                return;
            }
        }
        
        // Alle Einstellungen in einem Objekt sammeln und speichern
        await chrome.storage.sync.set({
            userSollzeit: standardSollzeitSelect.value,
            userUeberstunden: standardUeberstundenInput.value,
            userIsMinderjaehrig: standardMinderjaehrigCheckbox.checked,
            userRechnerAnzeigen: rechnerToggle.checked,
            userWunschGehzeitMode: wunschGehzeitModeToggle.checked,
            userCustomWunschGehzeit: customWunschGehzeitInput.value,
            userGleitzeitStart: gleitzeitStartInput.value,
            userKernzeitStart: kernzeitStartInput.value,
            userKernzeitEnde: kernzeitEndeInput.value,
            userKernzeitEndeFr: kernzeitEndeFrInput.value,
            userGleitzeitEnde: gleitzeitEndeInput.value,
            userCountdownWindow: countdownWindowToggleOptions.checked,
            userLogbookSync: logbookSyncToggleOptions.checked 
        });

        saveFeedback.style.opacity = '1';
        setTimeout(() => { saveFeedback.style.opacity = '0'; }, 2000);
    });

    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);
    
    // Initiale Ladefunktion aufrufen
    await loadSettingsForOptionsPage();
});