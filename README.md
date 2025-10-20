# Arbeitszeit-Rechner_Browser-Erweiterung

## Vorbereitung für Installation
Bevor du die Erweiterung im Browser installieren kannst, müssen die notwendigen Pakete installiert und der TypeScript-Code kompiliert werden.

1. Repository klonen oder ZIP-Datei entpacken
    Lade das Projekt herunter und öffne den Ordner in einem Terminal deiner Wahl.

2. Abhängigkeiten installieren
    Führe den folgenden Befehl aus, um alle für das Projekt notwendigen Pakete (wie z.B. Chart.js) zu installieren:
    ```bash
    npm install
    ```
3. Weather API Konfiguration
    Erstelle eine neue Datei im Ordner scripts (`scripts/config.ts`)
    Kopiere folgendes in diese Datei und trage deinen OpenWeatherMap-API-Schlüssel passend ein
    ```ts
    export const WEATHER_API_KEY = 'DEIN_PERSÖNLICHER_API_SCHLÜSSEL_HIER'; 
    ```

4. TypeScript kompilieren
    Dieser Befehl wandelt den TypeScript-Code (im scripts-Ordner) in JavaScript um, damit der Browser ihn ausführen kann. Die fertigen Dateien werden im dist-Ordner abgelegt.
    ```bash
    npx tsc
    ```

---

## Installation als Browser-Erweiterung
1.  Öffne Google Chrome und navigiere zur Seite `chrome://extensions`.  
    Öffne Microsoft Edge und navigiere zur Seite `edge://extensions`.
2.  Aktiviere oben rechts den **Entwicklermodus** (Developer mode).
3.  Klicke auf den Button **"Entpackte Erweiterung laden"** (Load unpacked).
4.  Wähle den **kompletten Hauptordner** dieses Projekts aus.
5.  Die Erweiterung erscheint nun in deiner Liste und das Icon in der Browser-Leiste.

Eine detaillierte Video-Anleitung findest du hier: [Video-Tutorial auf YouTube](https://www.youtube.com/watch?v=yNZqK4d9E_c&t=340s).

---

# Info & FAQ

### Wie funktioniert der Arbeitszeit-Rechner?
Der Rechner ermittelt anhand deiner Ankunftszeit, der täglichen Soll-Arbeitszeit und deiner aktuellen Überstunden, wann du frühestens gehen kannst. Standardmäßig wird eine Pause von 45 Minuten berücksichtigt, die du anpassen kannst, wenn du minderjährig bist.

### Wie gebe ich meine aktuellen Überstunden ein?
Gib deine aktuellen Überstunden als Dezimalzahl ein. Zum Beispiel: `1,5` für 1 Stunde und 30 Minuten oder `-2,25` für -2 Stunden und 15 Minuten. Wenn du keine Überstunden hast, lasse das Feld leer oder gib `0` ein.

### Was passiert, wenn ich die Pause für Minderjährige aktiviere?
Wenn du die Option "60 Minuten Pause (für Minderjährige)" aktivierst, wird die Standardpause von 45 Minuten auf 60 Minuten erhöht. Dies ist relevant für minderjährige Arbeitnehmer, die längere Pausenregelungen haben.

### Wie funktioniert der Plus/Minus-Rechner?
Der Plus/Minus-Rechner nutzt die gleichen Einstellungen wie der erste Rechner (Soll-Arbeitszeit, Ankunftszeit, aktuelle Überstunden und Pausenregelung). Du gibst eine gewünschte Gehzeit ein, und der Rechner zeigt dir an, ob du zu diesem Zeitpunkt im Plus oder Minus bist.

### Wie funktioniert der Überstunden-Planer?
Der Überstunden-Planer bietet zwei Funktionen: Du kannst berechnen lassen, wie viel tägliches Plus du benötigst, um in einer bestimmten Anzahl von Tagen ein Stunden-Ziel zu erreichen. Alternativ kannst du auch berechnen lassen, wie viel Gesamtplus du erreichst, wenn du jeden Tag eine bestimmte Anzahl von Minuten zusätzlich arbeitest.

### Warum sehe ich keine Ergebnisse?
Stelle sicher, dass du alle erforderlichen Felder korrekt ausgefüllt hast. Überprüfe auch, ob deine Eingaben im richtigen Format sind (z.B. Zeitangaben im 24-Stunden-Format). Wenn das Problem weiterhin besteht, versuche die Seite neu zu laden.

### Was ist mit der Kernzeit?
Der Rechner achtet automatisch auf die Gleit- und Kernzeit. Die Standart Gleitzeit (die Zeit, ab der Arbeitszeit gezählt wird) beginnt um 06:45 Uhr. Die Kernzeit, in der Anwesenheitspflicht besteht, ist von 08:45 Uhr bis 15:30 Uhr (Freitags bis 15:00 Uhr).  

*Kernzeiten über "Optionen" anpassbar*

### Wie funktioniert der Countdown?
Der Countdown-Timer hilft dir, die verbleibende Zeit bis zum Feierabend im Blick zu behalten. Es gibt drei Möglichkeiten, ihn zu starten:

- **Countdown bis Feierabend (+0):** Nutzt die berechnete Gehzeit aus dem ersten Rechner.
- **Countdown bis Wunsch-Gehzeit:** Nutzt die von dir im zweiten Rechner eingetragene Gehzeit.
- **Countdown bis Feierabend (Logbuch):** Dieser Button erscheint automatisch, wenn für den heutigen Tag bereits ein Logbuch-Eintrag existiert. Er nutzt die dort gespeicherte Gehzeit.  

In den Einstellungen kannst du außerdem wählen, ob der Countdown in der Erweiterung oder in einem eigenen kleinen Fenster angezeigt werden soll.

### Wie funktioniert die Import/Export Funktion des Logbuches?
Du kannst dein Logbuch als CSV-Datei oder JSON exportieren, um eine Sicherungskopie zu erstellen oder die Daten
in anderen Anwendungen zu verwenden. Beim Import kannst du eine CSV-Datei oder JSON auswählen, um deine
Logbuch-Einträge wiederherzustellen oder zu aktualisieren. Achte darauf, dass die Datei das richtige
Format hat.