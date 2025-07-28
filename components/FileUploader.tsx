
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploaderProps {
  id: string;
  onFileSelect: (file: File) => void;
  mainText?: string;
  subText?: string;
  acceptedFileTypes?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  id,
  onFileSelect,
  mainText = 'Click to upload',
  subText = 'Any file type (Images, Documents, etc.)',
  acceptedFileTypes = '*',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
        ${isDragging ? 'border-brand-green-neon bg-brand-accent' : 'border-brand-accent hover:border-brand-green-neon'}`}
    >
      <input
        type="file"
        id={id}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept={acceptedFileTypes}
      />
      <div className="tooltip-container">
        <label htmlFor={id} className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
            <UploadIcon />
            <p className="text-brand-text font-semibold">
            <span className="text-brand-green-neon">{mainText}</span> or drag and drop
            </p>
            <p className="text-xs text-brand-light">{subText}</p>
        </label>
        <span className="tooltip-text">Click this area to open a file selection dialog, or drag and drop a file directly onto it.</span>
      </div>
    </div>
  );
};