import {
  getMoviesFromDB,
  saveMoviesToDB,
  replaceMoviesInDB,
  getMovieFromDBById,
} from './indexedDB';
import { normalizeTitle } from '../utils/normalizeTitle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.imdbapi.dev';
export const TARGET_CATALOG_SIZE = 10000;
const PAGE_DELAY_MS = 900;
const BATCH_SIZE = 5;
const DEFAULT_RATE_LIMIT_RETRY_MS = 60_000;
const CATALOG_PAGE_TOKEN_KEY = 'imdbapi.catalogPageToken';
let inMemoryCatalogPageToken = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readCatalogPageToken = () => {
  if (inMemoryCatalogPageToken) return inMemoryCatalogPageToken;
  if (typeof localStorage === 'undefined') return null;
  inMemoryCatalogPageToken = localStorage.getItem(CATALOG_PAGE_TOKEN_KEY);
  return inMemoryCatalogPageToken;
};

const writeCatalogPageToken = (pageToken) => {
  inMemoryCatalogPageToken = pageToken || null;
  if (typeof localStorage === 'undefined') return;

  if (pageToken) {
    localStorage.setItem(CATALOG_PAGE_TOKEN_KEY, pageToken);
  } else {
    localStorage.removeItem(CATALOG_PAGE_TOKEN_KEY);
  }
};

const getRetryAfterMs = (response) => {
  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) return DEFAULT_RATE_LIMIT_RETRY_MS;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(seconds * 1000, PAGE_DELAY_MS);
  }

  const retryDate = Date.parse(retryAfter);
  return Number.isNaN(retryDate)
    ? DEFAULT_RATE_LIMIT_RETRY_MS
    : Math.max(retryDate - Date.now(), PAGE_DELAY_MS);
};

