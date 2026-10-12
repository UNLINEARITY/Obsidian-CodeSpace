# Code Space

<h1 align="center">Professionelle Code-Datei-Unterstützung für Obsidian</h1>

<p align="center">Bearbeiten, Einbetten, externe Einbindungen und Terminal-Integration.</p>

<p align="center"><a href="README.md">English</a> | <a href="README_CN.md">简体中文</a> | <a href="README_JA.md">日本語</a> | <a href="README_KO.md">한국어</a> | Deutsch | <a href="README_ES.md">Español</a> | <a href="README_PTBR.md">Português (Brasil)</a></p>

<p align="center">
  <img src="docs/img/Code.webp" alt="Code Space Preview" width="80%">
</p>

<p align="center">
  <a href="https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases">
    <img alt="Release" src="https://img.shields.io/github/v/release/UNLINEARITY/Obsidian-CodeSpace?label=Release&style=for-the-badge&logo=github&color=0891b2&labelColor=1c1917">
  </a>
  <a href="https://github.com/UNLINEARITY/Obsidian-CodeSpace/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/UNLINEARITY/Obsidian-CodeSpace?label=Stars&style=for-the-badge&logo=github&color=0891b2&labelColor=1c1917">
  </a>
  <a href="https://obsidian.md/plugins?id=code-space">
    <img alt="Downloads" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%27code-space%27%5D.downloads&label=Downloads&style=for-the-badge&logo=obsidian&color=0891b2&labelColor=1c1917&cacheSeconds=21600">
  </a>
  <a href="https://github.com/UNLINEARITY/Obsidian-CodeSpace/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/UNLINEARITY/Obsidian-CodeSpace?label=License&style=for-the-badge&logo=opensourceinitiative&color=0891b2&labelColor=1c1917">
  </a>
</p>

---

## Über das Plugin

> Code Space ist im offiziellen Obsidian Community-Plugin-Verzeichnis verfügbar.🎉

Obsidians nativer Workflow ist auf Markdown-Notizen ausgerichtet, daher ist die Unterstützung für zentrales Durchsuchen, Verwalten und Bearbeiten von Codedateien, Strukturnavigation und den Export eingebetteten Codes begrenzt. Code Space wurde geschaffen, um diese Lücke zu schließen.

**Die fünf Ebenen des „Space":**

1. **Verwaltungs-Space**: Bietet einen einheitlichen Index und Verwaltungsbereich für Codedateien, sodass du Codedateien über ein visuelles Dashboard durchsuchen kannst.
2. **Bearbeitungs-Space**: Öffnet Codedateien in einer eigenen Umgebung zum Ansehen und Bearbeiten.
3. **Einbettungs-Space**: Arbeitet mit Obsidians nativen Funktionen zusammen und unterstützt Verweise, eingebettete Codevorschauen und nativen PDF-Export als echte Codeblöcke.
4. **Einbindungs-Space**: Bindet externe Ordner über System-Symlinks/Junctions in den Vault ein, um projektübergreifenden Code zu verwalten.
5. **Terminal-Space**: Führt auf dem Desktop eine echte System-Shell (PowerShell, zsh, bash) im Editor aus.

<p align='center'><img src='docs\img\pre0.png' width=95%></p>

---

## Kernfunktionen

### 1. Verwaltungs-Space für Codedateien
Bietet ein visuelles Dashboard für die einheitliche Indexierung und Verwaltung von Codedateien im Vault.

- **Visuelles Dashboard**: Eine Verwaltungsoberfläche mit Rasterlayout und Dateistatusübersicht.
- **Integrierte Verwaltungswerkzeuge**: Der Kopfzeilenbereich bietet schnellen Zugriff auf **Einstellungen**, **Datei erstellen** und die Verwaltung ignorierter Elemente.
- **Mehrdimensionale dynamische Filter**: Nach Ordner und Dateiendung filtern, nach Dateiname oder Pfad suchen und nach Änderungsdatum, Name oder Typ sortieren.
- **Standard-Dateioperationen**: Umbenennen, verschieben, löschen, in der Navigation anzeigen und in der Standard-App öffnen — von Obsidian unterstützte Operationen.
- **Dashboard-Zustandsspeicher**: Such-, Filter- und Sortierzustand wird mit den Plugin-Einstellungen gespeichert für flüssige Wiederholungsnutzung.

