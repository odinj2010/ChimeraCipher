
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateSecureKey, deriveKeysFromMasterPBKDF, encryptVault, decryptVault } from '../lib/crypto';
import { generateThreatAnalysis, SecurityConfig, ThreatReport, API_KEY_ERROR } from '../lib/ai';
import { AppMode, View, DeniabilityLevel, PayloadFormat, Preset } from '../types';

export const useAppState = () => {
  const [mode, setMode] = useState<AppMode>('payload');
  const [view, setView] = useState<View>('encode');

  // --- Shared State ---
  const [masterKey, setMasterKey] = useState<string>('');
  const [useMasterKey, setUseMasterKey] = useState<boolean>(false);
  const [alphaKey, setAlphaKey] = useState<string>('');
  const [omegaKey, setOmegaKey] = useState<string>('');
  const [decoyKey, setDecoyKey] = useState<string>('');
  const [isAirGapped, setIsAirGapped] = useState<boolean>(true);
  const [isClipboardSanitizerActive, setIsClipboardSanitizerActive] = useState<boolean>(true);
  const [isAutoLockActive, setIsAutoLockActive] = useState<boolean>(true);

  // --- Threat Analysis State ---
  const [threatAnalysisReport, setThreatAnalysisReport] = useState<ThreatReport | null>(null);
  const [isAnalyzingThreats, setIsAnalyzingThreats] = useState<boolean>(false);
  const [threatAnalysisError, setThreatAnalysisError] = useState<string | null>(null);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState<boolean>(false);

  // --- UI State ---
  const [showClipboardNotification, setShowClipboardNotification] = useState<boolean>(false);
  const [isTorModalOpen, setIsTorModalOpen] = useState(false);
  const [isWikiModalOpen, setIsWikiModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const importVaultRef = useRef<HTMLInputElement>(null);

  const encoderActiveTabRef = useRef<'code' | 'stealth' | 'image'>('code');
  
  const encoderSettingsManager = useRef({
      get: (): any => ({}),
      set: (settings: any) => {},
  });

  const registerEncoderSettingsManager = (get: () => any, set: (settings: any) => void) => {
      encoderSettingsManager.current.get = get;
      encoderSettingsManager.current.set = set;
  };


  const getOperationalKeys = useCallback(async () => {
    if (useMasterKey && masterKey) {
        return await deriveKeysFromMasterPBKDF(masterKey);
    }
    return { alphaKey, omegaKey, decoyKey };
  }, [useMasterKey, masterKey, alphaKey, omegaKey, decoyKey]);
  
  const resetPayloadStateCallbacks: (() => void)[] = [];
  const onResetPayloadState = (callback: () => void) => {
      resetPayloadStateCallbacks.push(callback);
      return () => {
          const index = resetPayloadStateCallbacks.indexOf(callback);
          if (index > -1) {
              resetPayloadStateCallbacks.splice(index, 1);
          }
      };
  };

  const resetChannelStateCallbacks: (() => void)[] = [];
  const onResetChannelState = (callback: () => void) => {
      resetChannelStateCallbacks.push(callback);
      return () => {
          const index = resetChannelStateCallbacks.indexOf(callback);
          if (index > -1) {
              resetChannelStateCallbacks.splice(index, 1);
          }
      };
  };

  const resetPayloadState = () => {
      resetPayloadStateCallbacks.forEach(cb => cb());
  }
  const resetChannelState = () => {
      resetChannelStateCallbacks.forEach(cb => cb());
  }

  const resetStateForViewChange = (newView: View) => {
      setView(newView);
      resetPayloadState();
  };
  
  const handleModeChange = (newMode: AppMode) => {
      setMode(newMode);
      resetPayloadState();
      resetChannelState();
  }

  const handleAirGapToggle = () => {
      const newStatus = !isAirGapped;
      setIsAirGapped(newStatus);
  };

  const handleLockSession = useCallback(() => {
    setMasterKey('');
    setAlphaKey('');
    setOmegaKey('');
    setDecoyKey('');
    resetPayloadState();
    resetChannelState();
    setView('encode');
  }, []);

  const handleSecureWipe = () => {
    if (window.confirm("Are you sure you want to securely wipe all session data? This action cannot be undone.")) {
        setView('encode');
        setMasterKey('');
        setUseMasterKey(false);
        setAlphaKey('');
        setOmegaKey('');
        setDecoyKey('');
        resetPayloadState();
        resetChannelState();
    }
  };
  
  const handleRunThreatAnalysis = useCallback(async (encoderConfig: any) => {
    if (isAirGapped) {
      setThreatAnalysisError("Air-Gap Mode is active. Cannot run threat analysis.");
      setIsThreatModalOpen(true);
      return;
    }
    setIsAnalyzingThreats(true);
    setThreatAnalysisError(null);
    setThreatAnalysisReport(null);
    setIsThreatModalOpen(true);
    
    const layers = (useMasterKey ? 2 : ((alphaKey ? 1:0) + (omegaKey ? 1:0)));
    const hasDeniable = useMasterKey || !!decoyKey;

    const config: SecurityConfig = {
      encryptionLayers: layers,
      isBlockPermutationActive: encoderConfig.isBlockPermutationActive,
      isKeyHardeningActive: encoderConfig.isKeyHardeningActive,
      deniabilityLevel: encoderConfig.deniabilityLevel,
      isDynamicDecoysActive: encoderConfig.isDynamicDecoysActive && encoderConfig.deniabilityLevel !== 'minimal',
      hasDeniableEncryption: hasDeniable && encoderConfig.deniabilityLevel !== 'minimal',
      isImageScrubberActive: encoderConfig.isScrubberActive,
      steganography: encoderActiveTabRef.current,
      isPqHybridActive: encoderConfig.isPqHybridActive,
      isAcousticResonanceActive: encoderConfig.isAcousticResonanceActive,
    };

    try {
      const report = await generateThreatAnalysis(config, !isAirGapped && encoderConfig.isGhostNetworkActive);
      setThreatAnalysisReport(report);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during threat analysis.';
       if (errorMessage === API_KEY_ERROR) {
            setThreatAnalysisError("Gemini API Key is not configured. Please set it in the settings.");
            setIsThreatModalOpen(false); // Close this one
            setIsSettingsModalOpen(true); // Open the settings one
        } else {
            setThreatAnalysisError(errorMessage);
        }
    } finally {
      setIsAnalyzingThreats(false);
    }
  }, [isAirGapped, useMasterKey, alphaKey, omegaKey, decoyKey]);
  
  const handleExportVault = async () => {
      const encoderSettings = encoderSettingsManager.current.get();
      const password = window.prompt("Enter a strong password to encrypt the key vault:");
      if (!password) return;

      try {
          const vaultState = {
              version: 1,
              masterKey, useMasterKey, alphaKey, omegaKey, decoyKey,
              isAirGapped, isClipboardSanitizerActive, isAutoLockActive,
              ...encoderSettings
          };
          const vaultJson = JSON.stringify(vaultState);
          const encryptedVault = await encryptVault(vaultJson, password);
          
          const blob = new Blob([encryptedVault], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chimera-vault.cckv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert("Key vault exported successfully.");
      } catch (e) {
          alert(`Error exporting vault: ${e instanceof Error ? e.message : String(e)}`);
      }
  };
  
  const handleImportVaultFileSelect = async (file: File) => {
      const setEncoderSettings = encoderSettingsManager.current.set;
      const password = window.prompt("Enter the password for the key vault:");
      if (!password) return;

      try {
          const vaultData = new Uint8Array(await file.arrayBuffer());
          const decryptedJson = await decryptVault(vaultData, password);
          const importedState = JSON.parse(decryptedJson);

          setMasterKey(importedState.masterKey || '');
          setUseMasterKey(importedState.useMasterKey || false);
          setAlphaKey(importedState.alphaKey || '');
          setOmegaKey(importedState.omegaKey || '');
          setDecoyKey(importedState.decoyKey || '');
          setIsAirGapped(typeof importedState.isAirGapped === 'boolean' ? importedState.isAirGapped : true);
          setIsClipboardSanitizerActive(typeof importedState.isClipboardSanitizerActive === 'boolean' ? importedState.isClipboardSanitizerActive : true);
          setIsAutoLockActive(typeof importedState.isAutoLockActive === 'boolean' ? importedState.isAutoLockActive : true);

          setEncoderSettings({
            isScrubberActive: typeof importedState.isScrubberActive === 'boolean' ? importedState.isScrubberActive : true,
            isCompressionActive: typeof importedState.isCompressionActive === 'boolean' ? importedState.isCompressionActive : true,
            isBlockPermutationActive: typeof importedState.isBlockPermutationActive === 'boolean' ? importedState.isBlockPermutationActive : false,
            isKeyHardeningActive: typeof importedState.isKeyHardeningActive === 'boolean' ? importedState.isKeyHardeningActive : true,
            isGhostNetworkActive: typeof importedState.isGhostNetworkActive === 'boolean' ? importedState.isGhostNetworkActive : true,
            isPqHybridActive: typeof importedState.isPqHybridActive === 'boolean' ? importedState.isPqHybridActive : false,
            isAcousticResonanceActive: typeof importedState.isAcousticResonanceActive === 'boolean' ? importedState.isAcousticResonanceActive : false,
            deniabilityLevel: importedState.deniabilityLevel || 'hardened',
            payloadFormat: importedState.payloadFormat || 'binary',
            isDynamicDecoysActive: typeof importedState.isDynamicDecoysActive === 'boolean' ? importedState.isDynamicDecoysActive : true,
            preset: 'custom'
          });

          alert("Key vault imported successfully. All settings have been restored.");
          resetPayloadState();
      } catch(e) {
          alert(`Error importing vault: ${e instanceof Error ? e.message : String(e)}. Incorrect password or corrupt file.`);
      } finally {
          if(importVaultRef.current) importVaultRef.current.value = '';
      }
  };

  const handleGenerateAlphaKey = () => setAlphaKey(generateSecureKey());
  const handleGenerateOmegaKey = () => setOmegaKey(generateSecureKey());
  const handleGenerateDecoyKey = () => setDecoyKey(generateSecureKey());
  
  // --- Auto-Lock Logic ---
  const autoLockTimeoutRef = useRef<number | null>(null);
  const AUTO_LOCK_DELAY_MS = 5 * 60 * 1000;

  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimeoutRef.current) {
        clearTimeout(autoLockTimeoutRef.current);
    }
    autoLockTimeoutRef.current = window.setTimeout(() => {
        // Don't auto-lock if modals are open, as it's disruptive.
        if (!isTorModalOpen && !isWikiModalOpen && !isThreatModalOpen && !isSettingsModalOpen) {
             handleLockSession();
        }
    }, AUTO_LOCK_DELAY_MS);
  }, [handleLockSession, isTorModalOpen, isWikiModalOpen, isThreatModalOpen, isSettingsModalOpen, AUTO_LOCK_DELAY_MS]);

  useEffect(() => {
    if (isAutoLockActive) {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetAutoLockTimer, { passive: true }));
        resetAutoLockTimer(); // Start the timer on initial load/activation

        return () => {
            events.forEach(event => window.removeEventListener(event, resetAutoLockTimer));
            if (autoLockTimeoutRef.current) {
                clearTimeout(autoLockTimeoutRef.current);
            }
        };
    }
  }, [isAutoLockActive, resetAutoLockTimer]);


  return {
    mode,
    view,
    masterKey,
    useMasterKey,
    alphaKey,
    omegaKey,
    decoyKey,
    isAirGapped,
    isClipboardSanitizerActive,
    isAutoLockActive,
    threatAnalysisReport,
    isAnalyzingThreats,
    threatAnalysisError,
    isThreatModalOpen,
    showClipboardNotification,
    isTorModalOpen,
    isWikiModalOpen,
    isSettingsModalOpen,
    importVaultRef,
    encoderActiveTabRef,
    encoderSettingsManager,

    setMasterKey,
    setUseMasterKey,
    setAlphaKey,
    setOmegaKey,
    setDecoyKey,
    setIsClipboardSanitizerActive,
    setIsAutoLockActive,
    setIsThreatModalOpen,
    setShowClipboardNotification,
    setIsTorModalOpen,
    setIsWikiModalOpen,
    setIsSettingsModalOpen,
    
    getOperationalKeys,
    handleModeChange,
    resetStateForViewChange,
    handleAirGapToggle,
    handleSecureWipe,
    handleLockSession,
    handleRunThreatAnalysis,
    handleExportVault,
    handleImportVaultFileSelect,
    handleGenerateAlphaKey,
    handleGenerateOmegaKey,
    handleGenerateDecoyKey,
    onResetPayloadState,
    onResetChannelState,
    registerEncoderSettingsManager,
  };
};

export type AppState = ReturnType<typeof useAppState>;