import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { AuthService, AuthUser } from '../services/AuthService';
import { AccountsService } from '../services/AccountsService';
import { SessionService } from '../services/SessionService';
import { setUnauthorizedHandler } from '../api/client';

export type User = AuthUser;

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  socket: Socket | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      if (SessionService.get()) {
        try {
          const me = await AuthService.me();
          setUser(me);
        } catch {
          SessionService.clear();
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const session = SessionService.get();
    if (!session) return;

    let currentSocket: ReturnType<typeof import('socket.io-client')['io']> | null = null;
    let cancelled = false;
    import('socket.io-client').then(({ io }) => {
      if (cancelled) return;
      // VITE_SOCKET_URL for split deployments (falls back to VITE_API_URL's
      // origin, then same-origin for local dev where Vite proxies it).
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : window.location.origin);
      currentSocket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket'],
        auth: { token: session.token },
      });
      setSocket(currentSocket);
    });

    return () => {
      cancelled = true;
      if (currentSocket) {
        currentSocket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function login(email: string, password: string) {
    const data = await AuthService.login(email, password);
    SessionService.set(data.token, data.expiresAt);
    AccountsService.remember(data.user);
    setUser(data.user);
  }

  async function register(username: string, email: string, password: string) {
    const data = await AuthService.register(username, email, password);
    SessionService.set(data.token, data.expiresAt);
    AccountsService.remember(data.user);
    setUser(data.user);
  }

  async function logout() {
    try {
      await AuthService.logout();
    } finally {
      // Local save-slot entry stays — logout only clears the active
      // session, same as closing a game without deleting the save file.
      SessionService.clear();
      setUser(null);
    }
  }

  async function deleteAccount() {
    if (!user) return;
    await AuthService.deleteAccount();
    AccountsService.forget(user.id);
    SessionService.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, socket, login, register, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
