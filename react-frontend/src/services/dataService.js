// localStorage-backed data services for Medical AI platform
// All keys prefixed with 'medai_' to avoid conflicts

import { NotificationService } from './notificationService';

const KEYS = {
  consultations: 'medai_consultations',
  records: 'medai_records',
  activity: 'medai_activity',
};

function getStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ─── ConsultationService ─────────────────────────────────────────────────────

export const ConsultationService = {
  save(consultation) {
    const items = getStore(KEYS.consultations);
    const entry = {
      type: consultation.type || 'chat',
      query: consultation.query || '',
      response: consultation.response || null,
      diagnosis: consultation.diagnosis || '',
      symptoms: consultation.symptoms || [],
      recommendations: consultation.recommendations || [],
      ...consultation,
      id: consultation.id || generateId(),
      date: consultation.date || new Date().toISOString(),
    };
    items.unshift(entry);
    const ok = setStore(KEYS.consultations, items);
    if (!ok) {
      NotificationService.add({ type: 'warning', title: 'Storage Full', message: 'Unable to save consultation. Local storage is full.' });
    }
    return entry;
  },

  getAll() {
    return getStore(KEYS.consultations);
  },

  getById(id) {
    return getStore(KEYS.consultations).find(c => c.id === id) || null;
  },

  search(query) {
    const q = query.toLowerCase();
    return getStore(KEYS.consultations).filter(c =>
      (c.query && c.query.toLowerCase().includes(q)) ||
      (c.diagnosis && c.diagnosis.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q))
    );
  },

  getRecent(limit = 10) {
    return getStore(KEYS.consultations).slice(0, limit);
  },

  getStats() {
    const all = getStore(KEYS.consultations);
    const types = {};
    all.forEach(c => {
      types[c.type] = (types[c.type] || 0) + 1;
    });
    return {
      total: all.length,
      byType: types,
    };
  },

  getMonthlyStats() {
    const all = getStore(KEYS.consultations);
    const monthly = {};
    all.forEach(c => {
      const month = c.date ? c.date.slice(0, 7) : 'unknown';
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return Object.entries(monthly)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },
};

// ─── MedicalRecordService ────────────────────────────────────────────────────

export const MedicalRecordService = {
  save(record) {
    const items = getStore(KEYS.records);
    const entry = {
      patientId: record.patientId || 'default',
      type: record.type || 'report',
      title: record.title || '',
      content: record.content || '',
      tags: record.tags || [],
      ...record,
      id: record.id || generateId(),
      date: record.date || new Date().toISOString(),
    };
    items.unshift(entry);
    const ok = setStore(KEYS.records, items);
    if (!ok) {
      NotificationService.add({ type: 'warning', title: 'Storage Full', message: 'Unable to save medical record. Local storage is full.' });
    }
    return entry;
  },

  getAll() {
    return getStore(KEYS.records);
  },

  getByType(type) {
    return getStore(KEYS.records).filter(r => r.type === type);
  },

  search(query) {
    const q = query.toLowerCase();
    return getStore(KEYS.records).filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.content && r.content.toLowerCase().includes(q)) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
    );
  },

  delete(id) {
    const items = getStore(KEYS.records).filter(r => r.id !== id);
    setStore(KEYS.records, items);
  },
};

// ─── ActivityLogService ──────────────────────────────────────────────────────

export const ActivityLogService = {
  log(action, details = '', category = 'general') {
    const items = getStore(KEYS.activity);
    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action,
      details,
      category,
    };
    items.unshift(entry);
    // Keep only last 200 entries to reduce serialization cost
    if (items.length > 200) items.length = 200;
    const ok = setStore(KEYS.activity, items);
    if (!ok) {
      NotificationService.add({ type: 'warning', title: 'Storage Full', message: 'Unable to save activity log. Local storage is full.' });
    }
    return entry;
  },

  getAll() {
    return getStore(KEYS.activity);
  },

  getRecent(limit = 20) {
    return getStore(KEYS.activity).slice(0, limit);
  },

  getByCategory(category) {
    return getStore(KEYS.activity).filter(a => a.category === category);
  },

  getTimeline() {
    const all = getStore(KEYS.activity);
    const grouped = {};
    all.forEach(a => {
      const day = a.timestamp ? a.timestamp.slice(0, 10) : 'unknown';
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(a);
    });
    return Object.entries(grouped)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
};

// ─── AnalyticsService ────────────────────────────────────────────────────────

export const AnalyticsService = {
  totalConsultations() {
    return getStore(KEYS.consultations).length;
  },

  recentCount(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return getStore(KEYS.consultations).filter(c =>
      new Date(c.date) >= cutoff
    ).length;
  },

  monthlyStats() {
    return ConsultationService.getMonthlyStats();
  },

  categoryBreakdown() {
    const stats = ConsultationService.getStats();
    return Object.entries(stats.byType).map(([name, value]) => ({ name, value }));
  },

  activitySummary() {
    const activity = getStore(KEYS.activity);
    const categories = {};
    activity.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1;
    });
    return {
      total: activity.length,
      byCategory: categories,
    };
  },

  trendsOverTime(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const consultations = getStore(KEYS.consultations).filter(c =>
      new Date(c.date) >= cutoff
    );
    const daily = {};
    consultations.forEach(c => {
      const day = c.date.slice(0, 10);
      daily[day] = (daily[day] || 0) + 1;
    });
    return Object.entries(daily)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