<p align='center'><img src='docs\img\pre1.png' width=95%></p>


### 2. Professioneller Bearbeitungs-Space
Stellt eine IDE-ähnliche Umgebung zum Ansehen und Bearbeiten von Code bereit.

- **Syntaxhervorhebung**: Basierend auf CodeMirror 6 mit genauer Hervorhebung für viele Sprachen.
- **Strukturnavigation**: Code-Gliederungsansicht, die Klassen, Funktionen und Methoden parst, mit Klick-zum-Springen.
- **Erweitertes Suchen und Ersetzen**: Eigenes Suchfeld mit regulären Ausdrücken, Groß-/Kleinschreibung, ganzzahligem Wort, einzelnem Ersetzen und Alle ersetzen.
- **Manuelles Speichern**: Ctrl/Cmd+S mit Rückmeldung des ungespeicherten Zustands und Cursorpositionsschutz gegen Viewport-Sprünge.
- **Grundlegende Bearbeitungshilfen**: Automatische Einrückung, Klammerzuordnung, Code-Faltung und Zeilennummern.
- **Interaktionsoptimierungen**: Ctrl/Cmd+Mausrad-Schriftskalierung und ein schwebender Suchknopf für schnellen Zugriff.

<p align='center'><img src='docs\img\pre22.png' width=95%></p>

### 3. Nativer Obsidian-Einbettungs-Space

Code in Markdown einbetten und in der Vorschau ansehen, einschließlich bestimmter Ausschnitte aus Codedateien:

- **Dateiverweise**: Codedateien mit `[[Dateiname]]` verknüpfen.
- **Codeeinbettung**: Vorschauen mit `![[Dateiname]]` in Markdown einbetten.
- **Zeilenbereiche**: Startzeilen oder Zeilenbereiche angeben, um Codeausschnitte präzise einzubetten.
- **Schnelle Vorschau**: Über Links hovern, um den Codeinhalt voranzuschauen.
- **Quelldateien auf mehrere Arten öffnen**: Klicke auf den Einbettungskopf, um die Quelldatei zu öffnen. Ctrl/Cmd+Klick öffnet sie in einem neuen Tab, Ctrl/Cmd+Shift+Klick in einem neuen Fenster und Ctrl/Cmd+Alt/Option+Klick in einem geteilten Bereich.
- **Vorschau-Synchronisation**: Ändert sich eine Quelldatei, werden zugehörige eingebettete Vorschauen neu gerendert.
- **Nativer PDF-Export**: Nutze Obsidians offiziellen **Als PDF exportieren**, und Codedateiverweise werden als echte Codeblöcke statt als graue Dateikarten exportiert.
- **Breitere Host-Kompatibilität**: Eingebettete Codevorschauen verhalten sich im Lesemodus, in ausgekoppelten Fenstern und anderen Hosts, die Obsidians Markdown-Renderpipeline wiederverwenden, zuverlässiger.

<p align='center'><img src='docs\img\pre3.png' width=95%></p>

**Unterstützte Einbettungssyntax:**

| Syntax | Beschreibung |
|--------|-------------|
| `![[test.py]]` | Gesamte Datei einbetten |
| `![[test.py#20]]` | Ab Zeile 20 bis Dateiende anzeigen |
| `![[test.py#L20]]` | Wie oben (GitHub-Stil mit `L`-Präfix) |
| `![[test.py#20-40]]` | Zeilen 20 bis 40 anzeigen |
| `![[test.py#L20-L40]]` | Wie oben (GitHub-Stil) |
| `![[test.py#L20-40]]` | Gemischtes Format wird ebenfalls unterstützt |

**Zeilenbereich-Verhalten:**
- Im Bereichsmodus wird der volle angegebene Bereich angezeigt, unabhängig von der Einstellung „Maximale Zeilen der Einbettung"
- Überschreitet die Endzeile die Dateilänge, wird automatisch am Dateiende abgeschnitten
- Ist die Endzeile kleiner als die Startzeile, wird automatisch auf Einzellanzeige angepasst
- Zeilennummern stimmen mit der Originaldatei überein

