import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        ref={overlayRef}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
      ></div>
      
      {/* Content */}
      <div className="relative w-full max-w-lg transform transition-all">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};