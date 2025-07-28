
import type { FileInfo } from '../types';
import argon2 from 'argon2-browser';

// --- Crypto & Data Integrity Constants ---
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;
export const EV_KEY_SECRET_LENGTH = 32; // Entropic Veil
export const EV_KEY_COUNTER_LENGTH = 16;
export const EV_KEY_TOTAL_LENGTH = EV_KEY_SECRET_LENGTH + EV_KEY_COUNTER_LENGTH;
export const MAGIC_BYTE_BINARY_FORMAT = 0xBD;

// Transport Armor Constants
const ARMOR_MAGIC_STRING = 'CHIMERA_ARMOR_V1';
const ARMOR_MAGIC_BYTES = new TextEncoder().encode(ARMOR_MAGIC_STRING);
// Base64 of a minimal 1x1 transparent PNG.
const MINIMAL_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// --- Utility Functions ---
export const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192; // Use a chunk size of 8KB
    let result = '';
    // Process the Uint8Array in chunks to avoid "Maximum call stack size exceeded" errors
    // with String.fromCharCode.apply and to handle large binary data more efficiently.
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, i + CHUNK_SIZE);
        // String.fromCharCode.apply is a faster way to convert a chunk of byte values to a string
        // than iterating and concatenating, which can be slow for large arrays.
        result += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return window.btoa(result);
};


export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

export const xorUint8Arrays = (a: Uint8Array, b: Uint8Array): Uint8Array => {
    const length = Math.min(a.length, b.length);
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
};

export const getShortHash = async (str: string) => {
    if (!str) return 'INACTIVE';
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 8).toUpperCase();
};

// Returns a crypto-secure random integer between 0 (inclusive) and max (exclusive)
export const secureRandom = (max: number): number => {
    const randomValues = new Uint32Array(1);
    const max_uint32 = 0xFFFFFFFF + 1; 
    const threshold = max_uint32 - (max_uint32 % max);
    
    let value;
    do {
        window.crypto.getRandomValues(randomValues);
        value = randomValues[0];
    } while (value >= threshold);

    return value % max;
};

// Cryptographically secure Fisher-Yates shuffle.
export function secureShuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Converts a byte array to its binary representation string.
export const bytesToBinaryString = (bytes: Uint8Array): string => {
  let bin = '';
  // Using a for loop is more performant than map().join('') for large arrays.
  for (let i = 0; i < bytes.length; i++) {
    bin += bytes[i].toString(2).padStart(8, '0');
  }
  return bin;
};

// Converts a binary representation string back to a byte array.
export const binaryStringToBytes = (binary: string): Uint8Array => {
  // Add a size limit to prevent browser crashes from malicious input. 100MB limit.
  const MAX_PAYLOAD_BYTES = 100 * 1024 * 1024; 
  if (binary.length / 8 > MAX_PAYLOAD_BYTES) {
      throw new Error(`Payload size exceeds maximum limit of ${MAX_PAYLOAD_BYTES / (1024*1024)}MB.`);
  }

  if (!binary) {
    return new Uint8Array(0);
  }

  // If length is not a multiple of 8, it indicates data corruption.
  // Truncate to the nearest valid multiple of 8 to attempt recovery.
  const remainder = binary.length % 8;
  let finalBinary = binary;
  if (remainder !== 0) {
    finalBinary = binary.substring(0, binary.length - remainder);
  }
  
  if (!finalBinary) return new Uint8Array(0);

  const len = finalBinary.length / 8;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const byte = finalBinary.slice(i * 8, (i * 8) + 8);
    bytes[i] = parseInt(byte, 2);
  }
  return bytes;
};


// --- Cryptographic Functions ---
export const generateSecureKey = (): string => {
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
    return arrayBufferToBase64(randomBytes);
};

// --- Password-Based Key Derivation ---