Tipp: Enthält eine Notiz Codedatei-Einbettungen, exportiere sie mit Obsidians offiziellem **Als PDF exportieren**. Code Space hält diese Einbettungen im fertigen PDF als echte Codeblöcke und bewahrt dabei Obsidians natives Layout und die Seitenumbrüche.

<p align='center'><img src='docs\img\pre8.png' width=90%></p>

### 4. Externer Einbindungs-Space (nur Desktop)

Über Vault-Grenzen hinweg externen Projektcode verwalten.

- **Symlinks/Junctions**: Erstelle und verwalte Symlinks (macOS/Linux) oder Verzeichnis-Junctions (Windows) auf der Einstellungsseite, um externe Ordner in den Vault einzubinden
- **Integrierter Workflow**: Codedateien in eingebundenen Ordnern erscheinen im Dashboard mit Code-Space-Funktionen wie Bearbeiten, Einbetten und Gliederungsnavigation
- **Bidirektionale Synchronisation**: Bearbeitungen aus Obsidian oder aus dem externen Ordner betreffen dieselben zugrunde liegenden Dateien
- **Projektübergreifendes Arbeiten**: Verteilte Code-Repositorys direkt verwalten, ohne Projektcode in den Vault zu kopieren
- **Einbindungsstatus-Verwaltung**: Einbindungsstatus ansehen, Einbindungen entfernen oder neu verknüpfen und unter Windows den Modus auto, symlink oder junction wählen

<p align='center'><img src='docs\img\pre7.png' width=98%></p>

**Verwendung:**
1. Öffne **Einstellungen > Community-Plugins > Code Space**
2. Aktiviere **Externe Ordner**
3. Klicke auf **Externen Ordner hinzufügen**, wähle einen Quellordner außerhalb des Vaults und lege den Einbindungsort im Vault fest
4. Code Space erstellt den Link, speichert die Konfiguration und indexiert die Codedateien im eingebundenen Ordner

**Wichtige Hinweise!**
- **Nur Desktop**: Externe Einbindungen sind aufgrund von Sandbox-Beschränkungen auf iOS/Android nicht verfügbar
- **Sicherheitsrisiko**: Externe Einbindungen erlauben dem Plugin den Zugriff auf Dateien außerhalb des Vaults. **Binde nur Ordner ein, denen du vertraust**
- **Pfadvalidierung**: Die Quelle muss ein absoluter Ordner außerhalb des Vaults sein. Code Space lehnt Vault-Selbsteinbindungen, Eltern/Kind-Zyklen und unter einem anderen Symlink oder einer Junction verschachtelte Einbindungspfade ab
- **Sicheres Entfernen**: Code Space entfernt eine Einbindung nur, wenn der Link noch auf die konfigurierte Quelle zeigt. Ein geänderter oder vom Nutzer erstellter Link wird als Zielabweichung gemeldet und bleibt unangetastet
- **Berechtigungsunterschiede**: Unter Windows benötigen Symlinks möglicherweise den Entwicklermodus oder Administratorrechte. Der Automatikmodus versucht zuerst Symlink und fällt dann auf Junction zurück
- **Leistungsfragen**: Nutze dies für leichtgewichtige Repositorys oder die Koordination mehrerer Repositorys, vermeide aber das Einbindungen zu vieler Dateien oder sehr großer Verzeichnisse
- **Pfadstabilität**: Verschieben oder Umbenennen externer Ordner bricht die Einbindung und erfordert Neukonfiguration
- **Synchronisationsprobleme**: Liegen externe Ordner in cloudsynchronisierten Verzeichnissen (z. B. Dropbox, OneDrive), stelle sicher, dass Obsidian und die externen Ordner synchron sind, um Konflikte zu vermeiden. Beachte außerdem: Manche Clouddienste folgen den Symlinks im Vault und laden den gesamten eingebundenen Ordner in die Cloud hoch; schließe die Einbindungsordner in diesem Fall von der Synchronisierung aus

