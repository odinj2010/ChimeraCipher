
export type View = 'encode' | 'decode';
export type AppMode = 'payload' | 'channel';
export type EncodeOutputTab = 'code' | 'stealth' | 'image';
export type DeniabilityLevel = 'minimal' | 'standard' | 'hardened';
export type PayloadFormat = 'binary' | 'json';
export type ApiKeyStorage = 'session' | 'local';
export type AiProvider = 'gemini' | 'local';

export type LocalLlmSettings = {
    textGenerationEndpoint: string;
    isImageGenerationEnabled: boolean;
    imageGenerationEndpoint: string;
};

export type FileInfo = { 
    name: string; 
    type: string; 
    url: string | null; 
    bytes: Uint8Array; 
    base64?: string; // only for AI image prompt
};

export type DecodedFileInfo = { 
    name: string; 
    url: string; 
    isImage: boolean; 
};

export type ChannelMessage = {
    id: number;
    sender: 'self' | 'peer';
    timestamp: number;
    content: string;
    stagedPayload?: string;
};

export type HandshakeState = 'idle' | 'initiated' | 'complete';
export type Preset = 'custom' | 'standard' | 'paranoid';
export type ImageStegoRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// --- ARRK-DKE (Double Ratchet) Types ---

export type ChannelMode = 'SECURE' | 'DURESS' | 'UNINITIALIZED';

export type SkippedMessageKey = {
    publicKey: CryptoKey;
    messageNumber: number;
    messageKey: Uint8Array;
}

export type RatchetState = {
    // Diffie-Hellman Ratchet Keys
    DHRs: CryptoKeyPair | null; // Our sending key pair
    DHP: CryptoKey | null; // Peer's public key

    // Root and Chain Keys
    RK: Uint8Array | null; // Root Key
    CKs: Uint8Array | null; // Sending Chain Key
    CKr: Uint8Array | null; // Receiving Chain Key

    // Message Counters
    Ns: number; // Sending message number
    Nr: number; // Receiving message number
    PNs: number; // Previous sending chain length

    // State for out-of-order messages
    MKSKIPPED: Map<string, SkippedMessageKey>;
};
