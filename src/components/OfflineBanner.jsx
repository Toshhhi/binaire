import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock3 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppContext } from '../context/AppContext';
import './OfflineBanner.css';

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const { syncStatus } = useAppContext();
  const [visible, setVisible] = React.useState(false);
  const [mode, setMode] = React.useState('offline');

  React.useEffect(() => {
    if (!isOnline) {
      setMode('offline');
      setVisible(true);
      return;
    }

    if (mode === 'offline') {
      setMode('online');
      const timer = setTimeout(() => setVisible(false), 2800);
      return () => clearTimeout(timer);
    }
  }, [isOnline, mode]);

  React.useEffect(() => {
    if (isOnline && (syncStatus === 'refresh' || syncStatus === 'api')) {
      setMode('syncing');
      setVisible(true);
    } else if (isOnline && syncStatus === 'partial') {
      setMode('partial');
      setVisible(true);
    } else if (syncStatus === 'done' && mode === 'syncing') {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, isOnline, mode]);

  const message =
    mode === 'offline'
      ? "You're offline. Browsing from your saved catalog."
      : mode === 'partial'
        ? 'Catalog partially loaded due to API limits. Syncing will continue automatically.'
      : mode === 'syncing'
        ? 'Connection restored — refreshing catalog…'
        : 'Back online. Catalog is up to date.';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`offlineBanner ${mode === 'offline' || mode === 'partial' ? 'offline' : 'online'}`}
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          {mode === 'offline'
            ? <WifiOff className="icon" />
            : mode === 'partial'
              ? <Clock3 className="icon" />
              : <Wifi className="icon" />}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
