import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const getInitials = (user) => {
  if (user?.displayName) {
    return user.displayName.slice(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return 'U';
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const initials = useMemo(() => getInitials(user), [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navLeft">
        <Link to="/" className="logo">
          BINAIRE
        </Link>
        {user && (
          <ul className="navLinks">
            <li>
              <NavLink to="/" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/search" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>
                Search
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => `navLink ${isActive ? 'active' : ''}`}>
                My List
              </NavLink>
            </li>
          </ul>
        )}
      </div>

      {user && (
        <div className="navRight">
          <Link to="/search" className="searchIconLink" aria-label="Search">
            <Search size={20} />
          </Link>

          <div className="avatarMenu" ref={dropdownRef}>
            <button
              type="button"
              className="avatarInitials"
              onClick={() => setShowDropdown((prev) => !prev)}
              aria-label="Account menu"
            >
              {initials}
            </button>

            {showDropdown && (
              <div className="profileDropdown">
                <Link to="/profile" className="dropdownItem" onClick={() => setShowDropdown(false)}>
                  <User size={16} />
                  <span>Account</span>
                </Link>
                <Link to="/profile#watchlist" className="dropdownItem" onClick={() => setShowDropdown(false)}>
                  <Heart size={16} />
                  <span>Watchlist</span>
                </Link>
                <div className="dropdownDivider" />
                <button type="button" className="dropdownItem" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
