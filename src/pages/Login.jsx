import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      // Error is already set in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="authTitle">Sign In</h1>

        {error && (
          <div className="authError">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="authForm" onSubmit={handleSubmit}>
          <div className="authInputGroup">
            <label className="authLabel" htmlFor="login-email">Email</label>
            <input
              id="login-email"
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
            <label className="authLabel" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="authInput"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            className="authSubmitBtn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Signing in…</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="authFooter">
          New here?{' '}
          <Link to="/signup">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
