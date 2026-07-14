// AuthService — the real (server-verified) auth calls. Backend hashes with
// bcrypt and issues the 30-day session token; this service just wraps the
// three endpoints so AuthContext isn't making raw fetches.
import { api } from '../api/client';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export const AuthService = {
  register(username: string, email: string, password: string): Promise<AuthResult> {
    return api.post<AuthResult>('/auth/register', { username, email, password });
  },

  login(email: string, password: string): Promise<AuthResult> {
    return api.post<AuthResult>('/auth/login', { email, password });
  },

  logout(): Promise<void> {
    return api.post('/auth/logout');
  },

  me(): Promise<AuthUser> {
    return api.get<AuthUser>('/auth/me');
  },

  deleteAccount(): Promise<void> {
    return api.delete('/users/me');
  },

  resetProgress(): Promise<void> {
    return api.post('/users/me/reset');
  },
};
