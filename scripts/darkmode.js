// scripts/darkmode.js

/**
 * @file Steuert die Dark-Mode-Funktionalität.
 * @description Enthält die Logik zum Umschalten des Themes, zum Speichern der
 * Benutzereinstellung im Local Storage und zum Auslesen der Systempräferenz.
 * @author Jörn Unverzagt
 * @date 2025-10-13
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('dark-mode-toggle');
    const body = document.body;

    /**
     * Wendet ein Theme an, indem die 'dark-mode'-Klasse zum Body hinzugefügt oder entfernt wird.
     * @param {string} theme - Das anzuwendende Theme ('dark' oder 'light').
     */
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    };

    /**
     * Event Listener für den Umschalt-Button.
     * Wechselt das Theme und speichert die neue Einstellung im Local Storage.
     */
    toggleButton.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        if (isDarkMode) {
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        } else {
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // --- Initiales Laden des Themes ---
    // Prüft beim Seitenstart, ob ein Theme im Local Storage gespeichert ist.
    // Falls nicht, wird die Systemeinstellung des Benutzers ('prefers-color-scheme') geprüft.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }
});