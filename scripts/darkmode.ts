// scripts/darkmode.ts

/**
 * @module darkmode
 * @description Steuert die Dark-Mode-Funktionalität und synchronisiert die Einstellung.
 * @author Joern Unverzagt
 */

document.addEventListener('DOMContentLoaded', async () => {
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
    
    if (toggleButton) {
        toggleButton.addEventListener('click', async () => {
            const isDarkMode = body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            applyTheme(newTheme);
            await chrome.storage.sync.set({ theme: newTheme });
        });
    }
    
    const settings = await chrome.storage.sync.get('theme');
    const savedTheme = settings.theme;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
        await chrome.storage.sync.set({ theme: 'dark' });
    }
});