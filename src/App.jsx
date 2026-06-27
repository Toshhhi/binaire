import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import SyncBar from './components/SyncBar';
import OfflineBanner from './components/OfflineBanner';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

const Home    = lazy(() => import('./pages/Home'));
const Search  = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const Login   = lazy(() => import('./pages/Login'));
const Signup  = lazy(() => import('./pages/Signup'));

const App = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <>
      <SyncBar />
      <OfflineBanner />
      {!isAuthRoute && <Navbar />}
      <Toast />

      {/* Animated page transitions via AnimatePresence keyed on route */}
      <Suspense fallback={<Loader fullPage />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>

            {/* Public routes */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
};

export default App;
