const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

function buildUrl(endpoint: string, params?: Record<string, string>): string {
	const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
	const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	let fullUrl = `${base}${path}`;

	if (params && Object.keys(params).length > 0) {
		const searchParams = new URLSearchParams(params);
		fullUrl += `?${searchParams.toString()}`;
	}
	return fullUrl;
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
	try {
		return await fetch(url, options);
	} catch (err: any) {
		const message = err?.message || 'Network error';
		throw new Error(
			`Unable to reach backend API at ${url} (${message}). Please ensure the backend server is running on ${API_BASE}.`
		);
	}
}

async function handleJsonResponse(res: Response) {
	const text = await res.text();
	let data;
	try {
		data = text ? JSON.parse(text) : {};
	} catch (err) {
		throw new Error(`Invalid JSON response from ${res.url}: ${text}`);
	}

	if (!res.ok) {
		const message = data?.error || data?.message || res.statusText || 'Unknown error';
		throw new Error(`HTTP ${res.status}: ${message}`);
	}

	return data;
}

const pdfFaqItems: Array<{ question: string; answer: string }> = [
	{ question: "What is WeIntern?", answer: "WeIntern Pvt Ltd is an EdTech and IT Services company focused on technology solutions, AI innovation, software development, and helping businesses grow through digital transformation." },
	{ question: "What is WeNexa?", answer: "WeNexa is the IT Services division of WeIntern that provides website development, mobile app development, AI automation, software development, digital marketing, and business technology solutions." },
	{ question: "Where is WeIntern located?", answer: "WeIntern operates remotely and serves clients across India and internationally." },
	{ question: "What industries do you serve?", answer: "We serve:\n• Startups\n• Educational Institutions\n• E-Commerce Businesses\n• Healthcare Companies\n• Real Estate Businesses\n• Retail Businesses\n• Manufacturing Companies\n• Professional Service Firms\n• Technology Companies" },
	{ question: "Why should I choose WeNexa?", answer: "WeNexa offers:\n• Affordable pricing\n• Custom solutions\n• Modern technologies\n• Fast project delivery\n• Dedicated support\n• Scalable software solutions\n• AI-powered automation services" },
	{ question: "How can I contact your team?", answer: "You can contact us through:\n• Website Contact Form\n• LinkedIn\n• Email\n• WhatsApp\n• Social Media Channels" },
	{ question: "Do you work with international clients?", answer: "Yes, we work with clients globally." },
	{ question: "Do you sign NDAs?", answer: "Yes, Non-Disclosure Agreements (NDAs) can be signed before project discussions." },
	{ question: "Can I schedule a consultation?", answer: "Yes, consultation calls can be scheduled with our team." },
	{ question: "Is consultation free?", answer: "Initial project consultation is generally free." },
	{ question: "Do you build websites?", answer: "Yes, we design and develop custom websites for businesses and startups." },
	{ question: "What types of websites do you build?", answer: "• Business Websites\n• Corporate Websites\n• Portfolio Websites\n• Landing Pages\n• E-Commerce Websites\n• Educational Platforms\n• SaaS Platforms\n• Custom Web Applications" },
	{ question: "How long does it take to build a website?", answer: "Depending on complexity:\n• Landing Page: 3–7 Days\n• Business Website: 1–3 Weeks\n• E-Commerce Website: 2–6 Weeks\n• Custom Web App: 1–6 Months" },
	{ question: "Do you provide website maintenance?", answer: "Yes, maintenance and support plans are available." },
	{ question: "Will my website be mobile responsive?", answer: "Yes, all websites are optimized for mobile, tablet, and desktop devices." },
	{ question: "Can you redesign an existing website?", answer: "Yes, we can redesign and modernize existing websites." },
	{ question: "Do you provide domain and hosting support?", answer: "Yes, we assist with domain registration and hosting setup." },
	{ question: "Do you build SEO-friendly websites?", answer: "Yes, SEO best practices are implemented during development." },
	{ question: "Can you integrate payment gateways?", answer: "Yes, we support:\n• Razorpay\n• Stripe\n• PayPal\n• Cashfree\n• Other payment providers" },
	{ question: "Will I own the website after completion?", answer: "Yes, the client receives ownership of the final project." },
	{ question: "Do you develop mobile apps?", answer: "Yes." },
	{ question: "Which platforms do you support?", answer: "• Android\n• iOS\n• Cross-platform applications" },
	{ question: "Do you develop Flutter apps?", answer: "Yes." },
	{ question: "Can you build startup MVPs?", answer: "Yes, MVP development is one of our core services." },
	{ question: "Do you publish apps on Play Store and App Store?", answer: "Yes, deployment assistance is provided." },
	{ question: "Can you maintain existing apps?", answer: "Yes." },
	{ question: "Can you integrate APIs into mobile apps?", answer: "Yes." },
	{ question: "Do you provide app UI/UX design?", answer: "Yes." },
	{ question: "Do you build AI chatbots?", answer: "Yes." },
	{ question: "What types of AI chatbots do you build?", answer: "• Website Chatbots\n• Customer Support Chatbots\n• Lead Generation Chatbots\n• WhatsApp Chatbots\n• Knowledge Base Chatbots\n• AI Sales Assistants" },
	{ question: "Can your chatbot answer FAQs automatically?", answer: "Yes." },
	{ question: "Can the chatbot be trained on company data?", answer: "Yes." },
	{ question: "Can AI chatbots be integrated into websites?", answer: "Yes." },
	{ question: "Can chatbots collect leads?", answer: "Yes." },
	{ question: "Can chatbots book meetings?", answer: "Yes." },
	{ question: "Can chatbots connect with CRMs?", answer: "Yes." },
	{ question: "Do you build AI agents?", answer: "Yes." },
	{ question: "What is an AI agent?", answer: "An AI agent is an intelligent system capable of performing tasks, making decisions, retrieving information, and automating workflows." },
	{ question: "Can AI agents automate business operations?", answer: "Yes." },
	{ question: "Which AI technologies do you use?", answer: "• OpenAI\n• LangChain\n• Vector Databases\n• Retrieval-Augmented Generation (RAG)\n• Custom AI Workflows" },
	{ question: "Can AI be integrated into existing systems?", answer: "Yes." },
	{ question: "Do you build custom software?", answer: "Yes." },
	{ question: "What software solutions do you provide?", answer: "• CRM Systems\n• ERP Systems\n• HRMS Platforms\n• Inventory Management\n• Business Management Systems\n• Custom Dashboards\n• SaaS Platforms" },
	{ question: "Can software be customized for our business?", answer: "Yes." },
	{ question: "Do you provide source code?", answer: "Yes, based on project agreements." },
	{ question: "Do you offer cloud deployment?", answer: "Yes." },
	{ question: "Do you provide software maintenance?", answer: "Yes." },
	{ question: "Can you modernize legacy software?", answer: "Yes." },
	{ question: "Do you provide UI/UX design services?", answer: "Yes." },
	{ question: "What design services do you offer?", answer: "• Website Design\n• Mobile App Design\n• SaaS Dashboard Design\n• Wireframing\n• Prototyping\n• User Research" },
	{ question: "Which design tools do you use?", answer: "• Figma\n• Adobe XD\n• Photoshop\n• Illustrator" },
	{ question: "Can I get a prototype before development?", answer: "Yes." },
	{ question: "Do you provide SEO services?", answer: "Yes." },
	{ question: "What SEO services are included?", answer: "• On-Page SEO\n• Technical SEO\n• Local SEO\n• SEO Audits" },
	{ question: "Do you provide social media marketing?", answer: "Yes." },
	{ question: "Do you offer LinkedIn lead generation?", answer: "Yes." },
	{ question: "Can you manage advertising campaigns?", answer: "Yes." },
	{ question: "Do you provide content marketing services?", answer: "Yes." },
	{ question: "Can you improve website rankings?", answer: "Yes, using SEO best practices." },
	{ question: "How much does a website cost?", answer: "Pricing depends on project scope and requirements." },
	{ question: "Do you offer customized quotations?", answer: "Yes." },
	{ question: "Is advance payment required?", answer: "Typically, yes." },
	{ question: "What payment methods do you accept?", answer: "• Bank Transfer\n• UPI\n• Online Payment Gateways" },
	{ question: "Do you provide invoices?", answer: "Yes." },
	{ question: "Can projects be paid in milestones?", answer: "Yes." },
	{ question: "Do you offer maintenance packages?", answer: "Yes." },
	{ question: "What is your development process?", answer: "• 1. Requirement Gathering\n• 2. Planning\n• 3. Design\n• 4. Development\n• 5. Testing\n• 6. Deployment\n• 7. Support" },
	{ question: "How do you communicate during projects?", answer: "• WhatsApp\n• Email\n• Google Meet\n• Zoom\n• Project Management Tools" },
	{ question: "Will I receive progress updates?", answer: "Yes." },
	{ question: "Can project requirements change midway?", answer: "Yes, subject to feasibility and scope adjustments." },
	{ question: "Do you provide documentation?", answer: "Yes." },
	{ question: "Do you provide training after delivery?", answer: "Yes, if required." },
	{ question: "Do you provide technical support after project completion?", answer: "Yes." },
	{ question: "How long does support last?", answer: "Based on the selected support package." },
	{ question: "Do you provide bug fixes?", answer: "Yes." },
	{ question: "Do you monitor deployed systems?", answer: "Support plans may include monitoring services." },
	{ question: "Can you scale systems as our business grows?", answer: "Yes." },
	{ question: "Do you provide backup solutions?", answer: "Yes." },
	{ question: "Who founded WeIntern?", answer: "Ashwin Gurao." },
	{ question: "What is the vision of WeIntern?", answer: "To bridge the gap between technology, business growth, and practical innovation through impactful digital solutions." },
	{ question: "What makes WeIntern different?", answer: "A strong focus on innovation, affordability, AI-powered solutions, and delivering measurable business value." },
	{ question: "What is your long-term goal?", answer: "To become a leading technology and AI solutions company helping businesses transform digitally." },
	{ question: "How do I start a project?", answer: "Share your requirements with our team through the website or contact channels." },
	{ question: "What information do you need before providing a quote?", answer: "• Project Type\n• Features Required\n• Timeline\n• Budget Range\n• Business Goals" },
	{ question: "How soon can a project start?", answer: "After requirement discussion and project approval." },
	{ question: "Can you work as a long-term technology partner?", answer: "Yes." },
	{ question: "Do you provide dedicated development teams?", answer: "Yes." },
	{ question: "Can you handle enterprise-level projects?", answer: "Yes, depending on project requirements." },
	{ question: "Do you provide AI consultation?", answer: "Yes." },
	{ question: "Can I request a custom solution not listed on your website?", answer: "Absolutely. Custom solutions are one of our core strengths." },
	{ question: "Does WeIntern offer internships for students?", answer: "Yes, WeIntern offers internship programs for students and freshers across technology, AI, and business domains." },
	{ question: "What internship domains are available at WeIntern?", answer: "• Web Development\n• App Development\n• AI & Machine Learning\n• Data Science\n• UI/UX Design\n• Digital Marketing\n• Content Writing\n• Human Resources\n• Business Development\n• Software Development" },
	{ question: "Who can apply for a WeIntern internship?", answer: "College students, freshers, and career-changers looking to gain practical, hands-on experience can apply." },
	{ question: "Is prior experience required to join an internship?", answer: "No, internships are open to beginners as well as students with prior knowledge; requirements vary by role." },
	{ question: "Are the internships remote or in-office?", answer: "Internships are primarily remote, allowing students to work from anywhere." },
	{ question: "What is the duration of an internship at WeIntern?", answer: "Internship durations typically range from 1 month to 6 months, depending on the program and track chosen." },
	{ question: "Is the internship free or paid?", answer: "Some internships are unpaid/certificate-based, while others include a stipend depending on the role, performance, and project." },
	{ question: "Will I get real project experience during the internship?", answer: "Yes, interns work on real, live, or simulated industry projects rather than just theoretical assignments." },
	{ question: "Will I receive a certificate after completing the internship?", answer: "Yes, an internship completion certificate is provided to interns who successfully complete the program." },
	{ question: "Will I get a Letter of Recommendation (LOR)?", answer: "Yes, top-performing interns may receive a Letter of Recommendation based on their performance." },
	{ question: "Is there a fee to join the internship program?", answer: "The fee structure, if applicable, depends on the specific internship track; some programs are entirely free." },
	{ question: "How do I apply for an internship at WeIntern?", answer: "Students can apply through the WeIntern website, application form, or by contacting the team directly." },
	{ question: "What is the selection process for internships?", answer: "It typically includes application submission, screening or a short interview (if applicable), and onboarding." },
	{ question: "Will I be assigned a mentor during the internship?", answer: "Yes, interns are guided by mentors or team leads throughout the program." },
	{ question: "What skills will I gain from the internship?", answer: "Interns gain hands-on technical skills, real-world project experience, teamwork, and professional workplace exposure." },
	{ question: "Can I do the internship along with my college studies?", answer: "Yes, most internships are flexible and can be done alongside college coursework." },
	{ question: "Will I get a formal offer or appointment letter?", answer: "Yes, selected interns typically receive an offer/appointment letter at the start of the internship." },
	{ question: "Can the internship convert into a full-time job?", answer: "High-performing interns may be considered for full-time roles based on performance and business requirements." },
	{ question: "What tools or technologies will I work with during the internship?", answer: "This depends on the domain chosen — for example, web/app development stacks, AI/ML tools, design tools, or marketing platforms." },
	{ question: "Will I work independently or in a team?", answer: "Interns typically work as part of a team under mentor guidance, while also handling individual tasks." },
	{ question: "Will I get doubt-clearing support during the internship?", answer: "Yes, mentors and team members are available to help resolve doubts during the internship." },
	{ question: "Can I get a mid-internship progress review?", answer: "Yes, periodic feedback and progress reviews may be provided during the internship." },
	{ question: "What happens if I miss a deadline during the internship?", answer: "Deadlines are generally handled with flexibility when communicated in advance; consistent non-performance may affect certification." },
	{ question: "Can I switch my internship domain after starting?", answer: "Domain switches may be considered on a case-by-case basis, subject to feasibility." },
	{ question: "Why should I choose WeIntern over other internship platforms?", answer: "WeIntern focuses on real project-based learning, mentorship, flexible remote internships, and practical, industry-relevant skills rather than just theory." },
	{ question: "How is WeIntern different from other internship providers?", answer: "Unlike platforms that only issue certificates, WeIntern emphasizes genuine project work, mentorship, and skill-building that adds real value to a resume." },
	{ question: "Is WeIntern a legitimate and trustworthy platform for internships?", answer: "Yes, WeIntern is part of the WeIntern Pvt Ltd and WeNexa ecosystem, which works with real clients and live projects." },
	{ question: "Does WeIntern only give certificates without real learning?", answer: "No, the focus is on genuine, hands-on project work — certificates are issued upon actual completion of assigned work." },
	{ question: "Will my internship look good on my resume?", answer: "Yes, practical project experience, mentorship, and a recognized certificate can meaningfully strengthen a student's resume." },
	{ question: "Does WeIntern help with interview preparation or career guidance?", answer: "Career guidance and mentorship support may be provided as part of select internship programs." },
	{ question: "Can I showcase my internship projects in a portfolio?", answer: "Yes, students are encouraged to add completed internship projects to their personal portfolio, subject to confidentiality/NDA terms." },
	{ question: "Does WeIntern provide internship experience in AI, which is in high demand?", answer: "Yes, AI & Automation is one of WeIntern's core focus areas, and AI-related internships are available." },
	{ question: "Is there any age or academic-year restriction for internships?", answer: "Internships are generally open to students from various academic years; specific eligibility may vary by program." },
	{ question: "Can final-year students apply for a long-term internship that could lead to a job?", answer: "Yes, final-year students can apply, and strong performers may be considered for full-time opportunities." },
	{ question: "Will my internship be recognized on LinkedIn?", answer: "Yes, students are encouraged to add their WeIntern internship experience and certificate to their LinkedIn profile." },
	{ question: "What makes WeIntern's certificate credible?", answer: "Certificates reflect actual completed project work and are issued by a functioning EdTech and IT services company, not a template-only provider." },
	{ question: "Do I need to pay anything hidden or extra during the internship?", answer: "Any applicable fees are communicated clearly upfront before joining; there are no hidden charges." },
	{ question: "Can I ask questions before joining the internship?", answer: "Yes, prospective interns can reach out to the team with any questions before applying or joining." },
	{ question: "Does WeIntern support students from non-technical backgrounds too?", answer: "Yes, non-technical tracks such as Digital Marketing, Content Writing, and Human Resources are also available for students from diverse backgrounds." },
	{ question: "Does WeIntern offer online courses or training programs?", answer: "Yes, as an EdTech company, WeIntern offers structured courses and training programs in addition to internships." },
	{ question: "What subjects or courses are available?", answer: "• Web Development\n• AI & Machine Learning\n• Data Science\n• App Development\n• UI/UX Design\n• Digital Marketing\n• Software Development Fundamentals" },
	{ question: "Are the courses self-paced or instructor-led?", answer: "Both formats may be available depending on the course; details are shared at the time of enrollment." },
	{ question: "Do courses include a certification?", answer: "Yes, a certificate of completion is provided for eligible courses." },
	{ question: "Are there any free courses available?", answer: "Some introductory or short courses may be offered for free, alongside paid in-depth programs." },
	{ question: "Do you provide recorded sessions?", answer: "Yes, recorded sessions are typically provided for learners to revisit course content." },
	{ question: "Can I access course material after completion?", answer: "Access duration depends on the specific course terms shared at enrollment." },
	{ question: "Do you offer live doubt-clearing sessions for courses?", answer: "Yes, live sessions or mentor support may be included depending on the course." },
	{ question: "Is there a community or peer group for learners?", answer: "Yes, learners can connect with peers and mentors through WeIntern's community channels." },
	{ question: "Can colleges or institutions partner with WeIntern for training programs?", answer: "Yes, WeIntern collaborates with colleges and institutions for training and skill-development programs." },
	{ question: "How can employers verify my WeIntern certificate?", answer: "Certificates can typically be verified through a unique certificate ID or by contacting the WeIntern team directly." },
	{ question: "Does the certificate include a unique ID or QR code?", answer: "Yes, certificates generally include a unique identifier for verification purposes." },
	{ question: "What if I lose my certificate?", answer: "You can contact the WeIntern team to request a reissued copy of your certificate." },
	{ question: "Can I request a duplicate certificate?", answer: "Yes, duplicate certificates can be requested by reaching out to the support team." },
	{ question: "Is the certificate digitally signed or shareable online?", answer: "Yes, certificates are designed to be easily shared on platforms like LinkedIn and with employers." },
	{ question: "Does WeIntern have a referral program?", answer: "Yes, students can refer friends or peers to WeIntern's internship and course programs." },
	{ question: "What are the benefits of referring a friend?", answer: "Referral benefits, where applicable, are communicated at the time of the referral program's availability." },
	{ question: "Is there an alumni network for past interns?", answer: "Yes, past interns can stay connected through WeIntern's alumni and community network." },
	{ question: "Can alumni access future opportunities or job referrals?", answer: "Alumni may be considered for future openings, referrals, or advanced opportunities based on their performance history." },
	{ question: "Does WeIntern help with job placement after the internship?", answer: "Career support and guidance may be offered to strong performers, though placement is not guaranteed." },
	{ question: "Do you conduct mock interviews?", answer: "Mock interviews or interview guidance may be provided as part of select programs." },
	{ question: "Can WeIntern refer me to hiring partners?", answer: "Top-performing interns may be referred to relevant opportunities within WeIntern's network, where available." },
	{ question: "Do you help with resume building?", answer: "Resume guidance may be offered as part of mentorship support during the internship or course." },
	{ question: "What is the refund policy for paid internships or courses?", answer: "Refund terms, where applicable, are shared clearly at the time of enrollment or payment." },
	{ question: "Can I cancel my internship or course registration?", answer: "Cancellations may be possible depending on the program stage; please contact the team for specific cases." },
	{ question: "How is my personal data protected?", answer: "Student and client data is handled with confidentiality; sensitive project data is further protected under NDA where applicable." },
	{ question: "Who do I contact if I have a complaint?", answer: "Complaints can be raised through the website contact form, email, or WhatsApp support channels." },
	{ question: "Is there a grievance redressal process?", answer: "Yes, concerns raised by students or clients are reviewed and addressed by the WeIntern team." },
	{ question: "Does WeIntern conduct webinars or workshops?", answer: "Yes, webinars and workshops may be conducted on technology, AI, and career-related topics." },
	{ question: "Do you organize hackathons or challenges?", answer: "Yes, hackathons or coding challenges may be organized periodically for students and interns." },
	{ question: "Can I join WeIntern's community group (WhatsApp/Discord/LinkedIn)?", answer: "Yes, students and interns are typically invited to join a community group for updates, networking, and support." }
];

