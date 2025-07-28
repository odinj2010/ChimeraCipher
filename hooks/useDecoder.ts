
import { useState, useCallback, useEffect } from 'react';
import { AppState } from './useAppState';
import { DecodedFileInfo } from '../types';
import { DecoherenceResult } from '../components/DecoherenceReport';
import { extract as extractFromText } from '../lib/steganography';
import { extractDataFromImage } from '../lib/imageSteganography';
import pako from 'pako';
import { 
    decryptData,
    base64ToUint8Array,
    arrayBufferToBase64,
    xorUint8Arrays,
    reverseBlockPermutation,
    getShortHash,
    hardenKeyWithHKDF,
    normalizeKeyFromString,
    EV_KEY_SECRET_LENGTH,
    EV_KEY_COUNTER_LENGTH,
    EV_KEY_TOTAL_LENGTH,
    MAGIC_BYTE_BINARY_FORMAT,
    getHybridKey,
    generateImageFingerprint,
    deriveAcousticResonanceKey,
    extractFromArmoredPng,
} from '../lib/crypto';

export const useDecoder = (appState: AppState) => {
    const { getOperationalKeys, onResetPayloadState, masterKey, alphaKey, useMasterKey } = appState;

    const [pastedCode, setPastedCode] = useState<string>('');
    const [decodedFileInfo, setDecodedFileInfo] = useState<DecodedFileInfo | null>(null);
    const [decoherenceReport, setDecoherenceReport] = useState<DecoherenceResult[] | null>(null);
    const [isDecoding, setIsDecoding] = useState<boolean>(false);
    const [decodeError, setDecodeError] = useState<string | null>(null);
    
    // Settings (must match encoder)
    const [isBlockPermutationActive, setIsBlockPermutationActive] = useState<boolean>(false);
    const [isKeyHardeningActive, setIsKeyHardeningActive] = useState<boolean>(true);
    const [isPqHybridActive, setIsPqHybridActive] = useState<boolean>(false);
    const [isAcousticResonanceActive, setIsAcousticResonanceActive] = useState<boolean>(false);
    
    const hasPrimaryDecryptKey = (useMasterKey && !!masterKey) || !!alphaKey;
    
    const resetPayloadState = useCallback(() => {
        setDecodeError(null);
        if(decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
        setDecodedFileInfo(null);
        setDecoherenceReport(null);
        setPastedCode('');
    }, [decodedFileInfo?.url]);

    useEffect(() => {
        return onResetPayloadState(resetPayloadState);
    }, [onResetPayloadState, resetPayloadState]);

    useEffect(() => {
        return () => {
          if (decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
        };
    }, [decodedFileInfo]);

    const handleDecode = useCallback(async () => {
        if (!pastedCode.trim() || !hasPrimaryDecryptKey) {
          setDecodeError('Alpha Key/Master Key and Unified Payload are required.');
          return;
        }
        const { alphaKey: opAlphaKey, omegaKey: opOmegaKey, decoyKey: opDecoyKey } = await getOperationalKeys();
    
        const textDecoder = new TextDecoder();
        setDecodeError(null);
        if(decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
        setDecodedFileInfo(null);
        setDecoherenceReport(null);
        setIsDecoding(true);
    
        try {
          const extractedBytes = await extractFromText(pastedCode, opAlphaKey);
          const embeddedData = extractedBytes ? arrayBufferToBase64(extractedBytes) : pastedCode;
          
          let decodedBytes;
          try {
            decodedBytes = base64ToUint8Array(embeddedData);
          } catch(e) {
              throw new Error("Payload decoding failed. The data is not a valid Base64 string, which may indicate corruption or an incorrect format.");
          }
    
          let evKeyCombinedBytes: Uint8Array;
          let blobs: Uint8Array[];
    
          if (decodedBytes[0] === MAGIC_BYTE_BINARY_FORMAT) { // Binary Format
              let offset = 1;
              evKeyCombinedBytes = decodedBytes.slice(offset, offset + EV_KEY_TOTAL_LENGTH);
              offset += EV_KEY_TOTAL_LENGTH;
              const blobCount = decodedBytes[offset];
              offset++;
              const dataView = new DataView(decodedBytes.buffer);
              const blobSizes: number[] = [];
              for (let i = 0; i < blobCount; i++) {
                  blobSizes.push(dataView.getUint32(offset, false));
                  offset += 4;
              }
              blobs = [];
              for (const size of blobSizes) {
                  blobs.push(decodedBytes.slice(offset, offset + size));
                  offset += size;
              }
          } else { // Legacy JSON Format
            try {
              const decodedPayloadString = textDecoder.decode(decodedBytes);
              const unifiedPayload = JSON.parse(decodedPayloadString);
              const { q: entropicVeilKeyInput, d: stream } = unifiedPayload;
              if (!entropicVeilKeyInput || !stream) throw new Error("Invalid Unified Payload format (Legacy JSON).");
              evKeyCombinedBytes = base64ToUint8Array(entropicVeilKeyInput);
              blobs = stream.split('|').map((b: string) => base64ToUint8Array(b));
            } catch(e) {
                throw new Error("Could not parse Legacy JSON payload. The data may be corrupt, not a JSON payload, or in the modern binary format.");
            }
          }
    
          if (evKeyCombinedBytes.length !== EV_KEY_TOTAL_LENGTH) throw new Error(`Invalid Entropic Veil Key. Expected ${EV_KEY_TOTAL_LENGTH} bytes.`);
          
          const evSecret = evKeyCombinedBytes.slice(0, EV_KEY_SECRET_LENGTH);
          const evCounter = evKeyCombinedBytes.slice(EV_KEY_SECRET_LENGTH, EV_KEY_TOTAL_LENGTH);
          const evStreamKey = await window.crypto.subtle.importKey('raw', evSecret, { name: 'AES-CTR' }, false, ['encrypt']);
          
          let realPayloadFound = false;
    
            let finalAlphaKeyB64 = await normalizeKeyFromString(opAlphaKey);
            let finalOmegaKeyB64 = await normalizeKeyFromString(opOmegaKey);
    
            if (isKeyHardeningActive) {
                let configByte = 0;
                if (isBlockPermutationActive) configByte |= 1;
                if (isPqHybridActive) configByte |= 2;
                
                if (finalAlphaKeyB64) finalAlphaKeyB64 = await hardenKeyWithHKDF(finalAlphaKeyB64, 'chimera-alpha-harden', configByte);
                if (finalOmegaKeyB64) finalOmegaKeyB64 = await hardenKeyWithHKDF(finalOmegaKeyB64, 'chimera-omega-harden', configByte);
            }

            if (isPqHybridActive) {
                if (finalAlphaKeyB64) finalAlphaKeyB64 = await getHybridKey(finalAlphaKeyB64);
                if (finalOmegaKeyB64) finalOmegaKeyB64 = await getHybridKey(finalOmegaKeyB64);
            }
    
          const analysisPromises = blobs.map(async (blobBytes, index): Promise<DecoherenceResult> => {
            const blobHash = await getShortHash(arrayBufferToBase64(blobBytes));
            
            const deXorredBytes = xorUint8Arrays(blobBytes, new Uint8Array(await window.crypto.subtle.encrypt(
                { name: 'AES-CTR', counter: evCounter, length: 128 },
                evStreamKey, new Uint8Array(blobBytes.length)
            )));
    
            // Attempt 1: Real Payload (Alpha/Omega Keys)
            try {
              let permReversed = deXorredBytes;
              if (isBlockPermutationActive) permReversed = await reverseBlockPermutation(deXorredBytes, finalAlphaKeyB64);
              
              let tempPayload = await decryptData(finalAlphaKeyB64, permReversed);
              if (opOmegaKey) tempPayload = await decryptData(finalOmegaKeyB64, tempPayload);
    
              const view = new DataView(tempPayload.buffer);
              if (tempPayload.length < 2) throw new Error('Payload too small for metadata.');
              const metadataLen = view.getUint16(0, false);
              if (tempPayload.length < 2 + metadataLen) throw new Error('Payload corrupt, metadata length exceeds payload size.');
              
              const metadataBytes = tempPayload.slice(2, 2 + metadataLen);
              const metadataJsonString = textDecoder.decode(metadataBytes);
              const { f: fileName, t: mimeType, c: isCompressed } = JSON.parse(metadataJsonString);
              if (!fileName || !mimeType) throw new Error('Invalid real payload format');
    
              let finalBytes = tempPayload.slice(2 + metadataLen);
              if (isCompressed) finalBytes = pako.inflate(finalBytes);
              
              const fileBlob = new Blob([finalBytes], { type: mimeType });
              const fileUrl = URL.createObjectURL(fileBlob);
              const payload = { name: fileName, url: fileUrl, isImage: mimeType.startsWith('image/') };
    
              setDecodedFileInfo(payload);
              realPayloadFound = true;
              return { id: index, blobHash, status: 'REAL_PAYLOAD', keyUsed: 'Alpha', payload };
            } catch (e) {
              // Continue.
            }
    
            // Attempt 2: Decoy Payload (Decoy Key) - no hardening on decoy key
            if (opDecoyKey) {
                try {
                    // Decoy keys are not hardened with settings to keep them simple.
                    const finalDecoyKey = await normalizeKeyFromString(opDecoyKey);
                    const decoyBytes = await decryptData(finalDecoyKey, deXorredBytes);
                    const decoyText = textDecoder.decode(decoyBytes);
                    // A simple heuristic to check if the decrypted content is plausible text.
                    if (decoyText.length > 10 && decoyText.includes(' ')) {
                        return { id: index, blobHash, status: 'DECOY_PAYLOAD', keyUsed: 'Decoy', payload: decoyText };
                    }
                } catch(e) {
                    // Continue.
                }
            }
    
            return { id: index, blobHash, status: 'FAILURE', keyUsed: 'None' };
          });
          
          const report = await Promise.all(analysisPromises);
          setDecoherenceReport(report);
    
          if (!realPayloadFound) {
            throw new Error("DECOHERENCE FAILED. Keys are incorrect or data is corrupt. Unable to isolate real data from digital dust.");
          }
    
        } catch (error) {
          setDecodeError(error instanceof Error ? error.message : 'An unknown error occurred during decoherence.');
          if(decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
          setDecodedFileInfo(null);
          setDecoherenceReport(null);
        } finally {
          setIsDecoding(false);
        }
    }, [pastedCode, getOperationalKeys, isBlockPermutationActive, isKeyHardeningActive, isPqHybridActive, hasPrimaryDecryptKey, decodedFileInfo?.url]);

    const handleDecodeArkImage = useCallback(async (file: File) => {
        if (!hasPrimaryDecryptKey) {
          setDecodeError('Alpha Key or Master Key is required for ARK decoherence.');
          return;
        }

        const { alphaKey: opAlphaKey } = await getOperationalKeys();
        setIsDecoding(true);
        setDecodeError(null);
        if(decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
        setDecodedFileInfo(null);

        try {
            const fileBytes = new Uint8Array(await file.arrayBuffer());
            const fileUrlForExtraction = URL.createObjectURL(file);

            const fingerprint = await generateImageFingerprint(fileBytes);
            const arkKeyB64 = await deriveAcousticResonanceKey(opAlphaKey, fingerprint);
            const extractedCiphertext = await extractDataFromImage(fileUrlForExtraction, opAlphaKey);
            URL.revokeObjectURL(fileUrlForExtraction);
            if (!extractedCiphertext) {
                throw new Error("No covert data found in image. Stego-pattern key (Alpha) may be wrong.");
            }

            const decryptedPayload = await decryptData(arkKeyB64, extractedCiphertext);
            
            const view = new DataView(decryptedPayload.buffer);
            if (decryptedPayload.length < 2) throw new Error('Payload too small for metadata.');
            const metadataLen = view.getUint16(0, false);
            if (decryptedPayload.length < 2 + metadataLen) throw new Error('Payload corrupt, metadata length exceeds payload size.');
            
            const metadataBytes = decryptedPayload.slice(2, 2 + metadataLen);
            const metadataJsonString = new TextDecoder().decode(metadataBytes);
            const { f: fileName, t: mimeType, c: isCompressed } = JSON.parse(metadataJsonString);
            if (!fileName || !mimeType) throw new Error('Invalid real payload format');

            let finalBytes = decryptedPayload.slice(2 + metadataLen);
            if (isCompressed) finalBytes = pako.inflate(finalBytes);
          
            const fileBlob = new Blob([finalBytes], { type: mimeType });
            const finalFileUrl = URL.createObjectURL(fileBlob);
            const payload = { name: fileName, url: finalFileUrl, isImage: mimeType.startsWith('image/') };

            setDecodedFileInfo(payload);
            setDecoherenceReport([{ id: 0, blobHash: await getShortHash(file.name), status: 'REAL_PAYLOAD', keyUsed: 'Alpha (ARK)', payload }]);

        } catch (error) {
            setDecodeError(error instanceof Error ? error.message : 'ARK decoherence failed. The Alpha Key, carrier image, or payload may be incorrect/corrupt.');
            if(decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
            setDecodedFileInfo(null);
            setDecoherenceReport(null);
        } finally {
            setIsDecoding(false);
        }
    }, [getOperationalKeys, hasPrimaryDecryptKey, decodedFileInfo?.url]);

    const handleDecodeFileSelect = async (file: File) => {
        setDecodeError(null);
        if(decodedFileInfo?.url) URL.revokeObjectURL(decodedFileInfo.url);
        setDecodedFileInfo(null);
        setDecoherenceReport(null);
        setPastedCode('');

        setIsDecoding(true);
        try {
            if (isAcousticResonanceActive) {
                if (!file.type.startsWith('image/png')) {
                    throw new Error("Acoustic Resonance Keying requires a PNG image file.");
                }
                await handleDecodeArkImage(file);
            } else if (file.type === 'image/png') {
                const buffer = await file.arrayBuffer();
                const fileBytes = new Uint8Array(buffer);
                
                // Check for Transport Armor first
                const armoredPayload = extractFromArmoredPng(fileBytes);
                if (armoredPayload) {
                    setPastedCode(arrayBufferToBase64(armoredPayload));
                    return; // Auto-decode will be triggered by useEffect
                }

                // If not armored, treat as standard steganography
                if (!hasPrimaryDecryptKey) {
                    throw new Error("Alpha Key or Master Key is required to extract payload from a covert image.");
                }
                const dataUrl = URL.createObjectURL(file);
                const { alphaKey: opAlphaKey } = await getOperationalKeys();
                const extractedPayloadBytes = await extractDataFromImage(dataUrl, opAlphaKey);
                URL.revokeObjectURL(dataUrl);

                if (extractedPayloadBytes) {
                    setPastedCode(arrayBufferToBase64(extractedPayloadBytes));
                } else {
                    throw new Error("No covert payload detected. Key may be incorrect or the image does not contain a payload.");
                }
            } else if (file.name.endsWith('.ccup')) {
                const buffer = await file.arrayBuffer();
                const base64String = arrayBufferToBase64(buffer);
                setPastedCode(base64String);
            } else {
                throw new Error("Unsupported file type. Please upload a .ccup or .png file.");
            }
        } catch (error) {
            setDecodeError(error instanceof Error ? error.message : 'Failed to process file.');
        } finally {
            setIsDecoding(false);
        }
    };
    
    // Auto-run decode when pastedCode is programmatically set
    useEffect(() => {
        if (pastedCode && !isDecoding && !isAcousticResonanceActive) {
            handleDecode();
        }
    }, [pastedCode, isDecoding, isAcousticResonanceActive, handleDecode]);
    
    return {
        // State
        pastedCode,
        decodedFileInfo,
        decoherenceReport,
        isDecoding,
        decodeError,
        isBlockPermutationActive,
        isKeyHardeningActive,
        isPqHybridActive,
        isAcousticResonanceActive,

        // Setters
        setPastedCode,
        setIsBlockPermutationActive,
        setIsKeyHardeningActive,
        setIsPqHybridActive,
        setIsAcousticResonanceActive,

        // Handlers
        handleDecodeFileSelect,
        handleDecode,
        hasPrimaryDecryptKey,
    };
}
