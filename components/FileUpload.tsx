import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  id: string;
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [disabled, onFileSelect]);

  const dragDropClasses = isDragging
    ? 'border-teal-500 bg-teal-50 scale-105'
    : 'border-slate-300 bg-slate-100/80 hover:border-teal-400';

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${dragDropClasses} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <i className="fas fa-cloud-upload-alt text-5xl text-slate-400 mb-4 transition-transform duration-300 group-hover:scale-110"></i>
          <p className="mb-2 text-slate-600">
            <span className="font-semibold text-teal-700">Clicca per caricare</span> o trascina il file
          </p>
          <p className="text-xs text-slate-500">PNG, JPG o PDF (max. 10MB)</p>
        </div>
        <input
          id={id}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/jpg, application/pdf"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};