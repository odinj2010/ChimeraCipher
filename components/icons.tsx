
import React from 'react';

export const AppHeader = () => (
    <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-text tracking-widest flex items-center justify-center gap-3 uppercase">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green-neon">
          <path d="M12 15.5V12.5" />
          <path d="M12 9.5V6.5" />
          <path d="M15.5 12.5H12.5" />
          <path d="M9.5 12.5H6.5" />
          <path d="M15 6.5L12.5 9" />
          <path d="M9 15.5L6.5 18" />
          <path d="M15 18L12.5 15.5" />
          <path d="M9 9L6.5 6.5" />
          <path d="M13 3.5c1 .5 1.5 1.5 1.5 2.5" />
          <path d="M3.5 13c.5 1 1.5 1.5 2.5 1.5" />
          <path d="M20.5 11c-.5-1-1.5-1.5-2.5-1.5" />
          <path d="M11 20.5c-1-.5-1.5-1.5-1.5-2.5" />
          <path d="M5 4.5c1.5-1.5 3.5-2.5 5.5-2.5" />
          <path d="M4.5 19c-1.5-1.5-2.5-3.5-2.5-5.5" />
          <path d="M19 19.5c-1.5 1.5-3.5 2.5-5.5 2.5" />
          <path d="M19.5 5c1.5 1.5 2.5 3.5 2.5 5.5" />
        </svg>
        <span>CHIMERA CIPHER</span>
    </h1>
);


export const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green-neon">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-brand-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

export const DecodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"/><path d="M12 12v-2"/><path d="M12 12H8"/><path d="m16 8-3 3"/>
    </svg>
);

export const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-brand-primary">
        <path d="M12 3L9.5 8.5L4 11L9.5 13.5L12 19L14.5 13.5L20 11L14.5 8.5L12 3Z"/>
        <path d="M5 21L7 17L5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M19 21L17 17L19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M21 5L17 7L21 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M3 5L7 7L3 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
);

export const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
);

export const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);

export const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export const SubkeyDerivationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M12 12h.01"/>
      <path d="M17 12h.01"/>
      <path d="M7 12h.01"/>
      <path d="M10 12h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1"/>
      <path d="M14 12h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1"/>
      <path d="M10 14v2m4-2v2m-2 2v2"/>
      <path d="M14.121 8.464a5 5 0 1 0-8.242 0"/>
      <circle cx="12" cy="7" r="2"/>
    </svg>
);

export const BlockPermutationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3"/>
        <path d="M21 15v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3"/>
        <line x1="2" x2="22" y1="12" y2="12"/>
        <path d="m15 15-3-3 3-3"/>
        <path d="m9 9 3 3-3 3"/>
    </svg>
);

export const EraserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7Z"/>
        <path d="M22 21H7"/>
        <path d="m5 12 5 5"/>
    </svg>
);

export const AirGapOnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 17H7V4h10v13zm-2-9h-6v2h6V8zM5 2h14v2H5zm0 18h14v2H5z"/>
        <path d="M9 13v2"/>
        <path d="M15 13v2"/>
    </svg>
);

export const AirGapOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12v.01"/>
        <path d="M15.21 15.21a5 5 0 0 0-6.42 0"/>
        <path d="M18.36 18.36a9 9 0 0 0-12.72 0"/>
        <path d="M2 12h2.5"/>
        <path d="M19.5 12H22"/>
        <path d="M7 22l-2-2"/>
        <path d="M19 5l-2 2"/>
        <path d="M7 2l2 2"/>
        <path d="M19 19l-2 2"/>
    </svg>
);


export const WipeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.2 14.2c-1.2-1.2-1.2-3.1 0-4.2"/>
        <path d="M9.8 9.8c1.2 1.2 1.2 3.1 0 4.2"/>
        <path d="M12 12c-2.3 0-4.2-1.9-4.2-4.2V6c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2v1.8c0 2.3-1.9 4.2-4.2 4.2Z"/>
        <path d="M9.8 14.2c-1.2 1.2-3.1 1.2-4.2 0l-1-1c-1.2-1.2-1.2-3.1 0-4.2"/>
        <path d="M14.2 9.8c1.2-1.2 3.1-1.2 4.2 0l1 1c1.2 1.2 1.2 3.1 0 4.2"/>
        <path d="M12 12c0 2.3 1.9 4.2 4.2 4.2h1.8c1.8 0 3.2-1.4 3.2-3.2v-1.8c0-1.8-1.4-3.2-3.2-3.2"/>
        <path d="M12 12c0-2.3-1.9-4.2-4.2-4.2H6C4.2 7.8 2.8 9.2 2.8 11v1.8c0 1.8 1.4 3.2 3.2 3.2"/>
    </svg>
);

export const StealthRiskIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

export const CutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
);

export const CompressIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <path d="M12 5v14M5 12h14M19 12l-2 2-2-2M19 12l-2-2-2 2M5 12l2 2 2-2M5 12l2-2 2-2"/>
    </svg>
);


export const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

export const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent group-hover:text-brand-green-neon transition-colors">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export const GenerateKeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L3.36 17.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
      <path d="m14 7 3 3"/>
      <path d="M5 6v4"/>
      <path d="M19 14h-4"/>
      <path d="M10 3v4"/>
      <path d="M18 21h-4"/>
    </svg>
);

export const DynamicDecoyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M12 5V3M5 12H3M12 19v2M19 12h2M17 7l1.5-1.5M7 7l-1.5-1.5M17 17l1.5 1.5M7 17l-1.5-1.5"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
);

export const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
);

export const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0L19 4"/>
    </svg>
);

