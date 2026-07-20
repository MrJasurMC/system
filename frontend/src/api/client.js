// Thin fetch wrapper for the NestJS API.
// Session storage itself lives in SessionService — this file just reads it
// on the way out and reacts to 401s on the way back.
//
// API_BASE: in local dev, Vite proxies "/api" to the backend (see
// vite.config.ts), so the default same-origin path works with no env var.
// In production, frontend and backend usually live on different domains
// (e.g. Netlify + Railway) — set VITE_API_URL to the backend's full URL
// (e.g. https://your-backend.up.railway.app/api) to point at it.
import { SessionService } from '../services/SessionService';
const API_BASE = import.meta.env.VITE_API_URL || '/api';
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}
export function getSession() {
  return SessionService.get();
}
export function setSession(token, expiresAt) {
  SessionService.set(token, expiresAt);
}
export function clearSession() {
  SessionService.clear();
}
class ApiError extends Error {
  status;
  body;
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {})
  };
  const session = getSession();
  if (session) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  if (res.status === 401) {
    clearSession();
    onUnauthorized?.();
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText, data);
  }
  return data;
}
export const api = {
  get: path => request(path, {
    method: 'GET'
  }),
  post: (path, body) => request(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  }),
  put: (path, body) => request(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  }),
  patch: (path, body) => request(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: path => request(path, {
    method: 'DELETE'
  })
};
export { ApiError };