### 5. Integriertes Terminal (nur Desktop)

Führe eine echte System-Shell in Code Space aus, basierend auf xterm.js und node-pty.

- **Echtes PTY-Terminal**: Interaktive Programme, Farben, Job-Kontrolle und Paging funktionieren wie in einem nativen Terminal (ConPTY unter Windows, Unix-pty unter macOS/Linux)
- **Zwei Hosts, ein Satz Sitzungen**: Wechsle zwischen einem eingebetteten Bedienfeld unten im Code-Editor oder einem eigenständigen Terminal-Tab im Hauptbereich. Sitzungen laufen weiter, wenn Bedienfelder oder Ansichten geschlossen werden
- **Mehrere Tab-Sitzungen**: Terminal-Sitzungen über die Tableiste erstellen, wechseln und schließen; beendete Sitzungen werden markiert und bleiben lesbar, bis sie geschlossen werden
- **Folgt deinem Kontext**: Neue Terminals starten im Ordner der aktuell geöffneten Datei (externe Einbindungen werden zu ihrem echten Speicherort aufgelöst), andernfalls im Vault-Stammverzeichnis
- **Theme-bewusst**: Farben und die Monospace-Schrift folgen deinem Obsidian-Theme, auch in ausgekoppelten Fenstern
- **Größenänderbares Bedienfeld**: Ziehe den Griff über dem eingebetteten Bedienfeld, um dessen Höhe anzupassen

**Verwendung:**
1. Aktiviere das Terminal unter **Einstellungen > Code Space > Terminal** (standardmäßig deaktiviert)
2. Wähle neben „Unterstützungsdateien" **Herunterladen** — Code Space lädt ein kleines Plattformpaket herunter (siehe Hinweise unten); der Kopfkopf-Knopf, die Befehle und die übrigen Einstellungen erscheinen, sobald alles bereit ist
3. Öffne eine Codedatei und wähle den Terminal-Knopf in der Editor-Kopfzeile, oder führe **Code Space: Terminal-Bedienfeld umschalten** aus
4. Oder führe **Code Space: Terminal öffnen** für einen eigenständigen Terminal-Tab aus (jeder Tab ist ein Vollbild-Terminal)
5. Schließe einen Terminal-Tab, um dieses Terminal zu stoppen, oder führe **Code Space: Alle Terminalsitzungen schließen** aus, um alles zu stoppen

**Wichtige Hinweise!**
- **Nur Desktop**: Das Terminal ist auf iOS/Android nicht verfügbar
- **Expliziter Download**: Ein echtes PTY benötigt einen nativen Helfer (`node-pty`). Obsidians Plugin-Store verteilt nur JavaScript, daher wird der Helfer nur heruntergeladen, wenn du unter **Einstellungen > Terminal** **Herunterladen** wählst: ein vorgefertigtes Paket (ca. 1-3 MB) für deine Plattform aus den GitHub-Releases dieses Repositorys, per SHA-256-Prüfsumme verifiziert und unter dem Plugin-Ordner gespeichert. Terminal-Befehle und -Knöpfe laden niemals selbst etwas herunter
- **Unterstützte Plattformen**: Windows x64/ARM64, macOS x64/ARM64, Linux x64. Andere Linux-Architekturen werden noch nicht unterstützt
- **Linux-Voraussetzung**: Die Installation des Unterstützungspakets unter Linux erfordert das Hilfsprogramm `unzip` (auf den meisten Distributionen vorinstalliert)
- **Shell-Erkennung**: PowerShell (`pwsh.exe` → `powershell.exe` → `cmd.exe`) unter Windows, `$SHELL` → `zsh` unter macOS, `$SHELL` → `bash` unter Linux. Lege unter **Einstellungen > Terminal** eine explizite ausführbare Datei fest
- **Tastaturfokus**: Während das Terminal fokussiert ist, gehen Tasten (einschließlich Ctrl/Cmd-Kombinationen) an die Shell, wie in VS Code. Wähle den Editor, um die Tasten zurückzugeben
- **Sicherheit**: Das Terminal läuft mit deinen Benutzerrechten und kann auf Dateien außerhalb des Vaults zugreifen. Behandle eingefügte Befehle mit derselben Sorgfalt wie in jedem Systemterminal

