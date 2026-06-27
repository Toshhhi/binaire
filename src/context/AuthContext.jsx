import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, signup as authSignup, logout as authLogout, subscribeToAuthChanges } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      return await authLogin(email, password);
    } catch (err) {
      const friendlyMessage = getFriendlyAuthError(err.message);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const signup = async (email, password) => {
    setError(null);
    try {
      return await authSignup(email, password);
    } catch (err) {
      const friendlyMessage = getFriendlyAuthError(err.message);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getFriendlyAuthError = (code) => {
    if (code.includes('auth/email-already-in-use')) {
      return 'This email address is already in use.';
    }
    if (code.includes('auth/invalid-credential')) {
      return 'Incorrect email or password.';
    }
    if (code.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (code.includes('auth/invalid-email')) {
      return 'The email address is invalid.';
    }
    return code || 'An authentication error occurred. Please try again.';
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
