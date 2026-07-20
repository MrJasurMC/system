// AccountsService — the local "save slot" list. This is NOT authentication:
// it stores no password or hash, just enough (id/username/email/lastLoginAt)
// for the login screen to show "known accounts on this browser" and prefill
// the email field for a fast switch, the way a game shows save files. The
// real check always happens server-side via AuthService.
import { StorageService } from './StorageService';
const KEY = 'project-limitless-known-accounts';
export const AccountsService = {
  list() {
    const accounts = StorageService.getJSON(KEY, []);
    return [...accounts].sort((a, b) => a.lastLoginAt < b.lastLoginAt ? 1 : -1);
  },
  remember(account) {
    const accounts = this.list().filter(a => a.id !== account.id);
    accounts.push({
      ...account,
      lastLoginAt: new Date().toISOString()
    });
    StorageService.setJSON(KEY, accounts);
  },
  forget(id) {
    StorageService.setJSON(KEY, this.list().filter(a => a.id !== id));
  }
};