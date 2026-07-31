# Arbeitszeit-Rechner_Browser-Erweiterung

## Vorbereitung für Installation (Source code (.ts))
Bevor du die Erweiterung im Browser installieren kannst, müssen die notwendigen Pakete installiert und der TypeScript-Code kompiliert werden.

1. Repository klonen oder ZIP-Datei entpacken
    Lade das Projekt herunter und öffne den Ordner in einem Terminal deiner Wahl.

2. Abhängigkeiten installieren
    Führe den folgenden Befehl aus, um alle für das Projekt notwendigen Pakete (wie z.B. Chart.js) zu installieren:
    ```bash
    npm install
    ```
3. Weather API Konfiguration
    Erstelle oder öffne die Datei im Ordner scripts (`scripts/config.ts`)
    Kopiere folgendes in diese Datei und trage deinen [OpenWeatherMap-API-Schlüssel](https://openweathermap.org/) passend ein
    ```ts
    export const WEATHER_API_KEY: string = 'DEIN_PERSÖNLICHER_API_SCHLÜSSEL_HIER'; 
    ```
    *Wenn du die Kompilierte Version nutzt musst du nur den API-Schlüssel in die `dist/config.js` eintragen*

4. TypeScript & Browser Manifest kompilieren
    Dieser Befehl wandelt den TypeScript-Code um und bereitet das passende `manifest.json` vor:
    
    Für **Google Chrome / Edge / Brave**:
    ```bash
    npm run build:chrome
    ```
    
    Für **Mozilla Firefox**:
    ```bash
    npm run build:firefox
    ```

---

## Installation als Browser-Erweiterung

### Google Chrome / Microsoft Edge / Brave
1. Führe vorher `npm run build:chrome` aus.
2. Öffne Google Chrome (`chrome://extensions`) oder Microsoft Edge (`edge://extensions`).
3. Aktiviere oben rechts den **Entwicklermodus** (Developer mode).
4. Klicke auf **"Entpackte Erweiterung laden"** (Load unpacked).
5. Wähle den **Hauptordner** dieses Projekts aus.
6. Die Erweiterung steht nun als **Side Panel** zur Verfügung.

### Mozilla Firefox
1. Führe vorher `npm run build:firefox` aus (oder wähle direkt `manifest.firefox.json` aus).
2. Öffne Firefox und navigiere zu `about:debugging#/runtime/this-firefox`.
3. Klicke auf **"Temporäres Add-on laden..."** (Load Temporary Add-on...).
4. Wähle die Datei `manifest.firefox.json` (oder das aktualisierte `manifest.json`) aus diesem Ordner aus.
5. Die Erweiterung wird in der Firefox-Sidebar geladen.

---

## Import
ausnahmeTage = ["Krank", "Urlaub", "Feiertag", "Berufsschule"];

---

# Info & FAQ

### Wie funktioniert der Arbeitszeit-Rechner?
Der Rechner ermittelt anhand deiner Ankunftszeit, der täglichen Soll-Arbeitszeit und deiner aktuellen Überstunden, wann du frühestens gehen kannst. Standardmäßig wird eine Pause von 45 Minuten berücksichtigt, die du anpassen kannst, wenn du minderjährig bist.

### Wie trage ich Urlaub oder Krankheitstage ein?
Um Urlaub oder Krankheit einzutragen wähle die passende Option im ersten Rechner unter "Weitere Optionen".

### Wie gebe ich meine aktuellen Überstunden ein?
Gib deine aktuellen Überstunden als Dezimalzahl ein. Zum Beispiel: `1,5` für 1 Stunde und 30 Minuten oder `-2,25` für -2 Stunden und 15 Minuten. Wenn du keine Überstunden hast, lasse das Feld leer oder gib `0` ein.

### Wie trage ich einen Überstundenabbautag ein?
Um einen Tag an dem Überstundenabbau genutzt wurde einzutragen wähle die ensprechende Option im ersten Rechner unter "Weitere Optionen".  
*Achte darauf das deine Sollzeit korrekt gewählt ist*

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