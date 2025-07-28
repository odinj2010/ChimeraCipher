
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from './useAppState';
import { FileInfo, DecodedFileInfo, DeniabilityLevel, PayloadFormat, Preset, EncodeOutputTab, ImageStegoRisk, AiProvider, LocalLlmSettings } from '../types';
import { generateStory, generatePromptFromImage, generateDecoyTexts, generateImageFromPrompt, API_KEY_ERROR, LOCAL_ENDPOINT_ERROR } from '../lib/ai';
import { embed as embedInText } from '../lib/steganography';
import { embedDataInImage, LENGTH_HEADER_SIZE } from '../lib/imageSteganography';
import pako from 'pako';
import { 
    encryptData, 
    sanitizeImage,
    readFileAsBytes,
    arrayBufferToBase64,
    xorUint8Arrays,
    applyBlockPermutation,
    secureShuffle,
    hardenKeyWithHKDF,
    normalizeKeyFromString,
    EV_KEY_SECRET_LENGTH,
    EV_KEY_COUNTER_LENGTH,
    EV_KEY_TOTAL_LENGTH,
    MAGIC_BYTE_BINARY_FORMAT,
    getHybridKey,
    generateImageFingerprint,
    deriveAcousticResonanceKey,
    secureRandom,
    generateSecureKey,
    deriveStandardCostKeyFromPassword,
    deriveHighCostKeyFromPassword,
    createArmoredPng,
} from '../lib/crypto';


