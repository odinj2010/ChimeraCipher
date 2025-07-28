
import React, { useState, useEffect } from 'react';
import { CutIcon, ClockIcon } from './icons';

interface ClipboardSanitizerNotificationProps {
    onClose: () => void;
}

const DURATION = 15000; // 15 seconds in milliseconds

export const ClipboardSanitizerNotification: React.FC<ClipboardSanitizerNotificationProps> = ({ onClose }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = DURATION - elapsedTime;
            if (remainingTime <= 0) {
                clearInterval(interval);
                onClose();
            } else {
                setProgress((remainingTime / DURATION) * 100);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [onClose]);

    return (
        <div 
            className="fixed bottom-5 right-5 bg-brand-secondary border-2 border-brand-green-neon/50 rounded-lg shadow-2xl w-full max-w-sm p-4 z-50 animate-fade-in-up"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-4">
                <div className="text-brand-green-neon mt-1">
                    <CutIcon />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-brand-text">Clipboard Sanitizer Active</h4>
                    <p className="text-sm text-brand-light mt-1">
                        Copied text will be cleared from your clipboard in {Math.ceil(progress / 100 * 15)} seconds to protect your privacy.
                    </p>
                </div>
                <div className="tooltip-container">
                    <button 
                        onClick={onClose}
                        className="p-1 text-brand-light hover:text-white"
                        aria-label="Dismiss notification"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <span className="tooltip-text">Dismiss this notification. The clipboard will still be cleared.</span>
                </div>
            </div>
            <div className="relative w-full bg-brand-primary h-1 rounded-full mt-3 overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-brand-green-neon"
                    style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                />
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};