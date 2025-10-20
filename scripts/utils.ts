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
 * Speichert den neuen Überstundensaldo im Local Storage und löst ein Event aus.
 * @param {number} time - Der neue Überstundensaldo als Dezimalzahl.
 */
export async function saveUeberH(time: number): Promise<void> {
    const timeAsString = String(time.toFixed(2));
    localStorage.setItem('userUeberstunden', timeAsString);
    const hauptUeberstundenInput = document.getElementById('aktuelle-ueberstunden') as HTMLInputElement;
    const savedUeberstunden = localStorage.getItem('userUeberstunden');
        if (savedUeberstunden !== null) {
            hauptUeberstundenInput.value = savedUeberstunden;
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

interface ModalOptions {
    title: string;
    message: string;
    buttons: ModalButton[];
    inputs?: { type: 'radio'; name: string; choices: string[] };
}

function showModal(options: ModalOptions): Promise<any> {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal-overlay') as HTMLDivElement;
        const titleEl = document.getElementById('modal-title') as HTMLHeadingElement;
        const messageEl = document.getElementById('modal-message') as HTMLParagraphElement;
        const inputContainer = document.getElementById('modal-input-container') as HTMLDivElement;
        const buttonContainer = document.getElementById('modal-button-container') as HTMLDivElement;
        
        // Diese Konstante hilft TypeScript beim Verstehen des Typs
        const modalInputs = options.inputs;

        titleEl.textContent = options.title;
        messageEl.innerHTML = options.message;
        inputContainer.innerHTML = '';
        buttonContainer.innerHTML = '';

        if (modalInputs) {
            if (modalInputs.type === 'radio') {
                const radioGroup = document.createElement('div');
                radioGroup.className = 'modal-radio-group';
                modalInputs.choices.forEach((choice, index) => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = modalInputs.name;
                    radio.value = choice;
                    if (index === 0) radio.checked = true;
                    
                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(choice.toUpperCase()));
                    radioGroup.appendChild(label);
                });
                inputContainer.appendChild(radioGroup);
            }
        }

        options.buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = btnInfo.class;
            button.onclick = () => {
                let result = btnInfo.value;
                // Hier war der Fehler: Wir prüfen jetzt wieder auf modalInputs
                if (modalInputs && result) { 
                    if (modalInputs.type === 'radio') {
                        const selected = inputContainer.querySelector<HTMLInputElement>(`input[name="${modalInputs.name}"]:checked`);
                        if (selected) {
                            result = selected.value;
                        }
                    }
                }
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    resolve(result);
                }, 300);
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
    return showModal({ title, message, buttons });
}

export function showPrompt(title: string, message: string, choices: string[]): Promise<string | null> {
    const buttons: ModalButton[] = [
        { text: 'Abbrechen', value: null, class: 'btn-secondary' },
        { text: 'Exportieren', value: true, class: '' } 
    ];
    const inputs = { type: 'radio' as const, name: 'export-format', choices: choices };
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