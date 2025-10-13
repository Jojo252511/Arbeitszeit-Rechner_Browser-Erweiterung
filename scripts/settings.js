// scripts/settings.js

/**
 * @file Enthält die gesamte Logik für das Einstellungs-Modal.
 * @description Steuert das Öffnen, Schließen, Speichern und Laden von Benutzereinstellungen
 * über den Local Storage des Browsers.
 * @author Jörn Unverzagt
 * @date 2025-10-13
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM-Elemente für die Einstellungs-Logik ---
    const menuToggleBtn = document.getElementById('menu-toggle');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');

    // Elemente aus dem Einstellungs-Modal
    const standardSollzeitSelect = document.getElementById('standard-sollzeit');
    const standardMinderjaehrigCheckbox = document.getElementById('standard-pause-minderjaehrig');
    const standardUeberstundenInput = document.getElementById('standard-ueberstunden');
    const wunschGehzeitModeToggle = document.getElementById('wunsch-gehzeit-mode-toggle');
    const customWunschGehzeitContainer = document.getElementById('custom-wunsch-gehzeit-container');
    const customWunschGehzeitInput = document.getElementById('custom-wunsch-gehzeit');
    const wunschGehzeitInput = document.getElementById('wunsch-gehzeit');
    const rechnerToggle = document.getElementById('rechner-toggle');

    // Elemente aus den Hauptrechnern, die von den Einstellungen beeinflusst werden
    const hauptSollzeitSelect = document.getElementById('sollzeit');
    const hauptMinderjaehrigCheckbox = document.getElementById('pause-minderjaehrig');
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden');
    const calculatorCard = document.getElementById('calculator-card');
    const calculatorIframe = document.getElementById('calculator-iframe');

     /**
     * Steuert die Sichtbarkeit und das Laden des Taschenrechner-iFrames.
     */
    const applyRechnerVisibility = () => {
        if (rechnerToggle.checked) {
            calculatorCard.style.display = 'block';
            // Lade den iFrame-Inhalt nur, wenn er noch nicht geladen wurde.
            if (!calculatorIframe.src) {
                calculatorIframe.src = calculatorIframe.dataset.src;
            }
        } else {
            calculatorCard.style.display = 'none';
        }
    };

    /**
     * Zeigt oder versteckt das Eingabefeld für die feste Wunsch-Gehzeit,
     * basierend auf dem Zustand des Umschalters.
     */
    const toggleCustomWunschGehzeit = () => {
        if (wunschGehzeitModeToggle.checked) {
            customWunschGehzeitContainer.style.display = 'block';
        } else {
            customWunschGehzeitContainer.style.display = 'none';
        }
    };

    /**
     * Lädt alle gespeicherten Benutzereinstellungen aus dem Local Storage
     * und wendet sie auf die entsprechenden Felder im Hauptrechner und im Einstellungs-Modal an.
     */
    const loadSettings = () => {
        const savedSollzeit = localStorage.getItem('userSollzeit');
        const savedIsMinderjaehrig = localStorage.getItem('userIsMinderjaehrig') === 'true';
        const savedUeberstunden = localStorage.getItem('userUeberstunden');
        const savedWunschGehzeitMode = localStorage.getItem('userWunschGehzeitMode') === 'true';
        const savedCustomWunschGehzeit = localStorage.getItem('userCustomWunschGehzeit');
        const savedRechnerState = localStorage.getItem('userRechnerAnzeigen') === 'true';

        if (savedSollzeit) {
            hauptSollzeitSelect.value = savedSollzeit;
            standardSollzeitSelect.value = savedSollzeit;
        }
        if (savedUeberstunden !== null) {
            hauptUeberstundenInput.value = savedUeberstunden;
            standardUeberstundenInput.value = savedUeberstunden;
        }

        hauptMinderjaehrigCheckbox.checked = savedIsMinderjaehrig;
        standardMinderjaehrigCheckbox.checked = savedIsMinderjaehrig;

        wunschGehzeitModeToggle.checked = savedWunschGehzeitMode;
        if (savedCustomWunschGehzeit) {
            customWunschGehzeitInput.value = savedCustomWunschGehzeit;
        }

        // Stellt sicher, dass das Feld für die feste Zeit korrekt angezeigt wird.
        toggleCustomWunschGehzeit();
        
        // Lädt den Zustand des Taschenrechners und wendet ihn an.
        rechnerToggle.checked = savedRechnerState;
        applyRechnerVisibility();

    };

    /**
     * Event Listener zum Öffnen des Einstellungs-Modals.
     */
    menuToggleBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; });

    /**
     * Event Listener zum Schließen des Einstellungs-Modals über den Schließen-Button.
     */
    closeSettingsBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });

    /**
     * Event Listener, der das Modal schließt, wenn auf den dunklen Hintergrund geklickt wird.
     */
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) { settingsModal.style.display = 'none'; }
    });

    /**
     * Event Listener für den Umschalter des Wunsch-Gehzeit-Modus.
     */
    wunschGehzeitModeToggle.addEventListener('change', toggleCustomWunschGehzeit);

    /**
     * Event Listener für den Umschalter des Taschenrechners.
     */
    rechnerToggle.addEventListener('change', applyRechnerVisibility);

    /**
     * Event Listener für den "Speichern"-Button.
     * Validiert die Eingaben, speichert sie im Local Storage und lädt die Seite neu.
     */
    saveSettingsBtn.addEventListener('click', () => {
        const selectedSollzeit = standardSollzeitSelect.value;
        const selectedIsMinderjaehrig = standardMinderjaehrigCheckbox.checked;
        const selectedUeberstunden = standardUeberstundenInput.value;
        const selectedWunschGehzeitMode = wunschGehzeitModeToggle.checked;
        const selectedCustomWunschGehzeit = customWunschGehzeitInput.value;
        const selectedRechnerState = rechnerToggle.checked; 

        // Validiert die eingegebene feste Wunsch-Gehzeit, bevor gespeichert wird.
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
        localStorage.setItem('userIsMinderjaehrig', selectedIsMinderjaehrig);
        localStorage.setItem('userUeberstunden', selectedUeberstunden);
        localStorage.setItem('userWunschGehzeitMode', selectedWunschGehzeitMode);
        localStorage.setItem('userCustomWunschGehzeit', selectedCustomWunschGehzeit);
        localStorage.setItem('userRechnerAnzeigen', selectedRechnerState);

        window.location.reload();
    });

    // Lädt die gespeicherten Einstellungen direkt beim Start der Seite.
    loadSettings();
});