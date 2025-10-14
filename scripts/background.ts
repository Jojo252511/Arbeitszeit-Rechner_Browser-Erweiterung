// scripts/background.ts

// Dieser Listener wird ausgeführt, wenn auf das Action-Icon der Erweiterung geklickt wird.
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  // Wir prüfen sicherheitshalber, ob das Tab eine ID hat.
  if (tab.windowId) {
    // Öffnet das Side Panel im aktuellen Fenster.
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});