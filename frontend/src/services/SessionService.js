// SessionService — the *real* session: a backend-issued token, valid 30
// days, checked server-side on every request. This is intentionally the
// single source of truth for "am I logged in", unlike the local save-slot
// list in AccountsService which is just UI recall, not authentication.
import { StorageService } from './StorageService';
const TOKEN_KEY = 'project-limitless-session';
export const SessionService = {
  get() {
    const session = StorageService.getJSON(TOKEN_KEY, null);
    if (!session?.token || !session?.expiresAt) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.clear();
      return null;
    }
    return session;
  },
  set(token, expiresAt) {
    StorageService.setJSON(TOKEN_KEY, {
      token,
      expiresAt
    });
  },
  clear() {
    StorageService.remove(TOKEN_KEY);
  }
};