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

// GET / and GET /faq - return all FAQ entries from MongoDB or KB JSON fallback across all categories
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

  const allFaqs = [];
  const files = fs.existsSync(KB_DIR)
    ? fs.readdirSync(KB_DIR).filter((file) => file.endsWith(".json"))
    : [];

  files.forEach((fileName) => {
    const category = fileName.replace(/\.json$/, "");
    const filePath = path.join(KB_DIR, fileName);
    const entries = safeReadJson(filePath);
    entries.forEach((entry) => {
      allFaqs.push({
        category: entry.category || category,
        question: entry.question || entry.title || "",
        answer: entry.answer || entry.description || "",
      });
    });
  });

  res.json({ success: true, source: "file", count: allFaqs.length, data: allFaqs });
});

module.exports = router;