// Centralized function to derive a key from a password using specified Argon2 params.
async function deriveKeyFromPassword(password: string, time: number, mem: number): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const argonSalt = encoder.encode("CHIMERA-CIPHER-PBKDF-SALT-V2");

    const argonResult = await argon2.hash({
        pass: passwordBytes,
        salt: argonSalt,
        time: time,
        mem: mem,
        hashLen: 32,
        parallelism: 2,
        type: argon2.ArgonType.Argon2id,
    });
    return argonResult.hash;
}

export const deriveStandardCostKeyFromPassword = (password: string): Promise<Uint8Array> => {
    // Standard parameters for interactive use (e.g., decoys, user keys).
    return deriveKeyFromPassword(password, 2, 32768); // 32MB
};

export const deriveHighCostKeyFromPassword = (password: string): Promise<Uint8Array> => {
    // High-cost parameters designed to be slow, creating a "tar pit" for attackers.
    return deriveKeyFromPassword(password, 4, 131072); // 128MB
};

/**
 * Normalizes a user-provided key string into a valid Base64-encoded 32-byte key.
 * If the string appears to be a 32-byte key already encoded in Base64, it's passed through.
 * Otherwise, it's treated as a password and hashed with Argon2id to produce a key.
 */
export const normalizeKeyFromString = async (keyString: string): Promise<string> => {
    if (!keyString) return '';
    try {
        const decoded = base64ToUint8Array(keyString);
        if (decoded.length === 32) {
            return keyString;
        }
    } catch (e) {
        // Not a valid base64 string. Fall through to hashing.
    }

    const keyBytes = await deriveStandardCostKeyFromPassword(keyString);
    return arrayBufferToBase64(keyBytes);
};


/**
 * Derives Alpha, Omega, and Decoy keys from a single master key using Argon2id and HKDF-Expand.
 */
export async function deriveKeysFromMasterPBKDF(masterKey: string): Promise<{ alphaKey: string; omegaKey: string; decoyKey: string; }> {
    const encoder = new TextEncoder();
    const masterKeyBytes = encoder.encode(masterKey);
    const argonSalt = encoder.encode("CHIMERA-CIPHER-ARGON2-SALT-V1");

    const argonResult = await argon2.hash({
        pass: masterKeyBytes,
        salt: argonSalt,
        time: 3,
        mem: 65536,
        hashLen: 64,
        parallelism: 4,
        type: argon2.ArgonType.Argon2id,
    });
    
    const prk = argonResult.hash;
    const hmacKey = await window.crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);

    const infoAlpha = encoder.encode("CHIMERA-CIPHER-ALPHA");
    const infoOmega = encoder.encode("CHIMERA-CIPHER-OMEGA");
    const infoDecoy = encoder.encode("CHIMERA-CIPHER-DECOY");

    const t1 = await window.crypto.subtle.sign('HMAC', hmacKey, new Uint8Array([...infoAlpha, 0x01]));
    const t2 = await window.crypto.subtle.sign('HMAC', hmacKey, new Uint8Array([...new Uint8Array(t1), ...infoOmega, 0x02]));
    const t3 = await window.crypto.subtle.sign('HMAC', hmacKey, new Uint8Array([...new Uint8Array(t2), ...infoDecoy, 0x03]));
    
    const alphaKeyBytes = t1.slice(0, 32);
    const omegaKeyBytes = t2.slice(0, 32);
    const decoyKeyBytes = t3.slice(0, 32);

    return {
        alphaKey: arrayBufferToBase64(alphaKeyBytes),
        omegaKey: arrayBufferToBase64(omegaKeyBytes),
        decoyKey: arrayBufferToBase64(decoyKeyBytes),
    };
}


export const encryptData = async (keyB64: string, data: Uint8Array): Promise<Uint8Array> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const keyBytes = base64ToUint8Array(keyB64);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, true, ['encrypt']
  );

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    data
  );

  const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedContent), iv.length);
  return combined;
};

