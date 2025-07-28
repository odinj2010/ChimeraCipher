
import React from 'react';
import { LoadingSpinner, ErrorIcon, FileIcon, DownloadIcon } from './icons';

interface ImagePreviewProps {
  title: string;
  fileInfo: {
    name: string;
    url: string | null;
    isImage: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
  placeholderText: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ title, fileInfo, isLoading, error, placeholderText }) => {
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center gap-2 text-brand-light">
          <LoadingSpinner />
          <span>Processing...</span>
        </div>
      );
    }

    if (error) {
       return (
         <div className="flex flex-col items-center gap-2 text-red-400 p-4 text-center">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      );
    }
    
    if (fileInfo) {
      if (fileInfo.isImage && fileInfo.url) {
        return <img src={fileInfo.url} alt={fileInfo.name} className="w-full h-full object-contain" />;
      } else {
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-brand-text">
            <FileIcon />
            <p className="font-semibold text-center break-all px-4">{fileInfo.name}</p>
            {fileInfo.url && (
              <div className="tooltip-container mt-2">
                <a
                  href={fileInfo.url}
                  download={fileInfo.name}
                  className="flex items-center gap-2 bg-brand-green-neon text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-300"
                >
                  <DownloadIcon />
                  Download File
                </a>
                <span className="tooltip-text">Download the final disentangled file to your local machine.</span>
              </div>
            )}
          </div>
        );
      }
    }

    return <p className="text-brand-accent">{placeholderText}</p>;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-brand-light mb-2">{title}</h3>
      <div className="w-full aspect-video bg-brand-primary rounded-lg flex items-center justify-center overflow-hidden border-2 border-brand-accent">
        {renderContent()}
      </div>
    </div>
  );
};