const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRoutes = require("./routes/chatRoutes");
const dbRoutes = require("./routes/dbRoutes");
const { initDatabase, getIsPgConnected } = require("./database/db");
const { pingOllama } = require("./services/ollamaService");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api", dbRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'WeIntern AI Chatbot Backend Server',
    db_status: getIsPgConnected() ? 'PostgreSQL' : 'In-Memory Fallback',
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.send("WeIntern AI Chatbot Backend is Running 🚀");
});

app.get('/api/ollama/test', async (req, res) => {
  try {
    const result = await pingOllama();
    if (result.ok) return res.json({ success: true, model: result.model });
    return res.status(503).json({ success: false, error: result.error });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();