export const decryptData = async (keyB64: string, encryptedDataWithIv: Uint8Array): Promise<Uint8Array> => {
  const iv = encryptedDataWithIv.slice(0, IV_LENGTH);
  const data = encryptedDataWithIv.slice(IV_LENGTH);
  const keyBytes = base64ToUint8Array(keyB64);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, true, ['decrypt']
  );
  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      data
    );
    return new Uint8Array(decryptedContent);
  } catch(e) {
    throw new Error("Decryption failed. Authentication tag mismatch indicates wrong key or tampered data.");
  }
};


// --- Functions for Secure Channel Protocol ---

export async function deriveHandshakePWKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const passwordBytes = new TextEncoder().encode(password);
    
    const argonResult = await argon2.hash({
        pass: passwordBytes, salt, time: 2, mem: 16384, hashLen: 32, parallelism: 2, type: argon2.ArgonType.Argon2id,
    });

    return argonResult.hash;
}

export async function deriveHkdfKeyBytes(masterSecret: Uint8Array, salt: Uint8Array, info: string | Uint8Array, outputLength: number): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const ikm = masterSecret;
    const infoData = typeof info === 'string' ? encoder.encode(info) : info;

    const prkImportedKey = await window.crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const prk = await window.crypto.subtle.sign('HMAC', prkImportedKey, ikm);

    const okmImportedKey = await window.crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    
    const hashLen = 32;
    const numBlocks = Math.ceil(outputLength / hashLen);
    if (numBlocks > 255) throw new Error("Output length too large for HKDF-Expand implementation.");

    const okm = new Uint8Array(numBlocks * hashLen);
    let t_prev = new Uint8Array();

    for (let i = 1; i <= numBlocks; i++) {
        const blockData = new Uint8Array([...t_prev, ...infoData, i]);
        const t_i_buffer = await window.crypto.subtle.sign('HMAC', okmImportedKey, blockData);
        const t_i = new Uint8Array(t_i_buffer);
        okm.set(t_i, (i - 1) * hashLen);
        t_prev = t_i;
    }

    return okm.slice(0, outputLength);
}

/**
 * Hardens a raw key by using it as input to another round of HKDF, binding configuration settings into it.
 * @param keyB64 The base64-encoded key to harden.
 * @param info A domain-separation string for this specific derivation.
 * @param configByte A number representing the bitmask of security settings.
 * @returns A new, hardened base64-encoded key.
 */
export const hardenKeyWithHKDF = async (keyB64: string, info: string, configByte: number): Promise<string> => {
    const salt = new TextEncoder().encode("chimera-cipher-key-hardening-salt");
    const masterSecret = base64ToUint8Array(keyB64);
    
    // Combine the info string and the config byte into a single info buffer for HKDF
    const infoBytes = new TextEncoder().encode(info);
    const finalInfoBytes = new Uint8Array(infoBytes.length + 1);
    finalInfoBytes.set(infoBytes, 0);
    finalInfoBytes.set([configByte], infoBytes.length);

    const derivedBytes = await deriveHkdfKeyBytes(masterSecret, salt, finalInfoBytes, 32);
    return arrayBufferToBase64(derivedBytes);
};

const importAesGcmKey = (keyBytes: Uint8Array) => {
    return window.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
};

export const encryptWithRawKey = async (keyBytes: Uint8Array, data: Uint8Array, associatedData?: Uint8Array): Promise<Uint8Array> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await importAesGcmKey(keyBytes);
    const encryptParams: AesGcmParams = { name: 'AES-GCM', iv };
    if (associatedData) {
        encryptParams.additionalData = associatedData;
    }
    
    const encryptedContent = await window.crypto.subtle.encrypt(encryptParams, key, data);
    
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);
    return combined;
};

