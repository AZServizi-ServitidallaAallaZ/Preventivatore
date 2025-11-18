import React from 'react';
import { Logo } from './Logo';

interface LoaderProps {
    message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "Analisi in corso..." }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 h-full">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-t-teal-600 border-slate-200 rounded-full animate-spin"></div>
        <div className="absolute inset-2 flex items-center justify-center text-teal-600 animate-pulse">
            <Logo className="h-8 w-auto" />
        </div>
      </div>
      <p className="text-slate-600 font-semibold text-lg pt-4">{message}</p>
      <p className="text-sm text-slate-500">Potrebbe richiedere qualche istante.</p>
    </div>
  );
};
