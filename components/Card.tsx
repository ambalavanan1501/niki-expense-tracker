import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl ${className}`}>
      {children}
    </div>
  );
};
