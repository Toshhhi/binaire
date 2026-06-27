import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import { RowSkeleton } from '../components/Skeleton';
import { useAppContext } from '../context/AppContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import './Search.css';

const PAGE_SIZE = 24;

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const Search = () => {
  const { allMovies, isDbLoading } = useAppContext();
  const [searchResults, setSearchResults] = useState(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleResults = useCallback((results) => {
    setSearchResults(results);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleQueryChange = useCallback((q) => {
    setActiveQuery(q);
    setVisibleCount(PAGE_SIZE);
    if (!q) setSearchResults(null);
  }, []);

  const defaultMovies = useMemo(() => {
    if (!allMovies.length) return [];
    return [...allMovies]
      .sort((a, b) => b.rating.aggregateRating - a.rating.aggregateRating);
  }, [allMovies]);

  const hasQuery = activeQuery.trim().length > 0;
  const displayList = hasQuery ? (searchResults || []) : defaultMovies;
  const visibleMovies = displayList.slice(0, visibleCount);
  const hasMore = visibleCount < displayList.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, displayList.length));
  }, [displayList.length]);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    onLoadMore: loadMore,
    disabled: isDbLoading,
  });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeQuery]);

  const hasResults = hasQuery && searchResults !== null && searchResults.length > 0;
  const noResults = hasQuery && searchResults !== null && searchResults.length === 0;

  if (isDbLoading) {
    return (
      <div className="searchPage">
        <RowSkeleton count={6} />
      </div>
    );
  }

  return (
    <motion.div
      className="searchPage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="searchPageHeader">
        <h1 className="searchPageTitle">Search</h1>
        <p className="searchPageSubtitle">
          Look up titles by name, IMDb ID, or release year
        </p>
      </div>

      <SearchBar onResults={handleResults} onQueryChange={handleQueryChange} />

      {!hasQuery && (
        <div className="searchDefaultGrid">
          <h2 className="searchDefaultTitle">Top Rated</h2>
        </div>
      )}

      <AnimatePresence>
        {noResults && (
          <motion.div
            className="searchEmptyState"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <SearchIcon size={52} className="searchEmptyIcon" />
            <h2 className="searchEmptyTitle">Nothing matched "{activeQuery}"</h2>
            <p className="searchEmptyText">
              Try a different spelling, or search by IMDb ID (tt0111161) or year (1994).
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {(hasResults || !hasQuery) && displayList.length > 0 && (
        <motion.div
          className="searchResultsSection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={hasQuery ? activeQuery : 'browse'}
        >
          {hasQuery && (
            <div className="searchResultsHeader">
              <h2 className="searchResultsTitle">{displayList.length} results</h2>
              <span className="searchResultsCount">for "{activeQuery}"</span>
            </div>
          )}

          <motion.div
            className="searchGrid"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {visibleMovies.map((movie) => (
              <motion.div key={movie.id} variants={cardVariants}>
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </motion.div>

          {hasMore && (
            <div ref={sentinelRef} className="searchLoadMore">
              <span className="shimmer searchLoadMorePulse" />
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Search;
