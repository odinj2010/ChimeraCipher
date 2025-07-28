
import React, { useEffect, useState } from 'react';
import { AppState } from '../hooks/useAppState';
import { useEncoder } from '../hooks/useEncoder';
import { FileInfo, ImageStegoRisk, Preset, LocalLlmSettings, AiProvider } from '../types';
import { FileUploader } from '../components/FileUploader';
import { ImagePreview } from '../components/ImagePreview';
import { CodeDisplay } from '../components/CodeDisplay';
import { SecretKeyInput } from '../components/SecretKeyInput';
import { SecurityMatrix } from '../components/SecurityMatrix';
import { AccordionSection } from '../components/Accordion';
import { generateSecureKey } from '../lib/crypto';
import { LENGTH_HEADER_SIZE } from '../lib/imageSteganography';
import { AlertTriangleIcon, SparklesIcon, EraserIcon, CutIcon, CompressIcon, ImageIcon, KeyIcon, SubkeyDerivationIcon, BlockPermutationIcon, DynamicDecoyIcon, InfoIcon, GhostNetworkIcon, BrainCircuitIcon, DownloadIcon, StealthRiskIcon, PqShieldIcon, AcousticResonanceIcon, ArmoredPngIcon, ScatterIcon, DecoyIcon } from '../components/icons';

interface EncoderViewProps {
    appState: AppState;
}

