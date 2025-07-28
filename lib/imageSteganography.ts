
import { CryptoPrng, getPrngMaterialFromKey, bytesToBinaryString, binaryStringToBytes } from './crypto';

export const LENGTH_HEADER_SIZE = 32; // 32 bits for payload length

/**
 * Embeds data using the advanced Entropic Dispersal method with LSB Noise Filling.
 */
async function embedEntropic(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, binaryData: string, key: string): Promise<string> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;
    const numPixels = canvas.width * canvas.height;

    // We can use 3 channels (R,G,B) per pixel for data. Alpha is less reliable.
    const maxCapacity = numPixels * 3;
    const dataLength = binaryData.length;
    const dataLengthBits = dataLength.toString(2).padStart(LENGTH_HEADER_SIZE, '0');
    const totalBitsToEmbed = LENGTH_HEADER_SIZE + dataLength;

    if (totalBitsToEmbed > maxCapacity) {
        throw new Error(`Payload too large for Entropic Dispersal. Max bits: ${maxCapacity}, required: ${totalBitsToEmbed}`);
    }
    
    const { key: prngKey, counter } = await getPrngMaterialFromKey(key, 'entropic-dispersal-stego-salt');
    const prng = await CryptoPrng.create(prngKey, counter);

    // Create a list of all possible embedding indices (R, G, B channels only)
    const indices = new Uint32Array(numPixels * 3);
    for (let i = 0, j = 0; i < numPixels; i++) {
        indices[j++] = (i * 4);     // R
        indices[j++] = (i * 4) + 1; // G
        indices[j++] = (i * 4) + 2; // B
    }
    
    // Shuffle the indices deterministically based on the key
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(await prng.next() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Embed length header into the first N shuffled locations
    for (let i = 0; i < LENGTH_HEADER_SIZE; i++) {
        const embedIndex = indices[i];
        pixelData[embedIndex] = (pixelData[embedIndex] & 0xFE) | parseInt(dataLengthBits[i], 2);
    }
    
    // Embed data into the next M shuffled locations
    for (let i = 0; i < dataLength; i++) {
        const embedIndex = indices[LENGTH_HEADER_SIZE + i];
        pixelData[embedIndex] = (pixelData[embedIndex] & 0xFE) | parseInt(binaryData[i], 2);
    }
    
    // **LSB Noise Filling:** Overwrite all remaining LSBs with random noise.
    for (let i = totalBitsToEmbed; i < indices.length; i++) {
        const embedIndex = indices[i];
        const randomBit = Math.floor(await prng.next() * 2);
        pixelData[embedIndex] = (pixelData[embedIndex] & 0xFE) | randomBit;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

/**
 * Extracts data using the Entropic Dispersal method.
 */
async function extractEntropic(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, key: string): Promise<Uint8Array | null> {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;
    const numPixels = canvas.width * canvas.height;
    const maxCapacity = numPixels * 3;

    const { key: prngKey, counter } = await getPrngMaterialFromKey(key, 'entropic-dispersal-stego-salt');
    const prng = await CryptoPrng.create(prngKey, counter);

    const indices = new Uint32Array(numPixels * 3);
    for (let i = 0, j = 0; i < numPixels; i++) {
        indices[j++] = (i * 4);
        indices[j++] = (i * 4) + 1;
        indices[j++] = (i * 4) + 2;
    }
    
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(await prng.next() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let dataLengthBits = '';
    for (let i = 0; i < LENGTH_HEADER_SIZE; i++) {
        const extractIndex = indices[i];
        dataLengthBits += (pixelData[extractIndex] & 1).toString();
    }
    const dataLength = parseInt(dataLengthBits, 2);

    if (dataLength > maxCapacity - LENGTH_HEADER_SIZE || dataLength < 0 || isNaN(dataLength)) {
        return null; // Not a valid payload
    }
    
    let binaryData = '';
    for (let i = 0; i < dataLength; i++) {
        const extractIndex = indices[LENGTH_HEADER_SIZE + i];
        binaryData += (pixelData[extractIndex] & 1).toString();
    }
    
    return binaryStringToBytes(binaryData);
}

// --- Main Exported Functions ---

async function processImage(imageUrl: string, processor: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => Promise<any> | any) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Could not get canvas context.'));
            
            ctx.drawImage(img, 0, 0);
            
            try {
                const result = await processor(ctx, canvas);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image. It might be tainted by CORS policy or the URL is invalid.'));
        img.src = imageUrl;
    });
}

export async function embedDataInImage(carrierImageUrl: string, data: Uint8Array, key: string): Promise<string> {
    const binaryData = bytesToBinaryString(data);
    return processImage(carrierImageUrl, (ctx, canvas) => {
        if (!key) throw new Error("A key is required for Entropic Dispersal steganography.");
        return embedEntropic(ctx, canvas, binaryData, key);
    }) as Promise<string>;
}

export async function extractDataFromImage(stegoImageUrl: string, key: string): Promise<Uint8Array | null> {
    return processImage(stegoImageUrl, (ctx, canvas) => {
        if (!key) throw new Error("A key is required to extract from Entropic Dispersal steganography.");
        return extractEntropic(ctx, canvas, key);
    }) as Promise<Uint8Array | null>;
}
