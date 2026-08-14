# WeIntern AI Chatbot - Database & Backend APIs (MongoDB Version)

Welcome! This folder contains the backend database and API code built for the **WeIntern AI Chatbot**.
It has been designed with a **simple, beginner-friendly layout** using **MongoDB & Mongoose**.

---

## 📁 File Overview

| File Name | Purpose & Why It Exists |
| :--- | :--- |
| **`db.js`** | Connects our Node.js app to MongoDB using Mongoose. Includes in-memory fallback for testing without MongoDB running. |
| **`server.js`** | The main Express web server containing all API routes (`/api/leads`, `/api/history`, `/api/escalate`, `/api/admin/*`). |
| **`.env.example`** | Environment configuration template containing `MONGODB_URI`. |
| **`package.json`** | Lists required Node.js packages (`express`, `mongodb`, `mongoose`, `cors`, `dotenv`). |
| **`test_api.js`** | 1-click test script to test all backend API endpoints. |

---

## 🚀 How to Run the Server

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the backend server**:
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

3. **Run automated API tests** (in another terminal):
   ```bash
   node test_api.js
   ```
