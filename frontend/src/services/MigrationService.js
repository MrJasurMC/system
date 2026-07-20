// MigrationService — runs once on app start. Handles renamed/legacy
// localStorage keys and corrupted entries so an update never costs a
// returning player their session or their save-slot list.
import { StorageService } from './StorageService';
const LEGACY_TOKEN_KEY = 'system.sessionToken';
const LEGACY_EXPIRES_KEY = 'system.sessionExpiresAt';
const SESSION_KEY = 'project-limitless-session';
export const MigrationService = {
  /** Moves session data from the pre-refactor two-key format into the current single-key format. */
  migrateLegacySession() {
    const hasCurrent = localStorage.getItem(SESSION_KEY) !== null;
    if (hasCurrent) return;
    const token = localStorage.getItem(LEGACY_TOKEN_KEY);
    const expiresAt = localStorage.getItem(LEGACY_EXPIRES_KEY);
    if (token && expiresAt) {
      StorageService.setJSON(SESSION_KEY, {
        token,
        expiresAt
      });
    }
    StorageService.remove(LEGACY_TOKEN_KEY);
    StorageService.remove(LEGACY_EXPIRES_KEY);
  },
  /** Call once at app boot, before anything reads from storage. */
  run() {
    try {
      this.migrateLegacySession();
    } catch {
      // A migration failing should never block the app from loading —
      // worst case the player just has to log in again.
    }
  }
};