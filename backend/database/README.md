# WeIntern AI Chatbot - Database & Backend APIs (Backend Intern 2 / 4th Intern)

Welcome! This folder contains the backend database and API code built for the **WeIntern AI Chatbot**.
It has been designed with a **simple, beginner-friendly layout** so that anyone can read and understand how databases and APIs work.

---

## 📁 Why We Created Each File (File Overview)

Here is a simple explanation of every file in this folder and why it exists:

| File Name | Purpose & Why It Exists |
| :--- | :--- |
| **`schema.sql`** | Defines the structure (tables and columns) of our PostgreSQL database. Think of this like the blueprint for a spreadsheet where our data is saved. |
| **`db.js`** | Connects our Node.js app to PostgreSQL. It also has a fallback mode so the app works even if PostgreSQL is not installed locally on your machine. |
| **`server.js`** | The main Express web server. It contains all API routes (`/api/leads`, `/api/history`, `/api/escalate`, `/api/admin/*`) with detailed explanations for every line. |
| **`.env.example`** | A template showing the configuration settings (like DB host, username, password, port) needed to run the project. |
| **`package.json`** | Lists the required Node.js libraries (`express`, `pg`, `cors`, `dotenv`) needed to run this project. |
| **`test_api.js`** | A 1-click test script that automatically tests all 8 backend API endpoints to prove that everything works! |

---

## 🚀 How to Run the Server

1. **Install dependencies** (if not done already):
   ```bash
   npm install
   ```

2. **Start the backend server**:
   ```bash
   node server.js
   ```

3. **Run the automated test script** (in another terminal):
   ```bash
   node test_api.js
   ```
