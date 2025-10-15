// scripts/darkmode.ts

/**
 * @module darkmode
 * @description Steuert die Dark-Mode-Funktionalität.
 * @author Joern Unverzagt
 */

/**
 * @file Steuert die Dark-Mode-Funktionalität.
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('dark-mode-toggle') as HTMLButtonElement;
    const body = document.body;

    /**
     * Wendet ein Theme an.
     * @param {string} theme - 'dark' oder 'light'.
     */
    const applyTheme = (theme: string): void => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    };

    if (!toggleButton) return;

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

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }
});