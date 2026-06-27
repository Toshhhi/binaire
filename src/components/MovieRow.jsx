import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import './MovieRow.css';

// Intersection Observer Card Wrapper for virtualization
const ObservedCard = ({ movie }) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Disconnect once intersecting to keep card loaded
        }
      },
      {
        root: null, // default viewport
        rootMargin: '150px', // Trigger load 150px before entering viewport
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={cardRef} className="cardWrapper" style={{ aspectRatio: '2/3' }}>
      {isIntersecting ? (
        <MovieCard movie={movie} />
      ) : (
        <div 
          className="shimmer" 
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '4px',
            backgroundColor: '#232323' 
          }} 
        />
      )}
    </div>
  );
};

export const MovieRow = ({ title, movies = [] }) => {
  const sliderRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  // Monitor scroll offset to conditionally show left slider arrow
  const handleScroll = () => {
    if (sliderRef.current) {
      setShowLeftArrow(sliderRef.current.scrollLeft > 10);
    }
  };

  const scroll = (direction) => {
    if (sliderRef.current) {
      const { clientWidth, scrollLeft } = sliderRef.current;
      const offset = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      sliderRef.current.scrollTo({
        left: offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="movieRowContainer">
      <h2 className="rowTitle">{title}</h2>
      
      {movies.length === 0 ? (
        <p className="emptyRowMessage">No titles found in this list.</p>
      ) : (
        <div className="sliderWrapper">
          {showLeftArrow && (
            <button className="rowArrow left" onClick={() => scroll('left')} aria-label="Slide Left">
              <ChevronLeft size={24} />
            </button>
          )}

          <div 
            className="sliderContainer" 
            ref={sliderRef}
            onScroll={handleScroll}
          >
            {movies.map((movie) => (
              <ObservedCard key={movie.id} movie={movie} />
            ))}
          </div>

          <button className="rowArrow right" onClick={() => scroll('right')} aria-label="Slide Right">
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieRow;
