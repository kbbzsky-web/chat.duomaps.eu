# 📖 README - DuoMaps Team Chat

## 🎮 Über das Projekt

**DuoMaps Team Chat** ist eine **Echtzeit-Chat-Webanwendung**, die speziell für das Team des Minecraft-Servers **DuoMaps.eu** entwickelt wurde. Die Plattform ermöglicht es Teammitgliedern, sicher und effizient miteinander zu kommunizieren.

---

## ✨ Features

### 🔐 Authentifizierung & Sicherheit
- **Registrierung & Login** mit Benutzername und Passwort
- **JWT-basierte Authentifizierung** für sichere Sessions
- **Passwort-Verschlüsselung** mit bcrypt
- **Eindeutige Benutzernamen** - kein Benutzer kann doppelt existieren
- **Account-Verwaltung** - Benutzer können ihren Account jederzeit löschen

### 💬 Chat-Funktionen
- **Echtzeit-Messaging** mit Socket.io
- **1-zu-1 Chats** mit anderen Teammitgliedern
- **Nachrichtenhistorie** - alle Nachrichten werden gespeichert
- **Nachrichten bearbeiten & löschen**
- **Typing Indicators** - sehe wenn jemand tippt
- **Gelesen/Ungelesen Status** für Nachrichten
- **Ungelesene Nachrichten-Zähler**

### 👥 Soziale Features
- **Freunde hinzufügen** für schnellen Zugriff
- **Benutzer blockieren** - keine Nachrichten von blockierten Benutzern
- **Benutzer stummschalten** - Benachrichtigungen deaktivieren
- **Online/Offline Status** in Echtzeit
- **Benutzersuche** - finde andere Teammitglieder

### 🎨 Design & Benutzerfreundlichkeit
- **Modernes Dark Mode Design** in Blau-Schwarz-Grau
- **Responsive Design** - funktioniert auf Desktop, Tablet und Mobile
- **Intuitive Benutzeroberfläche**
- **Animationen & Übergänge** für bessere UX
- **Font Awesome Icons** für moderne Optik

### 🔔 Benachrichtigungen
- **Browser-Benachrichtigungen** für neue Nachrichten
- **Sound-Benachrichtigungen** (optional deaktivierbar)
- **Echtzeit-Updates** ohne Seite neu zu laden

---

## 🛠️ Technologie-Stack

### Frontend
- **HTML5** - Struktur
- **CSS3** - Styling mit CSS Custom Properties (Variables)
- **JavaScript (ES6+)** - Logik und Interaktivität
- **Socket.io Client** - Echtzeit-Kommunikation
- **Font Awesome 6.4** - Icons

### Backend
- **Node.js (v24.10.0)** - Runtime
- **Express.js** - Web-Framework
- **Socket.io** - WebSocket-Server für Echtzeit
- **MySQL (mysql2)** - Datenbank
- **JWT (jsonwebtoken)** - Authentifizierung
- **bcryptjs** - Passwort-Hashing
- **express-validator** - Input-Validierung
- **helmet** - Security Headers
- **cors** - Cross-Origin Resource Sharing
- **compression** - Response-Komprimierung
- **dotenv** - Umgebungsvariablen

### Datenbank
- **MySQL/MariaDB** - Relationale Datenbank
- **5 Tabellen:**
  - `users` - Benutzerkonten
  - `messages` - Chat-Nachrichten
  - `friendships` - Freundesliste
  - `blocks` - Blockierte Benutzer
  - `mutes` - Stummgeschaltete Benutzer

---

## 📂 Projektstruktur

