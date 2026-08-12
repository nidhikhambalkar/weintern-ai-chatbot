const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

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
	const res = await fetch(`${API_BASE}/api/chat`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message, source, session_id, voice_metadata: voiceMetadata }),
	});
	return handleJsonResponse(res);
}

export async function saveLead(lead: Record<string, unknown>) {
	const res = await fetch(`${API_BASE}/api/leads`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(lead),
	});
	return handleJsonResponse(res);
}

export async function getHistory(session_id: string) {
	const url = new URL(`${API_BASE}/api/history`);
	url.searchParams.append('session_id', session_id);
	const res = await fetch(url.toString());
	return handleJsonResponse(res);
}

export async function saveHistory(session_id: string, sender: string, message: string) {
	const res = await fetch(`${API_BASE}/api/history`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ session_id, sender, message }),
	});
	return handleJsonResponse(res);
}

export async function createEscalation(session_id: string, issue: string) {
	const res = await fetch(`${API_BASE}/api/escalate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ session_id, issue }),
	});
	return handleJsonResponse(res);
}

export default { sendChat, saveLead, getHistory, saveHistory, createEscalation };