class ApiRequestError extends Error {
  constructor(status, retryAfterMs = null) {
    super(`API error ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

const fetchWithRetry = async (url, options = {}, retries = 2, delayMs = 1200) => {
  const { signal } = options;

  for (let i = 0; i <= retries; i++) {
    try {
      if (signal?.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      }

      const errorText = await response.text().catch(() => '');
      const isRateLimited =
        response.status === 429 ||
        /(?:status|error|failed).*429|too many (?:network )?requests|rate.?limit/i.test(errorText);

      if (isRateLimited) {
        // Do not hammer a throttled upstream. The catalog sync scheduler will
        // retry after this cooldown and resume from the saved page token.
        throw new ApiRequestError(429, getRetryAfterMs(response));
      }

      if (response.status >= 500) {
        if (i === retries) {
          throw new ApiRequestError(response.status);
        }
        await delay(delayMs * (i + 1));
        continue;
      }

      throw new ApiRequestError(response.status);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      if (error.status === 429) throw error;
      if (i === retries) throw error;
      await delay(delayMs * (i + 1));
    }
  }
};

const buildTitlesUrl = (params = {}) => {
  const query = new URLSearchParams();
  const appendAll = (key, values) => {
    if (!values) return;
    (Array.isArray(values) ? values : [values]).forEach((value) => query.append(key, value));
  };

  appendAll('types', params.types);
  appendAll('genres', params.genres);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  if (params.pageToken) query.append('pageToken', params.pageToken);
  if (params.minVoteCount) query.append('minVoteCount', String(params.minVoteCount));
  return `${API_BASE_URL}/titles?${query.toString()}`;
};

const mergeById = (existing, incoming) => {
  const map = new Map();
  existing.forEach((item) => map.set(item.id, item));
  incoming.forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  return Array.from(map.values());
};

export const fetchPaginatedCatalog = async (
  onProgress,
  signal,
  maxTitles = TARGET_CATALOG_SIZE
) => {
  const collected = new Map();
  let pageToken = readCatalogPageToken();
  let emptyStreak = 0;
  let rateLimited = false;
  let retryAfterMs = null;

  while (collected.size < maxTitles && emptyStreak < 2) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    const url = buildTitlesUrl({
      types: ['MOVIE', 'TV_SERIES', 'TV_MINI_SERIES', 'TV_SPECIAL', 'TV_MOVIE'],
      sortBy: 'SORT_BY_POPULARITY',
      sortOrder: 'DESC',
      minVoteCount: 5000,
      pageToken,
    });

    let data;
    try {
      data = await fetchWithRetry(url, { signal });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      if (err.status === 429) {
        rateLimited = true;
        retryAfterMs = err.retryAfterMs || DEFAULT_RATE_LIMIT_RETRY_MS;
      }
      break;
    }

    const batch = (data?.titles || [])
      .map(normalizeTitle)
      .filter(Boolean);

    if (!batch.length) {
      emptyStreak += 1;
      break;
    }

    emptyStreak = 0;
    batch.forEach((title) => collected.set(title.id, title));
    onProgress?.(collected.size, 'api');

    if (!data.nextPageToken) {
      writeCatalogPageToken(null);
      break;
    }
    pageToken = data.nextPageToken;
    writeCatalogPageToken(pageToken);
    await delay(PAGE_DELAY_MS);
  }

  return {
    titles: Array.from(collected.values()),
    rateLimited,
    retryAfterMs,
  };
};

export const fetchTitlesByIds = async (ids, signal) => {
  const results = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }

    const chunk = ids.slice(i, i + BATCH_SIZE);
    const query = chunk.map((id) => `titleIds=${encodeURIComponent(id)}`).join('&');
    const url = `${API_BASE_URL}/titles:batchGet?${query}`;

    try {
      const data = await fetchWithRetry(url, { signal });
      const titles = (data?.titles || [])
        .map(normalizeTitle)
        .filter(Boolean);
      results.push(...titles);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }

    await delay(PAGE_DELAY_MS);
  }

  return results;
};

export const loadCatalog = async ({ signal, onProgress } = {}) => {
  const cached = (await getMoviesFromDB()).filter((title) => title.source === 'api');

  if (cached.length >= TARGET_CATALOG_SIZE) {
    onProgress?.(cached.length, 'cache');
    await replaceMoviesInDB(cached);
    return cached.slice(0, TARGET_CATALOG_SIZE);
  }

  let merged = [...cached];
  let rateLimited = false;
  let retryAfterMs = null;
  onProgress?.(merged.length, merged.length ? 'cache' : 'idle');

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const result = await fetchPaginatedCatalog(
        (count) => onProgress?.(count, 'api'),
        signal,
        TARGET_CATALOG_SIZE - merged.length
      );
      merged = mergeById(merged, result.titles);
      rateLimited = result.rateLimited;
      retryAfterMs = result.retryAfterMs;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  const catalog = merged.slice(0, TARGET_CATALOG_SIZE);
  await replaceMoviesInDB(catalog);
  onProgress?.(
    catalog.length,
    rateLimited ? 'partial' : 'done',
    rateLimited ? { retryAfterMs } : undefined
  );
  return catalog;
};

export const refreshCatalog = async ({ signal, onProgress } = {}) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = (await getMoviesFromDB()).filter((title) => title.source === 'api');
    await replaceMoviesInDB(cached);
    return cached;
  }

  const cached = (await getMoviesFromDB()).filter((title) => title.source === 'api');
  let merged = [...cached];
  let rateLimited = false;
  let retryAfterMs = null;

  try {
    const result = await fetchPaginatedCatalog(
      (count) => onProgress?.(count, 'refresh'),
      signal,
      Math.max(TARGET_CATALOG_SIZE - merged.length, 0)
    );
    merged = mergeById(merged, result.titles);
    rateLimited = result.rateLimited;
    retryAfterMs = result.retryAfterMs;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  const catalog = merged.slice(0, TARGET_CATALOG_SIZE);
  await replaceMoviesInDB(catalog);
  onProgress?.(
    catalog.length,
    rateLimited ? 'partial' : 'done',
    rateLimited ? { retryAfterMs } : undefined
  );
  return catalog;
};

export const seedMovieDatabase = loadCatalog;

export const getTitles = async (params = {}, signal) => {
  const url = buildTitlesUrl(params);

  try {
    const data = await fetchWithRetry(url, { signal });
    if (data?.titles) {
      const normalized = data.titles.map(normalizeTitle).filter(Boolean);
      saveMoviesToDB(normalized).catch(() => {});
      return { ...data, titles: normalized };
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return getTitlesLocal(params);
  }
};

export const getTitleById = async (id, signal) => {
  const url = `${API_BASE_URL}/titles/${id}`;

  try {
    const data = await fetchWithRetry(url, { signal });
    const normalized = normalizeTitle(data);
    if (normalized) {
      saveMoviesToDB([normalized]).catch(() => {});
    }
    return normalized || data;
  } catch (error) {
    if (error.name === 'AbortError') throw error;

    const movie = await getMovieFromDBById(id);
    if (movie) return movie;

    await loadCatalog({ signal });
    return getMovieFromDBById(id);
  }
};

export const searchTitles = async (searchQuery, limit = 50, signal) => {
  const url = `${API_BASE_URL}/search/titles?query=${encodeURIComponent(searchQuery)}&limit=${limit}`;

  try {
    const data = await fetchWithRetry(url, { signal });
    if (data?.titles) {
      return {
        ...data,
        titles: data.titles.map(normalizeTitle).filter(Boolean),
      };
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    return searchTitlesLocal(searchQuery, limit);
  }
};

const searchTitlesLocal = async (searchQuery, limit) => {
  const allMovies = await getMoviesFromDB();
  const dataset = allMovies.length ? allMovies : await loadCatalog();
  const query = searchQuery.toLowerCase().trim();

  const filtered = dataset.filter(
    (m) =>
      m.id.toLowerCase().includes(query) ||
      m.primaryTitle.toLowerCase().includes(query) ||
      String(m.startYear).includes(query)
  );

  return { titles: filtered.slice(0, limit) };
};

const getTitlesLocal = async (params) => {
  const allMovies = await getMoviesFromDB();
  const dataset = allMovies.length ? allMovies : await loadCatalog();
  let filtered = [...dataset];

  if (params.types) {
    filtered = filtered.filter((m) => m.type === params.types);
  }
  if (params.genres) {
    filtered = filtered.filter((m) => m.genres?.includes(params.genres));
  }

  if (params.sortBy) {
    filtered.sort((a, b) => {
      let valA;
      let valB;

      if (params.sortBy === 'SORT_BY_YEAR') {
        valA = a.startYear;
        valB = b.startYear;
      } else if (params.sortBy === 'SORT_BY_USER_RATING') {
        valA = a.rating?.aggregateRating || 0;
        valB = b.rating?.aggregateRating || 0;
      } else {
        valA = a.rating?.voteCount || 0;
        valB = b.rating?.voteCount || 0;
      }

      return params.sortOrder === 'DESC' ? valB - valA : valA - valB;
    });
  }

  const limit = 30;
  const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return {
    titles: paginatedItems,
    totalCount: filtered.length,
    nextPageToken: startIndex + limit < filtered.length ? String(page + 1) : null,
  };
};
