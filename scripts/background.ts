// scripts/background.ts

/**
 * Hintergrundskript für die Chrome-Erweiterung.
 * Öffnet das Side Panel, wenn auf das Erweiterungssymbol geklickt wird.
 */
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});