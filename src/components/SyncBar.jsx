import React from 'react';
import { useAppContext } from '../context/AppContext';
import './SyncBar.css';

const SyncBar = () => {
  const { isDbLoading, syncStatus, syncCount, catalogTarget } = useAppContext();

  if (!isDbLoading && syncStatus !== 'refresh' && syncStatus !== 'api' && syncStatus !== 'loading') {
    return null;
  }

  const progress = Math.min(100, Math.round((syncCount / catalogTarget) * 100));

  return (
    <div className="syncBar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="syncBarFill" style={{ width: `${Math.max(progress, 4)}%` }} />
    </div>
  );
};

export default SyncBar;