---
## Konfiguration

Zugriff auf die Konfiguration über **Einstellungen > Community-Plugins > Code Space**:

- **Verwaltete Dateiendungen**: Dateiendungen festlegen, die von Code Space verwaltet werden (kommagetrennt). Änderungen aktualisieren die verwalteten Dateizuordnungen.
- **Zeilennummern anzeigen**: Zeilennummern umschalten (Standard: ein)
- **Schriftgröße des Editors**: Schriftgröße für den Code-Editor (Standard: 18px, Bereich: 9-36px)
- **Schriftgröße der Einbettungen**: Schriftgröße für eingebettete Codeblöcke in Markdown (Standard: 15px, Bereich: 9-36px)
- **Maximale Zeilen der Einbettung**: Höchstzahl der in eingebetteten Vorschauen angezeigten Zeilen (Standard: 20, 0 für unbegrenzt)
- **Speicherort für neue Codedateien**: Neue Codedateien in einem eigenen Ordner oder im Ordner der gerade aktiven Datei erstellen
- **Externe Ordner (nur Desktop)**: Externe Ordner über System-Symlinks/Junctions in den Vault einbinden. Die Funktion lässt sich aktivieren oder deaktivieren; Einbindungen hinzufügen, entfernen, neu verknüpfen und prüfen.
- **Terminal (nur Desktop)**: Das integrierte Terminal aktivieren (standardmäßig deaktiviert; beim Aktivieren erscheinen der Terminal-Knopf und die Befehle), eine Shell-Programmdatei wählen (leer für automatische Erkennung), Schriftgröße, Scrollback und die Höchstzahl gleichzeitiger Sitzungen festlegen und die heruntergeladenen Terminal-Unterstützungsdateien verwalten (erneut herunterladen oder entfernen).

Hinweis: Externe Einbindungen erlauben den Zugriff auf Dateien außerhalb des Vaults. Binde nur Ordner ein, denen du vertraust.

## Unterstützte Sprachen (erweiterbar)

### 1. Standardmäßig unterstützte Dateiendungen

| Sprache | Dateiendungen |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| Web-Technologien | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| Systemprogrammierung | `.rs`, `.go`, `.java`, `.cs` |
| Daten/Konfiguration | `.sql`, `.yaml`, `.yml`, `.xml` |
| Skriptsprachen | `.php`, `.r`, `.rb`, `.sh` |

**Du kannst in den Plugin-Einstellungen weitere Dateiendungen hinzufügen. Code Space kann Dateien mit benutzerdefinierten Endungen verwalten.**
- Text- und Codedateien öffnen in der Code-Space-Editor-Oberfläche
- Binärdateien (z. B. Bilder oder PDFs) öffnen mit Obsidians nativem Betrachter oder der System-Standard-App. Über das Dashboard lassen sich auch Anhänge wie PDFs verwalten

<p align='center'><img src='docs\img\pre4.png' width=95%></p>

### 2. Zusätzliche Text-/Code-Endungen mit Syntaxhervorhebung

Füge die folgenden Dateiendungen unter **Einstellungen > Code Space > Verwaltete Dateiendungen** hinzu, um sie zu aktivieren:

