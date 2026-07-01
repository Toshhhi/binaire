import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  login as authLogin,
  signup as authSignup,
  logout as authLogout,
  subscribeToAuthChanges,
} from '../services/firebase';

const AuthContext = createContext(null);

const mapFirebaseError = (code) => {
  if (code.includes('auth/email-already-in-use')) {
    return 'This email address is already in use.';
  }
  if (code.includes('auth/user-not-found') || code.includes('EMAIL_NOT_FOUND')) {
    return 'No user found with that email.';
  }
  if (code.includes('auth/wrong-password') || code.includes('INVALID_PASSWORD')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters.';
  }
  if (code.includes('auth/invalid-email')) {
    return 'The email address is invalid.';
  }
  return code || 'An authentication error occurred. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      if (!mounted) return;
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      return await authLogin(email, password);
    } catch (err) {
      const friendly = mapFirebaseError(err.message || 'auth/error');
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signup = async (email, password) => {
    setError(null);
    try {
      return await authSignup(email, password);
    } catch (err) {
      const friendly = mapFirebaseError(err.message || 'auth/error');
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
