import React from 'react';

interface OfferFileDisplayProps {
  file: File;
}

export const OfferFileDisplay: React.FC<OfferFileDisplayProps> = ({ file }) => {
  return (
    <div className="w-full mt-4 p-4 flex items-center gap-4 bg-slate-100/80 rounded-2xl border border-slate-200 animate-fade-in">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow-sm">
        <i className="fas fa-file-alt text-2xl text-slate-500"></i>
      </div>
      <div className="flex-grow overflow-hidden">
        <p className="font-semibold text-slate-700 truncate" title={file.name}>{file.name}</p>
        <p className="text-sm text-slate-500">
          Dimensione: {(file.size / 1024).toFixed(2)} KB
        </p>
      </div>
    </div>
  );
};