// scripts/settings.ts

/**
 * @module settings
 * @description Verwaltung des Einstellungs-Modals für den Arbeitszeit-Rechner.
 * @author Joern Unverzagt
 */

import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString, showToast } from './utils.js';

/**
 * @file Enthält die gesamte Logik für das Einstellungs-Modal im Side Panel.
 * @description Steuert das Öffnen, Schließen, Speichern und Laden von Benutzereinstellungen.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const menuToggleBtn = document.getElementById('menu-toggle') as HTMLButtonElement;
    const settingsModal = document.getElementById('settings-modal') as HTMLDivElement;
    const closeSettingsBtn = document.getElementById('close-settings') as HTMLSpanElement;
    const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;
    const standardSollzeitSelect = document.getElementById('standard-sollzeit') as HTMLSelectElement;
    const standardMinderjaehrigCheckbox = document.getElementById('standard-pause-minderjaehrig') as HTMLInputElement;
    const standardUeberstundenInput = document.getElementById('standard-ueberstunden') as HTMLInputElement;
    const wunschGehzeitModeToggle = document.getElementById('wunsch-gehzeit-mode-toggle') as HTMLInputElement;
    const customWunschGehzeitContainer = document.getElementById('custom-wunsch-gehzeit-container') as HTMLDivElement;
    const customWunschGehzeitInput = document.getElementById('custom-wunsch-gehzeit') as HTMLInputElement;
    const rechnerToggle = document.getElementById('rechner-toggle') as HTMLInputElement;
    const hauptSollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const calculatorCard = document.getElementById('calculator-card') as HTMLDivElement;
    const calculatorIframe = document.getElementById('calculator-iframe') as HTMLIFrameElement;
    const countdownWindowToggle = document.getElementById('countdown-window-toggle') as HTMLInputElement;

    /**
     * Steuert die Sichtbarkeit des Taschenrechner-iFrames.
     */
    const applyRechnerVisibility = (): void => {
        if (rechnerToggle.checked) {
            calculatorCard.style.display = 'block';
            if (!calculatorIframe.src) {
                calculatorIframe.src = calculatorIframe.dataset.src || '';
            }
        } else {
            calculatorCard.style.display = 'none';
        }
    };

    /**
     * Zeigt oder versteckt das Eingabefeld für die feste Wunsch-Gehzeit.
     */
    const toggleCustomWunschGehzeit = (): void => {
        if (wunschGehzeitModeToggle.checked) {
            customWunschGehzeitContainer.style.display = 'block';
        } else {
            customWunschGehzeitContainer.style.display = 'none';
        }
    };

    /**
     * Lädt alle gespeicherten Benutzereinstellungen aus dem Chrome Storage.
     */
    const loadSettings = async (): Promise<void> => {
        const settings = await chrome.storage.sync.get([
            'userSollzeit', 'userUeberstunden', 'userIsMinderjaehrig',
            'userWunschGehzeitMode', 'userCustomWunschGehzeit', 'userRechnerAnzeigen',
            'userCountdownWindow', 'userLogbookSync', 'userGleitzeitStart', 
            'userKernzeitStart', 'userKernzeitEnde', 'userKernzeitEndeFr'
        ]);

        // Haupt-UI aktualisieren
        hauptSollzeitSelect.value = settings.userSollzeit || '8';
        if (settings.userUeberstunden !== undefined) hauptUeberstundenInput.value = settings.userUeberstunden;
        hauptMinderjaehrigCheckbox.checked = settings.userIsMinderjaehrig === 'true';

        // Einstellungs-Modal UI aktualisieren
        standardSollzeitSelect.value = settings.userSollzeit || '8';
        if (settings.userUeberstunden !== undefined) standardUeberstundenInput.value = settings.userUeberstunden;
        standardMinderjaehrigCheckbox.checked = settings.userIsMinderjaehrig === 'true';
        wunschGehzeitModeToggle.checked = settings.userWunschGehzeitMode === 'true';
        customWunschGehzeitInput.value = settings.userCustomWunschGehzeit || '';
        rechnerToggle.checked = settings.userRechnerAnzeigen === true;
        countdownWindowToggle.checked = settings.userCountdownWindow === true;
        
        toggleCustomWunschGehzeit();
        applyRechnerVisibility();
        updateFaqTimes(settings);
    };

    /**
     * Aktualisiert die Zeitangaben im FAQ-Bereich dynamisch.
     */
    function updateFaqTimes(settings: { [key: string]: any }): void {
        const gleitzeitStart = settings.userGleitzeitStart || '06:45';
        const kernzeitStart = settings.userKernzeitStart || '08:45';
        const kernzeitEnde = settings.userKernzeitEnde || '15:30';
        const kernzeitEndeFr = settings.userKernzeitEndeFr || '15:00';

        const faqGleitzeitStartEl = document.getElementById('faq-gleitzeit-start');
        const faqKernzeitStartEl = document.getElementById('faq-kernzeit-start');
        const faqKernzeitEndeEl = document.getElementById('faq-kernzeit-ende');
        const faqKernzeitEndeFrEl = document.getElementById('faq-kernzeit-ende-fr');

        if (faqGleitzeitStartEl) faqGleitzeitStartEl.textContent = gleitzeitStart;
        if (faqKernzeitStartEl) faqKernzeitStartEl.textContent = kernzeitStart;
        if (faqKernzeitEndeEl) faqKernzeitEndeEl.textContent = kernzeitEnde;
        if (faqKernzeitEndeFrEl) faqKernzeitEndeFrEl.textContent = kernzeitEndeFr;
    }

    menuToggleBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; document.body.style.overflowY = 'hidden'; });
    closeSettingsBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; document.body.style.overflowY = 'auto'; });
    settingsModal.addEventListener('click', (event: MouseEvent) => {
        if (event.target === settingsModal) { settingsModal.style.display = 'none'; document.body.style.overflowY = 'auto'; }
    });
    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);
    rechnerToggle.addEventListener('change', applyRechnerVisibility);

