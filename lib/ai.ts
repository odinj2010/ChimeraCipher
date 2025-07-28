
import { GoogleGenAI, Type } from "@google/genai";
import { secureRandom, secureShuffle } from './crypto';
import type { DeniabilityLevel, ApiKeyStorage, AiProvider, LocalLlmSettings } from '../types';

export const API_KEY_ERROR = "API_KEY_NOT_CONFIGURED";
export const LOCAL_ENDPOINT_ERROR = "LOCAL_ENDPOINT_ERROR";

// --- AI Configuration Management ---

function getAiProvider(): AiProvider {
    return (localStorage.getItem('chimera-ai-provider') as AiProvider | null) || 'gemini';
}

function getGeminiApiKey(): string | null {
    const storagePref = localStorage.getItem('chimera-api-key-storage') as ApiKeyStorage | null;
    if (!storagePref) return null;

    if (storagePref === 'local') {
        return localStorage.getItem('chimera-api-key');
    }
    if (storagePref === 'session') {
        return sessionStorage.getItem('chimera-api-key');
    }
    return null;
}

function getLocalLlmSettings(): LocalLlmSettings {
    const settingsJson = localStorage.getItem('chimera-local-llm-settings');
    if (settingsJson) {
        return JSON.parse(settingsJson);
    }
    return {
        textGenerationEndpoint: '',
        isImageGenerationEnabled: false,
        imageGenerationEndpoint: ''
    };
}

function getGeminiClient(): GoogleGenAI {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error(API_KEY_ERROR);
    }
    return new GoogleGenAI({ apiKey });
}

export type SecurityConfig = {
    encryptionLayers: number;
    isBlockPermutationActive: boolean;
    isKeyHardeningActive: boolean;
    isPqHybridActive: boolean;
    isAcousticResonanceActive: boolean;
    deniabilityLevel: DeniabilityLevel;
    isDynamicDecoysActive: boolean;
    hasDeniableEncryption: boolean;
    isImageScrubberActive: boolean;
    steganography: 'code' | 'stealth' | 'image';
};

export type ThreatReport = {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallAssessment: string;
};


const DECOY_PROMPTS = [
  "a simple recipe for baking bread",
  "a mundane journal entry about the weather",
  "a technical description of a common object, like a chair",
  "a summary of a non-controversial historical event",
  "a product review for a boring item, like a stapler",
  "an excerpt from a fictional user manual for a coffee machine",
  "a list of gardening tips for common house plants",
  "a bland corporate mission statement",
  "a brief, uninteresting biography of a fictional person",
];

const GHOST_NETWORK_TEXT_PROMPTS = [
    "explain the water cycle in simple terms",
    "who was the 16th president of the united states",
    "what is the capital of France",
    "a short poem about the moon",
    "list three benefits of regular exercise",
];

const GHOST_NETWORK_IMAGE_PROMPTS = [
    "a red apple on a wooden table",
    "a photorealistic image of a house cat sleeping",
    "a simple drawing of a smiling sun",
    "a blue car driving on a road",
    "a tree in a green field",
];

// --- Local LLM Functions ---

async function generateWithLocalLlm(prompt: string, settings: LocalLlmSettings, isJson: boolean = false): Promise<any> {
    if (!settings.textGenerationEndpoint) {
        throw new Error("Local LLM text endpoint is not configured.");
    }

    // Basic prompt engineering for JSON output. May not work on all models.
    const finalPrompt = isJson 
        ? `${prompt}\n\n### Instruction:\nOnly output the raw JSON object as specified in the prompt above. Do not include any other text or markdown.\n\n### Response:\n`
        : prompt;

    try {
        const response = await fetch(settings.textGenerationEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: finalPrompt,
                max_tokens: isJson ? 1024 : 300,
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            throw new Error(`Local LLM server responded with status: ${response.status}`);
        }
        const data = await response.json();
        // KoboldCPP often nests the result in `results[0].text`.
        const text = data?.results?.[0]?.text || '';
        if (isJson) {
            // Attempt to clean and parse JSON from the response.
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Local LLM did not return a valid JSON object.");
            return JSON.parse(jsonMatch[0]);
        }
        return text.trim();
    } catch (error) {
        console.error("Error with Local LLM:", error);
        throw new Error(LOCAL_ENDPOINT_ERROR);
    }
}

