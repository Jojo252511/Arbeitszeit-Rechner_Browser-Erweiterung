// scripts/utils.ts

/**
 * @file Utility-Funktionen für den Arbeitszeit-Rechner.
 * @description Diese Datei enthält wiederverwendbare Hilfsfunktionen für Zeitberechnungen, Formatierungen und die Anzeige von Ergebnissen.
 * @author Joern Unverzagt
 */


export interface ZeitPunkte {
    gleitzeitStart: number;
    kernzeitStart: number;
    kernzeitEnde: number;
    gleitzeitEnde: number;
}

declare global {
    interface Window {
        saveUeberH: (time: number) => void;
    }
}

// --- GLOBALE HILFSFUNKTIONEN ---

/**
 * Ermittelt die geltenden Kern- und Gleitzeiten für den aktuellen Tag in Minuten seit Mitternacht.
 * @returns {ZeitPunkte} Ein Objekt mit den Zeitangaben in Minuten.
 */
export const getKernzeitUndGleitzeit = (): ZeitPunkte => {
    const heute = new Date();
    const wochentag = heute.getDay();
    const gleitzeitStart = localStorage.getItem('userGleitzeitStart') || '06:45';
    const kernzeitStart = localStorage.getItem('userKernzeitStart') || '08:45';
    const kernzeitEndeMoDo = localStorage.getItem('userKernzeitEnde') || '15:30';
    const kernzeitEndeFr = localStorage.getItem('userKernzeitEndeFr') || '15:00';
    const gleitzeitEnde = localStorage.getItem('userGleitzeitEnde') || '19:00';
    const aktuellesKernzeitEnde = (wochentag === 5) ? kernzeitEndeFr : kernzeitEndeMoDo;
    return {
        gleitzeitStart: timeStringToMinutes(gleitzeitStart),
        kernzeitStart: timeStringToMinutes(kernzeitStart),
        kernzeitEnde: timeStringToMinutes(aktuellesKernzeitEnde),
        gleitzeitEnde: timeStringToMinutes(gleitzeitEnde)
    };
};

/**
 * Gibt die Soll-Arbeitszeit in Stunden als Zahl zurück.
 * Holt den Wert aus chrome.storage.sync und gibt 8 als Standard zurück.
 * @returns {Promise<number>} Die Soll-Arbeitszeit in Stunden. '0' = keine Sollzeit gesetzt.
 */
export async function getSollArbeitszeit(): Promise<number> {
    const settings = await chrome.storage.sync.get({ userSollzeit: '0' });
    const sollzeitString = settings.userSollzeit;
    return parseFloat(sollzeitString);
}

/**
 * Wandelt einen Zeit-String im Format "HH:MM" in die Gesamtminuten seit Mitternacht um.
 * @param {string} timeString - Der Zeit-String (z.B. "08:30").
 * @returns {number} Die Gesamtanzahl der Minuten.
 */
export const timeStringToMinutes = (timeString: string): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Wandelt eine Gesamtminutenzahl in einen formatierten Zeit-String im Format "HH:MM" um.
 * @param {number} totalMinutes - Die Gesamtminuten seit Mitternacht.
 * @returns {string} Der formatierte Zeit-String (z.B. "16:45").
 */
export const minutesToTimeString = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Formatiert eine Gesamtminutenzahl in einen lesbaren String (z.B. "-1 Std. 30 Min.").
 * @param {number} totalMinutes - Die zu formatierende Minutenzahl.
 * @returns {string} Der formatierte String für die Anzeige.
 */
export const formatMinutesToString = (totalMinutes: number): string => {
    if (isNaN(totalMinutes)) return "Ungültige Eingabe";
    const sign = totalMinutes < 0 ? "-" : "";
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = Math.round(absMinutes % 60);
    if (hours === 0) return `${sign}${minutes} Min.`;
    if (minutes === 0) return `${sign}${hours} Std.`;
    return `${sign}${hours} Std. ${minutes} Min.`;
};

