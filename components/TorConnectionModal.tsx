
import React from 'react';
import { TorIcon } from './icons';

interface TorConnectionModalProps {
    onClose: () => void;
}

export const TorConnectionModal: React.FC<TorConnectionModalProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-brand-primary bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-brand-secondary rounded-xl shadow-2xl border-2 border-purple-500/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="tooltip-container absolute -top-4 -right-4">
                        <button 
                            onClick={onClose}
                            className="p-2 text-brand-light hover:text-brand-green-neon"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <span className="tooltip-text">Close this modal.</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <div className="text-purple-400">
                          <TorIcon />
                        </div>
                        <h2 className="text-2xl font-bold text-purple-400 mt-4 mb-2">Connect via the Tor Network</h2>
                        <p className="text-brand-light mb-6">For true anonymity, all application traffic must be routed through Tor.</p>
                    </div>

                    <div className="space-y-4 text-sm">
                        <p className="p-4 bg-brand-primary/50 border border-brand-accent rounded-lg">
                           <strong className="text-yellow-300">Important:</strong> Web applications like this one <strong className="text-yellow-300">cannot automatically connect to Tor</strong> due to browser security restrictions. You must use the official Tor Browser to route your traffic through the Tor network.
                        </p>

                        <div>
                            <h3 className="font-bold text-brand-text mb-2 text-md">How to Achieve Anonymity:</h3>
                            <ol className="list-decimal list-inside space-y-3 bg-brand-primary/20 p-4 rounded-lg border border-brand-accent/50">
                                <li>
                                    <strong>Download and Install Tor Browser.</strong> This is the only official browser that connects directly to the Tor network.
                                    <div className="tooltip-container block mt-2">
                                        <a href="https://www.torproject.org/download/" target="_blank" rel="noopener noreferrer" className="w-full text-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-block">
                                            Download Tor Browser
                                        </a>
                                        <span className="tooltip-text">Opens the official Tor Project website in a new tab for you to download the browser.</span>
                                    </div>
                                </li>
                                <li>
                                    <strong>Open This App in Tor Browser.</strong> Copy the current URL from this browser and paste it into your new Tor Browser.
                                </li>
                                <li>
                                    <strong>You are now Anonymous.</strong> Once this app is running inside Tor Browser, all AI requests and network activity will be automatically routed through the Tor network, protecting your real IP address.
                                </li>
                            </ol>
                        </div>
                    </div>
                     <button onClick={onClose} className="w-full mt-6 py-2 px-4 bg-brand-accent text-brand-text font-bold rounded-lg hover:bg-brand-light hover:text-brand-primary transition-colors">
                        Understood
                    </button>
                </div>
            </div>
        </div>
    );
};