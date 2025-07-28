
import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, InfoIcon, GenerateKeyIcon } from './icons';

interface SecretKeyInputProps {
  label: string;
  placeholder: string;
  secretKey: string;
  onSetSecretKey: (key: string) => void;
  onGenerateKey: () => void;
  tooltipText?: string;
  disabled?: boolean;
  showStrengthMeter?: boolean;
}

export const SecretKeyInput: React.FC<SecretKeyInputProps> = ({ label, placeholder, secretKey, onSetSecretKey, onGenerateKey, tooltipText, disabled = false, showStrengthMeter = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [entropy, setEntropy] = useState(0);

  useEffect(() => {
    const calculateEntropy = (key: string): number => {
      if (!key) return 0;
      const charPools = {
          lowercase: 26,
          uppercase: 26,
          digits: 10,
          symbols: 32,
      };
      let poolSize = 0;
      if (/[a-z]/.test(key)) poolSize += charPools.lowercase;
      if (/[A-Z]/.test(key)) poolSize += charPools.uppercase;
      if (/[0-9]/.test(key)) poolSize += charPools.digits;
      if (/[^a-zA-Z0-9]/.test(key)) poolSize += charPools.symbols;
      
      if (poolSize === 0) return 0;

      return Math.floor(key.length * Math.log2(poolSize));
    };
    setEntropy(calculateEntropy(secretKey));
  }, [secretKey]);

  const getStrength = (): { level: string; color: string; width: string; } => {
    if (entropy < 30) return { level: 'Very Weak', color: 'bg-red-500', width: '25%' };
    if (entropy < 60) return { level: 'Weak', color: 'bg-orange-500', width: '50%' };
    if (entropy < 90) return { level: 'Strong', color: 'bg-yellow-400', width: '75%' };
    return { level: 'Very Strong', color: 'bg-brand-green-neon', width: '100%' };
  };

  const strength = getStrength();

  const labelContent = (
    <>
        {label}
        {tooltipText && (
            <div className="tooltip-icon-container group ml-2">
                <InfoIcon />
                <span className="tooltip-text">{tooltipText}</span>
            </div>
        )}
    </>
  );

  return (
    <div className={disabled ? 'cursor-not-allowed' : ''}>
        <label htmlFor={label} className={`flex items-center text-sm font-medium mb-1 ${disabled ? 'text-brand-accent' : 'text-brand-light'}`}>
            {labelContent}
        </label>
      <div className="relative">
        <input
          id={label}
          type={isVisible ? 'text' : 'password'}
          value={secretKey}
          onChange={(e) => onSetSecretKey(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 pr-20 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text disabled:bg-brand-primary/50 disabled:cursor-not-allowed"
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 px-2 flex items-center space-x-1">
            <div className="tooltip-container">
              <button
                type="button"
                onClick={onGenerateKey}
                className="p-1 rounded-full text-brand-light hover:text-brand-green-neon transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Generate secure key"
                disabled={disabled}
              >
                  <GenerateKeyIcon />
              </button>
              <span className="tooltip-text">Generate a new cryptographically secure key.</span>
            </div>
            <div className="tooltip-container">
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="p-1 rounded-full text-brand-light hover:text-brand-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isVisible ? 'Hide key' : 'Show key'}
                disabled={disabled}
              >
                {isVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <span className="tooltip-text">{isVisible ? 'Hide key' : 'Show key'}</span>
            </div>
        </div>
      </div>
      {secretKey && !disabled && showStrengthMeter && (
        <div className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-brand-light">Key Strength: {strength.level}</span>
                <span className="font-mono text-brand-accent">{entropy} bits</span>
            </div>
            <div className="w-full bg-brand-primary h-1.5 rounded-full overflow-hidden border border-brand-accent/50">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                />
            </div>
        </div>
      )}
    </div>
  );
};