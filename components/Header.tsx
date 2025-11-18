import React from 'react';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm w-full border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-center items-center">
        <Logo className="h-12 w-auto" />
      </div>
    </header>
  );
};
