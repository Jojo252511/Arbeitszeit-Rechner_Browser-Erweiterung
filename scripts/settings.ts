// scripts/settings.ts

// NEU: Importiere die benötigten Funktionen aus der utils-Datei
import { getKernzeitUndGleitzeit, timeStringToMinutes, minutesToTimeString } from './utils.js';

/**
 * @file Enthält die gesamte Logik für das Einstellungs-Modal im Side Panel.
 * @description Steuert das Öffnen, Schließen, Speichern und Laden von Benutzereinstellungen.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM-Elemente für die Einstellungs-Logik ---
    const menuToggleBtn = document.getElementById('menu-toggle') as HTMLButtonElement;
    const settingsModal = document.getElementById('settings-modal') as HTMLDivElement;
    const closeSettingsBtn = document.getElementById('close-settings') as HTMLSpanElement;
    const saveSettingsBtn = document.getElementById('save-settings') as HTMLButtonElement;

    // Elemente aus dem Einstellungs-Modal
    const standardSollzeitSelect = document.getElementById('standard-sollzeit') as HTMLSelectElement;
    const standardMinderjaehrigCheckbox = document.getElementById('standard-pause-minderjaehrig') as HTMLInputElement;
    const standardUeberstundenInput = document.getElementById('standard-ueberstunden') as HTMLInputElement;
    const wunschGehzeitModeToggle = document.getElementById('wunsch-gehzeit-mode-toggle') as HTMLInputElement;
    const customWunschGehzeitContainer = document.getElementById('custom-wunsch-gehzeit-container') as HTMLDivElement;
    const customWunschGehzeitInput = document.getElementById('custom-wunsch-gehzeit') as HTMLInputElement;
    const rechnerToggle = document.getElementById('rechner-toggle') as HTMLInputElement;

    // Elemente aus den Hauptrechnern, die von den Einstellungen beeinflusst werden
    const hauptSollzeitSelect = document.getElementById('sollzeit') as HTMLSelectElement;
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig') as HTMLInputElement;
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const calculatorCard = document.getElementById('calculator-card') as HTMLDivElement;
    const calculatorIframe = document.getElementById('calculator-iframe') as HTMLIFrameElement;

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
     * Lädt alle gespeicherten Benutzereinstellungen aus dem Local Storage.
     */
    const loadSettings = (): void => {
        hauptSollzeitSelect.value = localStorage.getItem('userSollzeit') || '8';
        standardSollzeitSelect.value = localStorage.getItem('userSollzeit') || '8';

        const savedUeberstunden = localStorage.getItem('userUeberstunden');
        if (savedUeberstunden !== null) {
            hauptUeberstundenInput.value = savedUeberstunden;
            standardUeberstundenInput.value = savedUeberstunden;
        }

        const isMinderjaehrig = localStorage.getItem('userIsMinderjaehrig') === 'true';
        hauptMinderjaehrigCheckbox.checked = isMinderjaehrig;
        standardMinderjaehrigCheckbox.checked = isMinderjaehrig;

        wunschGehzeitModeToggle.checked = localStorage.getItem('userWunschGehzeitMode') === 'true';
        customWunschGehzeitInput.value = localStorage.getItem('userCustomWunschGehzeit') || '';
        
        rechnerToggle.checked = localStorage.getItem('userRechnerAnzeigen') === 'true';
        
        toggleCustomWunschGehzeit();
        applyRechnerVisibility();
        updateFaqTimes();
    };

    /**
     * Aktualisiert die Zeitangaben im FAQ-Bereich dynamisch.
     */
    function updateFaqTimes(): void {
        const gleitzeitStart = localStorage.getItem('userGleitzeitStart') || '06:45';
        const kernzeitStart = localStorage.getItem('userKernzeitStart') || '08:45';
        const kernzeitEnde = localStorage.getItem('userKernzeitEnde') || '15:30';
        const kernzeitEndeFr = localStorage.getItem('userKernzeitEndeFr') || '15:00';

        const faqGleitzeitStartEl = document.getElementById('faq-gleitzeit-start');
        const faqKernzeitStartEl = document.getElementById('faq-kernzeit-start');
        const faqKernzeitEndeEl = document.getElementById('faq-kernzeit-ende');
        const faqKernzeitEndeFrEl = document.getElementById('faq-kernzeit-ende-fr');

        if (faqGleitzeitStartEl) faqGleitzeitStartEl.textContent = gleitzeitStart;
        if (faqKernzeitStartEl) faqKernzeitStartEl.textContent = kernzeitStart;
        if (faqKernzeitEndeEl) faqKernzeitEndeEl.textContent = kernzeitEnde;
        if (faqKernzeitEndeFrEl) faqKernzeitEndeFrEl.textContent = kernzeitEndeFr;
    }

    // --- Event Listeners ---
    menuToggleBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; });
    closeSettingsBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });
    settingsModal.addEventListener('click', (event: MouseEvent) => {
        if (event.target === settingsModal) { settingsModal.style.display = 'none'; }
    });
    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);
    rechnerToggle.addEventListener('change', applyRechnerVisibility);

    saveSettingsBtn.addEventListener('click', () => {
        const selectedSollzeit = standardSollzeitSelect.value;
        const selectedIsMinderjaehrig = standardMinderjaehrigCheckbox.checked;
        const selectedUeberstunden = standardUeberstundenInput.value;
        const selectedWunschGehzeitMode = wunschGehzeitModeToggle.checked;
        const selectedCustomWunschGehzeit = customWunschGehzeitInput.value;
        const selectedRechnerState = rechnerToggle.checked; 

        if (selectedWunschGehzeitMode && selectedCustomWunschGehzeit) {
            const zeiten = getKernzeitUndGleitzeit();
            const customTimeInMinutes = timeStringToMinutes(selectedCustomWunschGehzeit);
            if (customTimeInMinutes < zeiten.kernzeitEnde) {
                const kernzeitEndeFormatiert = minutesToTimeString(zeiten.kernzeitEnde);
                alert(`Fehler: Die feste Wunsch-Gehzeit (${selectedCustomWunschGehzeit} Uhr) muss nach dem Kernzeitende (${kernzeitEndeFormatiert} Uhr) liegen.`);
                return;
            }
        }

        localStorage.setItem('userSollzeit', selectedSollzeit);
        localStorage.setItem('userIsMinderjaehrig', String(selectedIsMinderjaehrig));
        localStorage.setItem('userUeberstunden', selectedUeberstunden);
        localStorage.setItem('userWunschGehzeitMode', String(selectedWunschGehzeitMode));
        localStorage.setItem('userCustomWunschGehzeit', selectedCustomWunschGehzeit);
        localStorage.setItem('userRechnerAnzeigen', String(selectedRechnerState));

        window.location.reload();
    });

    // Initiales Laden der Einstellungen
    loadSettings();
});