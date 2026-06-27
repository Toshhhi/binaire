import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useSearch } from '../hooks/useSearch';
import './SearchBar.css';

export const SearchBar = ({ onResults, onQueryChange }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('title'); // 'title' | 'id' | 'year'
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);
  const { results, search } = useSearch();

  // Build the effective query based on type prefix
  const buildEffectiveQuery = useCallback((raw, type) => {
    if (!raw.trim()) return '';
    if (type === 'id') {
      // Ensure it starts with 'tt'
      return raw.startsWith('tt') ? raw : `tt${raw}`;
    }
    return raw.trim();
  }, []);

  // Run search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      onResults?.([]);
      onQueryChange?.('');
      return;
    }
    const effective = buildEffectiveQuery(debouncedQuery, searchType);
    search(effective);
    onQueryChange?.(effective);
  }, [debouncedQuery, searchType, search, buildEffectiveQuery, onResults, onQueryChange]);

  // Propagate results up whenever they change
  useEffect(() => {
    if (onResults) onResults(results);
    if (results.length > 0 && query.trim()) {
      setShowDropdown(true);
    }
  }, [results, onResults, query]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) setShowDropdown(true);
    else setShowDropdown(false);
  };

  const handleSuggestionClick = (movie) => {
    setQuery(movie.primaryTitle);
    setShowDropdown(false);
    if (onResults) onResults([movie]);
  };

  const placeholder =
    searchType === 'id' ? 'Enter IMDb ID (e.g. tt0000123)' :
    searchType === 'year' ? 'Enter release year (e.g. 2010)' :
    'Search movies, TV shows…';

  return (
    <div className="searchBarContainer" ref={containerRef}>
      <div className="searchInputsRow">
        <div className="searchIconWrapper">
          <Search size={18} />
        </div>
        <input
          className="searchInput"
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
        <select
          className="searchTypeSelect"
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value);
            setQuery('');
            onResults?.([]);
          }}
          aria-label="Search type"
        >
          <option value="title">Title</option>
          <option value="id">IMDb ID</option>
          <option value="year">Year</option>
        </select>
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            className="autocompleteDropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {results.slice(0, 8).map((movie) => (
              <div
                key={movie.id}
                className="autocompleteItem"
                onClick={() => handleSuggestionClick(movie)}
              >
                <img
                  src={movie.primaryImage?.url}
                  alt={movie.primaryTitle}
                  className="autocompletePoster"
                />
                <div className="autocompleteDetails">
                  <span className="autocompleteTitle">{movie.primaryTitle}</span>
                  <span className="autocompleteMeta">
                    <span className="autocompleteRating">
                      {(movie.rating?.aggregateRating * 10).toFixed(0)}%
                    </span>
                    {movie.startYear} · {movie.genres?.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
