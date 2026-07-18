# ✉️ MailMerge — Mailmerge Tool

MailMerge ist ein modernes, benutzerfreundliches und sicheres E-Mail-Mailmerge-Dashboard für Vereine und Teams. Es ermöglicht das Verfassen, Vorschauen und Versenden von personalisierten E-Mails (sowohl als Klartext als auch in formatiertem HTML) direkt über Google Gmail.

---

## ✨ Hauptfunktionen

- **👥 Dynamische Empfängerdatenbank:** Importieren Sie Mitglieder über CSV (Drag-and-Drop / Copy-Paste) oder fügen Sie einzelne Zeilen manuell hinzu.
- **✉️ HTML & Text Template-Builder:** Erstellen Sie Vorlagen mit personalisierten Platzhaltern wie `{{first_name}}`, `{{last_name}}`, `{{role}}` oder `{{custom}}`.
- **🖥️ Sandboxed Live-Vorschau:** Betrachten Sie die fertig gerenderten E-Mails für jeden Empfänger in einem geschützten Vorschau-Iframe, bevor Sie auf Senden klicken.
- **🔐 Lokale SMTP-Bridge:** Versenden Sie E-Mails direkt über Ihren eigenen Google Postausgang. Ihre Passwörter und E-Mail-Adressen werden **ausschließlich lokal** in Ihrem Browser (im `localStorage`) gespeichert und verlassen niemals Ihren Rechner.
- **📊 Live Dispatch-Logs:** Verfolgen Sie den Versandfortschritt in Echtzeit mit Erfolgs- und Fehlerberichten und einem visualisierten Fortschrittsbalken.

---

## 🏗️ System-Architektur

Das Projekt ist in zwei Komponenten aufgeteilt, die lokal auf Ihrem Computer ausgeführt werden:

```
  ┌────────────────────────────────────────────────────────┐
  │                   Browser (Frontend)                   │
  │                 http://localhost:5173/                 │
  └───────────┬────────────────────────────────────────────┘
              │
              │ HTTP POST (E-Mail-Details & Credentials)
              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 Node.js Server (Backend)               │
  │                 http://localhost:3001/                 │
  └───────────┬────────────────────────────────────────────┘
              │
              │ Nodemailer (SMTP Verbindung)
              ▼
  ┌────────────────────────────────────────────────────────┐
  │                   Google SMTP Server                   │
  │                    (smtp.gmail.com)                    │
  └────────────────────────────────────────────────────────┘
```

---

## 🚀 Erste Schritte

### 1. Repository klonen und installieren
Installieren Sie nach dem Herunterladen/Klonen des Projekts zuerst alle erforderlichen Bibliotheken:

```bash
npm install
```

### 2. Anwendungen starten
Das Mailmerge-Tool benötigt zwei Terminal-Sitzungen (eine für das Frontend, eine für das Backend):

#### Terminal A: Starten des Frontends (Vite)
```bash
npm run dev
```
Das Frontend ist anschließend im Webbrowser erreichbar unter: **http://localhost:5173/**

#### Terminal B: Starten der lokalen SMTP-Bridge (Express Backend)
```bash
npm run server
```
Das Backend läuft auf Port **3001** und verarbeitet den sicheren Mailversand.

---

## ⚙️ SMTP-Verbindung einrichten

### Google Gmail SMTP Bridge
1. Aktivieren Sie die Zwei-Faktor-Authentifizierung (2FA) in Ihrem Google-Konto.
2. Erstellen Sie unter **Sicherheit > App-Passwörter** ein neues 16-stelliges App-Passwort für die Anwendung.
3. Tragen Sie im Tab **3. System Config** Ihre Google-E-Mail-Adresse und das generierte App-Passwort ein.
4. Schalten Sie die *Delivery Strategy* auf **Custom / Google / Outlook SMTP Bridge**.

---

## 🛠️ Technologien

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS
- **Backend:** Node.js, Express, Cors, Nodemailer
- **Speicherung:** HTML5 LocalStorage (lokal im Browser)