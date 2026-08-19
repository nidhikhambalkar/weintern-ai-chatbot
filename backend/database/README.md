# WeIntern AI Chatbot - Database & Backend APIs (Dual-Persistence Architecture)

Welcome! This folder contains the backend database and API code built for the **WeIntern AI Chatbot**.
It features a **Dual-Persistence Architecture** using **MongoDB (Mongoose)** alongside a persistent local storage engine (**`db_storage.json`**).

---

## 📁 File Overview

| File Name | Purpose & Why It Exists |
| :--- | :--- |
| **`db.js`** | Database Manager. Connects to MongoDB via Mongoose and maintains automatic local file persistence (`db_storage.json`). Dual-persists write operations and provides unified fallback collection handlers so no data is ever lost. |
| **`server.js`** | Express web server providing database API endpoints (`/api/leads`, `/api/history`, `/api/sessions`, `/api/escalate`, `/api/admin/*`). Features non-blocking server startup. |
| **`schema.sql`** | SQL table definitions for PostgreSQL setups (`sessions`, `messages`, `leads`, `escalations`, `users`, `faqs`). |
| **`db_storage.json`** | Auto-generated persistent disk storage file for local database backup and offline fallback. |
| **`package.json`** | Lists required dependencies (`express`, `mongodb`, `mongoose`, `cors`, `dotenv`). |
| **`test_api.js`** | Automated API test script verifying all backend database routes. |

---

## 🚀 Dual Persistence & Reliability Features

1. **MongoDB Mode**: When MongoDB is connected, data is stored in MongoDB collections AND synced into `db_storage.json`.
2. **Local Persistent Mode**: If MongoDB is unavailable, data is saved directly to `db_storage.json` on disk using array proxy mutation interceptors. Data persists across server reboots.
3. **Automatic Re-syncing**: Upon MongoDB connection, any locally accumulated records are automatically synced to MongoDB collections.

---

## 🛠️ How to Run the Database Server

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the backend database server**:
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

3. **Run automated API tests** (in another terminal):
   ```bash
   node test_api.js
   ```