| Sprache | Dateiendungen | Wiederverwendete Hervorhebung von |
|------|--------|-------------|
| **XML-Familie** | `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **C/C++-Familie** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Java-Familie** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **Frontend-Frameworks** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **JSON-Varianten** | `.json5`, `.jsonc` | JavaScript |
| **Python-Familie** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **Konfigurationsdateien** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **Shell-Skripte** | `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | Eigenständig |
| **Weitere Sprachen** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.erb`, `.m` | Eigenständig |

### 3. Binärdatei-Unterstützung (öffnet mit Obsidians nativem Betrachter)

Fügst du die folgenden Dateiendungen zur verwalteten Liste hinzu, lassen sich diese Dateien auch im Code-Space-Dashboard verwalten (umbenennen, verschieben, löschen usw.). Sie werden nicht vom Code-Space-Editor geöffnet; sie verwenden Obsidians nativen Betrachter oder die System-Standard-App.

| Typ | Dateiendungen |
|------|--------|
| Bilder | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| Dokumente | `.pdf` |
| Audio | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| Video | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| Archive | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| Sonstige | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |

---

## Unterstützte Tastenkombinationen

### 1. Plugin-Befehle

<p align='center'><img src='docs\img\pre5.png' width=98%></p>

| Befehlspfad | Funktion |
|---------|------|
| `Ctrl+P` → „Dashboard öffnen" | Code-Verwaltungsbereich öffnen |
| `Ctrl+P` → „Codedatei erstellen" | Neue Codedatei erstellen |
| `Ctrl+P` → „Plugin neu laden" | Plugin neu laden |
| `Ctrl+P` → „Code-Gliederung umschalten" | Code-Gliederungsansicht umschalten |
| `Ctrl+P` → „Suchen und ersetzen" | Such- und Ersetzen-Feld im aktuellen Code-Space-Editor öffnen |
| `Ctrl+P` → „Terminal öffnen" | Neuen Terminal-Tab öffnen (verfügbar nach Aktivierung des Terminals und Download der Unterstützungsdateien) |
| `Ctrl+P` → „Terminal-Bedienfeld umschalten" | Eingebettetes Terminal-Bedienfeld im aktuellen Editor umschalten |
| `Ctrl+P` → „Alle Terminalsitzungen schließen" | Jedes Terminal stoppen |

---

### 2. Grundlegende Operationen

| Tastenkombination | Funktion |
|--------|------|
| `Ctrl/Cmd+S` | Datei manuell speichern |
| `Ctrl/Cmd+Mausrad` | Schriftgröße anpassen (im Terminal: nur das fokussierte Terminal) |
| `Ctrl/Cmd+F` | Suchen |
| `Ctrl+H` / `Cmd+Option+F` | Ersetzen |
| `Ctrl/Cmd+C` | Auswahl kopieren |
| `Ctrl/Cmd+X` | Auswahl ausschneiden |
| `Ctrl/Cmd+V` | Inhalt einfügen |
| `Ctrl/Cmd+A` | Alles auswählen |
| `Ctrl/Cmd+Z` | Rückgängig |
| `Ctrl+Y` oder `Ctrl/Cmd+Shift+Z` | Wiederholen |
| `Tab` | Einrückung erhöhen |
| `Shift+Tab` | Einrückung verringern |
| `Enter`           | Neue Zeile mit beibehaltener Einrückung |



| Cursor-Navigation            |          | Auswahl und Bearbeitung              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | Cursor nach oben/unten/links/rechts bewegen | `Shift+Pfeiltasten`       | Auswahl erweitern    |
| `Home`          | Zum Zeilenanfang springen    | `Ctrl+Shift+←`    | Bis zum Wortanfang wählen |
| `End`           | Zum Zeilenende springen    | `Ctrl+Shift+→`    | Bis zum Wortende wählen |
| `Ctrl+←`        | Ein Wort nach links | `Ctrl+Shift+Home` | Bis zum Dateianfang wählen |
| `Ctrl+→`        | Ein Wort nach rechts | `Ctrl+Shift+End`  | Bis zum Dateiende wählen |
| `Ctrl+Home`     | Zum Dateianfang springen  | `Backspace`       | Zeichen vor dem Cursor löschen |
| `Ctrl+End`      | Zum Dateiende springen  | `Delete`          | Zeichen nach dem Cursor löschen |
| `Page Up`       | Seite auf     | `Ctrl+Backspace`  | Wort vor dem Cursor löschen |
| `Page Down`       | Seite ab     | `Ctrl+Delete`     | Wort nach dem Cursor löschen |


---

## Installation

### Methode 1: Installation über die Obsidian Community-Plugins (empfohlen)

Code Space ist im offiziellen Obsidian Community-Plugin-Verzeichnis verfügbar.

1. Öffne **Einstellungen > Community-Plugins**.
2. Schalte bei Aufforderung **Eingeschränkter Modus** aus.
3. Klicke auf **Durchsuchen**.
4. Suche nach „Code Space".
5. Klicke auf **Installieren** und aktiviere das Plugin.

### Methode 2: Manuelle Installation

1. Besuche [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest).
2. Lade `main.js`, `manifest.json` und `styles.css` herunter und lege sie im Plugin-Verzeichnis deines Vaults ab: `.obsidian/plugins/code-space/`. Existiert der Ordner `code-space` nicht, erstelle ihn manuell.
3. Lade in den Obsidian-Einstellungen neu und aktiviere das Plugin.

### Methode 3: BRAT

Verwende BRAT nur, wenn du einen Entwicklungs- oder Vorab-Build testen möchtest. Installiere zuerst das BRAT-Plugin und füge dann dieses Repository als Beta-Plugin hinzu: `https://github.com/UNLINEARITY/Obsidian-CodeSpace`. Wähle anschließend die neueste Version. Die meisten Nutzer sollten die Community-Plugin-Version installieren.