export const decryptWithRawKey = async (keyBytes: Uint8Array, encryptedDataWithIv: Uint8Array, associatedData?: Uint8Array): Promise<Uint8Array> => {
    const iv = encryptedDataWithIv.slice(0, IV_LENGTH);
    const data = encryptedDataWithIv.slice(IV_LENGTH);
    const key = await importAesGcmKey(keyBytes);
    const decryptParams: AesGcmParams = { name: 'AES-GCM', iv };
    if (associatedData) {
        decryptParams.additionalData = associatedData;
    }
    
    try {
        const decryptedContent = await window.crypto.subtle.decrypt(decryptParams, key, data);
        return new Uint8Array(decryptedContent);
    } catch(e) {
        throw new Error("Decryption failed. Authentication tag mismatch indicates wrong key, tampered data, or replay attack.");
    }
};


// --- Seeded PRNG and Permutation Functions ---

export class CryptoPrng {
    private key: CryptoKey;
    private counter: Uint8Array;
    private buffer: Uint8Array;
    private bytePosition: number;
    private static readonly BUFFER_SIZE = 1024;

    private constructor(key: CryptoKey, counter: Uint8Array) {
        this.key = key;
        this.counter = counter;
        this.buffer = new Uint8Array(0);
        this.bytePosition = 0;
    }

    public static async create(seedKey: CryptoKey, seedCounter: Uint8Array): Promise<CryptoPrng> {
        const prng = new CryptoPrng(seedKey, seedCounter);
        await prng.generateMoreBytes();
        return prng;
    }

    private incrementCounter() {
        for (let i = this.counter.length - 1; i >= 0; i--) {
            if (this.counter[i] === 255) {
                this.counter[i] = 0;
            } else {
                this.counter[i]++;
                return;
            }
        }
    }

    private async generateMoreBytes() {
        const plaintext = new Uint8Array(CryptoPrng.BUFFER_SIZE);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-CTR', counter: this.counter, length: 128 },
            this.key,
            plaintext
        );
        this.buffer = new Uint8Array(ciphertext);
        this.bytePosition = 0;
        this.incrementCounter();
    }

    public async next(): Promise<number> {
        if (this.bytePosition + 4 > this.buffer.length) {
            await this.generateMoreBytes();
        }
        const view = new DataView(this.buffer.buffer, this.bytePosition, 4);
        const value = view.getUint32(0, false);
        this.bytePosition += 4;
        return value / 0x100000000;
    }
}

export async function getPrngMaterialFromKey(keyB64: string, salt: string): Promise<{ key: CryptoKey, counter: Uint8Array }> {
    const encoder = new TextEncoder();
    const requiredLength = EV_KEY_SECRET_LENGTH + EV_KEY_COUNTER_LENGTH;
    const masterSecret = base64ToUint8Array(keyB64);
    const derivedBytes = await deriveHkdfKeyBytes(masterSecret, encoder.encode(salt), "prng-seed-derivation", requiredLength);
    
    const keyBytes = derivedBytes.slice(0, EV_KEY_SECRET_LENGTH);
    const counterBytes = derivedBytes.slice(EV_KEY_SECRET_LENGTH, requiredLength);

    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-CTR', false, ['encrypt']);
    
    return { key: cryptoKey, counter: counterBytes };
}

async function generatePermutationMap(prng: CryptoPrng, size: number): Promise<{ forward: Uint32Array, inverse: Uint32Array }> {
    const forward = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
        forward[i] = i;
    }

    for (let i = size - 1; i > 0; i--) {
        const j = Math.floor(await prng.next() * (i + 1));
        [forward[i], forward[j]] = [forward[j], forward[i]];
    }

    const inverse = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
        inverse[forward[i]] = i;
    }

    return { forward, inverse };
}

export async function applyBlockPermutation(data: Uint8Array, alphaKeyB64: string): Promise<Uint8Array> {
    if (data.length === 0) return data;
    const { key, counter } = await getPrngMaterialFromKey(alphaKeyB64, 'block-permutation-key-salt:');

    const prng = await CryptoPrng.create(key, counter);
    const { forward } = await generatePermutationMap(prng, data.length);
    
    const permutedData = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        permutedData[forward[i]] = data[i];
    }
    return permutedData;
}

