import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  getWatchlistFromDB,
  saveWatchlistItem as dbSaveWatchlist,
  removeWatchlistItem as dbRemoveWatchlist,
  getHistoryFromDB,
  saveHistoryItem as dbSaveHistory,
  removeHistoryItem as dbRemoveHistory,
  clearAllHistoryFromDB,
} from '../services/indexedDB';
import { loadCatalog, refreshCatalog, TARGET_CATALOG_SIZE } from '../services/api';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

const buildSearchIndices = (dataset) => {
  const idIndex = new Map();
  const titleIndex = new Map();
  const yearIndex = new Map();

  dataset.forEach((movie) => {
    idIndex.set(movie.id.toLowerCase(), movie);

    if (movie.startYear) {
      if (!yearIndex.has(movie.startYear)) {
        yearIndex.set(movie.startYear, []);
      }
      yearIndex.get(movie.startYear).push(movie);
    }

    const words = movie.primaryTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/);

    words.forEach((word) => {
      if (word.length >= 2) {
        if (!titleIndex.has(word)) {
          titleIndex.set(word, []);
        }
        titleIndex.get(word).push(movie);
      }
    });
  });

  return { idIndex, titleIndex, yearIndex };
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const [watchlist, setWatchlist] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncCount, setSyncCount] = useState(0);

  const [idIndex, setIdIndex] = useState(new Map());
  const [titleIndex, setTitleIndex] = useState(new Map());
  const [yearIndex, setYearIndex] = useState(new Map());
  const [toasts, setToasts] = useState([]);

  const toastTimers = useRef(new Map());
  const catalogAbortRef = useRef(null);
  const catalogRetryTimer = useRef(null);
  const catalogRetryDelay = useRef(60_000);
  const wasOffline = useRef(false);

  const applyCatalog = useCallback((dataset) => {
    setAllMovies(dataset);
    const indices = buildSearchIndices(dataset);
    setIdIndex(indices.idIndex);
    setTitleIndex(indices.titleIndex);
    setYearIndex(indices.yearIndex);
    setIsIndexing(false);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 3200);

    toastTimers.current.set(id, timer);
  }, []);

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      clearTimeout(catalogRetryTimer.current);
      catalogAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setWatchHistory([]);
      return;
    }

    const loadUserData = async () => {
      try {
        const [dbWatchlist, dbHistory] = await Promise.all([
          getWatchlistFromDB(),
          getHistoryFromDB(),
        ]);
        setWatchlist(dbWatchlist);
        setWatchHistory(dbHistory);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };

    loadUserData();
  }, [user]);

  const runCatalogLoad = useCallback(async (mode = 'load') => {
    catalogAbortRef.current?.abort();
    const controller = new AbortController();
    catalogAbortRef.current = controller;

    setIsDbLoading(true);
    setSyncStatus(mode === 'refresh' ? 'refresh' : 'loading');
    let completionStatus = 'done';

    try {
      const loader = mode === 'refresh' ? refreshCatalog : loadCatalog;
      const dataset = await loader({
        signal: controller.signal,
        onProgress: (count, status, details) => {
          setSyncCount(count);
          setSyncStatus(status);
          completionStatus = status;
          if (status === 'partial' && details?.retryAfterMs) {
            catalogRetryDelay.current = details.retryAfterMs;
          }
        },
      });

      if (!controller.signal.aborted) {
        applyCatalog(dataset);
        setSyncCount(dataset.length);
        setSyncStatus(completionStatus === 'partial' ? 'partial' : 'done');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Catalog load failed:', err);
        setSyncStatus('error');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsDbLoading(false);
      }
    }
  }, [applyCatalog]);

  useEffect(() => {
    runCatalogLoad('load');
  }, [runCatalogLoad]);

  useEffect(() => {
    clearTimeout(catalogRetryTimer.current);

    if (!isOnline || syncStatus !== 'partial') return undefined;

    catalogRetryTimer.current = setTimeout(() => {
      runCatalogLoad('refresh');
    }, catalogRetryDelay.current);

    return () => clearTimeout(catalogRetryTimer.current);
  }, [isOnline, syncStatus, runCatalogLoad]);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      runCatalogLoad('refresh');
      addToast('Back online — catalog updated from cache.', 'success');
    }
  }, [isOnline, runCatalogLoad, addToast]);

  const addToWatchlist = useCallback(async (movie) => {
    if (!user) {
      addToast('Sign in to save titles to your list.', 'error');
      return;
    }

    if (watchlist.some((item) => item.id === movie.id)) return;

    try {
      await dbSaveWatchlist(movie);
      setWatchlist((prev) => [...prev, movie]);
      addToast(`Added "${movie.primaryTitle}" to your list.`, 'success');
    } catch (err) {
      console.error('Watchlist save error:', err);
      addToast('Could not save to watchlist.', 'error');
    }
  }, [user, watchlist, addToast]);

  const removeFromWatchlist = useCallback(async (movieId) => {
    if (!user) return;

    const movie = watchlist.find((item) => item.id === movieId);
    if (!movie) return;

    try {
      await dbRemoveWatchlist(movieId);
      setWatchlist((prev) => prev.filter((item) => item.id !== movieId));
      addToast(`Removed "${movie.primaryTitle}" from your list.`, 'info');
    } catch (err) {
      console.error('Watchlist remove error:', err);
    }
  }, [user, watchlist, addToast]);

  const addToHistory = useCallback(async (movie) => {
    if (!user) return;

    const historyEntry = { ...movie, watchedAt: Date.now() };

    try {
      await dbSaveHistory(historyEntry);
      setWatchHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== movie.id);
        return [historyEntry, ...filtered];
      });
    } catch (err) {
      console.error('History save error:', err);
    }
  }, [user]);

  const removeFromHistory = useCallback(async (movieId) => {
    if (!user) return;

    try {
      await dbRemoveHistory(movieId);
      setWatchHistory((prev) => prev.filter((item) => item.id !== movieId));
    } catch (err) {
      console.error('History delete error:', err);
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      await clearAllHistoryFromDB();
      setWatchHistory([]);
      addToast('Watch history cleared.', 'info');
    } catch (err) {
      console.error('History clear error:', err);
    }
  }, [user, addToast]);

  const value = {
    watchlist,
    watchHistory,
    allMovies,
    isDbLoading,
    isIndexing,
    syncStatus,
    syncCount,
    catalogTarget: TARGET_CATALOG_SIZE,
    idIndex,
    titleIndex,
    yearIndex,
    toasts,
    addToast,
    addToWatchlist,
    removeFromWatchlist,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshCatalog: () => runCatalogLoad('refresh'),
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