/**
 * Zeigt eine formatierte Nachricht in einem Ergebnis-Container an.
 * @param {HTMLElement} element - Das DOM-Element für die Anzeige.
 * @param {string} message - Die anzuzeigende Nachricht (kann HTML enthalten).
 * @param {string} [type='success'] - Der Typ der Nachricht ('success' oder 'error').
 */
export const showResult = (element: HTMLElement, message: string, type: string = 'success'): void => {
    element.innerHTML = message;
    element.className = 'ergebnis';
    element.classList.add(type);
    element.classList.add('show');
};

/**
 * Berechnet die verbleibende Zeit von der aktuellen Uhrzeit bis zu einer Ziel-Uhrzeit.
 * @param {string} zielZeitString - Die Ziel-Uhrzeit im Format "HH:MM".
 * @returns {string|null} Die formatierte Restzeit oder `null`, wenn die Zeit vergangen ist.
 */
export const berechneRestzeitBis = (zielZeitString: string): string | null => {
    if (!zielZeitString) return null;
    const jetzt = new Date();
    const jetztInMinuten = jetzt.getHours() * 60 + jetzt.getMinutes();
    const zielInMinuten = timeStringToMinutes(zielZeitString);
    const verbleibendeMinuten = Math.max(0, zielInMinuten - jetztInMinuten);
    if (verbleibendeMinuten > 0) {
        const stunden = Math.floor(verbleibendeMinuten / 60);
        const minuten = Math.round(verbleibendeMinuten % 60);
        return `${stunden} Std. und ${minuten} Min.`;
    }
    return null;
};

/**
 * Speichert den neuen Überstundensaldo und löst ein Event aus.
 * @param {number} time - Der neue Überstundensaldo als Dezimalzahl.
 */
export async function saveUeberH(time: number): Promise<void> {
    const timeAsString = String(time.toFixed(2));
    await chrome.storage.sync.set({ 'userUeberstunden': timeAsString });

    const result = await chrome.storage.sync.get('userUeberstunden');
    const savedValue = result.userUeberstunden;

    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    
    // Prüfen, ob das Input-Feld und der Wert existieren.
    if (hauptUeberstundenInput && savedValue !== undefined) {
        hauptUeberstundenInput.value = savedValue;
    }
    
    // Löst ein Event aus, damit andere Teile der Anwendung reagieren können.
    document.dispatchEvent(new CustomEvent('ueberstundenUpdated', { detail: { newSaldo: timeAsString } }));
}

// =====================================================================================
// ----------------------------- Toast Notification ------------------------------------
// =====================================================================================

