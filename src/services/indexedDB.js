const DB_NAME = 'NetflixOfflineDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store 1: Movies list cache
      if (!db.objectStoreNames.contains('movies')) {
        db.createObjectStore('movies', { keyPath: 'id' });
      }

      // Store 2: Watchlist
      if (!db.objectStoreNames.contains('watchlist')) {
        db.createObjectStore('watchlist', { keyPath: 'id' });
      }

      // Store 3: Watch History
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
    };
  });
};

// --- Movie Caching Operations ---

export const saveMoviesToDB = async (movies) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movies', 'readwrite');
    const store = transaction.objectStore('movies');

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = (event) => {
      reject(event.target.error);
    };

    movies.forEach(movie => {
      store.put(movie);
    });
  });
};

export const replaceMoviesInDB = async (movies) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movies', 'readwrite');
    const store = transaction.objectStore('movies');

    store.clear();
    movies.forEach((movie) => {
      store.put(movie);
    });

    transaction.oncomplete = () => {
      resolve(true);
    };

    transaction.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getMoviesFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movies', 'readonly');
    const store = transaction.objectStore('movies');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

export const getMovieFromDBById = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movies', 'readonly');
    const store = transaction.objectStore('movies');
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// --- Watchlist Operations ---

export const saveWatchlistItem = async (movie) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('watchlist', 'readwrite');
    const store = transaction.objectStore('watchlist');
    const request = store.put(movie);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const removeWatchlistItem = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('watchlist', 'readwrite');
    const store = transaction.objectStore('watchlist');
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getWatchlistFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('watchlist', 'readonly');
    const store = transaction.objectStore('watchlist');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
};

// --- Watch History Operations ---

export const saveHistoryItem = async (historyEntry) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('history', 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.put(historyEntry);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const removeHistoryItem = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('history', 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getHistoryFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('history', 'readonly');
    const store = transaction.objectStore('history');
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort history items by watchedAt desc
      const sorted = (request.result || []).sort((a, b) => b.watchedAt - a.watchedAt);
      resolve(sorted);
    };
    request.onerror = (event) => reject(event.target.error);
  });
};

export const clearAllHistoryFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('history', 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(event.target.error);
  });
};
