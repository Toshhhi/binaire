# Binaire

Netflix-style streaming UI built as a frontend hiring assessment. React 18, Vite, Firebase Auth, IndexedDB offline cache, and client-side catalog search.

## Run locally

```bash
npm install
cp .env.example .env   # optional — see below
npm run dev
```

Open http://localhost:3000

## Environment

Copy `.env.example` to `.env` and add Firebase credentials if you want real auth. Without them, the app falls back to local mock auth (any email + 6+ char password works).

The IMDb API base URL defaults to `https://api.imdbapi.dev`. On first load the app paginates real titles from the API and caches them in IndexedDB for offline browsing. If the API is rate-limited, the real titles fetched so far remain usable and syncing resumes automatically after the cooldown.

## Structure

```
src/
├── components/     UI (HeroBanner, MovieRow, SearchBar, etc.)
├── pages/          Home, Search, Profile, Login, Signup
├── hooks/          useMovies, useSearch, useDebounce, useInfiniteScroll, useOnlineStatus
├── context/        AuthContext, AppContext
├── services/       api.js, firebase.js, indexedDB.js
├── utils/          title normalization
└── styles/         global CSS + variables
```

## Notable choices

- **Catalog loading** — IndexedDB first for speed, then background API pagination with retry/backoff. Reconnect triggers a refresh.
- **Search** — Map indices for ID, year, and keyword lookup. Network search when online, local fallback when not.
- **Performance** — `React.memo`, lazy routes, IntersectionObserver card loading in rows, infinite scroll on Search.
- **Offline** — Fetched API titles are cached in IndexedDB; watchlist and history persist per browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
