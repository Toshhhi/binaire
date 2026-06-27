import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './MovieCard.css';

export const MovieCard = React.memo(({ movie, showRemoveFromHistory = false }) => {
  const { watchlist, addToWatchlist, removeFromWatchlist, addToHistory, addToast } = useAppContext();

  const isInWatchlist = useMemo(() => {
    return watchlist.some(item => item.id === movie.id);
  }, [watchlist, movie.id]);

  const handlePlay = (e) => {
    e.stopPropagation();
    addToHistory(movie);
    addToast(`Now playing "${movie.primaryTitle}"`, 'success');
  };

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  return (
    <motion.div
      className="movieCard"
      whileHover={{ 
        scale: 1.08, 
        y: -5,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      layout
    >
      <img
        src={movie.primaryImage?.url}
        alt={movie.primaryTitle}
        loading="lazy"
        className="cardPoster"
      />
      
      <div className="cardInfoOverlay">
        <h4 className="cardTitle">{movie.primaryTitle}</h4>
        
        <div className="cardMeta">
          <span className="cardRating">{(movie.rating?.aggregateRating * 10).toFixed(0)}% Match</span>
          <span className="cardYear">{movie.startYear}</span>
        </div>
        
        <div className="cardGenres">
          {movie.genres?.join(' • ')}
        </div>
        
        <div className="cardButtons">
          <button className="cardBtn playBtn" onClick={handlePlay} title="Play">
            <Play size={14} fill="currentColor" />
          </button>
          
          <button className="cardBtn" onClick={handleWatchlistToggle} title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}>
            {isInWatchlist ? <Check size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// Give displayName for React.memo debug-ability
MovieCard.displayName = 'MovieCard';

export default MovieCard;
