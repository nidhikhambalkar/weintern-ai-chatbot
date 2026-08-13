const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

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

// GET / and GET /faq - return FAQ entries from the KB
router.get(["/", "/faq"], (req, res) => {
  const faqPath = path.join(KB_DIR, "faq.json");
  const entries = safeReadJson(faqPath);
  res.json({ success: true, count: entries.length, data: entries });
});

module.exports = router;