async function generateImageWithLocalLlm(prompt: string, settings: LocalLlmSettings): Promise<string> {
    if (!settings.isImageGenerationEnabled || !settings.imageGenerationEndpoint) {
        throw new Error("Local image generation is not enabled or configured.");
    }
    try {
        const response = await fetch(settings.imageGenerationEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Payload for Automatic1111's Stable Diffusion API
            body: JSON.stringify({ prompt, steps: 30, width: 512, height: 512 }),
        });
        if (!response.ok) {
            throw new Error(`Local image server responded with status: ${response.status}`);
        }
        const data = await response.json();
        // A1111 returns images in an array
        if (!data.images || data.images.length === 0) {
            throw new Error("Local image server did not return any images.");
        }
        return data.images[0]; // The image is already a base64 string
    } catch (error) {
        console.error("Error with local image generation:", error);
        throw new Error(LOCAL_ENDPOINT_ERROR);
    }
}


// --- Provider-Routed AI Functions ---

export async function generateDecoyTexts(count: number, useGhostNetwork: boolean): Promise<string[]> {
    const provider = getAiProvider();
    
    if (provider === 'local') {
        const settings = getLocalLlmSettings();
        const selectedPrompts = secureRandom(count);
        const structuredPrompt = `Generate ${count} short, distinct, and mundane-sounding pieces of text, each around 50-100 words. Each text should be based on one of the following themes: ${DECOY_PROMPTS.slice(0, count).join('; ')}. The texts should not contain any markdown, titles, or strange formatting. They must be suitable for use as decoy data. Return ONLY the JSON object with a single key "decoys" containing an array of strings.`;
        
        try {
            const jsonResponse = await generateWithLocalLlm(structuredPrompt, settings, true);
            const decoys = jsonResponse.decoys;

            if (!decoys || !Array.isArray(decoys) || decoys.length === 0) {
                throw new Error(`AI returned an invalid decoy structure.`);
            }
            
            let finalDecoys = decoys.map(d => String(d));
            if (finalDecoys.length > count) {
                finalDecoys = finalDecoys.slice(0, count);
            }
            while (finalDecoys.length < count) {
                finalDecoys.push("This is a fallback decoy text. The AI response was incomplete.");
            }
            return finalDecoys;

        } catch (error) {
            console.error("Error generating dynamic decoys with Local LLM:", error);
            throw new Error("Failed to generate decoys with Local LLM.");
        }
    }

    // Gemini provider logic
    const ai = getGeminiClient();
    const selectedPrompts = secureShuffle([...DECOY_PROMPTS]).slice(0, count);
    const structuredPrompt = `Generate ${count} short, distinct, and mundane-sounding pieces of text, each around 50-100 words. Each text should be based on one of the following themes: ${selectedPrompts.join('; ')}. The texts should not contain any markdown, titles, or strange formatting. They must be suitable for use as decoy data. Return ONLY the JSON object.`;

    const request = {
        model: 'gemini-2.5-flash',
        contents: structuredPrompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { decoys: { type: Type.ARRAY, description: `An array of ${count} decoy text strings.`, items: { type: Type.STRING } } }, required: ["decoys"] } }
    };

    try {
        let responseText: string;
        if (useGhostNetwork) {
            const promises = [ai.models.generateContent(request)];
            for (let i = 0; i < 2; i++) {
                const dummyPrompt = GHOST_NETWORK_TEXT_PROMPTS[secureRandom(GHOST_NETWORK_TEXT_PROMPTS.length)];
                promises.push(ai.models.generateContent({ model: 'gemini-2.5-flash', contents: dummyPrompt }));
            }
            const results = await Promise.allSettled(promises);
            const realResult = results[0];
            if (realResult.status === 'fulfilled') responseText = realResult.value.text;
            else throw realResult.reason;
        } else {
            const response = await ai.models.generateContent(request);
            responseText = response.text;
        }
        
        const jsonResponse = JSON.parse(responseText);
        const decoys = jsonResponse.decoys;
        if (!decoys || !Array.isArray(decoys) || decoys.length === 0) throw new Error(`AI returned an invalid decoy structure.`);
        
        let finalDecoys = decoys.map(d => String(d));
        if (finalDecoys.length > count) finalDecoys = finalDecoys.slice(0, count);
        while (finalDecoys.length < count) finalDecoys.push("Fallback decoy.");
        return finalDecoys;

    } catch (error) {
        if (error instanceof Error && error.message === API_KEY_ERROR) throw error;
        console.error("Error generating dynamic decoys with Gemini:", error);
        throw new Error("Failed to generate decoys with Gemini.");
    }
}

