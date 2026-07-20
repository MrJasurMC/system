// StorageService — every localStorage read/write in the app goes through
// here. Centralizing it means corrupted JSON, quota errors, or a browser
// with storage disabled degrade gracefully instead of crashing a page.

export const StorageService = {
  getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      // Corrupted entry — drop it rather than let it keep breaking reads.
      localStorage.removeItem(key);
      return fallback;
    }
  },
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      // Quota exceeded, storage disabled, or private-mode restrictions.
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing meaningful to recover — ignore.
    }
  }
};