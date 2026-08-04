import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // Render's free tier can take 30-50s to wake a sleeping instance.
  // Default axios timeout is effectively unlimited in the browser, but we
  // cap it here so a genuinely dead backend still fails fast-ish, while
  // giving cold starts enough room to succeed.
  timeout: 60000,
});

// Pings the backend as soon as the app loads so it's already awake by the
// time the user reaches something that needs it (e.g. Manifest Bro).
// Fire-and-forget — failures here are silently ignored.
export function wakeBackend() {
  api.get('/health').catch(() => {});
}

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;