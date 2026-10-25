# app-check

Dieses Repo ist für Claude Code mit [REA – Reverse Engineer Anything](https://github.com/morluto/rea)
eingerichtet. REA ist ein MCP-Server, mit dem Claude Apps ohne Quellcode untersuchen kann:
JavaScript/Electron-Apps, .NET-Assemblies, APKs, Webseiten, HAR-Mitschnitte,
PyInstaller-Pakete, ELF/PE-Metadaten und vieles mehr.

## Benutzung

Einfach eine Claude-Code-Session in diesem Repo starten und fragen, z. B.:

```text
Untersuche mit REA, wie die Suche in /pfad/zur/app funktioniert, zeig mir die
Belege und baue eine ähnliche Funktion für mein Projekt.
```

Das Zielprogramm muss im Container liegen (hochladen, per `git clone` holen oder
herunterladen). Mit `/mcp` siehst du, ob der Server `rea` verbunden ist.

Im Terminal der Session gibt es außerdem die CLI:

```bash
rea --help
rea analyze-javascript-application /absoluter/pfad/zur/app --json
rea doctor --json
```

## Was eingerichtet ist

| Datei                                       | Zweck                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `.mcp.json`                                 | Registriert den MCP-Server `rea` für dieses Projekt                                         |
| `.claude/rea/install.sh`                    | Installiert Node.js 24 (falls nötig) und `rea-agents` in `~/.rea-runtime`, idempotent        |
| `.claude/rea/mcp.sh`                        | Startet `rea mcp` und installiert vorher, falls noch nicht geschehen                        |
| `.claude/hooks/session-start.sh`            | Installiert REA beim Start jeder Cloud-Session und legt `rea` auf den `PATH`                 |
| `.claude/settings.json`                     | Aktiviert den Hook, gibt den MCP-Server frei, erhöht das MCP-Start-Timeout                  |
| `.claude/skills/reverse-engineer-anything/` | REAs offizielle Workflow-Anleitung für Claude (Version passend zu `rea-agents` 6.8.0, MIT)  |

Die systemweite Node.js-Version bleibt unverändert; REA läuft über den Shim
`~/.rea-runtime/bin/rea` immer auf seiner eigenen, kompatiblen Node.js-Version.

## REA aktualisieren

`REA_VERSION` in `.claude/rea/install.sh` erhöhen und die Skill-Dateien aus dem
neuen Paket übernehmen (`skills/reverse-engineer-anything` im npm-Paket
`rea-agents`). Die nächste Session installiert die neue Version automatisch.

## Native Binaries (Ghidra)

Für Pseudocode und Disassembly von nativen Programmen braucht REA eine
Analyse-Engine (Ghidra 12.1.x, Hopper oder IDA). Die ist nicht vorinstalliert,
weil die Netzwerk-Richtlinie dieser Cloud-Umgebung Downloads von GitHub-Releases
blockiert. Wenn du `github.com` und `objects.githubusercontent.com` unter
*Network access → Allowed domains* freigibst, kann Ghidra nachgerüstet werden
(JDK 21 ist bereits vorhanden); danach `GHIDRA_INSTALL_DIR` setzen.

## Lokal statt in der Cloud

Auf deinem eigenen Rechner ist der offizielle Weg:

```bash
npx rea-agents setup
```

Bitte REA nur für Software einsetzen, die dir gehört oder die du untersuchen
darfst (siehe [DISCLAIMER](https://github.com/morluto/rea/blob/main/DISCLAIMER.md)).
