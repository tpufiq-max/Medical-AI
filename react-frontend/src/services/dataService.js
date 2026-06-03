// API-backed data services for Medical AI platform
// Connects to Flask backend at http://localhost:5001

const API_BASE_URL = 'http://localhost:5001/api';

// ─── Helper: API Request Handler ──────────────────────────────────────────

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status}`, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    return null;
  }
}

// ─── ConsultationService ─────────────────────────────────────────────────────

export const ConsultationService = {
  async save(consultation) {
    const payload = {
      type: consultation.type || 'chat',
      query: consultation.query || '',
      response: consultation.response || null,
      diagnosis: consultation.diagnosis || '',
      symptoms: consultation.symptoms || [],
      recommendations: consultation.recommendations || [],
      metadata: consultation.metadata || {},
    };

    const result = await apiCall('/consultations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return result?.data || null;
  },

  async getAll() {
    const result = await apiCall('/consultations');
    return result || [];
  },

  async getById(id) {
    const result = await apiCall(`/consultations/${id}`);
    return result || null;
  },

  async search(query) {
    const allConsultations = await ConsultationService.getAll();
    const q = query.toLowerCase();
    return allConsultations.filter(c =>
      (c.query && c.query.toLowerCase().includes(q)) ||
      (c.diagnosis && c.diagnosis.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q))
    );
  },

  async getRecent(limit = 10) {
    const allConsultations = await ConsultationService.getAll();
    return allConsultations.slice(0, limit);
  },

  async getStats() {
    const allConsultations = await ConsultationService.getAll();
    const types = {};
    allConsultations.forEach(c => {
      types[c.type] = (types[c.type] || 0) + 1;
    });
    return {
      total: allConsultations.length,
      byType: types,
    };
  },

  async getMonthlyStats() {
    const allConsultations = await ConsultationService.getAll();
    const monthly = {};
    allConsultations.forEach(c => {
      const month = c.date ? c.date.slice(0, 7) : 'unknown';
      monthly[month] = (monthly[month] || 0) + 1;
    });
    return Object.entries(monthly)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month));
  },
};

// ─── MedicalRecordService ────────────────────────────────────────────────────

export const MedicalRecordService = {
  async save(record) {
    const payload = {
      type: record.type || 'report',
      title: record.title || 'Untitled',
      content: record.content || '',
      tags: record.tags || [],
      metadata: record.metadata || {},
    };

    const result = await apiCall('/records', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return result?.data || null;
  },

  async getAll() {
    const result = await apiCall('/records');
    return result || [];
  },

  async getByType(type) {
    const result = await apiCall(`/records?type=${encodeURIComponent(type)}`);
    return result || [];
  },

  async getById(id) {
    const result = await apiCall(`/records/${id}`);
    return result || null;
  },

  async search(query) {
    const allRecords = await MedicalRecordService.getAll();
    const q = query.toLowerCase();
    return allRecords.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.content && r.content.toLowerCase().includes(q)) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
    );
  },

  async delete(id) {
    const result = await apiCall(`/records/${id}`, {
      method: 'DELETE',
    });
    return result?.success || false;
  },
};

// ─── ActivityLogService ──────────────────────────────────────────────────────

export const ActivityLogService = {
  async log(action, details = '', category = 'general') {
    const payload = {
      action,
      details,
      category,
      metadata: {},
    };

    const result = await apiCall('/activity', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return result?.data || null;
  },

  async getAll() {
    const result = await apiCall('/activity?limit=500');
    return result || [];
  },

  async getRecent(limit = 20) {
    const result = await apiCall(`/activity?limit=${limit}`);
    return result || [];
  },

  async getByCategory(category) {
    const result = await apiCall(`/activity?category=${encodeURIComponent(category)}`);
    return result || [];
  },

  async getTimeline() {
    const allActivity = await ActivityLogService.getAll();
    const grouped = {};
    allActivity.forEach(a => {
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
  async totalConsultations() {
    const allConsultations = await ConsultationService.getAll();
    return allConsultations.length;
  },

  async recentCount(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const allConsultations = await ConsultationService.getAll();
    return allConsultations.filter(c =>
      new Date(c.date) >= cutoff
    ).length;
  },

  async monthlyStats() {
    return await ConsultationService.getMonthlyStats();
  },

  async categoryBreakdown() {
    const stats = await ConsultationService.getStats();
    return Object.entries(stats.byType).map(([name, value]) => ({ name, value }));
  },

  async activitySummary() {
    const activity = await ActivityLogService.getAll();
    const categories = {};
    activity.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1;
    });
    return {
      total: activity.length,
      byCategory: categories,
    };
  },

  async trendsOverTime(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const allConsultations = await ConsultationService.getAll();
    const consultations = allConsultations.filter(c =>
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

  async getFullAnalytics() {
    const result = await apiCall('/analytics');
    return result || {
      consultations: { total: 0, byType: {}, monthly: {} },
      records: { total: 0, byType: {} },
      activities: { total: 0 },
    };
  },
};
