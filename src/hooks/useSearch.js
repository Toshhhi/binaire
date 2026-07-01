import { useState, useCallback, useRef, useEffect } from 'react';
import { searchTitles } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useOnlineStatus } from './useOnlineStatus';

export const useSearch = () => {
  const {
    idIndex,
    titleIndex,
    yearIndex,
    allMovies,
    isIndexing,
  } = useAppContext();
  const isOnline = useOnlineStatus();

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      searchControllerRef.current?.abort();
    };
  }, []);

  const searchLocal = useCallback((q) => {
    if (q.startsWith('tt')) {
      const match = idIndex.get(q);
      return match ? [match] : [];
    }

    const numericYear = parseInt(q, 10);
    if (!Number.isNaN(numericYear) && q.length === 4 && yearIndex.has(numericYear)) {
      return [...yearIndex.get(numericYear)].sort(
        (a, b) => b.rating.aggregateRating - a.rating.aggregateRating
      );
    }

    const keywords = q
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((k) => k.length >= 2);

    if (keywords.length === 0 || isIndexing) {
      return allMovies
        .filter((m) => m.primaryTitle.toLowerCase().includes(q))
        .sort((a, b) => b.rating.aggregateRating - a.rating.aggregateRating);
    }

    const lists = keywords.map((kw) => titleIndex.get(kw) || []);
    if (lists.some((list) => list.length === 0)) return [];

    lists.sort((a, b) => a.length - b.length);
    let intersect = [...lists[0]];

    for (let i = 1; i < lists.length; i++) {
      const matchSet = new Set(lists[i].map((m) => m.id));
      intersect = intersect.filter((m) => matchSet.has(m.id));
    }

    intersect.sort((a, b) => b.rating.aggregateRating - a.rating.aggregateRating);
    return intersect;
  }, [idIndex, titleIndex, yearIndex, allMovies, isIndexing]);

  const search = useCallback(async (queryText) => {
    const q = queryText.toLowerCase().trim();
    if (!q) {
      setResults([]);
      return;
    }

    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;

    setIsSearching(true);

    try {
      if (isOnline && !q.startsWith('tt') && q.length !== 4) {
        const data = await searchTitles(q, 50, controller.signal);
        if (controller.signal.aborted) return;

        if (data?.titles?.length) {
          setResults(data.titles);
          return;
        }
      }

      if (!controller.signal.aborted) {
        const local = searchLocal(q);
        setResults(local.slice(0, 50));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const local = searchLocal(q);
      setResults(local.slice(0, 50));
    } finally {
      if (searchControllerRef.current === controller && !controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [isOnline, searchLocal]);

  return { results, search, isSearching, isIndexing };
};

export default useSearch;
