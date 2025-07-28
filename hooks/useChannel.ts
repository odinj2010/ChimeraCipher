
import { useState, useCallback, useRef, useEffect } from 'react';
import { ChannelMessage, HandshakeState, RatchetState, ChannelMode } from '../types';
import { 
    generateSecureKey,
    deriveHandshakePWKey, 
    encryptWithRawKey, 
    decryptWithRawKey, 
    deriveHkdfKeyBytes,
    arrayBufferToBase64,
    base64ToUint8Array,
    generateEcdhKeyPair,
    exportEcdhPublicKey,
    importEcdhPublicKey,
    calculateEcdhSharedSecret,
} from '../lib/crypto';
import { AppState } from './useAppState';
import { API_KEY_ERROR, LOCAL_ENDPOINT_ERROR } from '../lib/ai';


const initialRatchetState: RatchetState = {
    DHRs: null, DHP: null,
    RK: null, CKs: null, CKr: null,
    Ns: 0, Nr: 0, PNs: 0,
    MKSKIPPED: new Map(),
};

const DURESS_PLAUSIBLE_MESSAGES = [
    "Okay, sounds good.",
    "Message received.",
    "Got it, thanks.",
    "I'll look into it.",
    "Acknowledged.",
    "Understood.",
];

export const useChannel = (appState: AppState) => {
    const { onResetChannelState, setIsSettingsModalOpen } = appState;

    // --- Core State ---
    const [channelId, setChannelId] = useState('');
    const [handshakeKey, setHandshakeKey] = useState('');
    const [channelDuressKey, setChannelDuressKey] = useState('');
    const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [receivedCiphertext, setReceivedCiphertext] = useState('');
    const [channelError, setChannelError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- ARRK-DKE State ---
    const [handshakeState, setHandshakeState] = useState<HandshakeState>('idle');
    const [initiatorPayload, setInitiatorPayload] = useState(''); 
    const [responderPayload, setResponderPayload] = useState(''); 
    const [receivedPayload, setReceivedPayload] = useState(''); 
    const [ratchetState, setRatchetState] = useState<RatchetState>(initialRatchetState);
    const [channelMode, setChannelMode] = useState<ChannelMode>('UNINITIALIZED');
    
    // Using refs for values that change but shouldn't trigger re-renders
    const ephemeralKeyPair = useRef<CryptoKeyPair | null>(null);

    const resetChannelState = useCallback(() => {
        setChannelId('');
        setHandshakeKey('');
        setChannelDuressKey('');
        setChannelMessages([]);
        setNewMessage('');
        setReceivedCiphertext('');
        setChannelError(null);
        setHandshakeState('idle');
        setInitiatorPayload('');
        setResponderPayload('');
        setReceivedPayload('');
        setRatchetState(initialRatchetState);
        ephemeralKeyPair.current = null;
        setChannelMode('UNINITIALIZED');
    }, []);
    
    useEffect(() => onResetChannelState(resetChannelState), [onResetChannelState, resetChannelState]);

    const handleAiError = useCallback((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        if (errorMessage === API_KEY_ERROR || errorMessage === LOCAL_ENDPOINT_ERROR) {
            setChannelError("AI provider not configured. Please check settings.");
            if (setIsSettingsModalOpen) setIsSettingsModalOpen(true);
        } else {
            setChannelError(errorMessage);
        }
    }, [setIsSettingsModalOpen]);


    const kdf_rk = useCallback(async (rk: Uint8Array, dh_out: Uint8Array) => {
        const salt = rk;
        const rootKey = await deriveHkdfKeyBytes(dh_out, salt, 'chimera-arrk-dke-rk', 64);
        return {
            new_rk: rootKey.slice(0, 32),
            new_ck: rootKey.slice(32, 64)
        };
    }, []);

    const kdf_ck = useCallback(async (ck: Uint8Array) => {
        const messageKey = await deriveHkdfKeyBytes(ck, new Uint8Array(), 'chimera-arrk-dke-msg', 32);
        const nextChainKey = await deriveHkdfKeyBytes(ck, new Uint8Array(), 'chimera-arrk-dke-chain', 32);
        return { messageKey, nextChainKey };
    }, []);


    // --- ARRK-DKE Handshake Logic ---
    const handleInitiateHandshake = async () => {
        if (!handshakeKey || !channelDuressKey) {
            setChannelError("Handshake Key and Channel Duress Key are required.");
            return;
        }
        setIsProcessing(true);
        setChannelError(null);
        try {
            const salt = new TextEncoder().encode(channelId);
            const [pakeKey, duressPakeKey] = await Promise.all([
                deriveHandshakePWKey(handshakeKey, salt),
                deriveHandshakePWKey(channelDuressKey, salt)
            ]);
            
            const DHi = await generateEcdhKeyPair();
            ephemeralKeyPair.current = DHi;
            const exportedPubKey = await exportEcdhPublicKey(DHi.publicKey);
            
            // For duress, generate a completely fake key. It doesn't matter what it is.
            const fakePubKey = window.crypto.getRandomValues(new Uint8Array(65));
            
            const [realPayload, duressPayload] = await Promise.all([
                encryptWithRawKey(pakeKey, exportedPubKey),
                encryptWithRawKey(duressPakeKey, fakePubKey)
            ]);
            
            setInitiatorPayload(JSON.stringify({
                real: arrayBufferToBase64(realPayload),
                duress: arrayBufferToBase64(duressPayload)
            }));
            setHandshakeState('initiated');
        } catch (e) {
            setChannelError(e instanceof Error ? e.message : "Handshake initiation failed.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleRespondToHandshake = async () => {
        if (!receivedPayload) {
            setChannelError("Received payload from initiator is required.");
            return;
        }
        setIsProcessing(true);
        setChannelError(null);
        try {
            const salt = new TextEncoder().encode(channelId);
            const { real, duress } = JSON.parse(receivedPayload);
            if (!real || !duress) throw new Error("Invalid initiator payload format.");

            let pakeKey: Uint8Array;
            let initiatorPubKeyBytes: Uint8Array;
            let currentMode: ChannelMode = 'UNINITIALIZED';

            // Attempt to decrypt with REAL key first
            try {
                pakeKey = await deriveHandshakePWKey(handshakeKey, salt);
                const realBytes = base64ToUint8Array(real);
                initiatorPubKeyBytes = await decryptWithRawKey(pakeKey, realBytes);
                currentMode = 'SECURE';
            } catch (e) {
                // If real key fails, attempt with DURESS key
                try {
                    pakeKey = await deriveHandshakePWKey(channelDuressKey, salt);
                    const duressBytes = base64ToUint8Array(duress);
                    // We don't care about the result, just that it decrypts. This confirms the duress key.
                    await decryptWithRawKey(pakeKey, duressBytes);
                    currentMode = 'DURESS';
                    // We need a public key for the state, but it's a dummy one
                    initiatorPubKeyBytes = (await exportEcdhPublicKey((await generateEcdhKeyPair()).publicKey));
                } catch (e2) {
                    throw new Error("Handshake failed. Both Handshake and Duress keys are incorrect.");
                }
            }
            
            setChannelMode(currentMode);
            const DHP = await importEcdhPublicKey(initiatorPubKeyBytes);
            const DHr = await generateEcdhKeyPair();
            const exportedPubKey = await exportEcdhPublicKey(DHr.publicKey);
            
            setResponderPayload(arrayBufferToBase64(await encryptWithRawKey(pakeKey, exportedPubKey)));

            const dh_out = await calculateEcdhSharedSecret(DHr.privateKey, DHP);
            const { new_rk, new_ck } = await kdf_rk(new Uint8Array(32).fill(0), dh_out);
            
            setRatchetState({
                ...initialRatchetState,
                DHRs: DHr,
                DHP: DHP,
                RK: new_rk,
                CKr: new_ck,
            });

            setHandshakeState('complete');
            setReceivedPayload('');
        } catch (e) {
            setChannelError(e instanceof Error ? e.message : "Handshake response failed.");
            resetChannelState();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompleteHandshake = async () => {
        if (!receivedPayload) {
            setChannelError("Received payload from responder is required.");
            return;
        }
        if (!ephemeralKeyPair.current) {
            setChannelError("Initiator state lost. Please restart handshake.");
            return;
        }
        setIsProcessing(true);
        setChannelError(null);
        try {
            const salt = new TextEncoder().encode(channelId);
            const pakeKey = await deriveHandshakePWKey(handshakeKey, salt);
            const responderPayloadBytes = base64ToUint8Array(receivedPayload);
            const responderPubKeyBytes = await decryptWithRawKey(pakeKey, responderPayloadBytes);

            const DHP = await importEcdhPublicKey(responderPubKeyBytes);
            
            const dh_out = await calculateEcdhSharedSecret(ephemeralKeyPair.current.privateKey, DHP);
            const { new_rk, new_ck } = await kdf_rk(new Uint8Array(32).fill(0), dh_out);

            setRatchetState({
                ...initialRatchetState,
                DHRs: ephemeralKeyPair.current,
                DHP: DHP,
                RK: new_rk,
                CKs: new_ck
            });
            setChannelMode('SECURE');
            setHandshakeState('complete');
            setReceivedPayload('');
        } catch (e) {
            setChannelError(e instanceof Error ? e.message : "Handshake completion failed.");
            resetChannelState();
        } finally {
            setIsProcessing(false);
        }
    };

    // --- ARRK-DKE Message Handling ---
    const ratchetEncrypt = async (plaintext: Uint8Array, state: RatchetState): Promise<{newState: RatchetState, ciphertext: Uint8Array}> => {
        if (!state.CKs || !state.DHRs) throw new Error("Ratchet not initialized for sending.");
        const { messageKey, nextChainKey } = await kdf_ck(state.CKs);
        const pubKey = await exportEcdhPublicKey(state.DHRs.publicKey);
        const associatedData = new TextEncoder().encode(arrayBufferToBase64(pubKey));
        const ciphertext = await encryptWithRawKey(messageKey, plaintext, associatedData);
        
        const newState = { ...state, CKs: nextChainKey, Ns: state.Ns + 1 };
        return { newState, ciphertext };
    };

    const ratchetDecrypt = async (ciphertextPayload: {header: any, ciphertext: Uint8Array}, state: RatchetState): Promise<{newState: RatchetState, plaintext: Uint8Array}> => {
        let tempState = { ...state };
        let plaintext: Uint8Array;
        
        // Try skipped message keys first
        const headerB64 = arrayBufferToBase64(await exportEcdhPublicKey(ciphertextPayload.header.dh_pub));
        const keyId = `${headerB64}:${ciphertextPayload.header.n}`;

        if (tempState.MKSKIPPED.has(keyId)) {
            const mkSkipped = tempState.MKSKIPPED.get(keyId)!;
            const associatedData = new TextEncoder().encode(arrayBufferToBase64(await exportEcdhPublicKey(mkSkipped.publicKey)));
            plaintext = await decryptWithRawKey(mkSkipped.messageKey, ciphertextPayload.ciphertext, associatedData);
            tempState.MKSKIPPED.delete(keyId);
            return { newState: tempState, plaintext };
        }

        // Check for DH ratchet step
        const receivedPubKey = await importEcdhPublicKey(await exportEcdhPublicKey(ciphertextPayload.header.dh_pub));
        if (arrayBufferToBase64(await exportEcdhPublicKey(receivedPubKey)) !== arrayBufferToBase64(await exportEcdhPublicKey(tempState.DHP!))) {
            const DHRs = tempState.DHRs!;
            const dh_out = await calculateEcdhSharedSecret(DHRs.privateKey, receivedPubKey);
            const { new_rk, new_ck } = await kdf_rk(tempState.RK!, dh_out);
            tempState.PNs = tempState.Ns;
            tempState.Ns = 0;
            tempState.Nr = 0;
            tempState.DHP = receivedPubKey;
            tempState.RK = new_rk;
            tempState.CKr = new_ck;
            tempState.DHRs = await generateEcdhKeyPair();
            const dh_out_send = await calculateEcdhSharedSecret(tempState.DHRs.privateKey, tempState.DHP);
            const { new_rk: rk_send, new_ck: ck_send } = await kdf_rk(tempState.RK, dh_out_send);
            tempState.RK = rk_send;
            tempState.CKs = ck_send;
        }

        // Handle future messages
        while (ciphertextPayload.header.n > tempState.Nr) {
            if (!tempState.CKr) throw new Error("Receiving chain key is null during message skip.");
            const { messageKey, nextChainKey } = await kdf_ck(tempState.CKr);
            const skippedPubKey = tempState.DHP!;
            const skippedPubKeyB64 = arrayBufferToBase64(await exportEcdhPublicKey(skippedPubKey));
            const skippedKeyId = `${skippedPubKeyB64}:${tempState.Nr}`;
            tempState.MKSKIPPED.set(skippedKeyId, { 
                publicKey: skippedPubKey, 
                messageNumber: tempState.Nr,
                messageKey 
            });
            tempState.CKr = nextChainKey;
            tempState.Nr++;
        }
        
        // Decrypt current message
        if (ciphertextPayload.header.n === tempState.Nr) {
            if (!tempState.CKr) throw new Error("Receiving chain key is null for decryption.");
            const { messageKey, nextChainKey } = await kdf_ck(tempState.CKr);
            const associatedData = new TextEncoder().encode(arrayBufferToBase64(await exportEcdhPublicKey(tempState.DHP!)));
            plaintext = await decryptWithRawKey(messageKey, ciphertextPayload.ciphertext, associatedData);
            tempState.CKr = nextChainKey;
            tempState.Nr++;
            return { newState: tempState, plaintext };
        }
        
        throw new Error("Decryption logic error: message could not be processed.");
    };

    const handleSendMessage = async () => {
        if (!newMessage || !ratchetState.RK) return;
        setIsProcessing(true);
        setChannelError(null);
        try {
            let state = ratchetState;
            let finalPayloadForStaging: string;

            if (channelMode === 'DURESS') {
                const fakeMessage = DURESS_PLAUSIBLE_MESSAGES[Math.floor(Math.random() * DURESS_PLAUSIBLE_MESSAGES.length)];
                const plaintext = new TextEncoder().encode(JSON.stringify({ content: fakeMessage, timestamp: Date.now() }));
                // In duress, we still need to ratchet to produce valid-looking ciphertexts
                const { newState, ciphertext } = await ratchetEncrypt(plaintext, state);
                state = newState;
                const header = { dh_pub: await exportEcdhPublicKey(state.DHRs!.publicKey), n: state.Ns - 1, pn: state.PNs };
                finalPayloadForStaging = JSON.stringify({ h: header, c: arrayBufferToBase64(ciphertext) });
            } else { // SECURE mode
                const messageObject = { content: newMessage, timestamp: Date.now() };
                const plaintext = new TextEncoder().encode(JSON.stringify(messageObject));
                const { newState, ciphertext } = await ratchetEncrypt(plaintext, state);
                state = newState;
                const header = { dh_pub: await exportEcdhPublicKey(state.DHRs!.publicKey), n: state.Ns - 1, pn: state.PNs };
                finalPayloadForStaging = JSON.stringify({ h: header, c: arrayBufferToBase64(ciphertext) });
                setChannelMessages(prev => [...prev, { id: Date.now(), sender: 'self', ...messageObject, stagedPayload: finalPayloadForStaging }]);
            }
            
            setRatchetState(state);
            setNewMessage('');
        } catch (e) {
            handleAiError(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReceiveMessage = async () => {
        if (!receivedCiphertext || !ratchetState.RK) return;
        setIsProcessing(true);
        setChannelError(null);
        try {
            if (channelMode === 'DURESS') {
                const fakeMessage = DURESS_PLAUSIBLE_MESSAGES[Math.floor(Math.random() * DURESS_PLAUSIBLE_MESSAGES.length)];
                setChannelMessages(prev => [...prev, { id: Date.now(), sender: 'peer', content: fakeMessage, timestamp: Date.now() }]);
            } else { // SECURE mode
                const { h: headerData, c: ciphertextB64 } = JSON.parse(receivedCiphertext);
                headerData.dh_pub = await importEcdhPublicKey(base64ToUint8Array(headerData.dh_pub));
                const ciphertextBytes = base64ToUint8Array(ciphertextB64);
                
                const { newState, plaintext } = await ratchetDecrypt({header: headerData, ciphertext: ciphertextBytes}, ratchetState);
                
                const decryptedPayload = JSON.parse(new TextDecoder().decode(plaintext));
                if (!decryptedPayload.content || !decryptedPayload.timestamp) {
                    throw new Error("Invalid message payload structure.");
                }
                
                setRatchetState(newState);
                setChannelMessages(prev => [...prev, { id: Date.now(), sender: 'peer', ...decryptedPayload }]);
            }
            setReceivedCiphertext('');
        } catch (e) {
            setChannelError(e instanceof Error ? e.message : "Decryption failed. Key mismatch, corrupt data, or replay attempt.");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        // State
        channelId,
        handshakeKey,
        channelDuressKey,
        channelMessages,
        newMessage,
        receivedCiphertext,
        channelError,
        isProcessing,
        handshakeState,
        initiatorPayload,
        responderPayload,
        receivedPayload,
        channelMode,

        // Setters
        setChannelId,
        setHandshakeKey,
        setChannelDuressKey,
        setNewMessage,
        setReceivedCiphertext,
        setReceivedPayload,

        // Handlers
        resetChannelState,
        handleCreateChannelID: () => setChannelId(`ccc-${generateSecureKey().slice(0,12)}`),
        handleInitiateHandshake,
        handleRespondToHandshake,
        handleCompleteHandshake,
        handleSendMessage,
        handleReceiveMessage,
        handleGenerateHandshakeKey: () => setHandshakeKey(generateSecureKey()),
        handleGenerateDuressKey: () => setChannelDuressKey(generateSecureKey()),
    };
};