export async function reverseBlockPermutation(permutedData: Uint8Array, alphaKeyB64: string): Promise<Uint8Array> {
    if (permutedData.length === 0) return permutedData;
    const { key, counter } = await getPrngMaterialFromKey(alphaKeyB64, 'block-permutation-key-salt:');
    
    const prng = await CryptoPrng.create(key, counter);
    const { inverse } = await generatePermutationMap(prng, permutedData.length);
    
    const originalData = new Uint8Array(permutedData.length);
    for (let i = 0; i < permutedData.length; i++) {
        originalData[inverse[i]] = permutedData[i];
    }
    return originalData;
}


// --- Post-Quantum Hybrid Key Generation (Stub) ---
export async function getHybridKey(classicalKeyB64: string): Promise<string> {
    const dummyPqcSecret = window.crypto.getRandomValues(new Uint8Array(32));
    const classicalKeyBytes = base64ToUint8Array(classicalKeyB64);
    const hybridKeyBytes = await deriveHkdfKeyBytes(dummyPqcSecret, classicalKeyBytes, "pqc-hybrid-key-derivation", 32);
    return arrayBufferToBase64(hybridKeyBytes);
}


// --- Acoustic Resonance Keying (ARK) Functions ---
export async function generateImageFingerprint(imageData: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', imageData);
    const hashArray = new Uint8Array(hashBuffer);

    const numBytes = imageData.length;
    let sum = 0;
    const freqMap = new Array(256).fill(0);
    
    for(let i = 0; i < numBytes; i++) {
        const byte = imageData[i];
        sum += byte;
        freqMap[byte]++;
    }
    
    const mean = sum / numBytes;
    
    let sumSqDiff = 0;
    for(let i = 0; i < numBytes; i++) {
        sumSqDiff += (imageData[i] - mean) ** 2;
    }
    const stdDev = Math.sqrt(sumSqDiff / numBytes);

    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (freqMap[i] > 0) {
            const p = freqMap[i] / numBytes;
            entropy -= p * Math.log2(p);
        }
    }

    const fingerprintBuffer = new ArrayBuffer(32 + 8 + 8 + 8);
    const dataView = new DataView(fingerprintBuffer);
    
    new Uint8Array(fingerprintBuffer, 0, 32).set(hashArray);
    dataView.setFloat64(32, mean, false);
    dataView.setFloat64(40, stdDev, false);
    dataView.setFloat64(48, entropy, false);

    return new Uint8Array(fingerprintBuffer);
}

export async function deriveAcousticResonanceKey(alphaKeyB64: string, fingerprint: Uint8Array): Promise<string> {
    const masterSecret = base64ToUint8Array(alphaKeyB64);
    const derivedBytes = await deriveHkdfKeyBytes(masterSecret, fingerprint, "chimera-ark-v1", 32);
    return arrayBufferToBase64(derivedBytes);
}


// --- Key Vault Functions ---
export async function encryptVault(jsonData: string, password: string): Promise<Uint8Array> {
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const passwordBytes = new TextEncoder().encode(password);

    const argonResult = await argon2.hash({
        pass: passwordBytes, salt, time: 3, mem: 65536, hashLen: 32, parallelism: 4, type: argon2.ArgonType.Argon2id,
    });
    const keyBytes = argonResult.hash;

    const encryptedData = await encryptWithRawKey(keyBytes, new TextEncoder().encode(jsonData));
    
    const vaultData = new Uint8Array(salt.length + encryptedData.length);
    vaultData.set(salt, 0);
    vaultData.set(encryptedData, salt.length);

    return vaultData;
}

