
import React, { useState, useEffect } from 'react';
import { SettingsIcon, InfoIcon, KeyIcon, CpuChipIcon, ServerIcon, CheckIcon, ErrorIcon, LoadingSpinner, ImageIcon } from './icons';
import { ApiKeyStorage, AiProvider, LocalLlmSettings } from '../types';

interface SettingsModalProps {
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    // Gemini Settings
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStorage, setApiKeyStorage] = useState<ApiKeyStorage>('session');
    
    // AI Provider Settings
    const [provider, setProvider] = useState<AiProvider>('gemini');
    const [localSettings, setLocalSettings] = useState<LocalLlmSettings>({
        textGenerationEndpoint: 'http://127.0.0.1:5001/api/v1/generate',
        isImageGenerationEnabled: false,
        imageGenerationEndpoint: 'http://127.0.0.1:7860/sdapi/v1/txt2img'
    });
    
    // UI State
    const [saved, setSaved] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failure'>('idle');
    const [testError, setTestError] = useState('');

    useEffect(() => {
        // Load Gemini settings
        const storedKey = sessionStorage.getItem('chimera-api-key') || localStorage.getItem('chimera-api-key') || '';
        const storedMethod = localStorage.getItem('chimera-api-key-storage') as ApiKeyStorage || 'session';
        setApiKey(storedKey);
        setApiKeyStorage(storedMethod);
        
        // Load AI provider settings
        const storedProvider = localStorage.getItem('chimera-ai-provider') as AiProvider || 'gemini';
        setProvider(storedProvider);
        const storedLocalSettings = localStorage.getItem('chimera-local-llm-settings');
        if (storedLocalSettings) {
            setLocalSettings(JSON.parse(storedLocalSettings));
        }

    }, []);
    
    const handleSave = () => {
        // Save provider choice
        localStorage.setItem('chimera-ai-provider', provider);
        
        // Save Gemini settings
        localStorage.removeItem('chimera-api-key');
        sessionStorage.removeItem('chimera-api-key');
        localStorage.setItem('chimera-api-key-storage', apiKeyStorage);
        if (apiKeyStorage === 'local') {
            localStorage.setItem('chimera-api-key', apiKey);
        } else {
            sessionStorage.setItem('chimera-api-key', apiKey);
        }

        // Save Local LLM settings
        localStorage.setItem('chimera-local-llm-settings', JSON.stringify(localSettings));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onClose();
    };
    
    const handleTestConnection = async (type: 'text' | 'image') => {
        setTestStatus('testing');
        setTestError('');
        const endpoint = type === 'text' ? localSettings.textGenerationEndpoint : localSettings.imageGenerationEndpoint;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(type === 'text' ? { prompt: 'ping', max_tokens: 1 } : { prompt: 'ping', steps: 1 }),
            });
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            setTestStatus('success');
        } catch (err) {
            setTestStatus('failure');
            setTestError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setTimeout(() => setTestStatus('idle'), 3000);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-brand-primary bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-brand-secondary rounded-xl shadow-2xl border-2 border-gray-600/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <div className="tooltip-container absolute -top-4 -right-4">
                        <button onClick={onClose} className="p-2 text-brand-light hover:text-brand-green-neon" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <span className="tooltip-text">Close Settings</span>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <SettingsIcon />
                        <h2 className="text-2xl font-bold text-brand-text">Settings</h2>
                    </div>

                    <div className="space-y-6">
                        {/* AI Provider Selection */}
                        <div>
                             <label className="flex items-center gap-2 text-md font-medium text-brand-light mb-2">AI Provider</label>
                             <div className="flex bg-brand-primary p-0.5 rounded-md border border-brand-accent w-full">
                                <button onClick={() => setProvider('gemini')} className={`flex-1 flex items-center justify-center gap-2 text-xs px-2 py-2 rounded transition-colors duration-200 ${provider === 'gemini' ? 'bg-brand-green-neon text-brand-primary font-bold' : 'text-brand-light hover:bg-brand-accent'}`}>
                                    <KeyIcon /> Google Gemini API (Cloud)
                                </button>
                                <button onClick={() => setProvider('local')} className={`flex-1 flex items-center justify-center gap-2 text-xs px-2 py-2 rounded transition-colors duration-200 ${provider === 'local' ? 'bg-brand-green-neon text-brand-primary font-bold' : 'text-brand-light hover:bg-brand-accent'}`}>
                                    <CpuChipIcon /> Local LLM (KoboldCPP)
                                </button>
                            </div>
                        </div>

                        {/* Gemini Settings */}
                        {provider === 'gemini' && (
                            <div className="p-4 border-l-4 border-blue-500 bg-blue-900/20 rounded-r-lg space-y-4">
                                <h3 className="text-lg font-bold text-blue-300">Google Gemini API Configuration</h3>
                                <div>
                                    <label htmlFor="api-key-input" className="flex items-center gap-2 text-md font-medium text-brand-light mb-2"><KeyIcon /> <span>Google Gemini API Key</span></label>
                                    <p className="text-xs text-brand-accent mb-2">Required for cloud AI features. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">Get a key from Google AI Studio.</a></p>
                                    <input id="api-key-input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your Gemini API key here" className="w-full p-3 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon text-brand-text" />
                                </div>
                                <div>
                                    <label className="text-md font-medium text-brand-light mb-2 block">Storage Method</label>
                                    <div className="flex bg-brand-primary p-0.5 rounded-md border border-brand-accent w-full">
                                        <button onClick={() => setApiKeyStorage('session')} className={`flex-1 text-xs px-2 py-2 rounded transition-colors duration-200 ${apiKeyStorage === 'session' ? 'bg-blue-400 text-brand-primary font-bold' : 'text-brand-light hover:bg-brand-accent'}`}>Session (More Secure)</button>
                                        <button onClick={() => setApiKeyStorage('local')} className={`flex-1 text-xs px-2 py-2 rounded transition-colors duration-200 ${apiKeyStorage === 'local' ? 'bg-blue-400 text-brand-primary font-bold' : 'text-brand-light hover:bg-brand-accent'}`}>Local (Convenient)</button>
                                    </div>
                                    <p className="mt-2 text-xs text-brand-accent">{apiKeyStorage === 'session' ? 'Key is cleared when tab is closed.' : 'Key is stored in your browser persistently.'}</p>
                                </div>
                            </div>
                        )}

                        {/* Local LLM Settings */}
                        {provider === 'local' && (
                             <div className="p-4 border-l-4 border-purple-500 bg-purple-900/20 rounded-r-lg space-y-4">
                                <h3 className="text-lg font-bold text-purple-300">Local LLM Provider Configuration</h3>
                                <div>
                                    <label htmlFor="local-text-endpoint" className="flex items-center gap-2 text-md font-medium text-brand-light mb-2"><ServerIcon /> <span>Text Generation Endpoint</span></label>
                                    <p className="text-xs text-brand-accent mb-2">API endpoint for your local text generation model (e.g., KoboldCPP, Oobabooga).</p>
                                    <div className="flex gap-2">
                                        <input id="local-text-endpoint" type="text" value={localSettings.textGenerationEndpoint} onChange={(e) => setLocalSettings(s => ({...s, textGenerationEndpoint: e.target.value}))} className="w-full p-3 bg-brand-primary border-2 border-brand-accent rounded-lg text-brand-text text-sm" />
                                        <button onClick={() => handleTestConnection('text')} disabled={testStatus === 'testing'} className="px-3 bg-brand-accent text-brand-text rounded-lg hover:bg-brand-light hover:text-brand-primary text-sm font-bold w-32 shrink-0">
                                            {testStatus === 'testing' ? <LoadingSpinner /> : testStatus === 'success' ? <CheckIcon/> : testStatus === 'failure' ? <ErrorIcon /> : 'Test'}
                                        </button>
                                    </div>
                                </div>
                                 <div>
                                    <div className="flex items-center justify-between"><label htmlFor="local-image-toggle" className="flex items-center gap-2 text-md font-medium text-brand-light"><ImageIcon/> Enable Local Image Generation</label>
                                       <button role="switch" aria-checked={localSettings.isImageGenerationEnabled} id="local-image-toggle" onClick={() => setLocalSettings(s => ({...s, isImageGenerationEnabled: !s.isImageGenerationEnabled}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.isImageGenerationEnabled ? 'bg-purple-400' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${localSettings.isImageGenerationEnabled ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                    </div>
                                    {localSettings.isImageGenerationEnabled && (
                                        <div className="mt-4">
                                            <label htmlFor="local-image-endpoint" className="flex items-center gap-2 text-md font-medium text-brand-light mb-2"><ServerIcon /> <span>Image Generation Endpoint</span></label>
                                            <p className="text-xs text-brand-accent mb-2">API endpoint for your local image generation model (e.g., Stable Diffusion A1111).</p>
                                            <div className="flex gap-2">
                                                <input id="local-image-endpoint" type="text" value={localSettings.imageGenerationEndpoint} onChange={(e) => setLocalSettings(s => ({...s, imageGenerationEndpoint: e.target.value}))} className="w-full p-3 bg-brand-primary border-2 border-brand-accent rounded-lg text-brand-text text-sm" />
                                                <button onClick={() => handleTestConnection('image')} disabled={testStatus === 'testing'} className="px-3 bg-brand-accent text-brand-text rounded-lg hover:bg-brand-light hover:text-brand-primary text-sm font-bold w-32 shrink-0">
                                                     {testStatus === 'testing' ? <LoadingSpinner /> : testStatus === 'success' ? <CheckIcon/> : testStatus === 'failure' ? <ErrorIcon /> : 'Test'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                     {testStatus === 'failure' && <p className="text-xs text-red-400 mt-2">Connection failed: {testError}</p>}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-4 items-center">
                            <button onClick={onClose} className="py-2 px-4 text-brand-light hover:text-white transition-colors">Cancel</button>
                             <button onClick={handleSave} className="py-2 px-6 bg-brand-green-neon text-brand-primary font-bold rounded-lg hover:bg-opacity-80 transition-colors">
                                {saved ? 'Saved!' : 'Save & Close'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};