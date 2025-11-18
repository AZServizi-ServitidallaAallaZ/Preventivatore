import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} A.Z. Servizi - Servizi dalla A alla Z snc</p>
      </div>
    </footer>
  );
};
