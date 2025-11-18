import React from 'react';

interface BillDisplayProps {
  file: File | null;
  fileDataUrl: string | null;
}

export const BillDisplay: React.FC<BillDisplayProps> = ({ file, fileDataUrl }) => {
  if (!file || !fileDataUrl) {
    return null;
  }

  const isPdf = file.type === 'application/pdf';

  return (
    <div className="w-full mt-4 animate-fade-in">
      <h3 className="text-lg font-semibold mb-3 text-slate-700">Anteprima Bolletta</h3>
      <div className="border border-slate-200/80 rounded-2xl p-2 overflow-hidden shadow-lg shadow-slate-200/60 bg-slate-100">
        {isPdf ? (
          <div className="w-full h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center bg-slate-50 rounded-xl p-4 text-center">
            <i className="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
            <p className="font-semibold text-slate-700 break-all">{file.name}</p>
            <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm">
              Per una visualizzazione ottimale, apri il documento in una nuova scheda o scaricalo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
               <a
                  href={fileDataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 gradient-bg text-white font-semibold rounded-lg shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300"
                >
                  <i className="fas fa-external-link-alt"></i> Apri PDF
               </a>
               <a
                  href={fileDataUrl}
                  download={file.name}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-300"
                >
                  <i className="fas fa-download"></i> Scarica
               </a>
            </div>
          </div>
        ) : (
          <img
            src={fileDataUrl}
            alt="Anteprima bolletta"
            className="w-full h-64 sm:h-80 md:h-96 object-contain rounded-xl"
          />
        )}
      </div>
    </div>
  );
};
