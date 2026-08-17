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

export async function sendChat(message: string, source: string = 'text', session_id?: string, voiceMetadata?: any) {
	const url = buildUrl('/api/chat');
	const res = await safeFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message, source, session_id, voice_metadata: voiceMetadata }),
	});
	return handleJsonResponse(res);
}

export async function saveLead(lead: Record<string, unknown>) {
	const url = buildUrl('/api/leads');
	const res = await safeFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(lead),
	});
	return handleJsonResponse(res);
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
	const url = buildUrl('/api/history');
	const res = await safeFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ session_id, sender, message }),
	});
	return handleJsonResponse(res);
}

export async function clearHistory(session_id: string) {
	const url = buildUrl('/api/history', { session_id });
	const res = await safeFetch(url, {
		method: 'DELETE',
	});
	return handleJsonResponse(res);
}

export async function createEscalation(session_id: string, issue: string) {
	const url = buildUrl('/api/escalate');
	const res = await safeFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ session_id, issue }),
	});
	return handleJsonResponse(res);
}

export default { sendChat, saveLead, getHistory, saveHistory, clearHistory, createEscalation };