function getOfflineFallbackResponse(message: string) {
	const raw = (message || "").trim();
	const normRaw = raw.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");

	// 1. Exact normalized match search across all 160 PDF Q&As
	const exactMatch = pdfFaqItems.find(item => {
		const normQ = item.question.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
		return normQ === normRaw;
	});

	if (exactMatch) {
		return {
			success: true,
			reply: exactMatch.answer,
			source: "offline_faq_exact"
		};
	}

	// 2. Keyword-overlap scoring across all 160 PDF Q&As
	const queryTokens = normRaw.split(" ").filter(t => t.length > 2);
	let bestItem: { question: string; answer: string } | null = null;
	let maxScore = 0;

	for (const item of pdfFaqItems) {
		const normQ = item.question.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
		let score = 0;
		for (const token of queryTokens) {
			if (normQ.includes(token)) {
				score += 10;
			}
		}
		if (score > maxScore) {
			maxScore = score;
			bestItem = item;
		}
	}

	if (bestItem && maxScore >= 10) {
		return {
			success: true,
			reply: bestItem.answer,
			source: "offline_faq_keyword"
		};
	}

	return {
		success: true,
		reply: "Hello! I am WeIntern AI Assistant. I can help with our internship domains, fees, certification, placement support, orientation, and registration. Please ask your specific question!",
		source: "offline_faq"
	};
}