saveSettingsBtn.addEventListener('click', async () => {
        const selectedSollzeit = standardSollzeitSelect.value;
        const selectedIsMinderjaehrig = standardMinderjaehrigCheckbox.checked;
        const selectedUeberstunden = standardUeberstundenInput.value;
        const selectedWunschGehzeitMode = wunschGehzeitModeToggle.checked;
        const selectedCustomWunschGehzeit = customWunschGehzeitInput.value;
        const selectedRechnerState = rechnerToggle.checked;
        const selectedCountdownWindowState = countdownWindowToggle.checked;

        if (selectedWunschGehzeitMode && selectedCustomWunschGehzeit) {
            const zeiten = getKernzeitUndGleitzeit();
            const customTimeInMinutes = timeStringToMinutes(selectedCustomWunschGehzeit);
            if (customTimeInMinutes < zeiten.kernzeitEnde) {
                const kernzeitEndeFormatiert = minutesToTimeString(zeiten.kernzeitEnde);
                showToast(`Die Wunsch-Gehzeit (${selectedCustomWunschGehzeit}) muss nach dem Kernzeitende (${kernzeitEndeFormatiert}) liegen.`, 'error');
                return;
            }
        }

        await chrome.storage.sync.set({
            'userSollzeit': selectedSollzeit,
            'userIsMinderjaehrig': selectedIsMinderjaehrig,
            'userUeberstunden': selectedUeberstunden,
            'userWunschGehzeitMode': selectedWunschGehzeitMode,
            'userCustomWunschGehzeit': selectedCustomWunschGehzeit,
            'userRechnerAnzeigen': selectedRechnerState,
            'userCountdownWindow': selectedCountdownWindowState,
        });

         showToast('Einstellungen gespeichert. Die Seite wird neu geladen...', 'success');

        // warten, damit der Nutzer die Toast-Nachricht sieht
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    });
    await loadSettings();
});