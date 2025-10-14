// scripts/background.js

// Dieser Listener wird ausgeführt, wenn auf das Action-Icon der Erweiterung geklickt wird.
chrome.action.onClicked.addListener((tab) => {
  // Öffnet das Side Panel im aktuellen Fenster.
  chrome.sidePanel.open({ windowId: tab.windowId });
});