// AuthService — the real (server-verified) auth calls. Backend hashes with
// bcrypt and issues the 30-day session token; this service just wraps the
// three endpoints so AuthContext isn't making raw fetches.
import { api } from '../api/client';
export const AuthService = {
  register(username, email, password) {
    return api.post('/auth/register', {
      username,
      email,
      password
    });
  },
  login(email, password) {
    return api.post('/auth/login', {
      email,
      password
    });
  },
  logout() {
    return api.post('/auth/logout');
  },
  me() {
    return api.get('/auth/me');
  },
  deleteAccount() {
    return api.delete('/users/me');
  },
  resetProgress() {
    return api.post('/users/me/reset');
  }
};