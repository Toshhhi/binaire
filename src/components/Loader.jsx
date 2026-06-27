import React from 'react';
import './Loader.css';

export const Loader = ({ fullPage = false }) => {
  return (
    <div className={`loaderContainer ${fullPage ? 'fullPage' : ''}`}>
      <div className="spinner" />
    </div>
  );
};

export default Loader;
