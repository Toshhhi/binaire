import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './HeroBanner.css';

export const HeroBanner = ({ movie }) => {
  const { watchlist, addToWatchlist, removeFromWatchlist, addToHistory, addToast } = useAppContext();

  // Memoize whether the current hero item is in the user's watchlist
  const isInWatchlist = useMemo(() => {
    if (!movie) return false;
    return watchlist.some((item) => item.id === movie.id);
  }, [watchlist, movie]);

  if (!movie) return null;

  const handlePlay = () => {
    addToHistory(movie);
    addToast(`Now playing "${movie.primaryTitle}"`, 'success');
  };

  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  return (
    <div 
      className="heroBanner"
      style={{ backgroundImage: `url(${movie.backdropImage?.url || movie.primaryImage?.url})` }}
    >
      <div className="heroOverlay" />
      
      <motion.div 
        className="heroContent"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="topShowBadge">
          <span className="nLogo">N</span>
          <span>Featured</span>
        </div>
        
        <h1 className="heroTitle">{movie.primaryTitle}</h1>
        
        <div className="heroMeta">
          <span className="ratingPercent">
            {(movie.rating?.aggregateRating * 10).toFixed(0)}% Match
          </span>
          <span className="yearMeta">{movie.startYear}</span>
          <span className="genresMeta">{movie.genres?.join(', ')}</span>
        </div>
        
        <p className="heroPlot">{movie.plot}</p>
        
        <div className="heroButtons">
          <button className="heroBtn playBtn" onClick={handlePlay}>
            <Play size={18} fill="currentColor" />
            <span>Play</span>
          </button>
          
          <button className="heroBtn listBtn" onClick={handleWatchlistToggle}>
            {isInWatchlist ? <Check size={18} /> : <Plus size={18} />}
            <span>My List</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroBanner;