<p align='center'><img src='docs\img\pre6.png' width=90%></p>

---

## Entwicklung

### Build-Voraussetzungen

- Node.js 18 oder neuer (aktuelles LTS empfohlen)
- npm

### Build-Befehle

```bash
npm install          # Abhängigkeiten installieren
npm run dev          # Entwicklungs-Build (Dateiüberwachung)
npm run build        # Produktions-Build
npm test             # Unit-Tests ausführen
npm run lint         # ESLint ausführen
npm run dev:copy     # Build-Artefakte in den lokalen Vault kopieren
```

`npm run dev:copy` verwendet standardmäßig `C:\Nonlinear\ob` und `.obsidian`. Setze `OBSIDIAN_VAULT_PATH` oder `OBSIDIAN_CONFIG_DIR`, wenn dein Vault andere Pfade verwendet.

### Release-Workflow

Aktualisiere die Version in `package.json`, führe die Validierungspipeline aus und pushe ein SemVer-Tag wie `2.4.0`. GitHub Actions validiert dann den Tag, baut die Release-Artefakte, erstellt Herkunftsatteste und veröffentlicht `main.js`, `manifest.json` und `styles.css` im GitHub-Release.

### Projektstruktur

```
obsidian-codespace/
├── src/
│   ├── main.ts                # Plugin-Einstieg: Befehlsregistrierung, View-Mounting und Lebenszyklusverwaltung
│   ├── code_view.ts           # Editor-Kern: CodeMirror-6-Bearbeitungsumgebung
│   ├── dashboard_view.ts      # Dashboard-View: Dateiindexierung und Verwaltungs-Oberfläche
│   ├── outline_view.ts        # Gliederungsansicht: strukturelle Navigation in der Seitenleiste
│   ├── code_parser.ts         # Syntax-Parser: Strukturanalyse für mehrere Sprachen
│   ├── code_embed.ts          # Einbettungsverarbeitung: Verweis- und Vorschaulogik
│   ├── code_embed_markdown.ts # Code-Einbettungserweiterung für nativen PDF-Export und verwandte Abläufe
│   ├── scrollbar_visibility.ts # Scrollbar-Sichtbarkeitsstatus für Editoren und Einbettungen
│   ├── native_pdf_export_patch.ts # Integration des nativen PDF-Exports und Patch der Exportkette
│   ├── dropdown.ts            # UI-Komponenten: Dropdown/Mehrfachauswahl
│   ├── folder_filter_modal.ts # Ordnerfilter-Modal
│   ├── ignore_manager_modal.ts # Modal zur Verwaltung ignorierter Dateien/Ordner
│   ├── external_mount.ts      # Externe Einbindungen: Symlink/Junction-Verwaltung
│   ├── settings.ts            # Einstellungsbereich: Plugin-Konfiguration
│   ├── terminal/              # Integriertes Terminal (nur Desktop)
│   │   ├── types.ts           # Gemeinsame Terminal-Typen und lokale pty-Schnittstelle
│   │   ├── node_access.ts     # Zugriff auf Node-APIs über window.require zur Laufzeit
│   │   ├── binary_manager.ts  # node-pty-Prebuild herunterladen/prüfen/entpacken
│   │   ├── conout_patch.ts    # Windows-ConPTY-Renderer-Patch (node-pty)
│   │   ├── pty_host.ts        # PtyProcess-Wrapper: node-pty laden, spawn/kill
│   │   ├── shell_detector.ts  # Erkennung der plattformstandardmäßigen Shell
│   │   ├── terminal_theme.ts  # Zuordnung der Obsidian-Theme-Variablen zur xterm-Theme
│   │   ├── terminal_component.ts # xterm.js-Wrapper: attach/detach/fit
│   │   ├── session_manager.ts # TerminalManager: globaler Sitzungslebenszyklus
│   │   ├── terminal_panel.ts  # Gemeinsames Tab-Leisten-Bedienfeld (eingebettete + View-Hosts)
│   │   └── terminal_view.ts   # Eigenständige Terminal-ItemView
│   └── lang/
│       ├── helpers.ts         # Lokalisierungshelfer
│       └── locale/
│           ├── en.ts          # Englische Zeichenketten
│           └── zh-cn.ts       # Chinesische Zeichenketten
├── styles.css                 # Stil-Einstiegspunkt
├── manifest.json              # Plugin-Metadaten
└── package.json               # Abhängigkeiten und Skripte
```

