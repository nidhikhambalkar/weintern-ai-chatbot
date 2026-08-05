const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "..", "knowledge-base", "docs");
const jsonDir = path.join(__dirname, "..", "knowledge-base", "json");

const chapterAliases = {
  "Chapter-1-Company.md": "company",
  "Chapter-2-Courses.md": "courses",
  "Chapter-3-Benefits.md": "benefits",
  "Chapter-4-Internship.md": "internship",
  "Chapter-5-Certification.md": "certification",
  "Chapter-6-Placement.md": "placement",
  "Chapter-7-Fee.md": "fees",
  "Chapter-8-Support.md": "support",
  "Chapter-9-Policies.md": "policies",
};

const chapterDefinition = {
  company: {
    answer: "WeIntern is an EdTech platform that helps students and freshers build practical industry-ready skills through internship programs, training, mentorship, live projects, and career support.",
    headings: [
      "What is WeIntern",
      "Who is WeIntern",
      "Tell me about WeIntern",
      "What does WeIntern do",
      "Is WeIntern a company or an institute",
      "Is WeIntern genuine",
      "Why should I join WeIntern",
      "What makes WeIntern different",
      "Who can join WeIntern",
      "Is WeIntern suitable for beginners",
      "Can freshers join WeIntern",
    ],
  },
  courses: {
    answer: "WeIntern offers internship-focused courses in Full Stack Development, AI/ML, Data Science, Python, Java, UI/UX, Digital Marketing, Cyber Security, and Cloud Computing.",
    headings: [
      "Which courses are available",
      "Are the courses beginner-friendly",
      "Will I get practical projects",
      "Will the course help my career",
      "Will I receive mentor guidance",
      "Are the course programs industry-focused",
      "Can I build a portfolio through the courses",
      "Which course should I pick",
      "Will I learn by doing",
      "Can I join if I am a beginner",
    ],
  },
  benefits: {
    answer: "Students join WeIntern for live classes, recorded sessions, doubt support, mentor guidance, industry expert exposure, practical learning, assignments, resume support, interview preparation, soft skills, and career guidance.",
    headings: [
      "What are the key benefits",
      "Will I get mentors",
      "Will I get doubt support",
      "Will I get interview preparation",
      "Will I improve soft skills",
      "Will I build a better resume",
      "Will I get live classes",
      "Will I get recorded sessions",
      "Will I get networking support",
      "What is the overall value of the program",
    ],
  },
  internship: {
    answer: "The internship combines real-world projects, daily tasks, team collaboration, onboarding, attendance tracking, performance evaluation, and structured learning on a chosen domain.",
    headings: [
      "What is the internship process",
      "How do I register",
      "How is the selection done",
      "What happens during onboarding",
      "What kind of live projects are there",
      "What are the daily tasks",
      "Is attendance required",
      "How is performance evaluated",
      "How does team collaboration work",
      "What are the internship rules",
    ],
  },
  certification: {
    answer: "Certificate eligibility, completion criteria, and verification depend on completing the required coursework, assignments, and project outcomes as defined by the program.",
    headings: [
      "What certificates are provided",
      "Who is eligible for certificates",
      "What are the completion criteria",
      "How is certification verified",
      "How long is the certificate valid",
      "Can I use it on LinkedIn",
      "Will I get a professional completion certificate",
      "How do I show the certificate on my profile",
      "What does certificate completion mean",
      "How do I verify my certificate",
    ],
  },
  placement: {
    answer: "WeIntern offers placement assistance through support, resume review, mock interviews, job assistance, and career counseling to improve employability.",
    headings: [
      "Does WeIntern provide placement support",
      "What is the placement process",
      "Will I get resume review",
      "Will I get mock interviews",
      "Will I get job assistance",
      "Will I get career counseling",
      "Are there hiring partners",
      "Can I improve my placement chances",
      "How do I prepare for placement support",
      "How do I ask for placement help",
    ],
  },
  fees: {
    answer: "Fees may vary by course and offer cycle. Payment methods, discounts, scholarships, EMI possibilities, and refund terms should be confirmed through official support channels.",
    headings: [
      "What is the fee structure",
      "What are the course-wise fees",
      "Which payment methods are accepted",
      "Is EMI available",
      "Are discounts offered",
      "What is the refund policy",
      "Are scholarships available",
      "Can I ask about fee support",
      "Is the fee refundable",
      "How can I know the latest fee details",
    ],
  },
  support: {
    answer: "Students can reach the support team through helpdesk, WhatsApp, email, technical support, academic support, and the escalation process for unresolved issues.",
    headings: [
      "How do I contact support",
      "Is there WhatsApp support",
      "Can I email support",
      "What are office hours",
      "How does the escalation process work",
      "Will I get technical support",
      "Will I get academic support",
      "Who can help with account issues",
      "How do I raise a complaint",
      "How can I get quick help",
    ],
  },
  policies: {
    answer: "The policies section covers terms and conditions, attendance, code of conduct, privacy, refund, certificate, and placement policies.",
    headings: [
      "What are the terms and conditions",
      "What is the attendance policy",
      "What is the code of conduct",
      "What is the privacy policy",
      "What is the refund policy",
      "What is the certificate policy",
      "What is the placement policy",
      "Where can I read the rules",
      "How do I follow the official policy",
      "What should I check before joining",
    ],
  },
};

