// scripts/background.ts

/**
 * Hintergrundskript für den Arbeitszeit-Rechner.
 * Öffnet das Side Panel, wenn auf das Icon in Chrome/Edge geklickt wird.
 */
if (typeof chrome !== 'undefined' && chrome.action) {
    chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
        if (chrome.sidePanel && chrome.sidePanel.open && tab.windowId) {
            chrome.sidePanel.open({ windowId: tab.windowId });
        }
    });
}