
import { CryptoPrng, getPrngMaterialFromKey, bytesToBinaryString, binaryStringToBytes } from './crypto';

// --- Keyed Steganography Engine ---

// A pool of zero-width characters to be used for keyed steganography.
// Using a larger set makes frequency analysis harder if the key is unknown.
const ZW_CHARS = [
  '\u200B', // Zero Width Space
  '\u200C', // Zero Width Non-Joiner
  '\u200D', // Zero Width Joiner
  '\u2060', // Word Joiner
  '\uFEFF', // Zero Width No-Break Space
];

/**
 * Derives a deterministic configuration for steganography based on a secret key.
 * This ensures that the mapping of bits to characters is unique for each key.
 * @param key The secret string key.
 * @returns A promise that resolves to the steganographic character configuration.
 */
async function getStegoConfig(key: string): Promise<{ zero: string; one: string; end: string; }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key + "steg-config-salt"); // Use a domain-specific salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  const shuffledChars = [...ZW_CHARS];
  
  // Use the derived hash to perform a deterministic Fisher-Yates shuffle.
  // This is a simple but effective way to create a key-based permutation.
  for (let i = shuffledChars.length - 1; i > 0; i--) {
    const j = hashArray[i % hashArray.length] % (i + 1);
    [shuffledChars[i], shuffledChars[j]] = [shuffledChars[j], shuffledChars[i]];
  }

  return {
    zero: shuffledChars[0],
    one: shuffledChars[1],
    end: shuffledChars[2],
  };
}

/**
 * Embeds a hidden data string within a carrier text using a keyed, secure algorithm.
 * @param carrier The visible text (e.g., an AI-generated story).
 * @param data The secret data to hide (e.g., the encrypted payload).
 * @param key The secret key to drive the steganographic configuration.
 * @returns The carrier text with the hidden data embedded.
 */
export async function embed(carrier: string, data: Uint8Array, key: string): Promise<string> {
  const config = await getStegoConfig(key);
  const binaryData = bytesToBinaryString(data);
  const hiddenChars = binaryData.split('').map(bit => (bit === '1' ? config.one : config.zero));
  hiddenChars.push(config.end);

  const carrierChars = carrier.split('');
  
  // The number of available insertion slots is carrier length + 1.
  if (hiddenChars.length > carrierChars.length + 1) {
    // This is a critical security failure. Appending the data would make it visible.
    // The user must be forced to use a larger carrier text.
    throw new Error("Carrier text is too short to embed the data. Please provide a longer carrier or reduce the payload size.");
  }
  
  const { key: prngKey, counter } = await getPrngMaterialFromKey(key, 'text-steganography-shuffle-salt');
  const prng = await CryptoPrng.create(prngKey, counter);

  // Create an array of all possible insertion indices
  const possibleIndices = Array.from({ length: carrierChars.length + 1 }, (_, i) => i);
  
  // Perform a cryptographically secure Fisher-Yates shuffle
  for (let i = possibleIndices.length - 1; i > 0; i--) {
      const j = Math.floor(await prng.next() * (i + 1));
      [possibleIndices[i], possibleIndices[j]] = [possibleIndices[j], possibleIndices[i]];
  }

  // Take the required number of shuffled indices and sort them descending to avoid index shifting issues.
  const insertionPoints = possibleIndices.slice(0, hiddenChars.length).sort((a, b) => b - a);

  // Splice the hidden characters into the carrier text at the determined points.
  insertionPoints.forEach((point, index) => {
      // Insert in reverse order of characters because we sorted points descending.
      carrierChars.splice(point, 0, hiddenChars[hiddenChars.length - 1 - index]);
  });
  
  return carrierChars.join('');
}


/**
 * Extracts hidden data from text using a key to determine the steganographic configuration.
 * @param text The text potentially containing hidden data.
 * @param key The secret key to decode the steganographic pattern.
 * @returns The extracted hidden data, or null if no valid data is found.
 */
export async function extract(text: string, key: string): Promise<Uint8Array | null> {
  const config = await getStegoConfig(key);
  let binaryData = '';
  let foundEnd = false;

  for (const char of text) {
    if (char === config.end) {
      foundEnd = true;
      break; 
    }
    if (char === config.zero) {
      binaryData += '0';
    } else if (char === config.one) {
      binaryData += '1';
    }
  }

  if (!foundEnd || binaryData.length === 0) {
    return null; 
  }

  try {
    return binaryStringToBytes(binaryData);
  } catch (e) {
    console.error("Failed to decode binary string:", e);
    return null;
  }
}