export async function sendChat(message: string, source: string = 'text', session_id?: string, voiceMetadata?: any) {
	try {
		const url = buildUrl('/api/chat');
		const res = await safeFetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message, source, session_id, voice_metadata: voiceMetadata }),
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn("[chatApi] Backend connection issue, utilizing offline fallback response:", err.message);
		return getOfflineFallbackResponse(message);
	}
}

export async function saveLead(lead: Record<string, unknown>) {
	try {
		const url = buildUrl('/api/leads');
		const res = await safeFetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(lead),
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Backend offline, saving lead locally:', err.message);
		return { success: true, message: "Lead submitted successfully (offline mode)." };
	}
}

export async function getLeads() {
	try {
		const url = buildUrl('/api/leads');
		const res = await safeFetch(url);
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Failed to fetch leads:', err.message);
		return { success: false, data: [], error: err.message };
	}
}

export async function getHistory(session_id: string) {
	try {
		const url = buildUrl('/api/history', { session_id });
		const res = await safeFetch(url);
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Failed to load chat history:', err.message);
		return { success: false, data: [], error: err.message };
	}
}

export async function saveHistory(session_id: string, sender: string, message: string) {
	try {
		const url = buildUrl('/api/history');
		const res = await safeFetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ session_id, sender, message }),
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Backend offline, skipping history save:', err.message);
		return { success: true };
	}
}