export async function decryptVault(vaultData: Uint8Array, password: string): Promise<string> {
    const salt = vaultData.slice(0, SALT_LENGTH);
    const encryptedData = vaultData.slice(SALT_LENGTH);
    const passwordBytes = new TextEncoder().encode(password);
    
    const argonResult = await argon2.hash({
        pass: passwordBytes, salt, time: 3, mem: 65536, hashLen: 32, parallelism: 4, type: argon2.ArgonType.Argon2id,
    });
    const keyBytes = argonResult.hash;
    
    const decryptedBytes = await decryptWithRawKey(keyBytes, encryptedData);
    
    return new TextDecoder().decode(decryptedBytes);
}


// --- File Sanitizer & Reader ---
export const sanitizeImage = (file: File): Promise<{ dataUrl: string; bytes: Uint8Array; base64: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context to sanitize image.'));
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        canvas.toBlob(async (blob) => {
            if (!blob) {
                return reject(new Error('Canvas toBlob failed to produce a blob.'));
            }
            const bytes = new Uint8Array(await blob.arrayBuffer());
            resolve({ dataUrl, bytes, base64 });
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Image failed to load for sanitization.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file for sanitization.'));
    reader.readAsDataURL(file);
  });
};

export const readFileAsBytes = (file: File): Promise<FileInfo> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file.'));
      }
      const buffer = event.target.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let objectUrl: string | null = null;
      let base64: string | undefined = undefined;

      if (file.type.startsWith('image/')) {
        const blob = new Blob([buffer], { type: file.type });
        objectUrl = URL.createObjectURL(blob);
        try {
            base64 = arrayBufferToBase64(buffer);
        } catch(e) {
            console.error("Failed to convert image to base64 for AI prompt:", e);
        }
      }
      resolve({ name: file.name, type: file.type, bytes, url: objectUrl, base64 });
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
};

// --- Transport Armor Functions ---
export function createArmoredPng(payloadBytes: Uint8Array): Uint8Array {
    const pngHeader = base64ToUint8Array(MINIMAL_PNG_B64);
    const armoredFile = new Uint8Array(pngHeader.length + payloadBytes.length + ARMOR_MAGIC_BYTES.length);
    armoredFile.set(pngHeader, 0);
    armoredFile.set(payloadBytes, pngHeader.length);
    armoredFile.set(ARMOR_MAGIC_BYTES, pngHeader.length + payloadBytes.length);
    return armoredFile;
}

export function extractFromArmoredPng(armoredBytes: Uint8Array): Uint8Array | null {
    // Search for the magic marker from the end of the file.
    const markerIndex = findSubarray(armoredBytes, ARMOR_MAGIC_BYTES);
    if (markerIndex === -1) {
        return null; // Not an armored file
    }
    // The real payload is everything between the IEND chunk of the first PNG and the marker.
    // A simpler approach for our known structure is to find the *first* IEND chunk.
    const iendMarker = new Uint8Array([0x49, 0x45, 0x4E, 0x44]);
    const iendIndex = findSubarray(armoredBytes, iendMarker);
    if (iendIndex === -1) {
        return null; // Malformed PNG carrier
    }
    // The payload starts 8 bytes after the 'IEND' text (IEND chunk is 12 bytes: 4 len, 4 type, 4 crc)
    const payloadStartIndex = iendIndex + 8;
    return armoredBytes.slice(payloadStartIndex, markerIndex);
}

function findSubarray(haystack: Uint8Array, needle: Uint8Array): number {
    for (let i = 0; i <= haystack.length - needle.length; i++) {
        let found = true;
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                found = false;
                break;
            }
        }
        if (found) return i;
    }
    return -1;
}

// --- Double Ratchet ECDH Functions ---

export async function generateEcdhKeyPair(): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey']
    );
}

export async function exportEcdhPublicKey(key: CryptoKey): Promise<Uint8Array> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return new Uint8Array(exported);
}

export async function importEcdhPublicKey(keyBytes: Uint8Array): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
    );
}

export async function calculateEcdhSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<Uint8Array> {
    const sharedSecretKey = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: publicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', sharedSecretKey);
    return new Uint8Array(exported);
}
