
import React, { useEffect } from 'react';
import { GhostNetworkIcon, ChannelIcon, AirGapOnIcon, AirGapOffIcon, WipeIcon, SaveIcon, FolderOpenIcon, TorIcon, AlertTriangleIcon, LockIcon, BookOpenIcon, TimerIcon, VaultIcon, SettingsIcon } from './components/icons';
import { AppHeader } from './components/icons';
import { ThreatAnalysisReport } from './components/ThreatAnalysisReport';
import { ClipboardSanitizerNotification } from './components/ClipboardSanitizerNotification';
import { TorConnectionModal } from './components/TorConnectionModal';
import { WikiModal } from './components/WikiModal';
import { SettingsModal } from './components/SettingsModal';
import { EncoderView } from './views/EncoderView';
import { DecoderView } from './views/DecoderView';
import { ChannelView } from './views/ChannelView';
import { useAppState } from './hooks/useAppState';
import type { AiProvider } from './types';

export default function App() {
  const appState = useAppState();
  const {
    mode,
    view,
    isAirGapped,
    isTorModalOpen,
    isWikiModalOpen,
    isSettingsModalOpen,
    isThreatModalOpen,
    showClipboardNotification,
    isClipboardSanitizerActive,
    isAutoLockActive,
    handleModeChange,
    handleAirGapToggle,
    handleSecureWipe,
    handleLockSession,
    resetStateForViewChange,
    setIsTorModalOpen,
    setIsWikiModalOpen,
    setIsSettingsModalOpen,
    handleExportVault,
    handleImportVaultFileSelect,
    importVaultRef,
    threatAnalysisReport,
    isAnalyzingThreats,
    threatAnalysisError,
    setIsThreatModalOpen,
    setIsAutoLockActive
  } = appState;

  // Refine air-gap toggle to be aware of local provider setting
  const refinedAirGapToggle = () => {
      const newStatus = !isAirGapped;
      const provider = localStorage.getItem('chimera-ai-provider') as AiProvider;

      // When going online, only re-enable cloud-specific features if the provider is Gemini
      if (newStatus === false && provider === 'gemini') {
          const encoderSettings = appState.encoderSettingsManager.current.get();
          appState.encoderSettingsManager.current.set({
              ...encoderSettings,
              isGhostNetworkActive: true,
              isDynamicDecoysActive: true,
          });
      }
      handleAirGapToggle();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6">
            <AppHeader />
            <p className="mt-2 text-lg text-brand-light max-w-3xl mx-auto">A cryptographic system that dissolves data into deniable digital noise.</p>
        </header>

        {!isAirGapped && (
            <div className="max-w-4xl mx-auto mb-6 p-4 border-l-4 border-yellow-400 bg-yellow-900/30 rounded-r-lg flex items-start gap-4 text-sm">
                <div className="text-yellow-400 shrink-0 mt-0.5"><AlertTriangleIcon /></div>
                <div>
                    <h4 className="font-bold text-yellow-300">ANONYMITY WARNING: NETWORK IS LIVE</h4>
                    <p className="text-yellow-400/80 mt-1">
                        You are in Online Mode. AI features may send requests to external servers (e.g., Google). This could expose your IP address. For maximum anonymity, use a trusted VPN, the Tor network, or a local AI provider before disabling Air-Gap Mode.
                    </p>
                </div>
            </div>
        )}

        <div className="flex justify-center mb-8 gap-2 sm:gap-4 items-center flex-wrap bg-brand-secondary/50 border border-brand-accent/50 p-2 rounded-xl">
          {/* Mode Selection */}
          <div className="bg-brand-secondary p-1 rounded-full flex items-center space-x-1 border border-brand-accent/50">
             <div className="tooltip-container">
                <button onClick={() => handleModeChange('payload')} className={`px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 flex items-center gap-2 ${mode === 'payload' ? 'bg-brand-green-neon text-brand-primary' : 'text-brand-light hover:bg-brand-accent'}`}>
                    <GhostNetworkIcon /> PAYLOAD
                </button>
                <span className="tooltip-text">Switch to Payload Entanglement mode. This is for creating and decoding secure data packages.</span>
             </div>
             <div className="tooltip-container">
                <button onClick={() => handleModeChange('channel')} className={`px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 flex items-center gap-2 ${mode === 'channel' ? 'bg-brand-green-neon text-brand-primary' : 'text-brand-light hover:bg-brand-accent'}`}>
                    <ChannelIcon /> CHANNEL
                </button>
                <span className="tooltip-text">Switch to Secure Channel mode. This is for establishing a real-time, end-to-end encrypted communication channel.</span>
             </div>
          </div>

          <div className="h-6 w-px bg-brand-accent/50 mx-2"></div>
          
          {/* Security Toggles */}
          <div className="flex items-center gap-2">
            <div className="tooltip-container">
              <button
                  onClick={refinedAirGapToggle}
                  className={`p-2 rounded-full border transition-all duration-300 ${isAirGapped ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/70 border-blue-700/80' : 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/70 border-yellow-700/80'}`}
                  aria-label={isAirGapped ? "Disable Air-Gap" : "Enable Air-Gap"}
              >
                  {isAirGapped ? <AirGapOnIcon /> : <AirGapOffIcon />}
              </button>
              <span className="tooltip-text">{isAirGapped ? 'AIR-GAP ON (Offline): All network requests are blocked. Click to go online.' : 'AIR-GAP OFF (Online): App can connect to AI services. Click to go offline.'}</span>
            </div>
            <div className="tooltip-container">
              <button
                  onClick={() => setIsTorModalOpen(true)}
                  className="p-2 rounded-full bg-purple-900/50 text-purple-300 hover:bg-purple-800/70 border border-purple-700/80 transition-all duration-300"
                  aria-label="How to connect via Tor Network"
              >
                  <TorIcon />
              </button>
              <span className="tooltip-text">Open a guide on how to route this application's traffic through the Tor network for maximum anonymity.</span>
            </div>
             <div className="tooltip-container">
              <button
                  onClick={() => setIsAutoLockActive(!isAutoLockActive)}
                  className={`p-2 rounded-full border transition-all duration-300 ${isAutoLockActive ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/70 border-blue-700/80' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/70 border-gray-500/80'}`}
                  aria-label={isAutoLockActive ? "Disable auto-lock timer" : "Enable auto-lock timer"}
              >
                  <TimerIcon />
              </button>
               <span className="tooltip-text">{isAutoLockActive ? 'Auto-Lock ENABLED: Session will lock after 5 mins of inactivity. Click to disable.' : 'Auto-Lock DISABLED: Session will not lock automatically. Click to enable.'}</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-brand-accent/50 mx-2"></div>
          
          {/* Vault Controls */}
          <div className="flex items-center gap-2 p-1 bg-brand-primary/50 rounded-full border border-brand-accent/50">
              <span className="text-xs font-bold pl-3 text-brand-light flex items-center gap-2"><VaultIcon/> VAULT</span>
             <input type="file" ref={importVaultRef} className="hidden" accept=".cckv" onChange={(e) => e.target.files && handleImportVaultFileSelect(e.target.files[0])} />
            <div className="tooltip-container">
              <button onClick={() => importVaultRef.current?.click()} className="p-2 rounded-full bg-brand-secondary text-brand-light hover:bg-brand-accent hover:text-brand-green-neon transition-all duration-300">
                  <FolderOpenIcon />
              </button>
              <span className="tooltip-text">Import a previously exported Key Vault (.cckv file) to restore all keys and settings.</span>
            </div>
            <div className="tooltip-container">
             <button onClick={() => handleExportVault()} className="p-2 rounded-full bg-brand-secondary text-brand-light hover:bg-brand-accent hover:text-brand-green-neon transition-all duration-300">
                <SaveIcon />
            </button>
            <span className="tooltip-text">Export all current keys and settings into an encrypted, password-protected Key Vault (.cckv file).</span>
            </div>
          </div>
          
          {/* Session Controls */}
          <div className="flex items-center gap-2">
            <div className="tooltip-container">
             <button
                onClick={handleLockSession}
                className="p-2 rounded-full bg-blue-900/50 text-blue-400 hover:bg-blue-800/70 hover:text-blue-300 border border-blue-700/80 transition-all duration-300"
                aria-label="Lock Session to clear keys"
            >
                <LockIcon />
            </button>
            <span className="tooltip-text">Manually lock the current session, clearing all keys (Alpha, Omega, Decoy, Master) from memory. Requires re-entry to continue.</span>
            </div>
            <div className="tooltip-container">
            <button 
                onClick={handleSecureWipe} 
                className="p-2 rounded-full bg-red-900/50 text-red-400 hover:bg-red-700/50 hover:text-red-300 border border-red-700/80 transition-all duration-300"
                aria-label="Securely Wipe All Session Data"
            >
                <WipeIcon />
            </button>
            <span className="tooltip-text">SECURE WIPE. Irreversibly erases all keys and resets all settings to their default state. This action cannot be undone.</span>
            </div>
          </div>

          <div className="flex-grow"></div>
          
           {/* Help & Settings */}
          <div className="flex items-center gap-2">
            <div className="tooltip-container">
              <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2 rounded-full bg-gray-800/70 text-gray-300 hover:bg-gray-700/90 border border-gray-600/80 transition-all duration-300"
                  aria-label="Open Settings"
              >
                  <SettingsIcon />
              </button>
              <span className="tooltip-text">Open Settings to configure your Gemini API key or a Local LLM provider.</span>
            </div>
            <div className="tooltip-container">
              <button
                  onClick={() => setIsWikiModalOpen(true)}
                  className="p-2 rounded-full bg-blue-900/50 text-blue-300 hover:bg-blue-800/70 border border-blue-700/80 transition-all duration-300"
                  aria-label="Open Field Manual"
              >
                  <BookOpenIcon />
              </button>
              <span className="tooltip-text">Open the Field Manual. Contains detailed explanations of all features, protocols, and security concepts.</span>
            </div>
          </div>
        </div>

        <main>
          {mode === 'payload' ? (
                <>
                <div className="flex justify-center mb-8">
                    <div className="bg-brand-secondary p-1 rounded-full flex items-center space-x-1 border border-brand-accent/50">
                        <div className="tooltip-container">
                          <button onClick={() => resetStateForViewChange('encode')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${view === 'encode' ? 'bg-brand-green-neon text-brand-primary' : 'text-brand-light hover:bg-brand-accent'}`}>
                          ENTANGLE
                          </button>
                          <span className="tooltip-text">Switch to the Encoder view to create secure payloads.</span>
                        </div>
                        <div className="tooltip-container">
                          <button onClick={() => resetStateForViewChange('decode')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${view === 'decode' ? 'bg-brand-green-neon text-brand-primary' : 'text-brand-light hover:bg-brand-accent'}`}>
                          DISENTANGLE
                          </button>
                           <span className="tooltip-text">Switch to the Decoder view to extract data from payloads.</span>
                        </div>
                    </div>
                </div>
                {view === 'encode' ? <EncoderView appState={appState} /> : <DecoderView appState={appState} />}
                </>
            ) : (
                <ChannelView appState={appState} setIsSettingsModalOpen={setIsSettingsModalOpen} />
            )}
        </main>
        
        {isThreatModalOpen && (
            <ThreatAnalysisReport
                report={threatAnalysisReport}
                isLoading={isAnalyzingThreats}
                error={threatAnalysisError}
                onClose={() => setIsThreatModalOpen(false)}
            />
        )}
        
        {isWikiModalOpen && <WikiModal onClose={() => setIsWikiModalOpen(false)} />}
        {isTorModalOpen && <TorConnectionModal onClose={() => setIsTorModalOpen(false)} />}
        {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
        
        {showClipboardNotification && isClipboardSanitizerActive && (
            <ClipboardSanitizerNotification onClose={appState.setShowClipboardNotification.bind(null, false)} />
        )}

        <footer className="text-center mt-12 text-brand-accent text-sm">
            <p>Security hardened with multi-layer AES-GCM, Argon2id, Entropic Veil Key, Hardened Digital Dust decoys, and Data Scrubber Protocol.</p>
            <p>All processing is performed locally in your browser. No data is ever sent to a server, unless Air-Gap Mode is disabled for cloud AI features.</p>
        </footer>
      </div>
    </div>
  );
}
