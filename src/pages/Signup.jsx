import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signup, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password);
      navigate('/', { replace: true });
    } catch {
      // Error already set in context
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="authPage">
      <div className="authOverlay" />
      <motion.div
        className="authCard"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="authLogo">BINAIRE</div>
        <h1 className="authTitle">Create Account</h1>

        {displayError && (
          <div className="authError">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        <form className="authForm" onSubmit={handleSubmit}>
          <div className="authInputGroup">
            <label className="authLabel" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              className="authInput"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="authInputGroup">
            <label className="authLabel" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="authInput"
              type="password"
              placeholder="Create a password (min. 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="authInputGroup">
            <label className="authLabel" htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              className="authInput"
              type="password"
              placeholder="Confirm your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button className="authSubmitBtn" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Creating account…</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="authFooter">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
