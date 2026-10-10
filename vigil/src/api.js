import { seedMessages, seedNotifications } from './data.js';
import { supabase } from './supabase.js';

const STORAGE_KEYS = {
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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return value;
  }
  return value;
}

function fromReportRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    location: row.location_name,
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    status: row.status === 'active' ? 'open' : 'resolved',
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

export const api = {
  async getReports() {
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(fromReportRow);
  },
  async createReport(report, userId) {
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.from('reports').insert({
      title: report.title,
      category: report.category,
      description: report.description,
      location_name: report.location,
      latitude: report.lat,
      longitude: report.lng,
      user_id: userId,
    }).select().single();
    if (error) throw error;
    const created = fromReportRow(data);
    const notifications = readLocal(STORAGE_KEYS.notifications, seedNotifications);
    writeLocal(STORAGE_KEYS.notifications, [{ id: crypto.randomUUID(), title: 'New campus report', detail: `${created.title} · ${created.location}`, time: 'just now', read: false }, ...notifications]);
    return created;
  },
  async resolveReport(reportId, userId) {
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.from('reports')
      .update({ status: 'resolved' })
      .eq('id', reportId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return fromReportRow(data);
  },
  async getMessages() {
    return readLocal(STORAGE_KEYS.messages, seedMessages);
  },
  async sendMessage(text) {
    const messages = readLocal(STORAGE_KEYS.messages, seedMessages);
    const message = { id: crypto.randomUUID(), author: 'You', text, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), mine: true };
    writeLocal(STORAGE_KEYS.messages, [...messages, message]);
    return message;
  },
  async getNotifications() {
    return readLocal(STORAGE_KEYS.notifications, seedNotifications);
  },
  async markNotificationsRead() {
    const notifications = readLocal(STORAGE_KEYS.notifications, seedNotifications);
    return writeLocal(STORAGE_KEYS.notifications, notifications.map((notification) => ({ ...notification, read: true })));
  },
};
