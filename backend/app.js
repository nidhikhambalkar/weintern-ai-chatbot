const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRoutes = require("./routes/chatRoutes");
const { pingOllama } = require("./services/ollamaService");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});