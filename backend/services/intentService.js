function detectIntent(message = "") {
  const text = String(message).toLowerCase().trim();

  // Greeting
  const greetings = [
    "hi",
    "hello",
    "hey",
    "hii",
    "hlo",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
    "namaskar",
  ];

  if (greetings.some((greeting) => text === greeting || text.startsWith(greeting + " "))) {
    return {
      type: "greeting",
      response:
        "Hello! 👋 Welcome to WeIntern. How can I help you today? You can ask me about internships, courses, fees, placements, certificates, eligibility, or any WeIntern program.",
    };
  }

  // WeIntern-related keywords
  const weinternKeywords = [
    "weintern",
    "internship",
    "course",
    "courses",
    "program",
    "training",
    "mentor",
    "certificate",
    "certification",
    "placement",
    "resume",
    "interview",
    "fees",
    "fee",
    "emi",
    "payment",
    "refund",
    "domain",
    "full stack",
    "fullstack",
    "python",
    "java",
    "ai",
    "ml",
    "data science",
    "ui ux",
    "ui/ux",
    "digital marketing",
    "cyber security",
    "cloud",
    "orientation",
    "google meet",
    "support",
    "contact",
    "eligibility",
    "register",
    "registration",
    "apply",
    "join",
    "live project",
    "project",
    "intern",
    "interns",
    "interning",

  // Internship
  "internship",
  "intern",
  "program",
  "training",
  "live project",
  "project",
  "projects",
  "task",
  "assignment",

  // Courses
  "course",
  "courses",
  "domain",
  "domains",
  "full stack",
  "fullstack",
  "web development",
  "python",
  "java",
  "ai",
  "machine learning",
  "ml",
  "data science",
  "ui ux",
  "ui/ux",
  "digital marketing",
  "cyber security",
  "cloud computing",

  // Fees
  "fee",
  "fees",
  "payment",
  "pay",
  "emi",
  "discount",
  "refund",
  "scholarship",

  // Placement
  "placement",
  "resume",
  "interview",
  "mock interview",
  "linkedin",
  "certificate",
  "certification",

  // Support
  "mentor",
  "support",
  "contact",
  "email",
  "whatsapp",
  "orientation",
  "google meet",

  // Registration
  "register",
  "registration",
  "enroll",
  "apply",
  "joining",

  // Eligibility
  "eligible",
  "eligibility",
  "fresher",
  "beginner",
  "student",

  // Duration
  "duration",
  "month",
  "months",
  "3 month",
  "6 month",
];

  const isWeIntern = weinternKeywords.some((keyword) =>
    text.includes(keyword)
  );

  if (isWeIntern) {
    return {
      type: "weintern",
    };
  }

  // Out of domain
  return {
    type: "out-of-domain",
    response:
      "I'm the WeIntern Assistant. I can answer questions only about WeIntern internships, courses, fees, certifications, placements, mentor support, and related topics.",
  };
}

module.exports = {
  detectIntent,
};