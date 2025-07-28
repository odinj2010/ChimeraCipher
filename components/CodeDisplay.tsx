
import React, { useState, useEffect } from 'react';
import { CopyIcon, CheckIcon, LoadingSpinner, ErrorIcon } from './icons';

interface CodeDisplayProps {
  title: string;
  code: string;
  isLoading: boolean;
  placeholderText: string;
  error?: string | null;
  isClipboardSanitizerActive: boolean;
  onCopy?: () => void;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ title, code, isLoading, placeholderText, error, isClipboardSanitizerActive, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [copyTimeout, setCopyTimeout] = useState<number | null>(null);

  useEffect(() => {
    return () => {
        if (copyTimeout) clearTimeout(copyTimeout);
    };
  }, [copyTimeout]);
  
  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      if (onCopy) onCopy();
      
      if(copyTimeout) clearTimeout(copyTimeout);

      const newTimeout = window.setTimeout(() => {
          setCopied(false);
      }, 3000);
      setCopyTimeout(newTimeout);

      if (isClipboardSanitizerActive) {
          setTimeout(() => {
              // Note: we can only clear our own last entry in a secure context.
              // Writing a space is a common workaround to "clear" it.
              navigator.clipboard.writeText(' ').catch(err => {
                  console.warn("Could not clear clipboard:", err);
              });
          }, 15000);
      }
    }
  };

  return (
    <div className="flex flex-col h-full mt-2">
      <h3 className="text-lg font-semibold text-brand-light mb-2">{title}</h3>
      <div className="relative flex-grow">
        <textarea
          readOnly
          value={isLoading || error ? '' : code}
          placeholder={isLoading ? "Generating..." : placeholderText}
          className={`w-full h-full min-h-[100px] p-4 pr-12 bg-brand-primary border-2 rounded-lg focus:outline-none text-brand-text resize-none ${error ? 'border-red-500' : 'border-brand-accent'}`}
          aria-invalid={!!error}
          aria-describedby={error ? 'code-error' : undefined}
        />
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-brand-light bg-brand-primary bg-opacity-90 rounded-lg">
                <LoadingSpinner />
                <span>Generating...</span>
            </div>
        )}
        {code && !isLoading && !error && (
          <div className="tooltip-container absolute top-2 right-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-md bg-brand-accent hover:bg-brand-light text-brand-text transition-colors duration-200"
              aria-label="Copy to clipboard"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
            <span className="tooltip-text">Copy the content to your clipboard. If Clipboard Sanitizer is active, it will be cleared after 15 seconds.</span>
          </div>
        )}
        {error && (
            <div id="code-error" className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 p-4 text-center bg-brand-primary bg-opacity-90 rounded-lg">
                <ErrorIcon />
                <span>{error}</span>
            </div>
        )}
      </div>
      {copied && (
        <p className="text-sm text-green-400 mt-2 self-end transition-opacity duration-300">
            Copied! {isClipboardSanitizerActive && 'Clipboard will be cleared in 15s.'}
        </p>
      )}
    </div>
  );
};