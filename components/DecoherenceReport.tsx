
import React from 'react';
import { LoadingSpinner, ErrorIcon, TargetIcon, DecoyIcon, FailureIcon } from './icons';
import { ImagePreview } from './ImagePreview';

type FilePayload = {
  name: string;
  url: string;
  isImage: boolean;
};

export type DecoherenceResult = {
  id: number;
  blobHash: string;
  status: 'REAL_PAYLOAD' | 'DECOY_PAYLOAD' | 'FAILURE';
  keyUsed: 'Alpha' | 'Decoy' | 'None' | 'Alpha (ARK)';
  payload?: FilePayload | string;
};

interface DecoherenceReportProps {
  report: DecoherenceResult[] | null;
  isLoading: boolean;
  error: string | null;
}

const statusConfig = {
    REAL_PAYLOAD: {
        icon: <TargetIcon />,
        label: 'REAL PAYLOAD',
        color: 'border-brand-green-neon',
        bg: 'bg-brand-green-neon/10',
        textColor: 'text-brand-green-neon'
    },
    DECOY_PAYLOAD: {
        icon: <DecoyIcon />,
        label: 'DECOY PAYLOAD',
        color: 'border-yellow-400',
        bg: 'bg-yellow-400/10',
        textColor: 'text-yellow-400'
    },
    FAILURE: {
        icon: <FailureIcon />,
        label: 'DECOHERENCE FAILURE',
        color: 'border-red-500',
        bg: 'bg-red-500/10',
        textColor: 'text-red-500'
    }
}

export const DecoherenceReport: React.FC<DecoherenceReportProps> = ({ report, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 text-brand-light h-full">
          <LoadingSpinner />
          <span>Analyzing quantum state...</span>
        </div>
      );
    }

    if (error) {
       return (
         <div className="flex flex-col items-center justify-center gap-2 text-red-400 p-4 text-center h-full">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      );
    }
    
    if (!report || report.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-brand-accent">
                <p>Awaiting decoherence analysis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {report.map(result => {
                const config = statusConfig[result.status];
                const realPayload = result.status === 'REAL_PAYLOAD' ? result.payload as FilePayload : null;

                return (
                    <div key={result.id} className={`border-l-4 p-4 rounded-r-lg ${config.color} ${config.bg}`}>
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-3 font-bold ${config.textColor}`}>
                                {config.icon}
                                <span>CANDIDATE #{result.id + 1} / {report.length}</span>
                            </div>
                            <span className="font-mono text-sm text-brand-accent">{result.blobHash}</span>
                        </div>
                        <div className="mt-3 pl-10 text-sm">
                            <p><strong>Status:</strong> <span className={config.textColor}>{config.label}</span></p>
                            <p><strong>Key Match:</strong> {result.keyUsed}</p>

                            {result.status === 'DECOY_PAYLOAD' && typeof result.payload === 'string' && (
                                <div className="mt-2 p-2 border border-brand-accent/50 rounded bg-brand-primary/50 italic text-brand-light">
                                    "{result.payload}"
                                </div>
                            )}

                             {realPayload && (
                                 <div className="mt-4">
                                    <ImagePreview title="Disentangled File" fileInfo={realPayload} isLoading={false} error={null} placeholderText=""/>
                                 </div>
                             )}

                        </div>
                    </div>
                )
            })}
        </div>
    )

  };

  return (
    <div className="w-full h-full">
      {renderContent()}
    </div>
  );
};