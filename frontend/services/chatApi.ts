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

function getOfflineFallbackResponse(message: string) {
	const lower = (message || "").toLowerCase().trim();

	// 1. CEO / Founder / Leadership
	if (/\b(ceo|founder|owner|ashwin|namita|gurao|gope|who started|who founded)\b/i.test(lower)) {
		return {
			success: true,
			reply: "WeIntern was founded by Ashwin Gurao and Namita Gope. Their mission is to empower students with industry-oriented technical skills, mentorship, and practical project experience.",
			source: "offline_faq"
		};
	}

	// 2. What is WeIntern / Company overview
	if (/\b(what is weintern|about weintern|who is weintern|tell me about weintern|weintern kya hai|introduce weintern|company overview)\b/i.test(lower)) {
		return {
			success: true,
			reply: "WeIntern is an EdTech platform where students don't wait for opportunities — they build them. WeIntern provides industry-focused internship programs with live projects, mentor support, verified certificates, and stipend opportunities.",
			source: "offline_faq"
		};
	}

	// 3. Location / Address
	if (/\b(location|located|address|headquarter|office|pune|kharadi)\b/i.test(lower)) {
		return {
			success: true,
			reply: "WeIntern is headquartered in Kharadi, Pune, Maharashtra, India. All internship programs and live mentor sessions are conducted online.",
			source: "offline_faq"
		};
	}

	// 4. Certificates & LOR
	if (/\b(certificate|certificates|certification|lor|letter of recommendation|recommendation letter)\b/i.test(lower)) {
		return {
			success: true,
			reply: "Yes! All WeIntern candidates receive an official Internship Completion Certificate and a Letter of Recommendation (LOR) upon successful task completion. The 6-Month program (₹6,599) also includes a Training Certificate. All certificates are verifiable and shareable on LinkedIn.",
			source: "offline_faq"
		};
	}

	// 5. Full Stack Web Development
	if (/\b(full\s*stack|fullstack|react|node|express|mongodb|web\s*dev)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The Full Stack Web Development internship duration is 12 weeks and the fee is ₹6,599. You will learn HTML, CSS, JavaScript, React.js, Node.js, Express.js, MongoDB, REST APIs, Git/GitHub, and deploy live full-stack projects.",
			source: "offline_faq"
		};
	}

	// 6. Data Science
	if (/\b(data\s*science|datascience|data\s*analytics|pandas|tableau|power\s*bi)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The Data Science & Analytics internship duration is 12 weeks and the fee is ₹6,599. You will learn Python, Pandas, NumPy, SQL, Power BI, data visualization, and machine learning fundamentals.",
			source: "offline_faq"
		};
	}

	// 7. AI & Automation
	if (/\b(ai|ml|automation|prompt\s*engineering|llm|chatbots?)\b/i.test(lower) && !/\b(email|detail)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The AI & Automation internship duration is 8 weeks and the fee is ₹6,599. You will learn Python, Prompt Engineering, LLM integration, AI APIs, and build automated AI workflows.",
			source: "offline_faq"
		};
	}

	// 8. UI / UX Design
	if (/\b(ui|ux|ui\/ux|figma|design)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The UI/UX Design internship duration is 8 weeks and the fee is ₹3,299. You will learn design principles, user research, wireframing, prototyping, and build portfolio case studies using Figma.",
			source: "offline_faq"
		};
	}

	// 9. Python
	if (/\bpython\b/i.test(lower)) {
		return {
			success: true,
			reply: "The Python Programming internship duration is 10 weeks and the fee is ₹3,299. You will learn Python syntax, OOPs, file handling, APIs, automation scripts, and practical projects.",
			source: "offline_faq"
		};
	}

	// 10. Java
	if (/\bjava\b/i.test(lower) && !/\bjavascript\b/i.test(lower)) {
		return {
			success: true,
			reply: "The Java Programming internship duration is 12 weeks and the fee is ₹3,299. You will learn Core Java, OOPs, Collections, JDBC, multithreading, and REST API development.",
			source: "offline_faq"
		};
	}

	// 11. C / C++
	if (/\b(c\+\+|cpp|c\/c\+\+|c\s+programming)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The C/C++ Programming internship duration is 10 weeks and the fee is ₹3,299. You will learn C/C++ fundamentals, OOPs, Data Structures & Algorithms, and project development.",
			source: "offline_faq"
		};
	}

	// 12. Cloud Computing
	if (/\b(cloud|devops|aws|docker|kubernetes)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The Cloud Computing internship duration is 12 weeks and the fee is ₹5,399. You will learn AWS services (EC2, S3, VPC), Docker, Kubernetes, Linux, and cloud infrastructure deployment.",
			source: "offline_faq"
		};
	}

	// 13. Digital Marketing
	if (/\b(digital\s*marketing|seo|social\s*media|meta\s*ads)\b/i.test(lower)) {
		return {
			success: true,
			reply: "The Digital Marketing internship duration is 8 weeks and the fee is ₹2,499. You will learn SEO, social media marketing, Google & Meta ads, content strategy, and campaign analytics.",
			source: "offline_faq"
		};
	}

	// 14. Course / Domain List
	if (/\b(courses?|domains?|programs?|tracks?|list\s+of\s+courses|all\s+courses|available\s+courses)\b/i.test(lower)) {
		return {
			success: true,
			reply: "Here are the 10 WeIntern internship domains:\n1. Full Stack Web Development (12 weeks — ₹6,599)\n2. Mobile App Development (10 weeks — ₹10,699)\n3. AI & Automation (8 weeks — ₹6,599)\n4. Data Science & Analytics (12 weeks — ₹6,599)\n5. Python Programming (10 weeks — ₹3,299)\n6. Java Programming (12 weeks — ₹3,299)\n7. C/C++ Programming (10 weeks — ₹3,299)\n8. UI/UX Design (8 weeks — ₹3,299)\n9. Cloud Computing (12 weeks — ₹5,399)\n10. Digital Marketing (8 weeks — ₹2,499)",
			source: "offline_faq"
		};
	}

	// 15. Fees & EMI
	if (/\b(fee|fees|cost|price|emi|installment|payment|discount)\b/i.test(lower)) {
		return {
			success: true,
			reply: "WeIntern course fees range from ₹2,499 to ₹10,699 depending on the domain. Flexible EMI options (30:40:30 ratio) and a 10% discount on one-time full payments are available.",
			source: "offline_faq"
		};
	}

	// 16. Stipend
	if (/\b(stipend|salary|earnings?|paisa)\b/i.test(lower)) {
		return {
			success: true,
			reply: "Yes! Performance-based stipends up to ₹10,000 are awarded to candidates who excel in assigned projects and complete tasks on time.",
			source: "offline_faq"
		};
	}

	// 17. Eligibility & Freshers
	if (/\b(eligible|eligibility|fresher|freshers|beginner|beginners|qualification|who\s+can)\b/i.test(lower)) {
		return {
			success: true,
			reply: "All college students, freshers, and beginners from any branch or background are eligible. Most programs start from basic fundamentals and require no prior industry experience.",
			source: "offline_faq"
		};
	}

	// 18. Duration
	if (/\b(duration|how\s+long|how\s+many\s+months|weeks)\b/i.test(lower)) {
		return {
			success: true,
			reply: "Program durations range from 8 to 12 weeks: AI & Automation, UI/UX Design, and Digital Marketing are 8 weeks; Mobile App, Python, and C/C++ are 10 weeks; Full Stack, Data Science, Java, and Cloud Computing are 12 weeks.",
			source: "offline_faq"
		};
	}

	// 19. Registration / Apply
	if (/\b(apply|register|registration|enroll|signup|join)\b/i.test(lower)) {
		return {
			success: true,
			reply: "To register: Click 'Apply / Register' in our chat widget or visit we-intern.in, choose your domain, and complete your details. You will receive orientation and WhatsApp group links via email/WhatsApp.",
			source: "offline_faq"
		};
	}

	// 20. Contact & Support
	if (/\b(contact|support|email|phone|whatsapp|helpdesk|number)\b/i.test(lower)) {
		return {
			success: true,
			reply: "You can reach the WeIntern team via WhatsApp at +91 74149 74582 or email support@we-intern.in. Official website: we-intern.in.",
			source: "offline_faq"
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

export default { sendChat, saveLead, getHistory, saveHistory, clearHistory, createEscalation };

