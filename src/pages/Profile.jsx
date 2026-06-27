import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Heart, Clock, X, BookOpen } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import './Profile.css';

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.38 },
  }),
};

const getInitials = (user) => {
  if (user?.displayName) return user.displayName.slice(0, 2).toUpperCase();
  if (user?.email) return user.email.slice(0, 2).toUpperCase();
  return 'ME';
};

const Profile = () => {
  const { user, logout } = useAuth();
  const {
    watchlist,
    watchHistory,
    removeFromWatchlist,
    removeFromHistory,
    clearHistory,
  } = useAppContext();
  const navigate = useNavigate();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Member';
  const initials = useMemo(() => getInitials(user), [user]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [logout, navigate]);

  return (
    <motion.div
      className="profilePage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="profileUserCard"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="profileAvatarInitials">{initials}</div>

        <div className="profileUserInfo">
          <h1 className="profileDisplayName">{displayName}</h1>
          <p className="profileEmail">{user?.email}</p>
          <div className="profileBadges">
            <span className="profileBadge red">Standard</span>
            <span className="profileBadge">{watchlist.length} saved</span>
            <span className="profileBadge">{watchHistory.length} watched</span>
          </div>
        </div>

        <button type="button" className="profileLogoutBtn" onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      </motion.div>

      <motion.div
        className="profileSection"
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        id="watchlist"
      >
        <div className="profileSectionHeader">
          <h2 className="profileSectionTitle">
            <Heart size={20} />
            Watchlist
            <span className="profileSectionCount">{watchlist.length}</span>
          </h2>
        </div>

        {watchlist.length === 0 ? (
          <div className="profileEmpty">
            <BookOpen size={40} className="profileEmptyIcon" />
            <h3 className="profileEmptyTitle">Nothing saved yet</h3>
            <p className="profileEmptyText">
              Hit the + on any title to add it here.
            </p>
          </div>
        ) : (
          <div className="profileGrid">
            {watchlist.map((movie) => (
              <div key={movie.id} className="historyCardWrapper">
                <MovieCard movie={movie} />
                <button
                  type="button"
                  className="historyRemoveBtn"
                  onClick={() => removeFromWatchlist(movie.id)}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        className="profileSection"
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="profileSectionHeader">
          <h2 className="profileSectionTitle">
            <Clock size={20} />
            Recently watched
            <span className="profileSectionCount">{watchHistory.length}</span>
          </h2>
          {watchHistory.length > 0 && (
            <button type="button" className="profileClearBtn" onClick={clearHistory}>
              Clear
            </button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <div className="profileEmpty">
            <Clock size={40} className="profileEmptyIcon" />
            <h3 className="profileEmptyTitle">No history</h3>
            <p className="profileEmptyText">
              Titles you play will show up here.
            </p>
          </div>
        ) : (
          <div className="profileGrid">
            {watchHistory.map((movie) => (
              <div key={movie.id} className="historyCardWrapper">
                <MovieCard movie={movie} />
                <button
                  type="button"
                  className="historyRemoveBtn"
                  onClick={() => removeFromHistory(movie.id)}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Profile;