export const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green-neon">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
    </svg>
);

export const DecoyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
        <path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v10l3-3 2.5 2.5L12 17l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>
    </svg>
);

export const FailureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
);

export const ScatterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <circle cx="5.5" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="18.5" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      <circle cx="5.5" cy="18.5" r="0.5" fill="currentColor" />
      <circle cx="18.5" cy="18.5" r="0.5" fill="currentColor" />
      <path d="M12 3v1m0 16v1m8.5-9.5h1M3 11.5h1m6.5-7.2.7-.7m-13 13 .7-.7m12.3 0-.7-.7m-13 13-.7-.7"/>
    </svg>
);

export const BrainCircuitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2.5 2.5 0 0 0-2.5 2.5v.1a2.5 2.5 0 0 0 5 0v-.1A2.5 2.5 0 0 0 12 2Z"/>
        <path d="M12 22a2.5 2.5 0 0 1-2.5-2.5v-.1a2.5 2.5 0 0 1 5 0v.1a2.5 2.5 0 0 1-2.5 2.5Z"/>
        <path d="M22 12a2.5 2.5 0 0 1-2.5 2.5h-.1a2.5 2.5 0 0 1 0-5h.1A2.5 2.5 0 0 1 22 12Z"/>
        <path d="M2 12a2.5 2.5 0 0 0 2.5 2.5h.1a2.5 2.5 0 0 0 0-5h-.1A2.5 2.5 0 0 0 2 12Z"/>
        <path d="M12 12a2.5 2.5 0 0 0-2.5 2.5v.1a2.5 2.5 0 0 0 5 0v-.1a2.5 2.5 0 0 0-2.5-2.5Z"/>
        <path d="M12 12a2.5 2.5 0 0 1-2.5-2.5v-.1a2.5 2.5 0 0 1 5 0v.1a2.5 2.5 0 0 1-2.5-2.5Z"/>
        <path d="M14.5 4.5a2.5 2.5 0 0 0 0 5"/>
        <path d="M9.5 14.5a2.5 2.5 0 0 0 0 5"/>
        <path d="M14.5 14.5a2.5 2.5 0 0 1 0 5"/>
        <path d="M9.5 4.5a2.5 2.5 0 0 1 0 5"/>
    </svg>
);


export const ThumbsUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green-neon">
        <path d="M7 10v12"/>
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h2a3 3 0 0 1 3 3z"/>
    </svg>
);


export const AlertTriangleIcon = ({size=24}: {size?: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

export const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7c0-2.2-1.8-4-4-4S9.8 4.1 9 6.5C8.3 5.3 7.1 4.5 5.5 4.5c-2.2 0-4 1.8-4 4 0 1.4.6 2.5 1.2 3.4.8.9 1.3 1.6 1.5 2.6"/>
        <path d="M9 18h6"/>
        <path d="M10 22h4"/>
    </svg>
);

export const GhostNetworkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M12 12v.01" />
      <path d="M15.21 15.21a5 5 0 0 0-6.42 0" stroke-dasharray="2 2" />
      <path d="M18.36 18.36a9 9 0 0 0-12.72 0" />
      <path d="M21.5 21.5a13 13 0 0 0-19 0" stroke-dasharray="2 2" />
    </svg>
);

export const ChannelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 18v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4"/>
        <path d="M18 18v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2"/>
        <path d="M10 12V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4"/>
        <path d="M4 14H2"/>
        <path d="M22 14h-2"/>
    </svg>
);

export const HandshakeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>
        <path d="M13 17a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-5"/>
        <path d="m8 12 4.13 4.13a2 2 0 0 0 2.83 0L19 12"/>
        <path d="m16 7-4.13-4.13a2 2 0 0 0-2.83 0L5 7"/>
    </svg>
);

export const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

export const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>
);

export const FolderOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 14 l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v1"/>
    </svg>
);

export const PqShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9.5 9 3 3-3 3"/>
      <path d="m14.5 9-3 3 3 3"/>
    </svg>
);

export const TorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.99.592 3.843 1.638 5.404"/>
        <path d="M20.362 17.404c1.046-1.561 1.638-3.414 1.638-5.404 0-5.523-4.477-10-10-10"/>
        <path d="M12 2v5"/>
        <path d="M12 17v5"/>
        <path d="M12 7a5 5 0 0 1 5 5"/>
        <path d="M12 12a5 5 0 0 1-5-5"/>
        <path d="M7 12a5 5 0 0 1 5 5"/>
        <path d="M17 12a5 5 0 0 1-5-5"/>
    </svg>
);

export const AcousticResonanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 6a6 6 0 1 1 0 12" opacity="0.4" />
        <path d="M12 2a10 10 0 1 1 0 20" opacity="0.2"/>
    </svg>
);

export const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

export const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

export const TimerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
        <path d="M5 12a7 7 0 1 0 14 0 7 7 0 1 0-14 0z" />
        <path d="M12 7v5l3 1.5" />
    </svg>
);

export const ArmoredPngIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
        <path d="M3 3l18 18"/>
    </svg>
);

export const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const VaultIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
      <path d="M7 8v8" />
      <path d="M17 8v8" />
      <path d="M12 8v8" />
    </svg>
);

export const ServerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
);

export const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

export const CpuChipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
      <path d="M9 9h6v6H9z"></path>
      <path d="M15 2v3"></path>
      <path d="M9 2v3"></path>
      <path d="M15 22v-3"></path>
      <path d="M9 22v-3"></path>
      <path d="M2 15h3"></path>
      <path d="M2 9h3"></path>
      <path d="M22 15h-3"></path>
      <path d="M22 9h-3"></path>
    </svg>
);