```
/home/chat.duomaps.eu/chatapp/
├── index.html              # Landingpage mit Features-Übersicht
├── login.html              # Login-Seite
├── register.html           # Registrierungs-Seite
├── chat.html               # Haupt-Chat-Interface
├── .htaccess               # Apache Proxy-Konfiguration
│
├── css/
│   ├── style.css          # Haupt-Stylesheet (Landing Page, Globale Styles)
│   ├── auth.css           # Login/Register Seiten Styles
│   └── chat.css           # Chat-Interface Styles
│
├── js/
│   ├── main.js            # Kern-Funktionen (API Config, Utils)
│   ├── auth.js            # Login/Register Logik
│   ├── socket-client.js   # Socket.io Client-Handler
│   └── chat.js            # Chat-Funktionalität
│
├── assets/
│   └── (Bilder, Logos, etc.)
│
└── node/js/               # Backend (Node.js)
    ├── app.js             # Haupt-Startdatei
    ├── package.json       # Dependencies
    ├── .env               # Umgebungsvariablen
    │
    ├── config/
    │   └── db.js          # Datenbank-Verbindung
    │
    ├── models/
    │   ├── User.js        # User Model
    │   ├── Message.js     # Message Model
    │   └── Friendship.js  # Friendship/Block/Mute Model
    │
    ├── routes/
    │   ├── auth.js        # Auth Endpoints (Login, Register, Logout)
    │   ├── users.js       # User Endpoints (Search, Friends, Block, Mute)
    │   └── messages.js    # Message Endpoints (Send, History, Edit, Delete)
    │
    ├── middleware/
    │   └── auth.js        # JWT Auth Middleware
    │
    ├── socket/
    │   └── socketHandler.js  # Socket.io Event Handler
    │
    └── utils/
        └── helpers.js     # Helper Functions
```

---

## 🌐 API Endpoints

### Authentifizierung (`/api/auth`)
- `POST /api/auth/register` - Neuen Account erstellen
- `POST /api/auth/login` - Anmelden
- `POST /api/auth/logout` - Abmelden
- `GET /api/auth/me` - Aktuellen Benutzer abrufen
- `DELETE /api/auth/delete-account` - Account löschen

### Benutzer (`/api/users`)
- `GET /api/users/search?q=username` - Benutzer suchen
- `GET /api/users/:id` - Benutzer-Details abrufen
- `POST /api/users/friends/add` - Freund hinzufügen
- `DELETE /api/users/friends/:id` - Freund entfernen
- `GET /api/users/friends/list` - Freundesliste abrufen
- `POST /api/users/block` - Benutzer blockieren
- `DELETE /api/users/block/:id` - Blockierung aufheben
- `GET /api/users/blocked/list` - Blockierte Benutzer
- `POST /api/users/mute` - Benutzer stummschalten
- `DELETE /api/users/mute/:id` - Stummschaltung aufheben
- `GET /api/users/muted/list` - Stummgeschaltete Benutzer

### Nachrichten (`/api/messages`)
- `GET /api/messages/chats` - Alle Chats abrufen
- `GET /api/messages/history/:userId` - Chat-Verlauf mit Benutzer
- `POST /api/messages/send` - Nachricht senden
- `PUT /api/messages/:id` - Nachricht bearbeiten
- `DELETE /api/messages/:id` - Nachricht löschen
- `POST /api/messages/mark-read/:senderId` - Als gelesen markieren
- `GET /api/messages/unread-count` - Ungelesene Nachrichten zählen

### System
- `GET /api/health` - Health Check

---

## 🔌 Socket.io Events

### Client → Server
- `send_message` - Nachricht senden
- `typing_start` - Beginne zu tippen
- `typing_stop` - Höre auf zu tippen
- `mark_as_read` - Nachrichten als gelesen markieren
- `edit_message` - Nachricht bearbeiten
- `delete_message` - Nachricht löschen

### Server → Client
- `receive_message` - Neue Nachricht empfangen
- `message_sent` - Nachricht erfolgreich gesendet
- `user_online` - Benutzer ist online
- `user_offline` - Benutzer ist offline
- `user_typing` - Benutzer tippt
- `user_stopped_typing` - Benutzer hat aufgehört zu tippen
- `messages_read` - Nachrichten wurden gelesen
- `message_edited` - Nachricht wurde bearbeitet
- `message_deleted` - Nachricht wurde gelöscht

---

## 💾 Datenbank-Schema

