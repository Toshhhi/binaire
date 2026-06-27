import { useState, useEffect } from 'react';
import { getTitles } from '../services/api';

export const useMovies = (params = {}) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Serialize params object to track changes deeply in dependency array
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);
      try {
        const parsedParams = JSON.parse(paramsKey);
        const data = await getTitles(parsedParams, signal);
        
        if (data && data.titles) {
          setMovies(data.titles);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // Ignore abort signals since they are normal component lifecycles
          return;
        }
        console.error('Error fetching movies in hook:', err);
        setError(err.message || 'Failed to fetch movies');
      } finally {
        // Only set loading false if request wasn't cancelled to avoid state updates on unmounted component
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMovieData();

    return () => {
      // Abort the fetch request if component unmounts or parameters change
      controller.abort();
    };
  }, [paramsKey]);

  return { movies, loading, error };
};
