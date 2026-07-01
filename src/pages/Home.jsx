import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import HeroBanner from '../components/HeroBanner';
import MovieRow from '../components/MovieRow';
import { HeroSkeleton, RowSkeleton } from '../components/Skeleton';
import { useAppContext } from '../context/AppContext';
import './Home.css';

const Home = () => {
  const { allMovies, isDbLoading, watchHistory } = useAppContext();

  // Derive all curated rows from the allMovies flat list (memoized)
  const rows = useMemo(() => {
    if (!allMovies.length) return null;

    // Hero: the highest-rated movie with a backdrop image
    const heroMovie = [...allMovies]
      .filter((m) => m.backdropImage?.url)
      .sort(
        (a, b) =>
          (b.rating?.aggregateRating || 0) - (a.rating?.aggregateRating || 0),
      )[0] || allMovies[0];

    // Trending: movies with highest vote counts
    const trending = [...allMovies]
      .sort((a, b) => (b.rating?.voteCount || 0) - (a.rating?.voteCount || 0))
      .slice(0, 30);

    // Popular: highest aggregate rating
    const popular = [...allMovies]
      .sort((a, b) => (b.rating?.aggregateRating || 0) - (a.rating?.aggregateRating || 0))
      .slice(0, 30);

    // Movies only
    const movies = allMovies
      .filter((m) => String(m.type || '').toLowerCase() === 'movie')
      .sort((a, b) => (b.startYear || 0) - (a.startYear || 0))
      .slice(0, 30);

    // TV Shows only
    const tvShows = allMovies
      .filter((m) => String(m.type || '').toLowerCase().includes('tv'))
      .sort((a, b) => (b.rating?.aggregateRating || 0) - (a.rating?.aggregateRating || 0))
      .slice(0, 30);

    // Action genre
    const action = allMovies
      .filter(m => m.genres?.includes('Action'))
      .sort((a, b) => b.rating.aggregateRating - a.rating.aggregateRating)
      .slice(0, 30);

    // Sci-Fi genre
    const scifi = allMovies
      .filter(m => m.genres?.includes('Sci-Fi'))
      .sort((a, b) => b.rating.aggregateRating - a.rating.aggregateRating)
      .slice(0, 30);

    // New releases (highest start year)
    const newReleases = [...allMovies]
      .sort((a, b) => b.startYear - a.startYear)
      .slice(0, 30);

    return { heroMovie, trending, popular, movies, tvShows, action, scifi, newReleases };
  }, [allMovies]);

  if (isDbLoading || !rows) {
    return (
      <div className="homePage">
        <HeroSkeleton />
        <RowSkeleton count={6} />
        <RowSkeleton count={6} />
        <RowSkeleton count={6} />
      </div>
    );
  }

  return (
    <motion.div
      className="homePage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <HeroBanner movie={rows.heroMovie} />

      <div className="homeRows">
        {watchHistory.length > 0 && (
          <MovieRow title="Continue Watching" movies={watchHistory.slice(0, 20)} />
        )}
        <MovieRow title="Trending Now" movies={rows.trending} />
        <MovieRow title="Popular on Binaire" movies={rows.popular} />
        <MovieRow title="Movies" movies={rows.movies} />
        <MovieRow title="TV Shows" movies={rows.tvShows} />
        <MovieRow title="Action & Adventure" movies={rows.action} />
        <MovieRow title="Sci-Fi" movies={rows.scifi} />
        <MovieRow title="New This Week" movies={rows.newReleases} />
      </div>
    </motion.div>
  );
};

export default Home;
