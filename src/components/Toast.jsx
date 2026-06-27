import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Toast.css';

export const Toast = () => {
  const { toasts } = useAppContext();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toastIcon" />;
      case 'error':
        return <AlertCircle className="toastIcon" />;
      default:
        return <Info className="toastIcon" />;
    }
  };

  return (
    <div className="toastContainer">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, x: 50, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            layout
          >
            {getIcon(toast.type)}
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
