/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL, e.g. https://your-backend.up.railway.app/api. Falls back to same-origin "/api" if unset (works with the local Vite dev proxy). */
  readonly VITE_API_URL?: string;
  /** WebSocket backend origin. Falls back to VITE_API_URL's origin, then same-origin. */
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
