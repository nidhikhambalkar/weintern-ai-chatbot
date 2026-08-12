const express = require("express");
const router = express.Router();

const faqData = require("../knowledge-base/json/faq.json");

router.get("/", (req, res) => {
  res.json({
    success: true,
    count: faqData.length,
    data: faqData,
  });
});

module.exports = router;