export const useEncoder = (appState: AppState) => {
    const { getOperationalKeys, onResetPayloadState, masterKey, alphaKey, useMasterKey, isAirGapped } = appState;

    const [originalFileInfo, setOriginalFileInfo] = useState<FileInfo | null>(null);
    const [secureCode, setSecureCode] = useState<string>('');
    const [binaryPayload, setBinaryPayload] = useState<Uint8Array | null>(null);
    const [preparedPayload, setPreparedPayload] = useState<Uint8Array | null>(null);
    const [isEncoding, setIsEncoding] = useState<boolean>(false);
    const [encodeError, setEncodeError] = useState<string | null>(null);
    
    // Settings
    const [isScrubberActive, setIsScrubberActive] = useState<boolean>(true);
    const [isCompressionActive, setIsCompressionActive] = useState<boolean>(true);
    const [isBlockPermutationActive, setIsBlockPermutationActive] = useState<boolean>(false);
    const [isKeyHardeningActive, setIsKeyHardeningActive] = useState<boolean>(true);
    const [isGhostNetworkActive, setIsGhostNetworkActive] = useState<boolean>(true); 
    const [isPqHybridActive, setIsPqHybridActive] = useState<boolean>(false);
    const [isAcousticResonanceActive, setIsAcousticResonanceActive] = useState<boolean>(false);
    const [deniabilityLevel, setDeniabilityLevel] = useState<DeniabilityLevel>('hardened');
    const [payloadFormat, setPayloadFormat] = useState<PayloadFormat>('binary');
    const [isDynamicDecoysActive, setIsDynamicDecoysActive] = useState<boolean>(true);
    const [preset, setPreset] = useState<Preset>('custom');

    // Steganography State
    const [activeTab, setActiveTab] = useState<EncodeOutputTab>('code');
    const [stealthPrompt, setStealthPrompt] = useState<string>('');
    const [stealthText, setStealthText] = useState<string>('');
    const [isGeneratingStealth, setIsGeneratingStealth] = useState<boolean>(false);
    const [stealthError, setStealthError] = useState<string | null>(null);
    const [carrierImage, setCarrierImage] = useState<FileInfo | null>(null);
    const [stegoImage, setStegoImage] = useState<DecodedFileInfo | null>(null);
    const [isEmbeddingInImage, setIsEmbeddingInImage] = useState<boolean>(false);
    const [imageStegoError, setImageStegoError] = useState<string | null>(null);
    const [imageGenPrompt, setImageGenPrompt] = useState<string>('A high detail photorealistic cat');
    const [imageStegoRiskLevel, setImageStegoRiskLevel] = useState<ImageStegoRisk | null>(null);

    const isAiFeatureAvailable = (feature: 'text' | 'image') => {
        const provider = localStorage.getItem('chimera-ai-provider') as AiProvider || 'gemini';
        if (provider === 'gemini') {
            return !isAirGapped;
        }
        const settingsJson = localStorage.getItem('chimera-local-llm-settings');
        if (!settingsJson) return false;
        const settings: LocalLlmSettings = JSON.parse(settingsJson);
        if (feature === 'text') {
            return !!settings.textGenerationEndpoint;
        }
        if (feature === 'image') {
            return settings.isImageGenerationEnabled && !!settings.imageGenerationEndpoint;
        }
        return false;
    };
    
    const resetPayloadState = useCallback(() => {
        setEncodeError(null);
        if(originalFileInfo?.url) URL.revokeObjectURL(originalFileInfo.url);
        setOriginalFileInfo(null);
        setSecureCode('');
        setBinaryPayload(null);
        setPreparedPayload(null);
        setStealthPrompt('');
        setStealthText('');
        setIsGeneratingStealth(false);
        setStealthError(null);
        setActiveTab('code');
        appState.encoderActiveTabRef.current = 'code';
        if(carrierImage?.url) URL.revokeObjectURL(carrierImage.url);
        setCarrierImage(null);
        if(stegoImage?.url) URL.revokeObjectURL(stegoImage.url);
        setStegoImage(null);
        setIsEmbeddingInImage(false);
        setImageStegoError(null);
        setImageGenPrompt('A high detail photorealistic cat');
    }, [appState.encoderActiveTabRef]);
    
    useEffect(() => {
        return onResetPayloadState(resetPayloadState);
    }, [onResetPayloadState, resetPayloadState]);

    useEffect(() => {
        return () => {
          if (originalFileInfo?.url) URL.revokeObjectURL(originalFileInfo.url);
          if (carrierImage?.url) URL.revokeObjectURL(carrierImage.url);
          if (stegoImage?.url) URL.revokeObjectURL(stegoImage.url);
        };
    }, [originalFileInfo, carrierImage, stegoImage]);

    useEffect(() => {
        appState.encoderActiveTabRef.current = activeTab;
    }, [activeTab, appState.encoderActiveTabRef]);

    useEffect(() => {
        if (!isAiFeatureAvailable('text')) {
            setIsDynamicDecoysActive(false);
            if (activeTab === 'stealth') setActiveTab('code');
        }
        if (!isAiFeatureAvailable('image')) {
            // No direct action needed here, button disabled state handles it.
        }
    }, [isAirGapped, activeTab]);

    useEffect(() => {
        if (preset === 'standard') {
            setIsKeyHardeningActive(true);
            setIsBlockPermutationActive(false);
            setIsPqHybridActive(false);
            setIsAcousticResonanceActive(false);
            setDeniabilityLevel('standard');
            if (isAiFeatureAvailable('text')) setIsDynamicDecoysActive(true);
            setIsCompressionActive(true);
            setIsScrubberActive(true);
        } else if (preset === 'paranoid') {
            setIsKeyHardeningActive(true);
            setIsBlockPermutationActive(true);
            setIsPqHybridActive(true);
            setIsAcousticResonanceActive(true);
            setDeniabilityLevel('hardened');
            if (isAiFeatureAvailable('text')) setIsDynamicDecoysActive(true);
            setIsCompressionActive(true);
            setIsScrubberActive(true);
        }
    }, [preset, isAirGapped]);

    const preparePayload = useCallback(async (fileInfo: FileInfo) => {
        const textEncoder = new TextEncoder();
        
        let dataForPayload = fileInfo.bytes;
        let wasCompressed = false;
        if (isCompressionActive) {
            const compressed = pako.deflate(fileInfo.bytes);
            if (compressed.length < fileInfo.bytes.length) {
                dataForPayload = compressed;
                wasCompressed = true;
            }
        }

        const metadata = {
          f: fileInfo.name,
          t: fileInfo.type,
          c: wasCompressed ? 1 : 0,
        };
        const metadataBytes = textEncoder.encode(JSON.stringify(metadata));
        const metadataLen = metadataBytes.length;

        const payload = new Uint8Array(2 + metadataLen + dataForPayload.length);
        const view = new DataView(payload.buffer);
        view.setUint16(0, metadataLen, false); // Big-endian
        payload.set(metadataBytes, 2);
        payload.set(dataForPayload, 2 + metadataLen);
        
        setPreparedPayload(payload);
    }, [isCompressionActive]);

    const handleEncrypt = useCallback(async () => {
        if (!preparedPayload) {
          setEncodeError("No payload has been prepared for entanglement.");
          return;
        }
        
        setIsEncoding(true);
        setEncodeError(null);

        try {
            const { alphaKey: opAlphaKey, omegaKey: opOmegaKey, decoyKey: opDecoyKey } = await getOperationalKeys();
            const textEncoder = new TextEncoder();

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
            
            let finalPayload = preparedPayload;
            if (opOmegaKey) {
                finalPayload = await encryptData(finalOmegaKeyB64, finalPayload);
            }
            let finalEncryptedPayload = await encryptData(finalAlphaKeyB64, finalPayload);
            
            if (isBlockPermutationActive) {
                finalEncryptedPayload = await applyBlockPermutation(finalEncryptedPayload, finalAlphaKeyB64);
            }

            const evSecret = window.crypto.getRandomValues(new Uint8Array(EV_KEY_SECRET_LENGTH));
            const evCounter = window.crypto.getRandomValues(new Uint8Array(EV_KEY_COUNTER_LENGTH));
            const evStreamKey = await window.crypto.subtle.importKey('raw', evSecret, { name: 'AES-CTR' }, false, ['encrypt']);
            
            const keyStream = await window.crypto.subtle.encrypt(
                { name: 'AES-CTR', counter: evCounter, length: 128 },
                evStreamKey,
                new Uint8Array(finalEncryptedPayload.length)
            );
            const xorredPayload = xorUint8Arrays(finalEncryptedPayload, new Uint8Array(keyStream));
            
            const combinedEvKey = new Uint8Array(EV_KEY_TOTAL_LENGTH);
            combinedEvKey.set(evSecret);
            combinedEvKey.set(evCounter, evSecret.length);

            const numDecoys = { hardened: 3, standard: 1, minimal: 0 }[deniabilityLevel];
            const decoyPayloads: Uint8Array[] = [];

            if (numDecoys > 0) {
                let decoyTexts: string[];
                if (isDynamicDecoysActive && isAiFeatureAvailable('text')) {
                    try {
                        decoyTexts = await generateDecoyTexts(numDecoys, isGhostNetworkActive);
                    } catch (aiError) {
                        const errorMessage = aiError instanceof Error ? aiError.message : "An unknown AI error occurred.";
                        if (errorMessage === API_KEY_ERROR || errorMessage === LOCAL_ENDPOINT_ERROR) {
                             setEncodeError("AI provider not configured. Using static decoys.");
                             appState.setIsSettingsModalOpen(true);
                        } else {
                             setEncodeError("Warning: AI decoy generation failed. Using static decoys as fallback.");
                        }
                        console.warn("AI decoy generation failed, falling back to static decoys.", aiError);
                        const staticDecoyTexts = [
                            "Agenda for Q3 sync: Review of sales figures, presentation of the new marketing strategy, and an open forum for team feedback. Please come prepared.",
                            "Grocery list: Almond milk, whole wheat bread, avocados, chicken breast, quinoa, spinach, and a bag of coffee beans. Check for a coupon on the app.",
                            "The package was delivered to the front porch at approximately 3:15 PM according to the tracking information. No signature was required.",
                        ];
                        decoyTexts = secureShuffle(staticDecoyTexts).slice(0, numDecoys);
                    }
                } else {
                     const staticDecoyTexts = [
                        "The meeting is scheduled for 3 PM in conference room B. Please come prepared to discuss the quarterly budget review. A copy of the preliminary report has been emailed to all attendees.",
                        "Reminder: System maintenance is scheduled for Saturday from 1 AM to 3 AM. Services may be intermittently unavailable during this window.",
                        "Final draft of the proposal is attached. Please review for any errors or omissions before the EOD deadline.",
                        "Note to self: research flights to Denver for the conference in July. Check hotel availability near the convention center.",
                        "The sensor data indicates a nominal temperature fluctuation of 0.5 degrees over the last hour, which is within expected operational parameters."
                    ];
                    decoyTexts = secureShuffle(staticDecoyTexts).slice(0, numDecoys);
                }
                
                const decoyTextBytesArray = decoyTexts.map(text => textEncoder.encode(text));

                if (opDecoyKey && decoyTextBytesArray.length > 0) {
                    const finalDecoyKey = await normalizeKeyFromString(opDecoyKey);
                    const decoyIndex = secureRandom(decoyTextBytesArray.length);
                    const decoyPayload = await encryptData(finalDecoyKey, decoyTextBytesArray[decoyIndex]);
                    decoyPayloads.push(decoyPayload);
                    decoyTextBytesArray.splice(decoyIndex, 1);
                }

                const tarPitIndex = deniabilityLevel === 'hardened' ? secureRandom(decoyTextBytesArray.length) : -1;

                for (let i=0; i < decoyTextBytesArray.length; i++) {
                    const decoyBytes = decoyTextBytesArray[i];
                    const randomPassword = generateSecureKey();
                    let keyBytes;
                    if(i === tarPitIndex) {
                        keyBytes = await deriveHighCostKeyFromPassword(randomPassword);
                    } else {
                        keyBytes = await deriveStandardCostKeyFromPassword(randomPassword);
                    }
                    const decoyKeyB64 = arrayBufferToBase64(keyBytes);
                    const decoyPayload = await encryptData(decoyKeyB64, decoyBytes);
                    decoyPayloads.push(decoyPayload);
                }
            }
            
            const allBlobsBytes = secureShuffle([xorredPayload, ...decoyPayloads]);
            
            let finalOutput: string;
            let finalBytesForFile: Uint8Array;

            if (payloadFormat === 'binary') {
                const totalBlobsSize = allBlobsBytes.reduce((sum, b) => sum + b.length, 0);
                const totalSize = 1 + EV_KEY_TOTAL_LENGTH + 1 + (allBlobsBytes.length * 4) + totalBlobsSize;
                const finalPayloadBytes = new Uint8Array(totalSize);
                const dataView = new DataView(finalPayloadBytes.buffer);
                let offset = 0;

                finalPayloadBytes[offset] = MAGIC_BYTE_BINARY_FORMAT; offset++;
                finalPayloadBytes.set(combinedEvKey, offset); offset += EV_KEY_TOTAL_LENGTH;
                finalPayloadBytes[offset] = allBlobsBytes.length; offset++;

                for(const blob of allBlobsBytes) {
                    dataView.setUint32(offset, blob.length, false);
                    offset += 4;
                }
                for(const blob of allBlobsBytes) {
                    finalPayloadBytes.set(blob, offset);
                    offset += blob.length;
                }
                finalBytesForFile = finalPayloadBytes;
                finalOutput = arrayBufferToBase64(finalPayloadBytes);

            } else { 
                const entropicVeilKeyBase64 = arrayBufferToBase64(combinedEvKey);
                const allBlobsBase64 = allBlobsBytes.map(b => arrayBufferToBase64(b));
                const entangledStream = allBlobsBase64.join('|');
                const unifiedPayload = { q: entropicVeilKeyBase64, d: entangledStream };
                const unifiedPayloadString = JSON.stringify(unifiedPayload);
                finalBytesForFile = textEncoder.encode(unifiedPayloadString);
                finalOutput = arrayBufferToBase64(finalBytesForFile);
            }
            
            setBinaryPayload(finalBytesForFile);
            setSecureCode(finalOutput);

        } catch (error) {
            setEncodeError(error instanceof Error ? error.message : 'An unknown error occurred during entanglement.');
        } finally {
            setIsEncoding(false);
        }
    }, [getOperationalKeys, preparedPayload, isCompressionActive, deniabilityLevel, payloadFormat, isBlockPermutationActive, isKeyHardeningActive, isDynamicDecoysActive, isGhostNetworkActive, isPqHybridActive, appState]);

    const hasPrimaryEncryptKey = (useMasterKey && !!masterKey) || !!alphaKey;

    const handleFileSelect = useCallback(async (file: File) => {
        resetPayloadState();

        if (!hasPrimaryEncryptKey) {
            setEncodeError('The Alpha Key or Master Key is required to entangle the file.');
            return;
        }

        if (file) {
            setIsEncoding(true);
            try {
                let fileInfo: FileInfo;
                if (file.type.startsWith('image/') && isScrubberActive) {
                    const sanitized = await sanitizeImage(file);
                    fileInfo = { name: file.name, type: 'image/png', bytes: sanitized.bytes, base64: sanitized.base64, url: sanitized.dataUrl };
                } else {
                    fileInfo = await readFileAsBytes(file);
                }
                setOriginalFileInfo(fileInfo);
                await preparePayload(fileInfo);
                await handleEncrypt();
            } catch (error) {
                setEncodeError(error instanceof Error ? error.message : 'Failed to process file.');
            } finally {
                setIsEncoding(false);
            }
        }
    }, [hasPrimaryEncryptKey, isScrubberActive, preparePayload, handleEncrypt, resetPayloadState]);

    const handleDownloadCcup = () => {
        if (!binaryPayload) return;
        const blob = new Blob([binaryPayload], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payload.ccup`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadArmoredPng = () => {
        if (!binaryPayload) return;
        const armoredBytes = createArmoredPng(binaryPayload);
        const blob = new Blob([armoredBytes], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `covert_payload.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGenerateStealthText = useCallback(async () => {
        if (!binaryPayload) {
            setStealthError("Entangle a file first to generate a secure stream.");
            return;
        }
        const { alphaKey: opAlphaKey } = await getOperationalKeys();
         if (!opAlphaKey) {
            setStealthError("Alpha Key or Master Key is required for keyed steganography.");
            return;
        }
        let currentPrompt = stealthPrompt;
        setIsGeneratingStealth(true);
        setStealthError(null);
        setStealthText('');
        try {
          if (!currentPrompt.trim() && originalFileInfo?.type.startsWith('image/') && originalFileInfo.base64) {
              const generatedPrompt = await generatePromptFromImage(originalFileInfo.base64, isGhostNetworkActive);
              setStealthPrompt(generatedPrompt);
              currentPrompt = generatedPrompt;
          }
          if (!currentPrompt.trim()) throw new Error("A prompt is required to generate a story.");
    
          const story = await generateStory(currentPrompt, isGhostNetworkActive);
          const embeddedText = await embedInText(story, binaryPayload, opAlphaKey);
          setStealthText(embeddedText);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown AI error occurred.';
          if (errorMessage === API_KEY_ERROR || errorMessage === LOCAL_ENDPOINT_ERROR) {
              setStealthError("AI provider not configured. Please check settings.");
              appState.setIsSettingsModalOpen(true);
          } else {
              setStealthError(errorMessage);
          }
        } finally {
          setIsGeneratingStealth(false);
        }
    }, [binaryPayload, stealthPrompt, originalFileInfo, getOperationalKeys, isGhostNetworkActive, appState]);

    const handleCarrierImageSelect = async (file: File) => {
        if(carrierImage?.url) URL.revokeObjectURL(carrierImage.url);
        setCarrierImage(null);
        if(stegoImage?.url) URL.revokeObjectURL(stegoImage.url);
        setStegoImage(null);
        setImageStegoError(null);
        setImageStegoRiskLevel(null);

        if (!file.type.startsWith('image/')) {
            setImageStegoError('Invalid carrier file. Only image files are supported.');
            return;
        }

        setIsEmbeddingInImage(true);
        setImageStegoError(null);
        
        try {
            const sanitized = await sanitizeImage(file);
            const fileInfo = { name: file.name, type: 'image/png', bytes: sanitized.bytes, base64: sanitized.base64, url: sanitized.dataUrl };
            setCarrierImage(fileInfo);
        } catch (error) {
            setImageStegoError(error instanceof Error ? error.message : 'Failed to process carrier image.');
        } finally {
            setIsEmbeddingInImage(false);
        }
    };

    const handleGenerateCarrierImage = async () => {
        if (!imageGenPrompt) {
            setImageStegoError('An AI prompt is required to generate a carrier image.');
            return;
        }
        setIsEmbeddingInImage(true);
        setImageStegoError(null);
        setImageStegoRiskLevel(null);
        if(carrierImage?.url) URL.revokeObjectURL(carrierImage.url);
        setCarrierImage(null);
  
        try {
            const base64Data = await generateImageFromPrompt(imageGenPrompt, isGhostNetworkActive);
            const dataUrl = `data:image/png;base64,${base64Data}`;
            const blob = await (await fetch(dataUrl)).blob();
            const bytes = new Uint8Array(await blob.arrayBuffer());
            setCarrierImage({
                name: 'ai_carrier.png',
                type: 'image/png',
                url: URL.createObjectURL(blob),
                bytes: bytes,
                base64: base64Data
            });
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'AI image generation failed.';
             if (errorMessage === API_KEY_ERROR || errorMessage === LOCAL_ENDPOINT_ERROR) {
                setImageStegoError("AI provider not configured. Please check settings.");
                appState.setIsSettingsModalOpen(true);
            } else {
                setImageStegoError(errorMessage);
            }
        } finally {
            setIsEmbeddingInImage(false);
        }
    };
  
    const handleEmbedInImage = useCallback(async () => {
        if (!binaryPayload) {
            setImageStegoError("Entangle a file first to generate a secure stream.");
            return;
        }
        if (!carrierImage?.url) {
            setImageStegoError("A carrier image must be uploaded or generated first.");
            return;
        }
        const { alphaKey: opAlphaKey } = await getOperationalKeys();
        if (!opAlphaKey) {
            setImageStegoError("The Alpha Key or Master Key is required for Entropic Dispersal steganography.");
            return;
        }
        
        setIsEmbeddingInImage(true);
        setImageStegoError(null);
        if(stegoImage?.url) URL.revokeObjectURL(stegoImage.url);
        setStegoImage(null);
        
        try {
            const newImageDataUrl = await embedDataInImage(carrierImage.url, binaryPayload, opAlphaKey);
            setStegoImage({
                name: 'covert_payload.png',
                url: newImageDataUrl,
                isImage: true,
            });
        } catch(error) {
            setImageStegoError(error instanceof Error ? error.message : 'Failed to embed data into image.');
        } finally {
            setIsEmbeddingInImage(false);
        }
    }, [binaryPayload, carrierImage, getOperationalKeys]);
    
    const handleEncryptAndEmbedForArk = useCallback(async () => {
        if (!preparedPayload) {
            setImageStegoError("Prepare a file for entanglement first.");
            return;
        }
        if (!carrierImage?.bytes || !carrierImage.url) {
            setImageStegoError("A carrier image must be provided for ARK.");
            return;
        }
    
        const { alphaKey: opAlphaKey } = await getOperationalKeys();
        if (!opAlphaKey) {
            setImageStegoError("Alpha Key or Master Key is required for ARK.");
            return;
        }
    
        setIsEmbeddingInImage(true);
        setImageStegoError(null);
        if(stegoImage?.url) URL.revokeObjectURL(stegoImage.url);
        setStegoImage(null);
    
        try {
            const fingerprint = await generateImageFingerprint(carrierImage.bytes);
            const arkKeyB64 = await deriveAcousticResonanceKey(opAlphaKey, fingerprint);
            const encryptedPayload = await encryptData(arkKeyB64, preparedPayload);
            const newImageDataUrl = await embedDataInImage(carrierImage.url, encryptedPayload, opAlphaKey);
            setStegoImage({
                name: 'ark_covert_payload.png',
                url: newImageDataUrl,
                isImage: true,
            });
    
        } catch(error) {
            setImageStegoError(error instanceof Error ? error.message : 'ARK entanglement failed.');
        } finally {
            setIsEmbeddingInImage(false);
        }
    }, [preparedPayload, carrierImage, getOperationalKeys]);

    const getSettings = () => ({
        isScrubberActive, isCompressionActive, isBlockPermutationActive, isKeyHardeningActive,
        isGhostNetworkActive, isPqHybridActive, isAcousticResonanceActive, deniabilityLevel,
        payloadFormat, isDynamicDecoysActive, preset
    });
    
    const setSettings = (settings: any) => {
        setIsScrubberActive(settings.isScrubberActive);
        setIsCompressionActive(settings.isCompressionActive);
        setIsBlockPermutationActive(settings.isBlockPermutationActive);
        setIsKeyHardeningActive(settings.isKeyHardeningActive);
        setIsGhostNetworkActive(settings.isGhostNetworkActive);
        setIsPqHybridActive(settings.isPqHybridActive);
        setIsAcousticResonanceActive(settings.isAcousticResonanceActive);
        setDeniabilityLevel(settings.deniabilityLevel);
        setPayloadFormat(settings.payloadFormat);
        setIsDynamicDecoysActive(settings.isDynamicDecoysActive);
        setPreset(settings.preset);
    };

    return {
        // State
        originalFileInfo,
        secureCode,
        binaryPayload,
        preparedPayload,
        isEncoding,
        encodeError,
        isScrubberActive,
        isCompressionActive,
        isBlockPermutationActive,
        isKeyHardeningActive,
        isGhostNetworkActive,
        isPqHybridActive,
        isAcousticResonanceActive,
        deniabilityLevel,
        payloadFormat,
        isDynamicDecoysActive,
        preset,
        activeTab,
        stealthPrompt,
        stealthText,
        isGeneratingStealth,
        stealthError,
        carrierImage,
        stegoImage,
        isEmbeddingInImage,
        imageStegoError,
        imageGenPrompt,
        imageStegoRiskLevel,

        // Setters
        setIsScrubberActive,
        setIsCompressionActive,
        setIsBlockPermutationActive,
        setIsKeyHardeningActive,
        setIsGhostNetworkActive,
        setIsPqHybridActive,
        setIsAcousticResonanceActive,
        setDeniabilityLevel,
        setPayloadFormat,
        setIsDynamicDecoysActive,
        setPreset,
        setActiveTab,
        setStealthPrompt,
        setImageGenPrompt,
        setImageStegoRiskLevel,
        
        // Handlers
        handleFileSelect,
        handleDownloadCcup,
        handleDownloadArmoredPng,
        handleGenerateStealthText,
        handleCarrierImageSelect,
        handleGenerateCarrierImage,
        handleEmbedInImage,
        handleEncryptAndEmbedForArk,
        hasPrimaryEncryptKey,
        isAiFeatureAvailable,
        
        // For vault
        getSettings,
        setSettings,
    };
};