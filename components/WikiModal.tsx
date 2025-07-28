
import React from 'react';
import { AppHeader, AlertTriangleIcon, KeyIcon, ChannelIcon, GhostNetworkIcon, CpuChipIcon } from './icons';

interface WikiModalProps {
    onClose: () => void;
}

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({title, icon, children}) => (
    <section className="mb-8 p-4 border border-brand-accent/30 rounded-lg bg-brand-primary/30">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-brand-green-neon mb-4 border-b border-brand-accent/50 pb-2">
            {icon}
            <span>{title}</span>
        </h2>
        <div className="prose prose-sm prose-invert max-w-none text-brand-light">
            {children}
        </div>
    </section>
);

const OpSecWarning: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="my-4 p-4 border-l-4 border-yellow-400 bg-yellow-900/30 rounded-r-lg text-yellow-300">
        <h4 className="font-bold flex items-center gap-2"><AlertTriangleIcon size={20} /> {title}</h4>
        <div className="mt-2 text-yellow-400/90 text-sm">{children}</div>
    </div>
);

const Code: React.FC<{children: React.ReactNode}> = ({children}) => <code className="bg-brand-accent text-brand-green-neon px-1 py-0.5 rounded text-xs font-mono">{children}</code>;

export const WikiModal: React.FC<WikiModalProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-brand-primary bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-brand-secondary rounded-xl shadow-2xl border-2 border-brand-green-neon/50 w-full max-w-4xl h-[95vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-accent/50 flex justify-between items-center shrink-0">
                    <h1 className="text-xl font-bold text-brand-text">Chimera Cipher: Field Manual</h1>
                    <div className="tooltip-container">
                         <button 
                            onClick={onClose}
                            className="p-2 text-brand-light hover:text-brand-green-neon"
                            aria-label="Close"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <span className="tooltip-text">Close Field Manual</span>
                    </div>
                </header>

                <div className="p-6 overflow-y-auto flex-grow">

                    <Section title="Core Concepts" icon={<AppHeader />}>
                        <p>Chimera Cipher is not just an encryption tool; it's a system for creating <strong className="text-white">plausible deniability</strong>. Its primary goal is to transform a secret file (the payload) into a format where its very existence can be reasonably denied, even if an adversary captures the output.</p>
                        <p>It achieves this through three main techniques:</p>
                        <ul>
                            <li><strong>Multi-Layer Authenticated Encryption:</strong> Your data is wrapped in layers of state-of-the-art AES-256-GCM encryption. This makes it computationally impossible to read without the correct keys.</li>
                            <li><strong>Digital Dust (Plausible Deniability):</strong> The real encrypted payload is hidden among a number of fake, decoy payloads (encrypted literary text). To an observer, the final output is just a collection of random-looking data blocks. Without the key, it's impossible to know which one is real.</li>
                            <li><strong>Steganography (Hiding in Plain Sight):</strong> The entire package of real and decoy data can be concealed within an innocent-looking carrier, like a story or an image, making it appear as if no secret communication is happening at all.</li>
                        </ul>
                    </Section>

                    <Section title="Operational Security (OpSec) First!" icon={<AlertTriangleIcon />}>
                         <OpSecWarning title="Your Security Depends On You, Not Just The Tool">
                            <p>This tool uses world-class cryptography, but the strongest lock is useless if you leave the key under the doormat. Your real-world security depends on how you use it. </p>
                        </OpSecWarning>
                        <h4 className="text-lg font-bold text-white mt-4">The Golden Rules:</h4>
                        <ol>
                            <li><strong>Rule #1: Stay Air-Gapped.</strong> By default, the app is in <Code>Air-Gap Mode</Code>. This means it has NO connection to the internet. For the ultimate in privacy, use a Local LLM provider (see below) which allows all features to work in Air-Gap mode.</li>
                            <li><strong>Rule #2: Use Tor If You Go Online with a Cloud Provider.</strong> If you must use the cloud-based Gemini provider, you MUST route your traffic through the Tor network. The app provides a guide for this. Without Tor, your IP address is visible to Google's servers.</li>
                            <li><strong>Rule #3: Protect Your Endpoint.</strong> Run this application on a trusted, secure computer with up-to-date antivirus and minimal browser extensions. Malware on your machine (like a keylogger) can steal your passwords and defeat all of this tool's protections.</li>
                        </ol>
                    </Section>

                     <Section title="Using a Local LLM Provider" icon={<CpuChipIcon />}>
                        <p>For maximum privacy and operational security, Chimera Cipher supports using your own locally-hosted language and image models. This allows all AI-powered features to function in a completely offline, air-gapped environment.</p>
                        <OpSecWarning title="Local LLMs are an Advanced Feature">
                           <p>This requires you to be running your own AI models on your machine using software like KoboldCPP (for text) or a Stable Diffusion UI like AUTOMATIC1111 (for images). You must provide the correct API endpoint for the tool to connect to.</p>
                        </OpSecWarning>
                        <h4 className="text-lg font-bold text-white mt-4">Configuration Steps:</h4>
                        <ol>
                           <li>Navigate to <Code>Settings</Code> in the main header.</li>
                           <li>Under <Code>AI Provider</Code>, select <Code>Local LLM (KoboldCPP)</Code>.</li>
                           <li><strong>Text Generation:</strong> Enter the API endpoint for your text model. For KoboldCPP, this is often <Code>http://127.0.0.1:5001/api/v1/generate</Code>. Use the "Test" button to verify the connection.</li>
                           <li><strong>Image Generation:</strong> To enable local image generation, toggle the switch on. Enter the API endpoint for your image model. For AUTOMATIC1111's Stable Diffusion API, this is often <Code>http://127.0.0.1:7860/sdapi/v1/txt2img</Code>.</li>
                           <li>Save your settings. The application will now route all AI requests to your local servers instead of Google's.</li>
                        </ol>
                        <p>With a local provider configured, features like Dynamic Decoys and AI Carrier Image Generation will work even when <Code>Air-Gap Mode</Code> is enabled, providing a truly private, powerful workflow.</p>
                    </Section>

                    <Section title="Key Management" icon={<KeyIcon />}>
                         <h4 className="text-lg font-bold text-white">Master Key vs. Individual Keys</h4>
                         <p>You have two modes for managing keys:</p>
                        <ul>
                            <li><strong>Master Key Mode:</strong> Recommended for simplicity and security. You provide one very strong password. The app uses the Argon2id algorithm to derive the Alpha, Omega, and Decoy keys from this single password. This is highly resistant to brute-force attacks.</li>
                            <li><strong>Individual Key Mode:</strong> For advanced users. You can set the Alpha, Omega, and Decoy keys manually. When you type a password here, it is also hashed with Argon2id to create the real encryption key.</li>
                        </ul>
                         <h4 className="text-lg font-bold text-white mt-4">The Keys Explained</h4>
                        <ul>
                            <li><strong>Alpha Key:</strong> The primary key. It's always required to encrypt the payload and is used for steganography patterns.</li>
                            <li><strong>Omega Key:</strong> An optional second layer of encryption. If used, an attacker would need to break through two separate layers of AES-256, requiring both the Alpha and Omega keys. This dramatically increases the work factor for an attacker.</li>
                            <li><strong>Decoy Key:</strong> An optional "duress" key. It encrypts one of the decoy data blocks. If you are forced to reveal a password, you can provide the Decoy Key. It will "unlock" a harmless decoy file, allowing you to plausibly deny the existence of the real, more sensitive data.</li>
                        </ul>
                    </Section>

                    <Section title="Payload Entanglement" icon={<GhostNetworkIcon />}>
                        <h4 className="text-lg font-bold text-white">Cryptographic Controls</h4>
                        <ul>
                            <li><strong>Sub-key Derivation:</strong> (Recommended: ON) Uses HKDF to create unique sub-keys for different cryptographic purposes from your main keys. This is a security best practice that prevents keys from "leaking" information about each other.</li>
                            <li><strong>Block Permutation:</strong> (Experimental) Scrambles the bytes of your encrypted data. Provides no real cryptographic strength over standard AES-GCM and should be considered an obfuscation layer only.</li>
                            <li><strong>Post-Quantum Hybrid:</strong> (Forward-Looking) Simulates hardening your keys against future quantum computers by combining them with another secret. Does not use a real PQC algorithm but demonstrates the principle.</li>
                            <li><strong>Acoustic Resonance Keying (ARK):</strong> (Advanced) A powerful, novel protocol that turns the carrier image into a second security factor. It derives a key from the statistical "fingerprint" of the image. Decryption then requires both your Alpha Key AND the original, bit-perfect carrier image. If an attacker gets your key and the final covert image, they still can't decrypt it without the original carrier.</li>
                        </ul>

                         <h4 className="text-lg font-bold text-white mt-4">Plausible Deniability</h4>
                        <ul>
                           <li><strong>Digital Dust Level:</strong> Controls how many decoy blobs are created. `Minimal` creates none (no deniability). `Standard` creates a few. `Hardened` creates the most, offering the best deniability at the cost of a larger final payload size.</li>
                           <li><strong>Dynamic Decoys (AI):</strong> (Recommended: ON) Generates unique, mundane-sounding decoy text from AI for every session. This is far more secure than using static, pre-written decoys which could potentially be fingerprinted.</li>
                        </ul>

                         <h4 className="text-lg font-bold text-white mt-4">Steganography (Hiding Data)</h4>
                        <OpSecWarning title="Steganography is Fragile!">
                           <p>Any modification to the carrier file (text or image) will destroy the hidden data. This includes compression by social media sites, simple text edits, or even saving an image in a different format. Only use steganography when you can guarantee the integrity of the carrier from sender to receiver.</p>
                        </OpSecWarning>
                        <ul>
                            <li><strong>Covert Text (AI):</strong> Hides the payload as invisible zero-width characters inside AI-generated text. The `Stealth Risk` indicator shows how much of the text is composed of hidden data. A lower ratio is harder to detect.</li>
                            <li><strong>Covert Image (Entropic Dispersal):</strong> Hides the payload in the least significant bits (LSBs) of an image's pixels. Unlike naive LSB steganography, this method uses your Alpha Key to scatter the data bits across the image in a pseudo-random, unpredictable pattern, making it much more resistant to automated analysis. The `Image Stego Risk` indicator shows what percentage of the image's data capacity is being used. Keep this low.</li>
                        </ul>
                    </Section>

                    <Section title="Secure Channel Protocol: ARRK-DKE" icon={<ChannelIcon />}>
                        <p>This mode implements the <strong className="text-white">Asymmetric Regenerative Ratchet with Deniable Key Exchange (ARRK-DKE)</strong>. This is a state-of-the-art protocol, inspired by the Signal Protocol, designed for maximum security and resilience against powerful adversaries.</p>
                        
                        <h4 className="text-lg font-bold text-white mt-4">Core Engine: The Double Ratchet</h4>
                        <p>ARRK-DKE uses a "Double Ratchet" to protect your messages. This combines two independent cryptographic ratchets:</p>
                        <ul>
                            <li><strong className="text-white">Symmetric Key Ratchet:</strong> Just like a socket wrench, this ratchet "clicks" forward with every message sent or received. Each message is encrypted with a unique key. This provides <strong className="text-white">Forward Secrecy</strong>. If an attacker steals the key for one message, they cannot use it to decrypt past messages.</li>
                            <li><strong className="text-white">Asymmetric DH Ratchet:</strong> This is the "self-healing" component. Periodically, your app and your peer's app will transparently perform an Elliptic Curve Diffie-Hellman (ECDH) key exchange. This generates a completely new, shared secret root key for the symmetric ratchet. This provides <strong className="text-white">Post-Compromise Security</strong>. If an attacker compromises your device and steals your session keys, they can only listen in until the next DH ratchet step, which automatically locks them out.</li>
                        </ul>

                        <h4 className="text-lg font-bold text-white mt-4">The Masterstroke: Deniable Key Exchange (DKE)</h4>
                        <OpSecWarning title="KEY DISTINCTION IS CRITICAL!">
                           <p>The security of DKE depends on you understanding the two keys. They <strong className="text-white">MUST</strong> be different. You and your peer must agree on both keys beforehand via a separate secure channel.</p>
                        </OpSecWarning>
                        <ul>
                            <li><strong>Handshake Key:</strong> This is your <strong className="text-white">primary password</strong> for the channel. It is used to authenticate the handshake and establish the real, secure channel.</li>
                            <li><strong>Channel Duress Key:</strong> This is your <strong className="text-white">"duress" or "decoy" password</strong>. You ONLY use this if you are being coerced.</li>
                        </ul>
                        <p>When you initiate the channel, the app creates a payload with two "locks": one for the Handshake Key and one for the Duress Key. When your peer connects:</p>
                        <ul>
                            <li>If they use the <Code>Handshake Key</Code>, the real lock opens, and you enter <strong className="text-brand-green-neon">ARRK-DKE SECURE</strong> mode. Your communications are now protected by the Double Ratchet.</li>
                            <li>If they use the <Code>Channel Duress Key</Code>, the decoy lock opens, and they enter <strong className="text-red-400">DURESS MODE</strong>. In this mode, the application generates plausible but entirely fake decoy messages. This allows a user under duress to "prove" they are cooperating with an adversary, protecting the real channel and its participants. A highly visible banner will warn you if you are in this mode.</li>
                        </ul>
                    </Section>

                </div>
            </div>
            {/* Add styles for prose */}
            <style>{`
                .prose-invert {
                    --tw-prose-body: #888888;
                    --tw-prose-headings: #EAEAEA;
                    --tw-prose-lead: #888888;
                    --tw-prose-links: #39FF14;
                    --tw-prose-bold: #FFFFFF;
                    --tw-prose-counters: #888888;
                    --tw-prose-bullets: #2E3A31;
                    --tw-prose-hr: #2E3A31;
                    --tw-prose-quotes: #888888;
                    --tw-prose-quote-borders: #2E3A31;
                    --tw-prose-captions: #2E3A31;
                    --tw-prose-code: #39FF14;
                    --tw-prose-pre-code: #39FF14;
                    --tw-prose-pre-bg: #0A0A0A;
                    --tw-prose-th-borders: #2E3A31;
                    --tw-prose-td-borders: #2E3A31;
                }
                .prose-invert ul > li::before { background-color: #39FF14; }
                .prose-invert ol > li::before { color: #888888; }
                .prose-invert h2, .prose-invert h3, .prose-invert h4 {
                    color: #EAEAEA;
                }
            `}</style>
        </div>
    );
};