export async function generateStory(prompt: string, useGhostNetwork: boolean): Promise<string> {
  const provider = getAiProvider();
  const storyPrompt = `Write a short, mundane-sounding story or piece of text (around 150-200 words) subtly inspired by the theme: "${prompt}". The text should appear innocuous and unremarkable, perfect for hiding information in plain sight. Avoid any markdown formatting, titles, or obvious narrative conclusions.`;

  if (provider === 'local') {
      const settings = getLocalLlmSettings();
      return generateWithLocalLlm(storyPrompt, settings);
  }

  const ai = getGeminiClient();
  const request = { model: 'gemini-2.5-flash', contents: storyPrompt, config: { temperature: 0.8, topP: 0.9, topK: 40 } };
  
  try {
    if (useGhostNetwork) {
        const promises = [ai.models.generateContent(request)];
        for (let i = 0; i < 2; i++) {
            const dummyPrompt = GHOST_NETWORK_TEXT_PROMPTS[secureRandom(GHOST_NETWORK_TEXT_PROMPTS.length)];
            promises.push(ai.models.generateContent({ model: 'gemini-2.5-flash', contents: dummyPrompt }));
        }
        const results = await Promise.allSettled(promises);
        const realResult = results[0];
        if (realResult.status === 'fulfilled') return realResult.value.text;
        throw realResult.reason;
    } else {
        const response = await ai.models.generateContent(request);
        return response.text;
    }
  } catch (error) {
    if (error instanceof Error && error.message === API_KEY_ERROR) throw error;
    console.error("Error generating story with Gemini:", error);
    throw new Error("Failed to generate story with Gemini.");
  }
}

