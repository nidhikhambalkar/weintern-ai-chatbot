const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { initDatabase, getCollection, getIsDbConnected, mongoose } = require("../database/db");

const KB_DIR = path.join(__dirname, "..", "knowledge-base", "json");

async function seedMongoKnowledgeBase() {
  console.log("🌱 [Seed] Starting MongoDB Knowledge Base Sync...");

  if (!getIsDbConnected()) {
    await initDatabase();
  }

  if (!getIsDbConnected() || !mongoose.connection.db) {
    console.error("❌ [Seed] Cannot sync KB to MongoDB: Database connection is offline.");
    return { success: false, error: "Database offline" };
  }

  const collection = getCollection("faqs");
  if (!collection) {
    console.error("❌ [Seed] Failed to access 'faqs' collection.");
    return { success: false, error: "Collection uninitialized" };
  }

  // Ensure index on category and question for fast lookups
  try {
    await collection.createIndex({ category: 1, question: 1 }, { unique: true });
  } catch (idxErr) {
    // Index might exist or have minor conflict, continue gracefully
  }

  const files = fs.existsSync(KB_DIR)
    ? fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".json"))
    : [];

  let totalProcessed = 0;
  let totalUpserted = 0;
  const bulkOperations = [];

  for (const fileName of files) {
    const filePath = path.join(KB_DIR, fileName);
    const categoryName = fileName.replace(/\.json$/, "");
    try {
      const rawContent = fs.readFileSync(filePath, "utf8");
      if (!rawContent.trim()) continue;

      const parsed = JSON.parse(rawContent);
      const entries = Array.isArray(parsed) ? parsed : (parsed.entries || []);

      entries.forEach((entry) => {
        const question = (entry.question || entry.title || "").trim();
        const answer = (entry.answer || entry.description || "").trim();
        if (!question || !answer) return;

        totalProcessed++;

        bulkOperations.push({
          updateOne: {
            filter: { category: categoryName, question: question },
            update: {
              $set: {
                category: categoryName,
                question: question,
                answer: answer,
                keywords: entry.keywords || entry.tags || [],
                source_file: fileName,
                updated_at: new Date(),
              },
            },
            upsert: true,
          },
        });
      });
    } catch (fileErr) {
      console.warn(`⚠️ [Seed] Warning reading ${fileName}:`, fileErr.message);
    }
  }

  if (bulkOperations.length > 0) {
    const result = await collection.bulkWrite(bulkOperations, { ordered: false });
    totalUpserted = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    console.log(`✅ [Seed] Knowledge Base Sync Complete!`);
    console.log(`📊 [Stats] Processed ${totalProcessed} FAQs across ${files.length} categories.`);
    console.log(`💾 [MongoDB] Upserted/Updated ${totalUpserted} records in 'faqs' collection.`);
  } else {
    console.log("ℹ️ [Seed] No FAQ entries found to process.");
  }

  return {
    success: true,
    totalProcessed,
    totalUpserted,
    categoriesCount: files.length,
  };
}

if (require.main === module) {
  seedMongoKnowledgeBase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ [Seed Error]:", err);
      process.exit(1);
    });
}

module.exports = { seedMongoKnowledgeBase };
