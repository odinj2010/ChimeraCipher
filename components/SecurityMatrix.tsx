
import React, { useState, useEffect } from 'react';
import { ShieldIcon, InfoIcon } from './icons';
import type { DeniabilityLevel, PayloadFormat } from '../types';
import { getShortHash } from '../lib/crypto';

interface SecurityMatrixProps {
    masterKey: string;
    primaryKey: string;
    cipherKey: string;
    decoyKey: string;
    codeGenerated: boolean;
    isScrubberActive: boolean;
    isAirGapped: boolean;
    isClipboardSanitizerActive: boolean;
    isCompressionActive: boolean;
    isBlockPermutationActive: boolean;
    isKeyHardeningActive: boolean;
    isPqHybridActive: boolean;
    isAcousticResonanceActive: boolean;
    deniabilityLevel: DeniabilityLevel;
    payloadFormat: PayloadFormat;
    isDynamicDecoysActive: boolean;
    useMasterKey: boolean;
    isGhostNetworkActive: boolean;
}


export const SecurityMatrix: React.FC<SecurityMatrixProps> = ({ masterKey, primaryKey, cipherKey, decoyKey, codeGenerated, isScrubberActive, isAirGapped, isClipboardSanitizerActive, isCompressionActive, isBlockPermutationActive, isKeyHardeningActive, isPqHybridActive, isAcousticResonanceActive, deniabilityLevel, payloadFormat, isDynamicDecoysActive, useMasterKey, isGhostNetworkActive }) => {
    const [hashes, setHashes] = useState({ primary: 'INACTIVE', cipher: 'INACTIVE' });

    useEffect(() => {
        const updateHashes = async () => {
            if (useMasterKey) {
                 // Hashes are not displayed in master key mode, so no update needed here.
                 // The JSX handles displaying the derived status.
            } else {
                const primaryHash = await getShortHash(primaryKey);
                const cipherHash = await getShortHash(cipherKey);
                setHashes({ primary: primaryHash, cipher: cipherHash });
            }
        };
        updateHashes();
    }, [primaryKey, cipherKey, useMasterKey]);

    if (!codeGenerated) {
        return (
            <div className="border-2 border-dashed border-brand-accent/50 p-3 rounded-lg text-center text-brand-accent">
                <p>Awaiting entanglement protocol...</p>
            </div>
        );
    }
    
    const isMasterKeyActive = useMasterKey && !!masterKey;
    const layers = isMasterKeyActive ? 2 : ((primaryKey ? 1 : 0) + (cipherKey ? 1 : 0));
    
    const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
        <div className="tooltip-container group">
            {children}
            <InfoIcon />
            <span className="tooltip-text">{text}</span>
        </div>
    );
    
    const deniabilityMap: Record<DeniabilityLevel, string> = {
        hardened: 'HARDENED (4 CANDIDATES)',
        standard: 'STANDARD (2 CANDIDATES)',
        minimal: 'MINIMAL (1 CANDIDATE)',
    };


    return (
        <div className="border-2 border-brand-accent/80 p-3 rounded-lg text-xs text-brand-light bg-brand-primary/50">
            <h3 className="flex items-center gap-2 font-bold text-brand-text mb-2"><ShieldIcon /> SECURITY MATRIX</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 items-center">
                <Tooltip text="When active, Alpha, Omega, and Decoy keys are derived from a single master password.">
                    <span>MASTER KEY MODE:</span>
                </Tooltip>
                 <span className={`font-bold ${isMasterKeyActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {useMasterKey ? (isMasterKeyActive ? 'ACTIVE' : 'PENDING INPUT') : 'INACTIVE'}
                </span>
                
                <span>ENCRYPTION LAYERS:</span>
                <span className={`font-bold ${layers > 1 ? 'text-brand-green-neon' : 'text-brand-text'}`}>{layers}</span>

                <span>ALPHA KEY ID:</span>
                <span className="font-mono">{useMasterKey ? (isMasterKeyActive ? 'ACTIVE (DERIVED)' : 'INACTIVE') : hashes.primary}</span>
                
                <span>OMEGA KEY ID:</span>
                <span className={`font-mono ${layers > 1 ? 'text-brand-text' : 'text-brand-accent'}`}>{useMasterKey ? (isMasterKeyActive ? 'ACTIVE (DERIVED)' : 'INACTIVE') : (layers > 1 ? hashes.cipher : 'INACTIVE')}</span>
                
                 <Tooltip text="The steganographic pattern itself is encrypted using a derivative of the Alpha Key, making the hidden data unreadable without it.">
                    <span>STEGANOGRAPHIC CIPHER:</span>
                </Tooltip>
                <span className={`font-bold ${codeGenerated ? 'text-brand-green-neon' : 'text-brand-light'}`}>
                    {codeGenerated ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <Tooltip text="Adds a final XOR obfuscation layer using a one-time key, making the final ciphertext statistically indistinguishable from random noise.">
                    <span>ENTROPIC VEIL:</span>
                </Tooltip>
                <span className={`font-bold ${codeGenerated ? 'text-brand-green-neon' : 'text-brand-light'}`}>
                    {codeGenerated ? 'ACTIVE' : 'INACTIVE'}
                </span>
                
                <Tooltip text="Further derives unique sub-keys from the Alpha and Omega keys using HKDF, adding cryptographic isolation.">
                    <span>SUB-KEY DERIVATION:</span>
                </Tooltip>
                <span className={`font-bold ${isKeyHardeningActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {isKeyHardeningActive ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <Tooltip text="An experimental obfuscation layer that deterministically shuffles the encrypted data bytes based on the Alpha Key.">
                    <span>BLOCK PERMUTATION:</span>
                </Tooltip>
                <span className={`font-bold ${isBlockPermutationActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {isBlockPermutationActive ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <Tooltip text="Combines classical keys with a PQC-style secret to harden against future quantum computing threats.">
                    <span>POST-QUANTUM HYBRID:</span>
                </Tooltip>
                <span className={`font-bold ${isPqHybridActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {isPqHybridActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                
                 <Tooltip text="Derives a unique key from the carrier image's statistical fingerprint, making the carrier a required component for decryption.">
                    <span>ACOUSTIC RESONANCE:</span>
                </Tooltip>
                <span className={`font-bold ${isAcousticResonanceActive ? 'text-purple-400' : 'text-yellow-400'}`}>
                    {isAcousticResonanceActive ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <Tooltip text="Hides the real encrypted data among plausible decoys (encrypted literary text). This frustrates analysis and prevents an attacker from knowing which data block is the real one.">
                    <span>DIGITAL DUST:</span>
                </Tooltip>
                <span className={`font-bold ${deniabilityLevel === 'minimal' ? 'text-yellow-400' : 'text-brand-green-neon'}`}>{deniabilityMap[deniabilityLevel]}</span>

                {deniabilityLevel !== 'minimal' && (
                    <>
                        <Tooltip text="When a Decoy Key is set, the payload contains a decoy that can be 'decrypted' using that key, providing true deniable encryption.">
                            <span>DENIABLE ENCRYPTION:</span>
                        </Tooltip>
                        <span className={`font-bold ${decoyKey || isMasterKeyActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                            {decoyKey || isMasterKeyActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        
                        <Tooltip text="Decoy content source. Dynamic decoys are generated by AI for each entanglement, providing superior camouflage over static, pre-written texts.">
                            <span>DECOY TYPE:</span>
                        </Tooltip>
                        <span className={`font-bold ${isDynamicDecoysActive ? 'text-brand-green-neon' : 'text-brand-text'}`}>
                            {isDynamicDecoysActive ? 'DYNAMIC (AI)' : 'STATIC'}
                        </span>
                    </>
                )}

                <span>PAYLOAD FORMAT:</span>
                 <span className={`font-bold ${payloadFormat === 'binary' ? 'text-brand-green-neon' : 'text-brand-text'}`}>
                    {payloadFormat.toUpperCase()}
                </span>

                <span>PAYLOAD COMPRESSION:</span>
                 <span className={`font-bold ${isCompressionActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {isCompressionActive ? 'ACTIVE' : 'INACTIVE'}
                </span>

                <span>DATA SCRUBBER:</span>
                <span className={`font-bold ${isScrubberActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {isScrubberActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                
                <span>CLIPBOARD SANITIZER:</span>
                <span className={`font-bold ${isClipboardSanitizerActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {isClipboardSanitizerActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                
                <span>NETWORK STATUS:</span>
                <span className={`font-bold ${isAirGapped ? 'text-blue-400' : 'text-red-500'}`}>
                    {isAirGapped ? 'AIR-GAPPED (OFFLINE)' : 'ONLINE'}
                </span>

                 <Tooltip text="Obfuscates AI requests by sending multiple dummy requests alongside the real one to hide user activity.">
                    <span>GHOST NETWORK:</span>
                </Tooltip>
                <span className={`font-bold ${!isAirGapped && isGhostNetworkActive ? 'text-brand-green-neon' : 'text-yellow-400'}`}>
                    {!isAirGapped && isGhostNetworkActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>
        </div>
    );
};
