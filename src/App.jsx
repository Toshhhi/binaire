import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import SyncBar from './components/SyncBar';
import Toast from './components/Toast';
import Loader from './components/Loader';

const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

const App = () => {
  const location = useLocation();
  const isAuthRoute = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="appRoot">
      <OfflineBanner />
      {!isAuthRoute && <Navbar />}
      <Suspense fallback={<Loader fullPage />}>
        <Routes>
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <SyncBar />
      <Toast />
    </div>
  );
};

export default App;