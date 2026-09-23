// public/js/api.js
// Thin REST client shared by every page: attaches the JWT, and a per-browser
// guest id so public visitors still get their own chat history.

const TOKEN_KEY = 'novatrend_token';
const USER_KEY = 'novatrend_user';
const GUEST_KEY = 'novatrend_guest_id';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function guestId() {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? String(Math.random()).slice(2);
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'x-guest-id': guestId() };
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 401) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
