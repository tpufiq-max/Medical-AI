// Notification service - localStorage-backed in-app notifications

const KEY = 'medai_notifications';

function getStore() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStore(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export const NotificationService = {
  add(notification) {
    const items = getStore();
    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      read: false,
    };
    items.unshift(entry);
    // Keep only last 100 notifications
    if (items.length > 100) items.length = 100;
    setStore(items);
    return entry;
  },

  getAll() {
    return getStore();
  },

  getUnread() {
    return getStore().filter(n => !n.read);
  },

  markRead(id) {
    const items = getStore().map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setStore(items);
  },

  markAllRead() {
    const items = getStore().map(n => ({ ...n, read: true }));
    setStore(items);
  },

  clear() {
    setStore([]);
  },
};
