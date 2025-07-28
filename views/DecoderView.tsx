import React, { useState } from 'react';
import { AppState } from '../hooks/useAppState';
import { useDecoder } from '../hooks/useDecoder';
import { FileUploader } from '../components/FileUploader';
import { DecoherenceReport } from '../components/DecoherenceReport';
import { SecretKeyInput } from '../components/SecretKeyInput';
import { AccordionSection } from '../components/Accordion';
import { generateSecureKey } from '../lib/crypto';
import { DecodeIcon, KeyIcon, SubkeyDerivationIcon, BlockPermutationIcon, InfoIcon, ScatterIcon, PqShieldIcon, AcousticResonanceIcon } from '../components/icons';


interface DecoderViewProps {
    appState: AppState;
}

export const DecoderView: React.FC<DecoderViewProps> = ({ appState }) => {
    const decoderState = useDecoder(appState);
    const [openSection, setOpenSection] = useState<string>('keys');

    const handleToggleSection = (section: string) => {
        setOpenSection(openSection === section ? '' : section);
    };

    const {
        pastedCode, setPastedCode,
        isDecoding,
        decodeError,
        decoherenceReport,
        isBlockPermutationActive, setIsBlockPermutationActive,
        isKeyHardeningActive, setIsKeyHardeningActive,
        isPqHybridActive, setIsPqHybridActive,
        isAcousticResonanceActive, setIsAcousticResonanceActive,
        handleDecode, handleDecodeFileSelect, hasPrimaryDecryptKey,
    } = decoderState;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-6 p-6 bg-brand-secondary rounded-xl shadow-2xl border border-brand-accent/50">
            <h2 className="text-2xl font-bold text-brand-green-neon">1. Configure Decoherence Protocol</h2>

             <div className="space-y-3">
                 <AccordionSection title="Key Configuration" icon={<KeyIcon />} isOpen={openSection === 'keys'} onToggle={() => handleToggleSection('keys')}>
                    <div className="flex items-center justify-between">
                         <label htmlFor="master-key-toggle-decode" className="flex items-center gap-2 text-sm font-medium text-brand-light">Master Key Mode</label>
                         <div className="tooltip-container">
                           <button role="switch" aria-checked={appState.useMasterKey} id="master-key-toggle-decode" onClick={() => appState.setUseMasterKey(!appState.useMasterKey)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appState.useMasterKey ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${appState.useMasterKey ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                           <span className="tooltip-text">Toggle between using a single Master Key to derive all other keys, or setting each key individually.</span>
                         </div>
                     </div>
                     <div className={!appState.useMasterKey ? 'opacity-50' : ''}>
                         <SecretKeyInput label="Master Key" placeholder="Enter the master password used for entanglement" secretKey={appState.masterKey} onSetSecretKey={appState.setMasterKey} onGenerateKey={() => appState.setMasterKey(generateSecureKey())} disabled={!appState.useMasterKey} tooltipText="A single key from which all other keys (Alpha, Omega, Decoy) will be cryptographically derived using Argon2id. Simplifies key management."/>
                     </div>
                     <hr className="border-brand-accent/30" />
                     <SecretKeyInput label="Alpha Key (Primary)" placeholder="Enter your main access key..." secretKey={appState.alphaKey} onSetSecretKey={appState.setAlphaKey} onGenerateKey={appState.handleGenerateAlphaKey} disabled={appState.useMasterKey} tooltipText="The main cryptographic key used during the original entanglement. This key is always required."/>
                     <SecretKeyInput label="Omega Key (If Used)" placeholder="Required for 2-layer encryption..." secretKey={appState.omegaKey} onSetSecretKey={appState.setOmegaKey} onGenerateKey={appState.handleGenerateOmegaKey} disabled={appState.useMasterKey} tooltipText="If an Omega key was used to create a second encryption layer, it must be provided here to correctly decrypt the payload."/>
                     <SecretKeyInput label="Decoy Key (Deniable)" placeholder="Optional 'duress' key..." secretKey={appState.decoyKey} onSetSecretKey={appState.setDecoyKey} onGenerateKey={appState.handleGenerateDecoyKey} tooltipText="Optional. Providing a 'duress' key used during entanglement will successfully decrypt its corresponding decoy, enhancing plausible deniability by proving a harmless file can be 'recovered'." disabled={appState.useMasterKey}/>
                </AccordionSection>

                <AccordionSection title="Decryption Parameters" icon={<SubkeyDerivationIcon />} isOpen={openSection === 'params'} onToggle={() => handleToggleSection('params')}>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between">
                                <label htmlFor="key-hardening-toggle-decode" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light">Sub-key Derivation<InfoIcon /><span className="tooltip-text">Enable if the payload was entangled with Sub-key Derivation. This setting must match the original entanglement configuration.</span></label>
                                <div className="tooltip-container">
                                  <button role="switch" aria-checked={isKeyHardeningActive} id="key-hardening-toggle-decode" onClick={() => setIsKeyHardeningActive(!isKeyHardeningActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isKeyHardeningActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${isKeyHardeningActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                  <span className="tooltip-text">Toggle Sub-key Derivation. Must match setting used during encoding.</span>
                                </div>
                              </div>
                         </div>
                         <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between">
                               <label htmlFor="block-permutation-toggle-decode" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light">Block Permutation<InfoIcon /><span className="tooltip-text">Enable if the payload was entangled with Block Permutation. This setting must match the original entanglement configuration.</span></label>
                               <div className="tooltip-container">
                                <button role="switch" aria-checked={isBlockPermutationActive} id="block-permutation-toggle-decode" onClick={() => setIsBlockPermutationActive(!isBlockPermutationActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isBlockPermutationActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${isBlockPermutationActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle Block Permutation. Must match setting used during encoding.</span>
                               </div>
                             </div>
                         </div>
                         <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between">
                               <label htmlFor="pq-hybrid-toggle-decode" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light">Post-Quantum Hybrid<InfoIcon /><span className="tooltip-text">Enable if the payload was entangled with Post-Quantum Hybrid mode. This setting must match the original entanglement configuration.</span></label>
                               <div className="tooltip-container">
                                <button role="switch" aria-checked={isPqHybridActive} id="pq-hybrid-toggle-decode" onClick={() => setIsPqHybridActive(!isPqHybridActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPqHybridActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${isPqHybridActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle Post-Quantum Hybrid mode. Must match setting used during encoding.</span>
                               </div>
                             </div>
                         </div>
                         <div className="p-3 bg-brand-primary/80 border border-brand-accent/50 rounded-lg space-y-2">
                             <div className="flex items-center justify-between">
                               <label htmlFor="ark-toggle-decode" className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light">Acoustic Resonance<InfoIcon /><span className="tooltip-text">Enable if the payload was entangled with Acoustic Resonance Keying. This setting must match the original entanglement configuration.</span></label>
                               <div className="tooltip-container">
                                <button role="switch" aria-checked={isAcousticResonanceActive} id="ark-toggle-decode" onClick={() => setIsAcousticResonanceActive(!isAcousticResonanceActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAcousticResonanceActive ? 'bg-brand-green-neon' : 'bg-brand-accent'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-brand-text transition-transform ${isAcousticResonanceActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                <span className="tooltip-text">Toggle Acoustic Resonance Keying mode. Must match setting used during encoding.</span>
                               </div>
                             </div>
                         </div>
                     </div>
                </AccordionSection>

                 <div className="p-3 bg-brand-primary/50 border border-brand-accent/50 rounded-lg space-y-2">
                    <div className="tooltip-icon-container group flex items-center gap-2 text-sm font-medium text-brand-light">
                        <ScatterIcon /> Image Steganography Algorithm
                        <InfoIcon />
                        <span className="tooltip-text">The insecure LSB algorithm has been removed. Payloads must be extracted using the 'Entropic Dispersal' method, which requires the Alpha Key.</span>
                    </div>
                     <p className="text-brand-green-neon font-bold text-center p-2 bg-brand-accent/30 rounded mt-2">
                        Entropic Dispersal (Hardened)
                    </p>
                </div>
            </div>


            <FileUploader 
                id="disentangle-uploader" 
                onFileSelect={handleDecodeFileSelect} 
                mainText="Upload .ccup or .png file"
                subText="A Chimera Cipher Unified Payload or Covert Image"
                acceptedFileTypes=".ccup,image/png,application/octet-stream"
            />

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-brand-accent/50"></div>
                <span className="flex-shrink mx-4 text-brand-accent text-sm">OR</span>
                <div className="flex-grow border-t border-brand-accent/50"></div>
            </div>
            <div className="tooltip-container w-full">
             <textarea value={pastedCode} onChange={(e) => setPastedCode(e.target.value)} placeholder="...or paste Unified Payload / Covert Text here"
              className="w-full h-40 p-4 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text resize-none"/>
              <span className="tooltip-text">Paste the full Base64 payload string or the steganographic text here.</span>
            </div>
            <div className="tooltip-container w-full">
              <button onClick={handleDecode} disabled={isDecoding || !pastedCode || !hasPrimaryDecryptKey || isAcousticResonanceActive}
                className="flex items-center justify-center gap-2 w-full bg-brand-green-neon text-brand-primary font-bold py-3 px-6 rounded-lg hover:bg-opacity-80 transition-all duration-300 disabled:bg-brand-accent disabled:cursor-not-allowed">
                <DecodeIcon />
                {isDecoding ? 'Deconstructing Reality...' : 'Initiate Decoherence'}
              </button>
              <span className="tooltip-text">Start the decryption and analysis process. Requires a payload and at least an Alpha/Master Key. Disabled if ARK is active (upload file instead).</span>
            </div>
          </div>
           <div className="flex flex-col gap-6 p-6 bg-brand-secondary rounded-xl shadow-2xl min-h-full border border-brand-accent/50">
            <h2 className="text-2xl font-bold text-brand-green-neon">2. Decoherence Report</h2>
            <DecoherenceReport report={decoherenceReport} isLoading={isDecoding} error={decodeError} />
          </div>
        </div>
    );
}