---


## Mitwirken

Beiträge über Pull Requests sind willkommen!

Bitte stelle sicher:
1. Der Code besteht die ESLint-Prüfungen
2. Folge dem bestehenden Codestil
3. Commit-Messages sind klar und aussagekräftig

Für Probleme oder Vorschläge verwende [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues).
- Autor: unlinearity
- E-Mail: unlinearity@gmail.com
- [AGPL-3.0-or-later](LICENSE) - Copyright (c) 2026 unlinearity

Bekannte Einschränkungen:
- Inhalte von Codedateien werden derzeit nicht von Obsidians globaler Suchmaschine indexiert. Verwende für die aktuelle Datei das Code-Space-Such- und Ersetzen-Feld.
- Das integrierte Terminal ist nur für den Desktop; schlägt der Download der Unterstützungsdateien unter Windows ARM64 fehl, melde dies bitte in einem Issue.

---

## Danksagung

<p align="center">Code Space wird auch auf <a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace">AtomGit</a> gehostet, wo du den Quellcode durchsehen kannst.</p>
<p align="center"><a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace"><img alt="AtomGit G-Star" src="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace/star/new_badge.svg"></a></p>

### Danke für die Unterstützung

> Dank an alle, die Probleme gemeldet und Pull Requests beigetragen haben.

Wenn dir dieses Plugin hilft oder Spaß macht, kannst du mir einen Bubble Tea ausgeben. ❤️ (WeChat-Trinkgeld-QR-Code unten)

<p align='center'><img src='docs/img/wechat-tip.png' width=60%></p>

### Referenzierte Projekte

Dieses Projekt baut auf folgenden hervorragenden Projekten auf:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): Bietet mächtige Plugin-Erweiterbarkeit.
- [CodeMirror 6](https://codemirror.net/): Flexible und moderne Code-Editor-Engine.
- [Lezer](https://lezer.codemirror.net/): Effizientes inkrementelles Code-Parsing-System.
- [xterm.js](https://github.com/xtermjs/xterm.js/): Terminal-Frontend für das integrierte Terminal.
- [node-pty](https://github.com/microsoft/node-pty): Pseudo-Terminal-Backend von Microsoft; der Windows-Patch in Obsidian ist angelehnt an [lean-obsidian-terminal](https://github.com/sdkasper/lean-obsidian-terminal).
- [TypeScript](https://www.typescriptlang.org/): Bietet robuste Typsicherheit.
- [esbuild](https://esbuild.github.io/): Extrem schneller JavaScript-Bundler.

---

## Star-Verlauf

<!-- star-history:start -->
[![Star History](https://raw.githubusercontent.com/UNLINEARITY/Obsidian-CodeSpace/main/assets/star-history/star-history.png)](https://star-history.com/#UNLINEARITY/Obsidian-CodeSpace&Date)
<!-- star-history:end -->

---

**Mache die Code-Verwaltung in Obsidian einfach und effizient!**
