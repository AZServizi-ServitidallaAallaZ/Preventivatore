import React from 'react';

interface FilePreviewProps {
  file: File;
  fileDataUrl: string;
  title: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, fileDataUrl, title }) => {
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="w-full mt-2 animate-fade-in">
      <h3 className="text-lg font-semibold mb-2 text-slate-700">{title}</h3>
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-100">
        {isPdf ? (
          <div className="w-full h-96 flex flex-col bg-slate-50 rounded-xl">
            <div className="flex-shrink-0 p-3 bg-slate-100 border-b border-slate-200 rounded-t-xl flex justify-between items-center">
                <p className="font-semibold text-slate-700 break-all truncate" title={file.name}>
                    <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                    {file.name}
                </p>
                <div className="flex items-center gap-2">
                    <a href={fileDataUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs bg-white text-slate-600 font-semibold rounded-md border border-slate-300 hover:bg-slate-50 transition-colors" title="Apri in una nuova scheda">
                        <i className="fas fa-external-link-alt"></i>
                    </a>
                    <a href={fileDataUrl} download={file.name} className="px-3 py-1 text-xs bg-white text-slate-600 font-semibold rounded-md border border-slate-300 hover:bg-slate-50 transition-colors" title="Scarica">
                        <i className="fas fa-download"></i>
                    </a>
                </div>
            </div>
            <div className="flex-grow h-full w-full">
              <iframe
                src={fileDataUrl}
                title={`Anteprima di ${file.name}`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        ) : (
          <img
            src={fileDataUrl}
            alt={title}
            className="w-full h-96 object-contain rounded-xl"
          />
        )}
      </div>
    </div>
  );
};