/**
 * Zeigt eine Toast-Benachrichtigung an.
 * @param {string} message - Die anzuzeigende Nachricht.
 * @param {'success' | 'error' | 'info'} [type='info'] - Der Typ der Nachricht.
 * @param {number} [duration=3000] - Die Anzeigedauer in Millisekunden.
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Fade in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // kleiner Delay für den CSS-Übergang

    // Fade out und entfernen
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}

// =====================================================================================
// ----------------------------- Mordal Logic ------------------------------------------
// =====================================================================================

interface ModalButton {
    text: string;
    value: any;
    class: string;
}

interface RadioChoice {
    value: string;
    text: string;
}

interface ModalOptions {
    title: string;
    message: string;
    buttons: ModalButton[];
    inputs?: { type: 'radio'; name: string; choices: (string | RadioChoice)[] };
}

function showModal<T>(options: ModalOptions): Promise<T | null> {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal-overlay') as HTMLDivElement;
        const titleEl = document.getElementById('modal-title') as HTMLHeadingElement;
        const messageEl = document.getElementById('modal-message') as HTMLParagraphElement;
        const inputContainer = document.getElementById('modal-input-container') as HTMLDivElement;
        const buttonContainer = document.getElementById('modal-button-container') as HTMLDivElement;

        const modalInputs = options.inputs;

        titleEl.textContent = options.title;
        messageEl.innerHTML = options.message;
        inputContainer.innerHTML = '';
        buttonContainer.innerHTML = '';

        if (modalInputs) {
            if (modalInputs.type === 'radio') {
                const radioGroup = document.createElement('div');
                radioGroup.className = 'modal-radio-group';
                radioGroup.style.flexDirection = 'column';
                radioGroup.style.alignItems = 'start';
                radioGroup.style.marginLeft = '30%';


                modalInputs.choices.forEach((choice, index) => {
                    const value = typeof choice === 'string' ? choice : choice.value;
                    const text = typeof choice === 'string' ? choice.toUpperCase() : choice.text;

                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = modalInputs.name;
                    radio.value = value;
                    if (index === 0) radio.checked = true;

                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(text));
                    radioGroup.appendChild(label);
                });
                inputContainer.appendChild(radioGroup);
            }
        }

        const closeModal = (value: T | null) => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
                resolve(value);
            }, 300);
        };

        options.buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = btnInfo.class;
            button.onclick = () => {
                let result = btnInfo.value;
                if (modalInputs && result) {
                    if (modalInputs.type === 'radio') {
                        const selected = inputContainer.querySelector<HTMLInputElement>(`input[name="${modalInputs.name}"]:checked`);
                        result = selected ? selected.value : null;
                    }
                }
                closeModal(result);
            };
            buttonContainer.appendChild(button);
        });

        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);
    });
}

export function showConfirm(title: string, message: string, danger: boolean = false): Promise<boolean> {
    const buttons: ModalButton[] = [
        { text: 'Abbrechen', value: false, class: 'btn-secondary' },
        { text: 'OK', value: true, class: danger ? 'btn-danger' : '' }
    ];
    return showModal<boolean>({ title, message, buttons }).then(val => val ?? false);
}

export function showPrompt(title: string, message: string, choices: string[]): Promise<string | null> {
    const buttons: ModalButton[] = [
        { text: 'Abbrechen', value: null, class: 'btn-secondary' },
        { text: 'Exportieren', value: true, class: '' }
    ];
    const inputs = { type: 'radio' as const, name: 'export-format', choices };
    return showModal<string | null>({ title, message, buttons, inputs });
}

export function showDayTypePrompt(title: string, message: string, choices: RadioChoice[]): Promise<string | null> {
    const buttons: ModalButton[] = [
        { text: 'Abbrechen', value: null, class: 'btn-secondary' },
        { text: 'OK', value: true, class: '' }
    ];
    const inputs = { type: 'radio' as const, name: 'day-type', choices };
    return showModal<string | null>({ title, message, buttons, inputs });
}


export function showRadioPrompt(title: string, message: string, choices: { value: string; text: string }[]): Promise<string | null> {
    const buttons: ModalButton[] = [
        { text: 'Abbrechen', value: null, class: 'btn-secondary' },
        { text: 'OK', value: true, class: '' }
    ];
    const inputs = { type: 'radio' as const, name: 'day-type', choices: choices.map(c => c.value) };

    const originalShowModal = showModal;

    const radioGroup = document.querySelector('.modal-radio-group');
    if (radioGroup) {

    }

    return showModal({ title, message, buttons, inputs });
}

/**
 * ======================================================
 * -------------------- Verwendung ----------------------
 * ======================================================
 * 
 * 
 * -------------------- showConfirm ---------------------
 * 
 * showConfirm("Titel", "Beschreibung/Text");
 * 
 * 
 * -------------------- showPrompt ---------------------
 * 
 * showPrompt("Titel", "Beschreibung/Text", ['Auswahl1', 'Auswahl2', 'Auswahl3']);
 * 
 * 
 * -------------------- showModal ----------------------
 * 
 * Wird über die anderen zwei Funtionen aufgerufen
 * 
 * 
 */