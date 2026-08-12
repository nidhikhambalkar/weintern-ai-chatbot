const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Secure environment check
if (!process.env.OLLAMA_HOST) {
  console.warn("⚠️ [Security] OLLAMA_HOST is not set in .env! Defaulting to http://localhost:11434");
}

const chatRoutes = require("./routes/chatRoutes");
const dbRoutes = require("./routes/dbRoutes");
const { initDatabase, getIsPgConnected } = require("./database/db");
const { pingOllama } = require("./services/ollamaService");
const faqRoutes = require("./routes/faqRoutes");
const app = express();

// Custom in-memory sliding window rate limiter
const rateLimits = new Map();
const rateLimiter = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60; // Max 60 requests per minute

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }

  const timestamps = rateLimits.get(ip).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please slow down and try again in a minute."
    });
  }

  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  next();
};

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes (Apply rate limiting globally)
app.use(rateLimiter);
app.use("/api/chat", chatRoutes);
app.use("/api", dbRoutes);
app.use("/api/faq", faqRoutes);

app.get("/health", async (req, res) => {
  let dbStatus = "UNKNOWN";
  let dbError = null;
  try {
    const { pool, getIsPgConnected } = require("./database/db");
    if (pool && getIsPgConnected()) {
      const result = await pool.query("SELECT NOW()");
      dbStatus = result.rows.length > 0 ? "CONNECTED" : "UNHEALTHY";
    } else {
      dbStatus = "IN_MEMORY_FALLBACK";
    }
  } catch (err) {
    dbStatus = "DISCONNECTED";
    dbError = err.message;
  }

  let ollamaStatus = "UNKNOWN";
  try {
    const ping = await pingOllama();
    ollamaStatus = ping.ok ? "CONNECTED" : "OFFLINE";
  } catch (err) {
    ollamaStatus = "ERROR";
  }

  res.status(200).json({
    status: "online",
    service: "WeIntern AI Chatbot Backend Server",
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      error: dbError
    },
    ollama: {
      status: ollamaStatus
    },
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

// Production Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ [Error] Unexpected request error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === "production" 
      ? "An unexpected internal server error occurred."
      : err.message || String(err)
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