export async function generatePromptFromImage(imageBase64: string, useGhostNetwork: boolean): Promise<string> {
    const provider = getAiProvider();
    const promptText = 'Analyze this image and provide a short, creative, 3-5 word prompt for a story. For example: "a robot exploring ruins".';

    if (provider === 'local') {
        const settings = getLocalLlmSettings();
        if (!settings.textGenerationEndpoint) throw new Error("Local LLM text endpoint not configured.");
        // This is a placeholder as most local models don't support image input this way.
        // A true implementation would require a multimodal local model endpoint (e.g., LLaVA).
        console.warn("Image analysis with local models is not fully supported and may not work.");
        return generateWithLocalLlm(`A user has provided an image. Based on the file name, suggest a creative prompt. The user can't see the image, only you can. Pretend you see it. The prompt should be 3-5 words.`, settings);
    }

    const ai = getGeminiClient();
    const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } }; // Assuming PNG from sanitizer
    const textPart = { text: promptText };
    const request = { model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] } };

    try {
        if (useGhostNetwork) {
            const promises = [ai.models.generateContent(request)];
            for (let i = 0; i < 2; i++) {
                const dummyPrompt = GHOST_NETWORK_TEXT_PROMPTS[secureRandom(GHOST_NETWORK_TEXT_PROMPTS.length)];
                promises.push(ai.models.generateContent({ model: 'gemini-2.5-flash', contents: dummyPrompt }));
            }
            const results = await Promise.allSettled(promises);
            const realResult = results[0];
            if (realResult.status === 'fulfilled') return realResult.value.text.replace(/"/g, '').trim();
            throw realResult.reason;
        } else {
            const response = await ai.models.generateContent(request);
            return response.text.replace(/"/g, '').trim();
        }
    } catch (error) {
        if (error instanceof Error && error.message === API_KEY_ERROR) throw error;
        console.error("Error generating prompt from image:", error);
        throw new Error("Failed to analyze image with Gemini.");
    }
}

export async function generateImageFromPrompt(prompt: string, useGhostNetwork: boolean): Promise<string> {
    const provider = getAiProvider();
    if (provider === 'local') {
        const settings = getLocalLlmSettings();
        return generateImageWithLocalLlm(prompt, settings);
    }
    
    const ai = getGeminiClient();
    const request = { model: 'imagen-3.0-generate-002', prompt, config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' } };

    try {
        let generatedImages;
        if (useGhostNetwork) {
            const promises = [ai.models.generateImages(request)];
            for (let i = 0; i < 2; i++) {
                const dummyPrompt = GHOST_NETWORK_IMAGE_PROMPTS[secureRandom(GHOST_NETWORK_IMAGE_PROMPTS.length)];
                promises.push(ai.models.generateImages({ ...request, prompt: dummyPrompt }));
            }
            const results = await Promise.allSettled(promises);
            const realResult = results[0];
            if (realResult.status === 'fulfilled') generatedImages = realResult.value.generatedImages;
            else throw realResult.reason;
        } else {
            const response = await ai.models.generateImages(request);
            generatedImages = response.generatedImages;
        }

        if (!generatedImages || generatedImages.length === 0) throw new Error("AI did not return any images.");
        return generatedImages[0].image.imageBytes;
    } catch (error) {
        if (error instanceof Error && error.message === API_KEY_ERROR) throw error;
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image. The AI service may be unavailable or the prompt was rejected.");
    }
}

export async function generateThreatAnalysis(config: SecurityConfig, useGhostNetwork: boolean): Promise<ThreatReport> {
    const provider = getAiProvider();
    const prompt = `You are a world-class cybersecurity analyst and cryptographer, providing a threat assessment for a user's data concealment configuration. Your analysis must be concise, expert-level, and formatted as a JSON object. Do not include any markdown or explanatory text outside of the JSON structure.
        Configuration:
        - Encryption Layers: ${config.encryptionLayers}
        - Sub-key Derivation (HKDF): ${config.isKeyHardeningActive ? 'Active' : 'Inactive'}
        - Ciphertext Block Permutation: ${config.isBlockPermutationActive ? 'Active (Experimental)' : 'Inactive'}
        - Post-Quantum Hybrid Mode: ${config.isPqHybridActive ? 'Active (Forward-Looking)' : 'Inactive'}
        - Acoustic Resonance Keying (ARK): ${config.isAcousticResonanceActive ? 'Active (Novel Protocol)' : 'Inactive'}
        - Plausible Deniability Level: "${config.deniabilityLevel}"
        - Deniable Encryption (Duress Key): ${config.hasDeniableEncryption ? 'Active' : 'Inactive'}
        - Dynamic Decoys (AI-Generated): ${config.isDynamicDecoysActive ? 'Active' : 'Inactive'}
        - Steganography Method: "${config.steganography}"
        - Image Metadata Scrubber: ${config.isImageScrubberActive ? 'Active' : 'Inactive'}

        Provide a threat analysis with strengths, weaknesses, recommendations, and an overall assessment.`;
    
    if (provider === 'local') {
        const settings = getLocalLlmSettings();
        try {
            return await generateWithLocalLlm(prompt, settings, true) as ThreatReport;
        } catch(e) {
            throw new Error("Failed to get threat analysis from Local LLM.");
        }
    }
    
    const ai = getGeminiClient();
    const request = {
        model: 'gemini-2.5-flash', contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }, overallAssessment: { type: Type.STRING } }, required: ["strengths", "weaknesses", "recommendations", "overallAssessment"] }
        }
    };

    try {
        let responseText: string;
         if (useGhostNetwork) {
            const promises = [ai.models.generateContent(request)];
            for (let i = 0; i < 2; i++) {
                const dummyPrompt = GHOST_NETWORK_TEXT_PROMPTS[secureRandom(GHOST_NETWORK_TEXT_PROMPTS.length)];
                promises.push(ai.models.generateContent({ model: 'gemini-2.5-flash', contents: dummyPrompt }));
            }
            const results = await Promise.allSettled(promises);
            const realResult = results[0];
            if (realResult.status === 'fulfilled') responseText = realResult.value.text;
            else throw realResult.reason;
        } else {
            const response = await ai.models.generateContent(request);
            responseText = response.text;
        }
        return JSON.parse(responseText) as ThreatReport;
    } catch (error) {
        if (error instanceof Error && error.message === API_KEY_ERROR) throw error;
        console.error("Error generating threat analysis with Gemini:", error);
        throw new Error("Failed to generate threat analysis with Gemini.");
    }
}