export const EncoderView: React.FC<EncoderViewProps> = ({ appState }) => {
    const encoderState = useEncoder(appState);
    const [openSection, setOpenSection] = useState<string>('keys');

    const handleToggleSection = (section: string) => {
        setOpenSection(openSection === section ? '' : section);
    };

    const {
        getSettings,
        setSettings,
        hasPrimaryEncryptKey,
        handleFileSelect,
        handleDownloadCcup,
        handleDownloadArmoredPng,
        handleGenerateStealthText,
        handleCarrierImageSelect,
        handleGenerateCarrierImage,
        handleEmbedInImage,
        handleEncryptAndEmbedForArk,
        isAiFeatureAvailable,
    } = encoderState;

    useEffect(() => {
        appState.registerEncoderSettingsManager(getSettings, setSettings);
    }, [appState, getSettings, setSettings]);


    const SegmentedControl = <T extends string>({ options, value, onChange, disabled }: { options: {label: string, value: T}[], value: T, onChange: (v: T) => void, disabled?: boolean}) => (
        <div className={`flex bg-brand-primary p-0.5 rounded-md border border-brand-accent w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {options.map(option => (
                <button 
                    key={option.value} 
                    onClick={() => { if(!disabled) onChange(option.value); }}
                    disabled={disabled}
                    className={`flex-1 text-xs px-2 py-1 rounded transition-colors duration-200 ${value === option.value ? 'bg-brand-green-neon text-brand-primary font-bold' : 'text-brand-light hover:bg-brand-accent'}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
    
    const configSetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => (value: T) => {
        setter(value);
        encoderState.setPreset('custom');
    };

    const renderStegoWarning = () => (
        <div className="mt-3 p-3 border-l-4 border-yellow-400 bg-yellow-900/30 rounded-r-lg flex items-start gap-3 text-xs">
            <div className="mt-0.5 text-yellow-400 shrink-0">
                <AlertTriangleIcon />
            </div>
            <div>
                <p className="font-bold text-yellow-300">
                    OPSEC WARNING: Steganography is Fragile
                </p>
                <p className="text-yellow-400/80 mt-1">
                    Data hidden this way can be easily destroyed if the carrier text or image is edited, re-compressed, or modified by other applications (e.g., social media sites). Use only in controlled environments where the carrier's integrity is guaranteed.
                </p>
            </div>
        </div>
    );

    const StealthRiskIndicator = ({ binaryPayload, stealthText }: { binaryPayload: Uint8Array | null, stealthText: string }) => {
        if (!stealthText || !binaryPayload) return null;

        const payloadBytes = binaryPayload.length;
        const carrierBytes = new TextEncoder().encode(stealthText).length;
        const ratio = carrierBytes > 0 ? payloadBytes / carrierBytes : Infinity;

        let risk: { level: string, color: string, recommendation: string };

        if (ratio > 0.25) {
            risk = { level: 'CRITICAL', color: 'text-red-500', recommendation: 'Extremely high chance of detection. Use a much longer story or a smaller payload.' };
        } else if (ratio > 0.15) {
            risk = { level: 'HIGH', color: 'text-orange-500', recommendation: 'High risk of detection. Consider generating a longer story.' };
        } else if (ratio > 0.05) {
            risk = { level: 'MEDIUM', color: 'text-yellow-400', recommendation: 'Potentially detectable. A longer carrier text is advised.' };
        } else {
            risk = { level: 'LOW', color: 'text-brand-green-neon', recommendation: 'Good payload-to-carrier ratio. Low risk of detection.' };
        }

        return (
            <div className={`mt-3 p-3 border rounded-lg flex items-start gap-3 text-xs ${risk.color.replace('text-', 'border-')}/50 bg-brand-primary/50`}>
                <div className={`mt-0.5 ${risk.color}`}>
                    <StealthRiskIcon />
                </div>
                <div>
                    <p className="font-bold">
                        STEALTH RISK: <span className={risk.color}>{risk.level}</span>
                    </p>
                    <p className="text-brand-light">
                        Payload-to-Carrier Ratio: {ratio.toFixed(3)}:1. {risk.recommendation}
                    </p>
                </div>
            </div>
        );
    };

    const ImageStegoRiskIndicator = ({ binaryPayload, preparedPayload, carrierImage, onRiskChange }: { binaryPayload: Uint8Array | null; preparedPayload: Uint8Array | null; carrierImage: FileInfo | null; onRiskChange: (risk: ImageStegoRisk | null) => void; }) => {
        const [risk, setRisk] = useState<{ level: ImageStegoRisk; color: string; recommendation: string, percentage: string } | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        const { isAcousticResonanceActive } = encoderState;

        useEffect(() => {
            const payloadToMeasure = isAcousticResonanceActive ? preparedPayload : binaryPayload;
            if (!payloadToMeasure || !carrierImage?.url) {
                setRisk(null);
                onRiskChange(null);
                return;
            }

            setIsLoading(true);
            const img = new Image();
            img.onload = () => {
                const payloadBits = (payloadToMeasure.length * 8) + LENGTH_HEADER_SIZE;
                const capacityBits = img.width * img.height * 3;
                const ratio = capacityBits > 0 ? payloadBits / capacityBits : Infinity;
                
                let localRisk: { level: ImageStegoRisk, color: string, recommendation: string };
                const percentage = (ratio * 100).toFixed(2);

                if (ratio > 0.5) {
                    localRisk = { level: 'CRITICAL', color: 'text-red-500', recommendation: `Extremely high chance of detection. Embedding is disabled.` };
                } else if (ratio > 0.25) {
                    localRisk = { level: 'HIGH', color: 'text-orange-500', recommendation: 'High risk of detection. The payload is occupying a significant portion of the carrier.' };
                } else if (ratio > 0.10) {
                    localRisk = { level: 'MEDIUM', color: 'text-yellow-400', recommendation: 'Potentially detectable. Consider a larger carrier image for better security.' };
                } else {
                    localRisk = { level: 'LOW', color: 'text-brand-green-neon', recommendation: 'Good payload-to-carrier ratio. Low risk of detection.' };
                }
                setRisk({ ...localRisk, percentage });
                onRiskChange(localRisk.level);
                setIsLoading(false);
            };
            img.onerror = () => {
                setRisk(null);
                onRiskChange(null);
                setIsLoading(false);
            }
            img.src = carrierImage.url;

            return () => {
                img.onload = null;
                img.onerror = null;
                onRiskChange(null);
            }
        }, [binaryPayload, preparedPayload, isAcousticResonanceActive, carrierImage, onRiskChange]);

        if (isLoading || !risk) return null;

        return (
            <div className={`mt-2 p-3 border rounded-lg flex items-start gap-3 text-xs ${risk.color.replace('text-', 'border-')}/50 bg-brand-primary/50`}>
                <div className={`mt-0.5 ${risk.color}`}> <StealthRiskIcon /> </div>
                <div>
                    <p className="font-bold">
                        IMAGE STEGO RISK: <span className={risk.color}>{risk.level}</span>
                    </p>
                    <p className="text-brand-light">
                        Payload uses {risk.percentage}% of carrier capacity. {risk.recommendation}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6 p-6 bg-brand-secondary rounded-xl shadow-2xl border border-brand-accent/50">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-brand-green-neon">1. Configure Entanglement Protocol</h2>
                <div className="tooltip-container">
                    <button
                        onClick={() => appState.handleRunThreatAnalysis(getSettings())}
                        disabled={appState.isAnalyzingThreats || !isAiFeatureAvailable('text')}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-primary bg-brand-green-neon rounded-lg hover:bg-opacity-80 transition-all duration-300 disabled:bg-brand-accent disabled:cursor-not-allowed"
                    >
                        <BrainCircuitIcon />
                        <span>{appState.isAnalyzingThreats ? "Analyzing..." : "Threat Analysis"}</span>
                    </button>
                    <span className="tooltip-text">Run an AI-powered threat analysis on the current security configuration. Requires a configured AI provider.</span>
                </div>
            </div>
            
             <div className="space-y-3">
                 <AccordionSection title="Key Configuration" icon={<KeyIcon />} isOpen={openSection === 'keys'} onToggle={() => handleToggleSection('keys')}>
                    <div className="flex items-center justify-between">
                        <label htmlFor="master-key-toggle" className="flex items-center gap-2 text-sm font-medium text-brand-light">Master Key Mode</label>
                        <div className="tooltip-container">
                          <button
                              role="switch"
                              aria-checked={appState.useMasterKey}
                              id="master-key-toggle"
                              onClick={() => appState.setUseMasterKey(!appState.useMasterKey)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appState.useMasterKey ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}
                          ><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${appState.useMasterKey ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                          <span className="tooltip-text">Toggle between using a single Master Key to derive all other keys, or setting each key individually.</span>
                        </div>
                    </div>
                    <div className={!appState.useMasterKey ? 'opacity-50' : ''}>
                        <SecretKeyInput label="Master Key" placeholder="Enter a single, strong master password" secretKey={appState.masterKey} onSetSecretKey={appState.setMasterKey} onGenerateKey={() => appState.setMasterKey(generateSecureKey())} disabled={!appState.useMasterKey} tooltipText="A single key from which all other keys (Alpha, Omega, Decoy) will be cryptographically derived using Argon2id. Simplifies key management." />
                    </div>
                    <hr className="border-brand-accent/30" />
                    <SecretKeyInput label="Alpha Key (Primary)" placeholder="Enter your main access key..." secretKey={appState.alphaKey} onSetSecretKey={configSetter(appState.setAlphaKey)} onGenerateKey={appState.handleGenerateAlphaKey} disabled={appState.useMasterKey} tooltipText="The main cryptographic key used to secure the payload. This key is always required for both entanglement and disentanglement." />
                    <SecretKeyInput label="Omega Key (Optional, 2nd Layer)" placeholder="Enter key for nested encryption..." secretKey={appState.omegaKey} onSetSecretKey={configSetter(appState.setOmegaKey)} onGenerateKey={appState.handleGenerateOmegaKey} tooltipText="Adds a second, independent layer of AES-256-GCM encryption. If used, both the Alpha and Omega keys are required for decryption, significantly increasing security." disabled={appState.useMasterKey} />
                </AccordionSection>
                
                <AccordionSection title="Deniability Protocol" icon={<DecoyIcon />} isOpen={openSection === 'deniability'} onToggle={() => handleToggleSection('deniability')}>
                    <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                        <label className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light mb-2">Digital Dust Level<InfoIcon /><span className="tooltip-text">Hides real data among fake "decoy" data blocks. "Hardened" offers max security but a larger payload. "Minimal" is smallest but removes this feature.</span></label>
                        <SegmentedControl options={[{ label: 'Minimal', value: 'minimal' }, { label: 'Standard', value: 'standard' }, { label: 'Hardened', value: 'hardened' }]} value={encoderState.deniabilityLevel} onChange={configSetter(encoderState.setDeniabilityLevel)}/>
                    </div>
                     <div className={`p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2 ${encoderState.deniabilityLevel === 'minimal' ? 'opacity-50' : ''}`}>
                         <div className="flex items-center justify-between">
                             <label htmlFor="dynamic-decoy-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light">
                                 <DynamicDecoyIcon /> Dynamic Decoys (AI)
                                 <InfoIcon /><span className="tooltip-text">Uses AI to generate unique, random decoys for each entanglement. This makes them statistically similar to real carrier text and much harder to identify as fakes. Requires a configured AI provider.</span>
                             </label>
                             <div className="tooltip-container">
                               <button role="switch" aria-checked={encoderState.isDynamicDecoysActive} id="dynamic-decoy-toggle" onClick={() => configSetter(encoderState.setIsDynamicDecoysActive)(!encoderState.isDynamicDecoysActive)} disabled={encoderState.deniabilityLevel === 'minimal' || !isAiFeatureAvailable('text')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${encoderState.isDynamicDecoysActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isDynamicDecoysActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                               <span className="tooltip-text">Toggle AI-generated decoys. Disabled if AI provider is not available or Deniability Level is Minimal.</span>
                             </div>
                         </div>
                     </div>
                    <div className={`${encoderState.deniabilityLevel === 'minimal' ? 'opacity-50' : ''}`}>
                        <SecretKeyInput label="Decoy Key (Deniable)" placeholder="Optional 'duress' password..." secretKey={appState.decoyKey} onSetSecretKey={configSetter(appState.setDecoyKey)} onGenerateKey={appState.handleGenerateDecoyKey} tooltipText="Optional. Creates a 'duress' password. Encrypts one of the decoy data blocks. If you enter this key for decryption, it will reveal a harmless file, allowing you to plausibly deny the existence of the real data." disabled={encoderState.deniabilityLevel === 'minimal' || appState.useMasterKey}/>
                    </div>
                </AccordionSection>

                <AccordionSection title="Cryptographic Engine" icon={<SubkeyDerivationIcon />} isOpen={openSection === 'crypto'} onToggle={() => handleToggleSection('crypto')}>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between"><label htmlFor="key-hardening-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><SubkeyDerivationIcon /> Sub-key Derivation<InfoIcon /><span className="tooltip-text">HARDENED: Derives unique sub-keys from the Alpha and Omega keys using HKDF. This practice, known as domain separation, prevents cryptographic interactions between key usages and is a best practice for robust security architectures.</span></label>
                             <div className="tooltip-container">
                                <button role="switch" aria-checked={encoderState.isKeyHardeningActive} id="key-hardening-toggle" onClick={() => configSetter(encoderState.setIsKeyHardeningActive)(!encoderState.isKeyHardeningActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${encoderState.isKeyHardeningActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isKeyHardeningActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle Sub-key Derivation (HKDF). Recommended ON.</span>
                             </div>
                            </div>
                             <p className="text-xs text-brand-accent">Adds key isolation. Recommended.</p>
                         </div>
                         <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between"><label htmlFor="block-permutation-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><BlockPermutationIcon /> Block Permutation<InfoIcon /><span className="tooltip-text">EXPERIMENTAL: This non-standard obfuscation layer shuffles encrypted bytes. It offers no proven cryptographic strength beyond AES-GCM and is vulnerable to known-plaintext attacks. Use with caution. The core security relies solely on AES-GCM.</span></label>
                             <div className="tooltip-container">
                                <button role="switch" aria-checked={encoderState.isBlockPermutationActive} id="block-permutation-toggle" onClick={() => configSetter(encoderState.setIsBlockPermutationActive)(!encoderState.isBlockPermutationActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${encoderState.isBlockPermutationActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isBlockPermutationActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle experimental ciphertext block permutation.</span>
                             </div>
                            </div>
                             <p className="text-xs text-brand-accent">Ciphertext byte scrambling.</p>
                         </div>
                          <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between"><label htmlFor="pq-hybrid-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><PqShieldIcon /> Post-Quantum Hybrid<InfoIcon /><span className="tooltip-text">FORWARD-LOOKING SIMULATION: This mode demonstrates a hybrid key exchange principle by combining classical keys with a simulated post-quantum secret (a random value). It does NOT use a real PQC algorithm like Kyber. This hardens the key against classical attacks but only simulates future PQC resistance.</span></label>
                             <div className="tooltip-container">
                                <button role="switch" aria-checked={encoderState.isPqHybridActive} id="pq-hybrid-toggle" onClick={() => configSetter(encoderState.setIsPqHybridActive)(!encoderState.isPqHybridActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${encoderState.isPqHybridActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isPqHybridActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle simulated Post-Quantum Hybrid keying.</span>
                             </div>
                            </div>
                             <p className="text-xs text-brand-accent">Hardens against quantum threats.</p>
                         </div>
                          <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between"><label htmlFor="ark-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><AcousticResonanceIcon /> Acoustic Resonance<InfoIcon /><span className="tooltip-text">NOVEL PROTOCOL: Fuses encryption with steganography. Derives a unique key from the statistical fingerprint of the carrier image itself. Decryption requires BOTH the Alpha Key and the original, bit-perfect carrier image, creating a powerful 'something you have' security factor.</span></label>
                             <div className="tooltip-container">
                                <button role="switch" aria-checked={encoderState.isAcousticResonanceActive} id="ark-toggle" onClick={() => configSetter(encoderState.setIsAcousticResonanceActive)(!encoderState.isAcousticResonanceActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${encoderState.isAcousticResonanceActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isAcousticResonanceActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle Acoustic Resonance Keying (ARK). Requires image steganography.</span>
                             </div>
                            </div>
                             <p className="text-xs text-brand-accent">Links key to carrier image.</p>
                         </div>
                     </div>
                </AccordionSection>

                 <AccordionSection title="Payload & Network" icon={<GhostNetworkIcon />} isOpen={openSection === 'payload'} onToggle={() => handleToggleSection('payload')}>
                     <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                        <label className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light mb-2">Payload Format<InfoIcon /><span className="tooltip-text">"Optimized (Binary)" creates a smaller, more efficient payload. "Legacy (JSON)" is larger but may be useful for compatibility or analysis.</span></label>
                        <SegmentedControl options={[{ label: 'Optimized (Binary)', value: 'binary' }, { label: 'Legacy (JSON)', value: 'json' }]} value={encoderState.payloadFormat} onChange={configSetter(encoderState.setPayloadFormat)} />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <label htmlFor="compress-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><CompressIcon /> Payload Compression<InfoIcon /><span className="tooltip-text">Reduces payload size using ZLIB compression if it results in a smaller file. Most effective on uncompressed files (text, BMPs). Less effective on already compressed files (JPEGs, ZIPs).</span></label>
                                <div className="tooltip-container">
                                  <button role="switch" aria-checked={encoderState.isCompressionActive} id="compress-toggle" onClick={() => configSetter(encoderState.setIsCompressionActive)(!encoderState.isCompressionActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${encoderState.isCompressionActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isCompressionActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                  <span className="tooltip-text">Toggle payload compression. Recommended ON.</span>
                                </div>
                              </div>
                              <p className="text-xs text-brand-accent">Reduces payload size. Recommended.</p>
                          </div>
                          <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <label htmlFor="scrubber-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><EraserIcon /> Data Scrubber<InfoIcon /><span className="tooltip-text">Strips all identifying metadata from uploaded images (e.g., EXIF GPS data, camera model) by re-rendering the image to a clean PNG canvas.</span></label>
                                <div className="tooltip-container">
                                  <button role="switch" aria-checked={encoderState.isScrubberActive} id="scrubber-toggle" onClick={() => configSetter(encoderState.setIsScrubberActive)(!encoderState.isScrubberActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${encoderState.isScrubberActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isScrubberActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                  <span className="tooltip-text">Toggle image metadata scrubber. Recommended ON.</span>
                                </div>
                              </div>
                              <p className="text-xs text-brand-accent">Strips image metadata for untraceability.</p>
                          </div>
                          <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <label htmlFor="clipboard-sanitizer-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><CutIcon /> Clipboard Sanitizer<InfoIcon /><span className="tooltip-text">To prevent accidental data leakage, this feature automatically clears your clipboard 15 seconds after you copy any sensitive text from this application.</span></label>
                              <div className="tooltip-container">
                                <button role="switch" aria-checked={appState.isClipboardSanitizerActive} id="clipboard-sanitizer-toggle" onClick={() => appState.setIsClipboardSanitizerActive(!appState.isClipboardSanitizerActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appState.isClipboardSanitizerActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${appState.isClipboardSanitizerActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle clipboard sanitizer. Recommended ON.</span>
                              </div>
                            </div>
                            <p className="text-xs text-brand-accent">Automatically clears clipboard 15s after copy.</p>
                          </div>
                          <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-3">
                             <div className="flex items-center justify-between">
                              <label htmlFor="ghost-network-toggle" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light"><GhostNetworkIcon /> Ghost Network<InfoIcon /><span className="tooltip-text">For cloud providers, this obfuscates AI requests by sending multiple dummy requests alongside the real one, making it harder to identify user activity via network analysis.</span></label>
                              <div className="tooltip-container">
                                <button role="switch" aria-checked={encoderState.isGhostNetworkActive} id="ghost-network-toggle" onClick={() => configSetter(encoderState.setIsGhostNetworkActive)(!encoderState.isGhostNetworkActive)} disabled={!isAiFeatureAvailable('text') || localStorage.getItem('chimera-ai-provider') === 'local'} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${encoderState.isGhostNetworkActive && isAiFeatureAvailable('text') ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${encoderState.isGhostNetworkActive && isAiFeatureAvailable('text') ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle Ghost Network. Recommended ON when using a cloud provider.</span>
                              </div>
                            </div>
                             <p className="text-xs text-brand-accent">Hides real AI requests among decoys.</p>
                          </div>
                     </div>
                 </AccordionSection>
            </div>
            
            <FileUploader id="entangle-uploader" onFileSelect={handleFileSelect} acceptedFileTypes='*' />
            <ImagePreview title="Source File (Sanitized if Image)" fileInfo={encoderState.originalFileInfo ? { name: encoderState.originalFileInfo.name, url: encoderState.originalFileInfo.url, isImage: encoderState.originalFileInfo.type.startsWith('image/') } : null} isLoading={encoderState.isEncoding} error={encoderState.encodeError} placeholderText="Upload any file to begin entanglement"/>
        </div>
        <div className="flex flex-col gap-4 p-6 bg-brand-secondary rounded-xl shadow-2xl min-h-full border border-brand-accent/50">
            <h2 className="text-2xl font-bold text-brand-green-neon">2. Retrieve Entangled Output</h2>
            <SecurityMatrix 
                masterKey={appState.masterKey} 
                primaryKey={appState.alphaKey} 
                cipherKey={appState.omegaKey} 
                decoyKey={appState.decoyKey} 
                codeGenerated={!!encoderState.secureCode || !!encoderState.stegoImage} 
                isScrubberActive={encoderState.isScrubberActive} 
                isAirGapped={appState.isAirGapped} 
                isClipboardSanitizerActive={appState.isClipboardSanitizerActive} 
                isCompressionActive={encoderState.isCompressionActive} 
                isBlockPermutationActive={encoderState.isBlockPermutationActive} 
                isKeyHardeningActive={encoderState.isKeyHardeningActive}
                isPqHybridActive={encoderState.isPqHybridActive}
                isAcousticResonanceActive={encoderState.isAcousticResonanceActive}
                deniabilityLevel={encoderState.deniabilityLevel} 
                payloadFormat={encoderState.payloadFormat} 
                isDynamicDecoysActive={encoderState.isDynamicDecoysActive} 
                useMasterKey={appState.useMasterKey} 
                isGhostNetworkActive={encoderState.isGhostNetworkActive}
            />

            <div className="flex border-b border-brand-accent items-center">
                <div className="tooltip-container">
                    <button className={`py-2 px-4 font-semibold -mb-px border-b-2 transition-colors duration-200 ${encoderState.activeTab === 'code' ? 'text-brand-green-neon border-brand-green-neon' : 'text-brand-light border-transparent hover:border-brand-light/50 disabled:opacity-50'}`}
                        onClick={() => encoderState.setActiveTab('code')} disabled={!encoderState.secureCode || encoderState.isAcousticResonanceActive}>
                        Unified Payload
                    </button>
                    <span className="tooltip-text">View the raw entangled payload as a Base64 string.</span>
                </div>
                <div className="tooltip-container">
                    <button className={`py-2 px-4 font-semibold -mb-px border-b-2 transition-colors duration-200 ${encoderState.activeTab === 'stealth' ? 'text-brand-green-neon border-brand-green-neon' : 'text-brand-light border-transparent hover:border-brand-light/50 disabled:opacity-50'}`}
                        onClick={() => encoderState.setActiveTab('stealth')} disabled={!encoderState.secureCode || !isAiFeatureAvailable('text') || encoderState.isAcousticResonanceActive}>
                        Covert Text (AI)
                    </button>
                    <span className="tooltip-text">Hide the payload within AI-generated text using steganography. Requires a configured AI provider.</span>
                </div>
                <div className="tooltip-container">
                     <button className={`py-2 px-4 font-semibold -mb-px border-b-2 transition-colors duration-200 ${encoderState.activeTab === 'image' ? 'text-brand-green-neon border-brand-green-neon' : 'text-brand-light border-transparent hover:border-brand-light/50 disabled:opacity-50'}`}
                        onClick={() => encoderState.setActiveTab('image')} disabled={!encoderState.preparedPayload}>
                        Covert Image
                    </button>
                    <span className="tooltip-text">Hide the payload within an image file using advanced steganography.</span>
                </div>
                <div className="flex-grow" />
                <div className="tooltip-container">
                    <button 
                        onClick={handleDownloadArmoredPng} 
                        disabled={!encoderState.binaryPayload || encoderState.payloadFormat !== 'binary'}
                        className="flex items-center gap-2 text-sm px-3 py-1 text-brand-light hover:text-brand-green-neon transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArmoredPngIcon />
                        <span className="hidden sm:inline">Export PNG</span>
                    </button>
                    <span className="tooltip-text">Export payload as a 'Transport Armor' PNG file. The payload is embedded inside a valid PNG image for better deniability during transit. (Only works with Binary payload format).</span>
                </div>
                <div className="tooltip-container">
                    <button 
                        onClick={handleDownloadCcup} 
                        disabled={!encoderState.binaryPayload}
                        className="flex items-center gap-2 text-sm px-3 py-1 text-brand-light hover:text-brand-green-neon transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon />
                        <span className="hidden sm:inline">Export .ccup</span>
                    </button>
                    <span className="tooltip-text">Download the entangled payload as a raw binary file (.ccup).</span>
                </div>
            </div>
            <div className="flex-grow pt-2">
                {encoderState.activeTab === 'code' && (
                    <CodeDisplay title="Unified Payload (Copy this)" code={encoderState.secureCode} isLoading={encoderState.isEncoding} placeholderText="Unified payload will appear here..." isClipboardSanitizerActive={appState.isClipboardSanitizerActive} onCopy={() => appState.setShowClipboardNotification(true)} />
                )}
                {encoderState.activeTab === 'stealth' && (
                    <div className="flex flex-col gap-4 h-full">
                        {renderStegoWarning()}
                        <h3 className="text-lg font-semibold text-brand-light mt-2">Covert Text Generation</h3>
                        <div className="flex gap-2">
                           <div className="tooltip-container w-full">
                                <input id="stealth-prompt" type="text" value={encoderState.stealthPrompt} onChange={(e) => encoderState.setStealthPrompt(e.target.value)} placeholder="AI prompt (e.g., a cat in space)"
                                    className="w-full p-3 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text"
                                    disabled={encoderState.isGeneratingStealth || !encoderState.secureCode || !isAiFeatureAvailable('text')}/>
                                <span className="tooltip-text">Enter a prompt for the AI to generate a story. If left blank, a prompt will be generated from the source image (if available).</span>
                           </div>
                            <div className="tooltip-container">
                                <button onClick={handleGenerateStealthText} disabled={encoderState.isGeneratingStealth || !encoderState.secureCode || !isAiFeatureAvailable('text') || !hasPrimaryEncryptKey}
                                    className="flex items-center justify-center gap-2 bg-brand-green-neon text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 disabled:bg-brand-accent disabled:cursor-not-allowed shrink-0">
                                    <SparklesIcon />{encoderState.isGeneratingStealth ? '...' : 'Generate'}
                                </button>
                                <span className="tooltip-text">Generate a new AI story based on the prompt and embed the current payload within it.</span>
                            </div>
                        </div>
                        <CodeDisplay title="Resulting Covert Text" code={encoderState.stealthText} isLoading={encoderState.isGeneratingStealth} placeholderText="AI-generated text with hidden data stream will appear here." error={encoderState.stealthError} isClipboardSanitizerActive={appState.isClipboardSanitizerActive} onCopy={() => appState.setShowClipboardNotification(true)}/>
                        <StealthRiskIndicator binaryPayload={encoderState.binaryPayload} stealthText={encoderState.stealthText} />
                    </div>
                )}
                 {encoderState.activeTab === 'image' && (
                    <div className="flex flex-col gap-4 h-full">
                         {renderStegoWarning()}
                        <div className="flex justify-between items-center mt-2">
                           <h3 className="text-lg font-semibold text-brand-light">Covert Image Generation</h3>
                           <div className="tooltip-icon-container group flex items-center gap-2 text-sm text-brand-accent">
                                <InfoIcon />
                                <span>Using Entropic Dispersal Algorithm</span>
                                <span className="tooltip-text">The insecure LSB algorithm has been removed. Entropic Dispersal uses a key to pseudo-randomly scatter data across image pixels, making it highly resistant to detection.</span>
                            </div>
                        </div>
                        
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-brand-light">1. Provide Carrier Image</p>
                                <FileUploader id="carrier-uploader" onFileSelect={handleCarrierImageSelect} mainText="Upload Carrier Image" subText="Any image file" acceptedFileTypes="image/*" />
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-brand-accent/50"></div>
                                    <span className="flex-shrink mx-4 text-brand-accent text-xs">OR</span>
                                    <div className="flex-grow border-t border-brand-accent/50"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="tooltip-container w-full">
                                        <input id="image-gen-prompt" type="text" value={encoderState.imageGenPrompt} onChange={(e) => encoderState.setImageGenPrompt(e.target.value)} placeholder="AI prompt for image..."
                                            className="w-full p-2 bg-brand-primary border-2 text-sm border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text"
                                            disabled={encoderState.isEmbeddingInImage || !isAiFeatureAvailable('image')}/>
                                        <span className="tooltip-text">Enter a prompt for the AI to generate a carrier image.</span>
                                    </div>
                                    <div className="tooltip-container">
                                        <button onClick={handleGenerateCarrierImage} disabled={encoderState.isEmbeddingInImage || !isAiFeatureAvailable('image')}
                                            className="flex items-center justify-center gap-2 bg-brand-accent text-brand-text font-bold p-2 rounded-lg hover:bg-brand-light hover:text-brand-primary transition-all duration-300 disabled:bg-brand-accent disabled:cursor-not-allowed shrink-0">
                                            <SparklesIcon />
                                        </button>
                                        <span className="tooltip-text">Generate a new carrier image using your configured AI provider.</span>
                                    </div>
                                </div>
                            </div>
                             <div className="flex flex-col gap-2">
                                 <p className="text-sm text-brand-light">2. Embed Payload</p>
                                <ImagePreview title="Carrier Image (Sanitized)" fileInfo={encoderState.carrierImage ? { name: encoderState.carrierImage.name, url: encoderState.carrierImage.url, isImage: true } : null} isLoading={encoderState.isEmbeddingInImage && !encoderState.carrierImage} error={encoderState.imageStegoError} placeholderText="Upload or Generate Carrier"/>
                                {encoderState.isAcousticResonanceActive ? (
                                    <div className="tooltip-container w-full">
                                      <button onClick={handleEncryptAndEmbedForArk} disabled={!encoderState.carrierImage || !encoderState.preparedPayload || encoderState.isEmbeddingInImage || !hasPrimaryEncryptKey || encoderState.imageStegoRiskLevel === 'CRITICAL'}
                                          className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 disabled:bg-brand-accent disabled:cursor-not-allowed">
                                          <AcousticResonanceIcon /> {encoderState.imageStegoRiskLevel === 'CRITICAL' ? 'Risk Too High' : 'Entangle & Embed with ARK'}
                                      </button>
                                      <span className="tooltip-text">Encrypt the payload with a key derived from the carrier image itself, then embed it. This makes the original carrier image a required key for decryption.</span>
                                    </div>
                                ) : (
                                    <div className="tooltip-container w-full">
                                      <button onClick={handleEmbedInImage} disabled={!encoderState.carrierImage || encoderState.isEmbeddingInImage || !hasPrimaryEncryptKey || encoderState.imageStegoRiskLevel === 'CRITICAL' || !encoderState.binaryPayload}
                                          className="flex items-center justify-center gap-2 w-full bg-brand-green-neon text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 disabled:bg-brand-accent disabled:cursor-not-allowed">
                                          <ImageIcon /> {encoderState.imageStegoRiskLevel === 'CRITICAL' ? 'Risk Too High' : 'Embed Data'}
                                      </button>
                                      <span className="tooltip-text">Embed the current entangled payload into the carrier image using the Entropic Dispersal algorithm.</span>
                                    </div>
                                )}
                             </div>
                        </div>
                        <ImageStegoRiskIndicator binaryPayload={encoderState.binaryPayload} preparedPayload={encoderState.preparedPayload} carrierImage={encoderState.carrierImage} onRiskChange={encoderState.setImageStegoRiskLevel}/>
                        <div className="mt-4">
                             <ImagePreview title="Resulting Covert Image" fileInfo={encoderState.stegoImage} isLoading={encoderState.isEmbeddingInImage && !!encoderState.carrierImage} error={encoderState.imageStegoError && !!encoderState.carrierImage ? encoderState.imageStegoError : null} placeholderText="Covert image with hidden data will appear here."/>
                        </div>
                    </div>
                 )}
            </div>
        </div>
        </div>
    );
};
