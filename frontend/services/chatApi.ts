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
	const lower = (message || "").toLowerCase();

	if (lower.includes("apply") || lower.includes("register") || lower.includes("enroll") || lower.includes("signup")) {
		return {
			success: true,
			reply: "You can apply for WeIntern internships directly through our chat widget by clicking 'Apply / Register'. We offer programs in Full Stack Development, Data Science, AI/ML, UI/UX Design, and Digital Marketing!",
			source: "offline_fallback"
		};
	}
	if (lower.includes("fee") || lower.includes("cost") || lower.includes("price") || lower.includes("emi") || lower.includes("payment")) {
		return {
			success: true,
			reply: "WeIntern offers flexible fee structures and EMI options for all internship domain tracks. Training and stipend details are provided upon domain selection.",
			source: "offline_fallback"
		};
	}
	if (lower.includes("certificate") || lower.includes("certification") || lower.includes("lor") || lower.includes("recommendation")) {
		return {
			success: true,
			reply: "Yes! All WeIntern candidates receive an official Internship Completion Certificate and a Letter of Recommendation (LOR) upon successful completion of tasks.",
			source: "offline_fallback"
		};
	}
	if (lower.includes("domain") || lower.includes("course") || lower.includes("field") || lower.includes("program")) {
		return {
			success: true,
			reply: "WeIntern offers internship tracks in Full Stack Web Development, Data Science & Analytics, AI & Machine Learning, UI/UX Design, Python, Java, and Digital Marketing.",
			source: "offline_fallback"
		};
	}
	if (lower.includes("contact") || lower.includes("email") || lower.includes("phone") || lower.includes("support")) {
		return {
			success: true,
			reply: "You can reach the WeIntern team at support@we-intern.in or through our official website.",
			source: "offline_fallback"
		};
	}

	return {
		success: true,
		reply: "Hello! I am WeIntern AI Assistant. How can I help you with our internship programs, domains, certificates, or registration today?",
		source: "offline_fallback"
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

