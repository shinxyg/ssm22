const PRODUCTION_API_URL = 'https://acceptable-perception-production-dc68.up.railway.app';
const LOCAL_API_URL = 'http://localhost:5000';

const getBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If running in browser and not on localhost, use the production backend URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return PRODUCTION_API_URL;
    }
  }

  return LOCAL_API_URL;
};

export const API_BASE_URL = getBaseUrl();

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default API_BASE_URL;
