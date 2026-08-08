const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export async function sendChat(message) {
	const res = await fetch(`${API_BASE}/api/chat`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message })
	});
	return res.json();
}

export async function saveLead(lead) {
	const res = await fetch(`${API_BASE}/api/leads`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(lead)
	});
	return res.json();
}

export async function getHistory(session_id) {
	const url = new URL(`${API_BASE}/api/history`);
	url.searchParams.append('session_id', session_id);
	const res = await fetch(url.toString());
	return res.json();
}

export default { sendChat, saveLead, getHistory };
