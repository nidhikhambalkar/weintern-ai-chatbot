const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getCollection, getIsDbConnected } = require("../database/db");

// Knowledge base JSON directory
const KB_DIR = path.join(__dirname, "..", "knowledge-base", "json");

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return [];

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.entries)) return parsed.entries;
    return [];
  } catch (error) {
    console.error("Failed to read FAQ JSON:", error);
    return [];
  }
}

// GET / and GET /faq - return FAQ entries from MongoDB or KB JSON fallback
router.get(["/", "/faq"], async (req, res) => {
  try {
    if (getIsDbConnected()) {
      const collection = getCollection("faqs");
      if (collection) {
        const mongoFaqs = await collection.find({}).sort({ category: 1 }).toArray();
        if (mongoFaqs && mongoFaqs.length > 0) {
          return res.json({ success: true, source: "mongodb", count: mongoFaqs.length, data: mongoFaqs });
        }
      }
    }
  } catch (dbErr) {
    console.warn("⚠️ [FAQ Route] MongoDB query error, falling back to JSON:", dbErr.message);
  }

  const faqPath = path.join(KB_DIR, "faq.json");
  const entries = safeReadJson(faqPath);
  res.json({ success: true, source: "file", count: entries.length, data: entries });
});

module.exports = router;

