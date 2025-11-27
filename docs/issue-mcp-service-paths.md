# 🜄 MCPHub Service Path Recognition Issue 🜄

## 🜄 Ziel / Summary 🜄
Behebung des Problems, dass MCPHub beim Start als Service keine Paths erkennt, wodurch einige MCP Server nicht gestartet werden können.

## 🜄 Kontext / Referenz 🜄
- Projekt: MCPHub (Model Context Protocol Hub)
- Umgebung: Service-Modus (systemd, kein Docker)
- Bezug: MCP Server Konfiguration und Pfad-Auflösung
- Datum: 2025-09-26

## 🜄 Verantwortung / Authority 🜄
- Autor: Project Manager Agent
- Cap: Projektsteuerung und Issue-Management
- Delegation: Analyse und Lösung durch spezialisierte Agents

## 🜄 Prüfung / Validation 🜄
- [ ] Issue-Beschreibung verstanden und dokumentiert
- [ ] Cap für Projektsteuerung akzeptiert
- [ ] Opportunitäts-Ethik geprüft (keine Blockierung anderer kritischer Issues)

## 🜄 Risiken / Nebenwirkungen 🜄
- Potenzielle Ausfallzeiten bei MCP Servern
- Beeinträchtigung der MCP-Funktionalität
- Mögliche Sicherheitsimplikationen bei Pfad-Auflösung

## 🜄 Aufgaben / To-Do 🜄
- [ ] Root Cause Analyse durchführen
- [ ] Ist-Zustand analysieren
- [ ] Zielzustand definieren
- [ ] Implementierungsplan erstellen
- [ ] Tasks in ct_dev-task_mgmnt anlegen
- [ ] Freigabe durch Auctor einholen

## 🜄 Details 🜄
### Problemstellung
MCPHub erkennt beim Start als Service keine Paths. Dies führt dazu, dass einige MCP Server nicht gestartet werden können.

### Vermutete Ursachen
- Pfad-Auflösung im Service-Kontext unterscheidet sich von interaktivem Start
- Environment-Variablen oder Working Directory nicht korrekt gesetzt
- Berechtigungsprobleme bei Pfad-Zugriffen
- Konfigurationsdateien nicht gefunden oder falsch geparst

### Betroffene Komponenten
- MCP Server Initialisierung
- Pfad-Management in MCPHub
- Service-Konfiguration (systemd, kein Docker)

### Priorität
Hoch - Beeinträchtigt Kernfunktionalität von MCP Servern

### Root Cause Analyse Ergebnisse
Aus der Analyse der Agents:

#### Code-Analyse (code-analyzer):
- Verwendung von `process.cwd()` für Pfad-Auflösung
- Beim Service-Start ist cwd nicht das Projektverzeichnis
- Führt zu falschen Pfaden für Konfigurationsdateien

#### Runtime-Debugging (runtime-debugger):
- Environment PATH ist limitiert beim Service-Start
- Fehlende Standardverzeichnisse wie /usr/local/bin
- MCP Server Commands (npx, uvx) nicht gefunden

#### System-Architektur (system-architect):
- Empfehlung: Kombination aus systemd WorkingDirectory und Code-Refaktor
- Robustere Pfad-Auflösung mit __dirname
- Erweiterung der PATH Variable für Child Processes

### Lösungsansätze
1. Systemd Service mit WorkingDirectory konfigurieren
2. Code-Refaktor für robuste Pfad-Auflösung (__dirname basiert)
3. PATH Erweiterung für MCP Server Child Processes