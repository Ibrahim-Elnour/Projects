import { seedMessages, seedNotifications, seedReports } from './data.js';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const STORAGE_KEYS = {
  reports: 'vigil.reports',
  messages: 'vigil.messages',
  notifications: 'vigil.notifications',
};

function readLocal(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(key, JSON.stringify(fallback));
  } catch {
    return fallback;
  }
  return fallback;
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) throw new Error(`Vigil API error (${response.status})`);
  return response.status === 204 ? null : response.json();
}

export const api = {
  async getReports() {
    return API_URL ? request('/api/reports') : readLocal(STORAGE_KEYS.reports, seedReports);
  },
  async createReport(report) {
    if (API_URL) return request('/api/reports', { method: 'POST', body: JSON.stringify(report) });
    const reports = readLocal(STORAGE_KEYS.reports, seedReports);
    const created = { ...report, id: crypto.randomUUID(), status: 'open', createdAt: new Date().toISOString() };
    writeLocal(STORAGE_KEYS.reports, [created, ...reports]);
    const notifications = readLocal(STORAGE_KEYS.notifications, seedNotifications);
    writeLocal(STORAGE_KEYS.notifications, [{ id: crypto.randomUUID(), title: 'New campus report', detail: `${created.title} · ${created.location}`, time: 'just now', read: false }, ...notifications]);
    return created;
  },
  async getMessages() {
    return API_URL ? request('/api/chat/messages') : readLocal(STORAGE_KEYS.messages, seedMessages);
  },
  async sendMessage(text) {
    if (API_URL) return request('/api/chat/messages', { method: 'POST', body: JSON.stringify({ text }) });
    const messages = readLocal(STORAGE_KEYS.messages, seedMessages);
    const message = { id: crypto.randomUUID(), author: 'You', text, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), mine: true };
    writeLocal(STORAGE_KEYS.messages, [...messages, message]);
    return message;
  },
  async getNotifications() {
    return API_URL ? request('/api/notifications') : readLocal(STORAGE_KEYS.notifications, seedNotifications);
  },
  async markNotificationsRead() {
    if (API_URL) return request('/api/notifications/read', { method: 'POST' });
    const notifications = readLocal(STORAGE_KEYS.notifications, seedNotifications);
    return writeLocal(STORAGE_KEYS.notifications, notifications.map((notification) => ({ ...notification, read: true })));
  },
};