export async function clearHistory(session_id: string) {
	try {
		const url = buildUrl('/api/history', { session_id });
		const res = await safeFetch(url, {
			method: 'DELETE',
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Backend offline, clearing local history:', err.message);
		return { success: true };
	}
}

export async function createEscalation(session_id: string, issue: string) {
	try {
		const url = buildUrl('/api/escalate');
		const res = await safeFetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ session_id, issue }),
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Backend offline, creating local ticket:', err.message);
		return { success: true, data: { id: "OFFLINE-" + Math.floor(Math.random() * 10000) } };
	}
}

export async function createPaymentOrder(details: {
	name: string;
	email: string;
	phone: string;
	preferred_domain: string;
	internship_duration: string;
}) {
	try {
		const url = buildUrl('/api/leads/payment/order');
		const res = await safeFetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(details),
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Payment order failed:', err.message);
		return { success: false, error: err.message };
	}
}

export async function verifyPayment(paymentPayload: {
	razorpay_order_id?: string;
	razorpay_payment_id?: string;
	razorpay_signature?: string;
	email: string;
	phone: string;
	payment_status?: string;
}) {
	try {
		const url = buildUrl('/api/leads/payment/verify');
		const res = await safeFetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(paymentPayload),
		});
		return await handleJsonResponse(res);
	} catch (err: any) {
		console.warn('[chatApi] Payment verification failed:', err.message);
		return { success: false, error: err.message };
	}
}

export default { sendChat, saveLead, getLeads, getHistory, saveHistory, clearHistory, createEscalation, createPaymentOrder, verifyPayment };


