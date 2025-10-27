// scripts/options.ts

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, showToast, showConfirm } from './utils.js';

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
    const logbookSyncToggleOptions = document.getElementById('logbook-sync-toggle-options') as HTMLInputElement;
    const exportSettingsBtn = document.getElementById('export-settings-btn') as HTMLButtonElement;
    const importSettingsBtn = document.getElementById('import-settings-btn') as HTMLButtonElement;
    const settingsContent = document.querySelector('.settings-content-standalone') as HTMLDivElement;
    const weatherEnabledToggle = document.getElementById('weather-enabled-toggle-options') as HTMLInputElement;
    const weatherOptionsContainer = document.getElementById('weather-options-container-options') as HTMLDivElement;
    const weatherLocationModeToggle = document.getElementById('weather-location-mode-toggle-options') as HTMLInputElement;
    const manualWeatherLocationContainer = document.getElementById('manual-weather-location-container-options') as HTMLDivElement;
    const manualWeatherLocationInput = document.getElementById('manual-weather-location-options') as HTMLInputElement;

    const toggleCustomWunschGehzeit = (): void => {
        customWunschGehzeitContainer.style.display = wunschGehzeitModeToggle.checked ? 'block' : 'none';
    };

    const toggleWeatherOptions = (): void => {
        weatherOptionsContainer.style.display = weatherEnabledToggle.checked ? 'block' : 'none';
        toggleManualWeatherLocation(); // Auch das manuelle Feld ein-/ausblenden
    };

    const toggleManualWeatherLocation = (): void => {
        // Zeige das manuelle Eingabefeld nur an, wenn Wetter UND manueller Modus aktiviert sind
        manualWeatherLocationContainer.style.display = weatherEnabledToggle.checked && weatherLocationModeToggle.checked ? 'block' : 'none';
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
            'userKernzeitEndeFr', 'userGleitzeitEnde',
            'userWeatherEnabled', 'userWeatherLocationMode', 'userWeatherManualLocation'
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
        weatherEnabledToggle.checked = settings.userWeatherEnabled !== false; // Standard ist true
        weatherLocationModeToggle.checked = settings.userWeatherLocationMode === true; // Standard ist false (auto)
        manualWeatherLocationInput.value = settings.userWeatherManualLocation || '';

        toggleCustomWunschGehzeit();
        toggleWeatherOptions();
    };

    saveSettingsBtn.addEventListener('click', async (): Promise<void> => {
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
            userLogbookSync: logbookSyncToggleOptions.checked,
            userWeatherEnabled: weatherEnabledToggle.checked,
            userWeatherLocationMode: weatherLocationModeToggle.checked,
            userWeatherManualLocation: manualWeatherLocationInput.value
        });

        saveFeedback.style.opacity = '1';
        setTimeout(() => { saveFeedback.style.opacity = '0'; }, 2000);
    });

    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);
    weatherEnabledToggle.addEventListener('change', toggleWeatherOptions);
    weatherLocationModeToggle.addEventListener('change', toggleManualWeatherLocation);

    exportSettingsBtn?.addEventListener('click', async () => {
        const allSettings = await chrome.storage.sync.get(null);

        // Logbuch aus den Einstellungen entfernen, da es separat exportiert wird
        delete allSettings.workLogbook;

        if (Object.keys(allSettings).length === 0) {
            showToast('Keine Einstellungen zum Exportieren gefunden.', 'info');
            return;
        }

        const jsonString = JSON.stringify(allSettings, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'arbeitszeit-rechner-einstellungen.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Einstellungen exportiert!', 'success');
    });

    // --- Import Logik ---
    const handleSettingsFile = (file: File) => {
        if (!file || !file.name.endsWith('.json')) {
            showToast('Ungültiger Dateityp. Bitte eine .json Datei auswählen.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const importedSettings = JSON.parse(content);

                if (typeof importedSettings !== 'object' || !('userSollzeit' in importedSettings)) {
                    throw new Error('Keine gültige Einstellungs-Datei.');
                }

                const confirmed = await showConfirm(
                    "Einstellungen importieren?",
                    "Möchtest du die aktuellen Einstellungen wirklich mit den Daten aus der Datei überschreiben?"
                );

                if (confirmed) {
                    const settingKeysToRemove = Object.keys(importedSettings);
                    const logbookKeyIndex = settingKeysToRemove.indexOf('workLogbook');
                    if (logbookKeyIndex > -1) {
                        settingKeysToRemove.splice(logbookKeyIndex, 1);
                    }
                    await chrome.storage.sync.remove(settingKeysToRemove);
                    await chrome.storage.sync.set(importedSettings);

                    showToast('Einstellungen erfolgreich importiert!', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                }
            } catch (error) {
                console.error("Import error:", error);
                showToast('Fehler beim Lesen oder Parsen der Datei.', 'error');
            }
        };
        reader.readAsText(file);
    };

    // Verstecktes Input-Feld für den Klick-Import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) handleSettingsFile(file);
        fileInput.value = ''; // Input zurücksetzen
    };
    document.body.appendChild(fileInput);

    importSettingsBtn?.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag & Drop Event-Listener
    settingsContent?.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        settingsContent.classList.add('drag-over');
    });

    settingsContent?.addEventListener('dragleave', (event) => {
        event.preventDefault();
        event.stopPropagation();
        settingsContent.classList.remove('drag-over');
    });

    settingsContent?.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        settingsContent.classList.remove('drag-over');
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            handleSettingsFile(files[0]);
        }
    });

    // Initiale Ladefunktion aufrufen
    await loadSettingsForOptionsPage();
});