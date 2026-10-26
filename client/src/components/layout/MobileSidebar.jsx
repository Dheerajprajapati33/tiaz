import React, { useEffect } from 'react';
import Sidebar from './Sidebar.jsx';

export default function MobileSidebar({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 bg-white">
        <Sidebar onCloseMobile={onClose} />
      </div>
    </div>
  );
}