function cleanText(text = "") {
  return String(text)
    .replace(/\*\*Answer:\*\*/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFaqsFromMarkdown(content) {
  const items = [];
  const lines = content.split(/\r?\n/);
  let currentQuestion = null;
  let currentAnswer = [];
  let capturingAnswer = false;

  const flush = () => {
    if (currentQuestion && currentAnswer.length) {
      items.push({
        question: cleanText(currentQuestion),
        answer: cleanText(currentAnswer.join(" ")),
      });
    }
    currentQuestion = null;
    currentAnswer = [];
    capturingAnswer = false;
  };

  lines.forEach((line) => {
    const questionMatch = line.match(/^###\s*Q\d+\.\s*(.+)$/i) || line.match(/^Q\d+\.\s*(.+)$/i);
    if (questionMatch) {
      flush();
      currentQuestion = questionMatch[1].trim();
      capturingAnswer = false;
      return;
    }

    if (!currentQuestion) return;

    if (/^\*\*Answer:\*\*/i.test(line)) {
      capturingAnswer = true;
      return;
    }

    if (capturingAnswer) {
      if (/^---$/.test(line.trim())) {
        flush();
        return;
      }
      currentAnswer.push(line.trim());
    }
  });

  flush();
  return items;
}

function createFaqEntry(question, answer) {
  return {
    question: cleanText(question),
    answer: cleanText(answer),
  };
}

function readExistingEntries(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    if (!content.trim()) {
      return [];
    }

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function generateVariants(topic, heading, answer) {
  const headingText = heading.trim();
  const normalizedHeading = headingText.toLowerCase();
  const betterQuestion = headingText.startsWith("Who is ")
    ? headingText.replace(/^Who is /i, "Who is ")
    : headingText;

  const mainFaqs = [
    createFaqEntry(`${headingText}?`, answer),
    createFaqEntry(`Can you explain ${normalizedHeading}?`, answer),
    createFaqEntry(`How does ${normalizedHeading} work?`, answer),
    createFaqEntry(`I want to know about ${normalizedHeading}.`, answer),
    createFaqEntry(`Kya ${normalizedHeading} ke baare me jaana chahiye?`, answer),
    createFaqEntry(`${normalizedHeading} ko Hindi me samjhao.`, answer),
    createFaqEntry(`क्या ${normalizedHeading} के बारे में बताओ?`, answer),
    createFaqEntry(`${normalizedHeading} कैसे काम करता है?`, answer),
    createFaqEntry(`${betterQuestion}?`, answer),
  ];

  return mainFaqs;
}

function buildPayloadFromDocs() {
  const payload = {};
  const chapterFiles = fs.readdirSync(docsDir).filter((file) => file.startsWith("Chapter-") && file.endsWith(".md"));

  chapterFiles.forEach((fileName) => {
    const docContent = fs.readFileSync(path.join(docsDir, fileName), "utf8");
    const extractedFaqs = extractFaqsFromMarkdown(docContent);
    const chapterKey = chapterAliases[fileName] || fileName.replace(/\.md$/, "");
    const chapter = chapterDefinition[chapterKey] || { answer: "WeIntern provides internship and career support.", headings: [] };

    const generatedFaqs = [];
    chapter.headings.forEach((heading) => {
      generatedFaqs.push(...generateVariants(chapterKey, heading, chapter.answer));
    });

    payload[chapterKey] = [...extractedFaqs, ...generatedFaqs];
  });

  return payload;
}

function dedupeFaqs(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.question.toLowerCase()}::${item.answer.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mergeExistingEntries(fileName, generatedItems) {
  const filePath = path.join(jsonDir, fileName);
  const existingItems = readExistingEntries(filePath);
  const merged = dedupeFaqs([...(existingItems || []), ...generatedItems]);
  return merged;
}

function writeJsonFiles(payload) {
  fs.mkdirSync(jsonDir, { recursive: true });
  Object.entries(payload).forEach(([key, items]) => {
    const deduped = dedupeFaqs(items);
    const merged = mergeExistingEntries(`${key}.json`, deduped);
    const outPath = path.join(jsonDir, `${key}.json`);
    fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
  });
}

writeJsonFiles(buildPayloadFromDocs());
console.log("Expanded multilingual FAQ knowledge base regenerated from chapter docs without losing existing entries.");
