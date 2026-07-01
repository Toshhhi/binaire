const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.imdbapi.dev';
const DEFAULT_TIMEOUT = 10000;

const buildUrl = (path, query = '') => {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = query ? `?${query}` : '';
  return `${API_BASE}${sanitizedPath}${queryString}`;
};

const fetchWithTimeout = async (url, { signal, timeout = DEFAULT_TIMEOUT } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const finalSignal = signal || controller.signal;

  try {
    const response = await fetch(url, { signal: finalSignal });
    clearTimeout(timer);

    const text = await response.text().catch(() => null);
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        body: data,
      };
    }

    return { ok: true, data };
  } catch (error) {
    clearTimeout(timer);
    if (error?.name === 'AbortError') {
      return { ok: false, error: 'Request aborted due to timeout or navigation.' };
    }
    return { ok: false, error: error?.message || 'Network request failed.' };
  }
};

export const fetchTitles = async (query = '') => {
  const url = buildUrl('/titles', query);
  return fetchWithTimeout(url);
};

export const searchTitles = fetchTitles;
export const fetchTitleById = async (id) => {
  const url = buildUrl(`/title/${encodeURIComponent(id)}`);
  return fetchWithTimeout(url);
};

export default { searchTitles,  fetchTitles, fetchTitleById, API_BASE };