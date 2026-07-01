import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { fetchTitles } from '../services/api';

const AppContext = createContext(null);

const CATALOG_KEY = 'binaire_catalog';
const WATCHLIST_KEY = 'binaire_watchlist';
const HISTORY_KEY = 'binaire_watch_history';

const getStorageKey = (base, userId) => `${base}_${userId || 'guest'}`;

const buildSearchIndices = (dataset) => {
  const idIndex = new Map();
  const titleIndex = new Map();
  const yearIndex = new Map();

  dataset.forEach((movie) => {
    if (!movie) return;
    const id = movie.id || movie?.title?.id;
    const title = movie.title || movie?.title?.titleText?.text || movie.name;
    const year = movie.year || movie?.releaseYear?.year;

    if (id) {
      idIndex.set(String(id).toLowerCase(), movie);
    }

    if (title) {
      const normalized = String(title).trim().toLowerCase();
      if (!titleIndex.has(normalized)) {
        titleIndex.set(normalized, []);
      }
      titleIndex.get(normalized).push(movie);
    }

    if (year) {
      const yearKey = String(year);
      if (!yearIndex.has(yearKey)) {
        yearIndex.set(yearKey, []);
      }
      yearIndex.get(yearKey).push(movie);
    }
  });

  return { idIndex, titleIndex, yearIndex };
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [watchlist, setWatchlist] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [toasts, setToasts] = useState([]);

  const toastTimers = useRef(new Map());
  const wasOffline = useRef(false);

  const storageUserId = user?.uid || 'guest';

  const addToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      toastTimers.current.delete(id);
    }, 4500);

    toastTimers.current.set(id, timer);
  }, []);

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  const persistMovies = useCallback((movies) => {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(movies));
    } catch {}
  }, []);

  const persistWatchlist = useCallback(
    (list) => {
      try {
        localStorage.setItem(
          getStorageKey(WATCHLIST_KEY, storageUserId),
          JSON.stringify(list),
        );
      } catch {}
    },
    [storageUserId],
  );

  const persistHistory = useCallback(
    (history) => {
      try {
        localStorage.setItem(
          getStorageKey(HISTORY_KEY, storageUserId),
          JSON.stringify(history),
        );
      } catch {}
    },
    [storageUserId],
  );

  const applyCatalog = useCallback(
    (movies) => {
      setAllMovies(movies);
      persistMovies(movies);
    },
    [persistMovies],
  );

  useEffect(() => {
    const cached = safeParse(localStorage.getItem(CATALOG_KEY)) || [];
    setAllMovies(Array.isArray(cached) ? cached : []);
    setIsDbLoading(false);

    const watchlistCache =
      safeParse(localStorage.getItem(getStorageKey(WATCHLIST_KEY, storageUserId))) || [];
    setWatchlist(Array.isArray(watchlistCache) ? watchlistCache : []);

    const historyCache =
      safeParse(localStorage.getItem(getStorageKey(HISTORY_KEY, storageUserId))) || [];
    setWatchHistory(Array.isArray(historyCache) ? historyCache : []);
  }, [storageUserId]);

  const runCatalogLoad = useCallback(
    async (force = false) => {
      if (!isOnline) return;
      setSyncStatus('loading');

      const query =
        'types=MOVIE&types=TV_SERIES&types=TV_MINI_SERIES&types=TV_SPECIAL&types=TV_MOVIE&sortBy=SORT_BY_POPULARITY&sortOrder=DESC&minVoteCount=5000';

      const result = await fetchTitles(query);

      if (!result.ok) {
        setSyncStatus('error');
        addToast('Unable to refresh catalog. Showing offline cache.', 'warning');
        return;
      }

      const movies = Array.isArray(result.data?.titles)
        ? result.data.titles
        : Array.isArray(result.data?.results)
        ? result.data.results
        : Array.isArray(result.data)
        ? result.data
        : [];

      applyCatalog(movies);
      setSyncStatus('synced');
      if (force) {
        addToast('Content updated after reconnecting.', 'success');
      }
    },
    [addToast, applyCatalog, isOnline],
  );

  useEffect(() => {
    if (isOnline) {
      runCatalogLoad();
      return;
    }

    setSyncStatus('offline');
  }, [isOnline, runCatalogLoad]);

  useEffect(() => {
    if (!isOnline) {
      if (!wasOffline.current) {
        addToast('You are offline. Content may be stale.', 'warning');
        wasOffline.current = true;
      }
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      addToast('Back online. Refreshing data...', 'success');
      runCatalogLoad(true);
    }
  }, [addToast, isOnline, runCatalogLoad]);

  const getMovieId = (movie) => movie?.id || movie?.title?.id || movie?.tconst || null;

  const addToWatchlist = useCallback(
    (movie) => {
      const nextList = (prev) => {
        const id = getMovieId(movie);
        if (!id) return prev;
        const filtered = prev.filter((item) => getMovieId(item) !== id);
        return [...filtered, movie];
      };

      setWatchlist((prev) => {
        const next = nextList(prev);
        persistWatchlist(next);
        return next;
      });

      addToast('Added to watchlist', 'success');
    },
    [addToast, persistWatchlist],
  );

  const removeFromWatchlist = useCallback(
    (movieId) => {
      setWatchlist((prev) => {
        const next = prev.filter((item) => getMovieId(item) !== String(movieId));
        persistWatchlist(next);
        return next;
      });
      addToast('Removed from watchlist', 'info');
    },
    [addToast, persistWatchlist],
  );

  const addToHistory = useCallback(
    (movie) => {
      const nextHistory = (prev) => {
        const id = getMovieId(movie);
        if (!id) return prev;
        const filtered = prev.filter((item) => getMovieId(item) !== id);
        return [movie, ...filtered].slice(0, 50);
      };

      setWatchHistory((prev) => {
        const next = nextHistory(prev);
        persistHistory(next);
        return next;
      });

      addToast('Added to watch history', 'success');
    },
    [addToast, persistHistory],
  );

  const removeFromHistory = useCallback(
    (movieId) => {
      setWatchHistory((prev) => {
        const next = prev.filter((item) => getMovieId(item) !== String(movieId));
        persistHistory(next);
        return next;
      });
      addToast('Removed from watch history', 'info');
    },
    [addToast, persistHistory],
  );

  const clearHistory = useCallback(() => {
    setWatchHistory([]);
    persistHistory([]);
    addToast('Watch history cleared', 'info');
  }, [addToast, persistHistory]);

  const searchIndices = useMemo(() => buildSearchIndices(allMovies), [allMovies]);

  const value = {
    watchlist,
    watchHistory,
    allMovies,
    isDbLoading,
    syncStatus,
    toasts,
    addToast,
    addToWatchlist,
    removeFromWatchlist,
    addToHistory,
    removeFromHistory,
    clearHistory,
    ...searchIndices,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};