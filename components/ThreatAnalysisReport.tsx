
import React from 'react';
import { ThreatReport } from '../lib/ai';
import { LoadingSpinner, ErrorIcon, ThumbsUpIcon, AlertTriangleIcon, LightbulbIcon, BrainCircuitIcon } from './icons';

interface ThreatAnalysisReportProps {
  report: ThreatReport | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export const ThreatAnalysisReport: React.FC<ThreatAnalysisReportProps> = ({ report, isLoading, error, onClose }) => {
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 text-brand-light h-full">
                    <LoadingSpinner />
                    <h3 className="text-lg font-bold">ANALYZING THREAT VECTORS...</h3>
                    <p className="text-sm text-brand-accent">Consulting with AI security specialist...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center gap-2 text-red-400 p-4 text-center h-full">
                    <ErrorIcon />
                    <h3 className="text-lg font-bold">ANALYSIS FAILED</h3>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }

        if (!report) {
             return (
                <div className="flex flex-col items-center justify-center gap-2 text-brand-accent p-4 text-center h-full">
                    <BrainCircuitIcon />
                    <p className="text-sm mt-2">No threat report available.</p>
                </div>
            );
        }
        
        return (
            <div className="text-brand-text">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-brand-green-neon mb-6">
                    <BrainCircuitIcon />
                    <span>THREAT ANALYSIS DOSSIER</span>
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="flex items-center gap-3 text-lg font-semibold text-brand-green-neon mb-2">
                            <ThumbsUpIcon />
                            <span>Strengths Analysis</span>
                        </h3>
                        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                            {report.strengths.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="flex items-center gap-3 text-lg font-semibold text-yellow-400 mb-2">
                            <AlertTriangleIcon />
                            <span>Potential Weaknesses</span>
                        </h3>
                         <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                            {report.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>

                    <div>
                        <h3 className="flex items-center gap-3 text-lg font-semibold text-blue-400 mb-2">
                            <LightbulbIcon />
                            <span>Recommendations</span>
                        </h3>
                         <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                            {report.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>

                     <div className="pt-4 border-t-2 border-brand-accent/50">
                        <h3 className="text-md font-bold text-brand-light mb-1">OVERALL ASSESSMENT:</h3>
                        <p className="text-brand-text italic">"{report.overallAssessment}"</p>
                    </div>

                </div>
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-brand-primary bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="threat-analysis-title"
        >
            <div 
                className="bg-brand-secondary rounded-xl shadow-2xl border-2 border-brand-green-neon/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="tooltip-container absolute -top-2 -right-2">
                         <button 
                            onClick={onClose}
                            className="p-2 text-brand-light hover:text-brand-green-neon"
                            aria-label="Close Threat Analysis"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <span className="tooltip-text">Close Report</span>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};