### Tabelle: `users`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- username (VARCHAR(20), UNIQUE)
- password (VARCHAR(255), bcrypt hash)
- created_at (TIMESTAMP)
- last_online (TIMESTAMP)
- is_online (BOOLEAN)
```

### Tabelle: `messages`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- sender_id (INT, FOREIGN KEY → users.id)
- receiver_id (INT, FOREIGN KEY → users.id)
- content (TEXT)
- created_at (TIMESTAMP)
- is_read (BOOLEAN)
- is_edited (BOOLEAN)
```

### Tabelle: `friendships`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FOREIGN KEY → users.id)
- friend_id (INT, FOREIGN KEY → users.id)
- status (ENUM: 'pending', 'accepted', 'rejected')
- created_at (TIMESTAMP)
```

### Tabelle: `blocks`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FOREIGN KEY → users.id)
- blocked_user_id (INT, FOREIGN KEY → users.id)
- created_at (TIMESTAMP)
```

### Tabelle: `mutes`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FOREIGN KEY → users.id)
- muted_user_id (INT, FOREIGN KEY → users.id)
- created_at (TIMESTAMP)
```

---

## 🎨 Design-System

### Farbpalette
```css
Primary: #2563eb (Blau)
Secondary: #64748b (Grau)
Dark Background: #0f172a (Dunkelblau/Schwarz)
Dark Secondary: #1e293b
Dark Tertiary: #334155
Success: #10b981 (Grün)
Warning: #f59e0b (Orange)
Danger: #ef4444 (Rot)
Info: #3b82f6 (Hellblau)
```

### Typography
- Font Family: System Fonts (-apple-system, Segoe UI, Roboto)
- Base Font Size: 16px
- Responsive & lesbar

---

## 🚀 Deployment

### Server-Umgebung
- **Hosting:** Plesk
- **Domain:** http://chat.duomaps.eu
- **Node.js Version:** 24.10.0
- **Datenbank:** MySQL/MariaDB
- **Web Server:** Apache mit Proxy zu Node.js

### Konfiguration
- Frontend: `/home/chat.duomaps.eu/chatapp/`
- Backend: `/home/chat.duomaps.eu/chatapp/node/js/`
- Node.js Port: 3000 (intern)
- Proxy: Apache/Nginx leitet `/api/*` zu `localhost:3000`

---

## 🔒 Sicherheit

- **Passwörter:** bcrypt mit Salt (10 Rounds)
- **JWT Tokens:** Sichere Session-Verwaltung
- **SQL Injection:** Prepared Statements (mysql2)
- **XSS Protection:** Input-Validierung & Escape
- **CSRF Protection:** Token-basiert
- **Rate Limiting:** Max. 10 Login/Register-Versuche pro 15 Min
- **Helmet.js:** Security Headers

---

## 📱 Browser-Unterstützung

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Browser (iOS Safari, Chrome Mobile)

---

## 🐛 Support & Passwort-Reset

Bei Problemen oder zum Zurücksetzen des Passworts:
- **Discord:** http://dsc.gg/duomaps
- **Website:** https://duomaps.eu

---

## 📄 Lizenz

Dieses Projekt ist **privat** und ausschließlich für das DuoMaps.eu Team bestimmt.

---

## 👨‍💻 Entwickler-Informationen

- **Erstellt für:** DuoMaps.eu Minecraft Server Team
- **Entwicklungsjahr:** 2025
- **Server User:** kbbzsky-web
- **Aktuelle Version:** 1.0.0

---

## 📝 Changelog

### Version 1.0.0 (2025-01-16)
- ✅ Initiales Release
- ✅ Authentifizierungs-System (Login/Register)
- ✅ Echtzeit-Chat mit Socket.io
- ✅ Freunde-System
- ✅ Block & Mute Funktionen
- ✅ Responsive Design
- ✅ Dark Mode Theme
- ✅ Browser-Benachrichtigungen

---

**🎮 Made with ❤️ for the DuoMaps Team**
