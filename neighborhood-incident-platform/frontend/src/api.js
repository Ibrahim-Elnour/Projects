const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function listIncidents({ page = 1, page_size = 10 } = {}) {
  const res = await fetch(`${API_BASE}/incidents?page=${page}&page_size=${page_size}`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function createIncident(token, payload) {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create incident");
  return res.json();
}
