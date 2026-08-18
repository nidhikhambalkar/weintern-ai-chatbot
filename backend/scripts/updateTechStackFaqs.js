const fs = require('fs');
const path = require('path');

const domainsPath = path.join(__dirname, '..', 'knowledge-base', 'json', 'domains.json');
const domainsData = JSON.parse(fs.readFileSync(domainsPath, 'utf8'));

const TECH_FAQS = [
  // 1. Full Stack Web Development
  {
    category: "domains",
    question: "What technologies are used in Full Stack Web Development?",
    answer: "The Full Stack Web Development program covers HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Git, GitHub, and web deployment tools. You build 4 real-world projects including e-commerce platforms and SaaS dashboards."
  },
  {
    category: "domains",
    question: "What tools are used in Full Stack Web Development?",
    answer: "The Full Stack Web Development program covers HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Git, GitHub, and web deployment tools. You build 4 real-world projects including e-commerce platforms and SaaS dashboards."
  },
  {
    category: "domains",
    question: "Full Stack Web Development tech stack",
    answer: "The Full Stack Web Development program covers HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Git, GitHub, and web deployment tools. You build 4 real-world projects including e-commerce platforms and SaaS dashboards."
  },
  {
    category: "domains",
    question: "full stack technologies",
    answer: "The Full Stack Web Development program covers HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Git, GitHub, and web deployment tools. You build 4 real-world projects including e-commerce platforms and SaaS dashboards."
  },
  {
    category: "domains",
    question: "Full Stack mein kya technologies sikhate ho?",
    answer: "The Full Stack Web Development program covers HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Git, GitHub, and web deployment tools. You build 4 real-world projects including e-commerce platforms and SaaS dashboards."
  },

  // 2. Mobile App Development
  {
    category: "domains",
    question: "What technologies are used in Mobile App Development?",
    answer: "The Mobile App Development program covers Flutter, Dart, Firebase, REST APIs, State Management, and Android & iOS App Store deployment. You build 3 real client mobile applications."
  },
  {
    category: "domains",
    question: "What tools are used in Mobile App Development?",
    answer: "The Mobile App Development program covers Flutter, Dart, Firebase, REST APIs, State Management, and Android & iOS App Store deployment. You build 3 real client mobile applications."
  },
  {
    category: "domains",
    question: "Mobile App Development tech stack",
    answer: "The Mobile App Development program covers Flutter, Dart, Firebase, REST APIs, State Management, and Android & iOS App Store deployment. You build 3 real client mobile applications."
  },
  {
    category: "domains",
    question: "mobile app ka tech stack?",
    answer: "The Mobile App Development program covers Flutter, Dart, Firebase, REST APIs, State Management, and Android & iOS App Store deployment. You build 3 real client mobile applications."
  },

  // 3. AI & Automation
  {
    category: "domains",
    question: "What technologies are used in AI & Automation?",
    answer: "The AI & Automation program covers Python, OpenAI API, LangChain, n8n, Make.com, Pinecone vector database, and FastAPI. You build 3 real AI projects including AI chatbots and workflow automation pipelines."
  },
  {
    category: "domains",
    question: "What tools are used in AI & Automation?",
    answer: "The AI & Automation program covers Python, OpenAI API, LangChain, n8n, Make.com, Pinecone vector database, and FastAPI. You build 3 real AI projects including AI chatbots and workflow automation pipelines."
  },
  {
    category: "domains",
    question: "AI & Automation tech stack",
    answer: "The AI & Automation program covers Python, OpenAI API, LangChain, n8n, Make.com, Pinecone vector database, and FastAPI. You build 3 real AI projects including AI chatbots and workflow automation pipelines."
  },
  {
    category: "domains",
    question: "ai automation technologies",
    answer: "The AI & Automation program covers Python, OpenAI API, LangChain, n8n, Make.com, Pinecone vector database, and FastAPI. You build 3 real AI projects including AI chatbots and workflow automation pipelines."
  },

  // 4. Data Science & Analytics
  {
    category: "domains",
    question: "What technologies are used in Data Science & Analytics?",
    answer: "The Data Science & Analytics program covers Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, Tableau, and SQL. You build 3 real data projects including analytics dashboards and predictive machine learning models."
  },
  {
    category: "domains",
    question: "What tools are used in Data Science & Analytics?",
    answer: "The Data Science & Analytics program covers Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, Tableau, and SQL. You build 3 real data projects including analytics dashboards and predictive machine learning models."
  },
  {
    category: "domains",
    question: "Data Science & Analytics tech stack",
    answer: "The Data Science & Analytics program covers Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, Tableau, and SQL. You build 3 real data projects including analytics dashboards and predictive machine learning models."
  },
  {
    category: "domains",
    question: "data science tech stack?",
    answer: "The Data Science & Analytics program covers Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, Tableau, and SQL. You build 3 real data projects including analytics dashboards and predictive machine learning models."
  },
  {
    category: "domains",
    question: "data science technologies",
    answer: "The Data Science & Analytics program covers Python, Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn, Tableau, and SQL. You build 3 real data projects including analytics dashboards and predictive machine learning models."
  },

  // 5. Python Programming
  {
    category: "domains",
    question: "What technologies are used in Python Programming?",
    answer: "The Python Programming program covers Python core syntax, Object-Oriented Programming (OOP), file handling, automation scripts, REST API integration, and project development."
  },
  {
    category: "domains",
    question: "What tools are used in Python Programming?",
    answer: "The Python Programming program covers Python core syntax, Object-Oriented Programming (OOP), file handling, automation scripts, REST API integration, and project development."
  },
  {
    category: "domains",
    question: "Python Programming tech stack",
    answer: "The Python Programming program covers Python core syntax, Object-Oriented Programming (OOP), file handling, automation scripts, REST API integration, and project development."
  },
  {
    category: "domains",
    question: "python mein kya use hota hai?",
    answer: "The Python Programming program covers Python core syntax, Object-Oriented Programming (OOP), file handling, automation scripts, REST API integration, and project development."
  },

  // 6. Java Programming
  {
    category: "domains",
    question: "What technologies are used in Java Programming?",
    answer: "The Java Programming program covers Core Java, Object-Oriented Programming (OOP) principles, Java Collections Framework, JDBC, multithreading, and desktop/web application development."
  },
  {
    category: "domains",
    question: "What tools are used in Java Programming?",
    answer: "The Java Programming program covers Core Java, Object-Oriented Programming (OOP) principles, Java Collections Framework, JDBC, multithreading, and desktop/web application development."
  },
  {
    category: "domains",
    question: "Java Programming tech stack",
    answer: "The Java Programming program covers Core Java, Object-Oriented Programming (OOP) principles, Java Collections Framework, JDBC, multithreading, and desktop/web application development."
  },

  // 7. C/C++ Programming
  {
    category: "domains",
    question: "What technologies are used in C/C++ Programming?",
    answer: "The C/C++ Programming program covers C fundamentals, Object-Oriented Programming in C++, Data Structures & Algorithms (DSA), memory management, and system programming projects."
  },
  {
    category: "domains",
    question: "What tools are used in C/C++ Programming?",
    answer: "The C/C++ Programming program covers C fundamentals, Object-Oriented Programming in C++, Data Structures & Algorithms (DSA), memory management, and system programming projects."
  },
  {
    category: "domains",
    question: "C/C++ Programming tech stack",
    answer: "The C/C++ Programming program covers C fundamentals, Object-Oriented Programming in C++, Data Structures & Algorithms (DSA), memory management, and system programming projects."
  },

  // 8. Cloud Computing & DevOps
  {
    category: "domains",
    question: "What technologies are used in Cloud Computing & DevOps?",
    answer: "The Cloud Computing & DevOps program covers AWS Cloud Services (EC2, S3, IAM, VPC), Git, Docker, Kubernetes, Jenkins, Terraform, Ansible, and CI/CD automation pipelines."
  },
  {
    category: "domains",
    question: "What tools are used in Cloud Computing & DevOps?",
    answer: "The Cloud Computing & DevOps program covers AWS Cloud Services (EC2, S3, IAM, VPC), Git, Docker, Kubernetes, Jenkins, Terraform, Ansible, and CI/CD automation pipelines."
  },
  {
    category: "domains",
    question: "Cloud Computing & DevOps tech stack",
    answer: "The Cloud Computing & DevOps program covers AWS Cloud Services (EC2, S3, IAM, VPC), Git, Docker, Kubernetes, Jenkins, Terraform, Ansible, and CI/CD automation pipelines."
  },
  {
    category: "domains",
    question: "cloud mein kya technologies hain?",
    answer: "The Cloud Computing & DevOps program covers AWS Cloud Services (EC2, S3, IAM, VPC), Git, Docker, Kubernetes, Jenkins, Terraform, Ansible, and CI/CD automation pipelines."
  },

  // 9. UI/UX Design
  {
    category: "domains",
    question: "What technologies are used in UI/UX Design?",
    answer: "The UI/UX Design program covers Figma, Adobe XD, FigJam, design thinking, wireframing, interactive prototyping, and design systems. You build 3 real web and mobile design projects."
  },
  {
    category: "domains",
    question: "What tools are used in UI/UX Design?",
    answer: "The UI/UX Design program covers Figma, Adobe XD, FigJam, design thinking, wireframing, interactive prototyping, and design systems. You build 3 real web and mobile design projects."
  },
  {
    category: "domains",
    question: "UI/UX Design tech stack",
    answer: "The UI/UX Design program covers Figma, Adobe XD, FigJam, design thinking, wireframing, interactive prototyping, and design systems. You build 3 real web and mobile design projects."
  },
  {
    category: "domains",
    question: "ui ux technologies",
    answer: "The UI/UX Design program covers Figma, Adobe XD, FigJam, design thinking, wireframing, interactive prototyping, and design systems. You build 3 real web and mobile design projects."
  },
  {
    category: "domains",
    question: "what tools in ui ux?",
    answer: "The UI/UX Design program covers Figma, Adobe XD, FigJam, design thinking, wireframing, interactive prototyping, and design systems. You build 3 real web and mobile design projects."
  },
  {
    category: "domains",
    question: "ui ux mein kya sikhoge?",
    answer: "The UI/UX Design program covers Figma, Adobe XD, FigJam, design thinking, wireframing, interactive prototyping, and design systems. You build 3 real web and mobile design projects."
  },

  // 10. Digital Marketing & SEO
  {
    category: "domains",
    question: "What technologies are used in Digital Marketing & SEO?",
    answer: "The Digital Marketing & SEO program covers Google Ads, Meta Ads (Facebook & Instagram), Search Engine Optimization (SEO - On-Page, Technical, Local), Content Marketing, Canva, Mailchimp, and Google Analytics."
  },
  {
    category: "domains",
    question: "What tools are used in Digital Marketing & SEO?",
    answer: "The Digital Marketing & SEO program covers Google Ads, Meta Ads (Facebook & Instagram), Search Engine Optimization (SEO - On-Page, Technical, Local), Content Marketing, Canva, Mailchimp, and Google Analytics."
  },
  {
    category: "domains",
    question: "Digital Marketing & SEO tech stack",
    answer: "The Digital Marketing & SEO program covers Google Ads, Meta Ads (Facebook & Instagram), Search Engine Optimization (SEO - On-Page, Technical, Local), Content Marketing, Canva, Mailchimp, and Google Analytics."
  },
  {
    category: "domains",
    question: "marketing tools?",
    answer: "The Digital Marketing & SEO program covers Google Ads, Meta Ads (Facebook & Instagram), Search Engine Optimization (SEO - On-Page, Technical, Local), Content Marketing, Canva, Mailchimp, and Google Analytics."
  }
];

const existingQs = new Set(domainsData.map(d => d.question.toLowerCase().trim()));
let updatedCount = 0;
let addedCount = 0;

TECH_FAQS.forEach(faq => {
  const qNorm = faq.question.toLowerCase().trim();
  const existingItem = domainsData.find(d => d.question.toLowerCase().trim() === qNorm);
  if (existingItem) {
    if (existingItem.answer !== faq.answer) {
      existingItem.answer = faq.answer;
      updatedCount++;
    }
  } else {
    domainsData.push(faq);
    existingQs.add(qNorm);
    addedCount++;
  }
});

fs.writeFileSync(domainsPath, JSON.stringify(domainsData, null, 2), 'utf8');

console.log('====================================================');
console.log('       TECH STACK FAQS JSON UPDATE COMPLETE         ');
console.log('====================================================');
console.log(`- Updated Existing FAQs: ${updatedCount}`);
console.log(`- Added New Tech FAQs:   ${addedCount}`);
console.log(`- Total Entries in domains.json: ${domainsData.length}`);
console.log('====================================================');
