
import React from 'react';
import { useChannel } from '../hooks/useChannel';
import { AppState } from '../hooks/useAppState';
import { CodeDisplay } from '../components/CodeDisplay';
import { SecretKeyInput } from '../components/SecretKeyInput';
import { HandshakeIcon, LogOutIcon, ServerIcon, AlertTriangleIcon } from '../components/icons';

interface ChannelViewProps {
    appState: AppState;
    setIsSettingsModalOpen: (isOpen: boolean) => void;
}

const Step: React.FC<{ number: number; title: string; children: React.ReactNode, active: boolean }> = ({ number, title, children, active }) => (
    <div className={`p-4 border-l-4 transition-all duration-500 ${active ? 'border-brand-green-neon bg-brand-accent/20' : 'border-brand-accent/50'}`}>
        <h3 className={`flex items-center gap-3 font-bold ${active ? 'text-brand-green-neon' : 'text-brand-light'}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${active ? 'border-brand-green-neon' : 'border-brand-light'}`}>{number}</span>
            {title}
        </h3>
        <div className={`pl-9 pt-3 space-y-4 ${!active ? 'opacity-60' : ''}`}>
            {children}
        </div>
    </div>
);


export const ChannelView: React.FC<ChannelViewProps> = ({ appState, setIsSettingsModalOpen }) => {
    // A bit of a workaround to get a single AppState instance without prop drilling
    // This assumes ChannelView is always rendered within the App component's context.
    const channel = useChannel(appState);

    if (channel.handshakeState === 'complete') {
        // --- ESTABLISHED CHANNEL VIEW ---
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                 {/* Left Column: Control */}
                <div className="flex flex-col gap-6 p-6 bg-brand-secondary rounded-xl shadow-2xl border border-brand-accent/50 lg:col-span-1">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-brand-green-neon">Channel Active</h2>
                        <div className="tooltip-container">
                             <button onClick={channel.resetChannelState} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 bg-red-900/50 rounded-lg hover:bg-red-800/70 border border-red-500/50 transition-colors">
                                <LogOutIcon />
                                Disconnect
                            </button>
                            <span className="tooltip-text">Disconnect from the secure channel and erase all session keys and messages.</span>
                        </div>
                    </div>
                    {channel.channelMode === 'DURESS' && (
                        <div className="p-3 border-l-4 border-red-500 bg-red-900/40 rounded-r-lg text-red-300">
                           <h4 className="font-bold flex items-center gap-2"><AlertTriangleIcon size={20} /> DURESS MODE ACTIVE</h4>
                           <p className="text-xs mt-1 text-red-300/80">You are in a deniable decoy channel. Messages sent and received are plausible fakes, not real data.</p>
                        </div>
                    )}
                     {channel.channelMode === 'SECURE' && (
                        <div className="p-3 border-l-4 border-brand-green-neon bg-brand-green-neon/10 rounded-r-lg text-brand-green-neon">
                           <h4 className="font-bold">ARRK-DKE SECURE</h4>
                           <p className="text-xs mt-1 text-brand-green-neon/80">Self-healing, end-to-end encrypted channel established.</p>
                        </div>
                    )}
                    <div>
                         <h4 className="text-md font-semibold text-brand-light mb-2">Compose Message</h4>
                        <div className="tooltip-container w-full">
                          <textarea value={channel.newMessage} onChange={e => channel.setNewMessage(e.target.value)} placeholder="Type your secure message..." className="w-full h-24 p-2 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text resize-none text-sm"/>
                          <span className="tooltip-text">Type your message here. It will be encrypted before it is staged for sending.</span>
                        </div>
                        <div className="tooltip-container w-full">
                          <button onClick={channel.handleSendMessage} disabled={channel.isProcessing || !channel.newMessage} className="w-full mt-2 py-2 px-4 bg-brand-green-neon text-brand-primary font-bold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50">
                              {channel.isProcessing ? 'Encrypting...' : 'Encrypt & Stage for Sending'}
                          </button>
                          <span className="tooltip-text">Encrypts your message and stages the resulting payload in the history view. You must manually copy this payload and send it to your peer.</span>
                        </div>
                    </div>
                    <div>
                         <h4 className="text-md font-semibold text-brand-light mb-2">Receive Message</h4>
                         <div className="tooltip-container w-full">
                          <textarea value={channel.receivedCiphertext} onChange={e => channel.setReceivedCiphertext(e.target.value)} placeholder="Paste received payload here..." className="w-full h-24 p-2 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text resize-none text-sm"/>
                          <span className="tooltip-text">Paste the encrypted message payload you have received from your peer here.</span>
                         </div>
                        <div className="tooltip-container w-full">
                          <button onClick={channel.handleReceiveMessage} disabled={channel.isProcessing || !channel.receivedCiphertext} className="w-full mt-2 py-2 px-4 bg-brand-accent text-brand-text font-bold rounded-lg hover:bg-brand-light hover:text-brand-primary transition-colors disabled:opacity-50">
                              {channel.isProcessing ? 'Decrypting...' : 'Decrypt Received Message'}
                          </button>
                          <span className="tooltip-text">Decrypts the payload from your peer and displays the plaintext message in the history view.</span>
                        </div>
                    </div>
                    {channel.channelError && <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-xs">{channel.channelError}</div>}
                </div>
                {/* Right Column: Message Display */}
                <div className="flex flex-col gap-6 p-6 bg-brand-secondary rounded-xl shadow-2xl min-h-full border border-brand-accent/50 lg:col-span-2">
                    <h2 className="text-2xl font-bold text-brand-green-neon">Message History</h2>
                    <div className="flex-grow bg-brand-primary p-4 rounded-lg border border-brand-accent/50 h-[32rem] overflow-y-auto flex flex-col gap-4">
                        {channel.channelMessages.length === 0 && (
                            <div className="m-auto text-center text-brand-accent text-sm">
                                <p>Channel connected. Message history will appear here.</p>
                            </div>
                        )}
                        {channel.channelMessages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'self' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'self' ? 'bg-brand-green-neon/20' : 'bg-brand-accent/50'}`}>
                                    <p className="text-brand-text text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                    <p className="text-xs text-brand-light/70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                </div>
                                {msg.sender === 'self' && msg.stagedPayload && (
                                    <CodeDisplay title="Payload to Send (Copy This)" code={msg.stagedPayload} isLoading={false} placeholderText="" isClipboardSanitizerActive={appState.isClipboardSanitizerActive} onCopy={() => appState.setShowClipboardNotification(true)} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
    
    // --- PAKE HANDSHAKE VIEW ---
    return (
        <div className="flex flex-col gap-6 p-6 bg-brand-secondary rounded-xl shadow-2xl border border-brand-accent/50 max-w-4xl mx-auto">
             <h2 className="flex items-center gap-3 text-2xl font-bold text-brand-green-neon">
                <HandshakeIcon /> <span>ARRK-DKE Secure Channel</span>
             </h2>
             <p className="text-sm text-brand-light -mt-4">Establish a self-healing, deniable, end-to-end encrypted channel using a Double Ratchet protocol. <strong className="text-yellow-400">Both keys MUST be strong</strong> and shared securely out-of-band.</p>
            
            {channel.channelError && <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-xs">{channel.channelError}</div>}
             
             <div className="space-y-4">
                <Step number={1} title="Define Channel" active={channel.handshakeState === 'idle'}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="channel-id" className="flex items-center gap-2 text-sm font-medium text-brand-light mb-1"><ServerIcon /> Channel ID</label>
                            <div className="flex gap-2">
                                <div className="tooltip-container w-full">
                                    <input id="channel-id" value={channel.channelId} onChange={e => channel.setChannelId(e.target.value)} placeholder="Enter or generate a Channel ID" className="w-full p-2 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text text-sm" />
                                    <span className="tooltip-text">A unique identifier for this channel. Both users must enter the exact same ID. It acts as a salt for key derivation.</span>
                                </div>
                                <div className="tooltip-container">
                                    <button onClick={channel.handleCreateChannelID} className="px-3 bg-brand-accent text-brand-text rounded-lg hover:bg-brand-light hover:text-brand-primary transition-colors text-sm font-bold">New</button>
                                    <span className="tooltip-text">Generate a new, random Channel ID.</span>
                                </div>
                            </div>
                         </div>
                         <div/>
                         <SecretKeyInput label="Handshake Key" placeholder="Main shared secret password" secretKey={channel.handshakeKey} onSetSecretKey={channel.setHandshakeKey} onGenerateKey={channel.handleGenerateHandshakeKey} showStrengthMeter={true} tooltipText="The main password for the handshake. A weak key is vulnerable to an offline dictionary attack."/>
                         <SecretKeyInput label="Channel Duress Key" placeholder="Secondary 'duress' password" secretKey={channel.channelDuressKey} onSetSecretKey={channel.setChannelDuressKey} onGenerateKey={channel.handleGenerateDuressKey} showStrengthMeter={true} tooltipText="A second, different password. If the peer uses this key to connect, they will enter a fake 'duress' channel, providing you plausible deniability under coercion."/>
                     </div>
                </Step>
                
                <Step number={2} title="User A (Initiator): Generate & Send Payload" active={channel.handshakeState === 'idle' || channel.handshakeState === 'initiated'}>
                    {channel.handshakeState !== 'initiated' ? (
                        <div className="tooltip-container w-full">
                            <button onClick={channel.handleInitiateHandshake} disabled={!channel.channelId || !channel.handshakeKey || !channel.channelDuressKey || channel.isProcessing} className="w-full py-2 bg-brand-green-neon text-brand-primary font-bold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {channel.isProcessing && channel.handshakeState === 'idle' ? 'Generating...' : 'Generate Initiator Payload'}
                            </button>
                            <span className="tooltip-text">As User A, click this to generate the first handshake payload. Copy the entire output and send it to User B.</span>
                        </div>
                    ) : (
                        <CodeDisplay title="Payload to Send to User B" code={channel.initiatorPayload} isLoading={false} placeholderText="" isClipboardSanitizerActive={appState.isClipboardSanitizerActive} onCopy={() => appState.setShowClipboardNotification(true)} />
                    )}
                </Step>

                <Step number={3} title="User B (Responder): Receive, Respond & Connect" active={channel.handshakeState === 'idle'}>
                     <div className="tooltip-container w-full">
                        <textarea value={channel.receivedPayload} onChange={e => channel.setReceivedPayload(e.target.value)} placeholder="Paste User A's Initiator Payload Here" className="w-full h-24 p-2 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text resize-none text-sm"/>
                        <span className="tooltip-text">As User B, paste the payload you received from User A here.</span>
                     </div>
                     <div className="tooltip-container w-full">
                        <button onClick={channel.handleRespondToHandshake} disabled={!channel.receivedPayload || !channel.channelId || !channel.handshakeKey || !channel.channelDuressKey || channel.isProcessing} className="w-full py-2 bg-brand-accent text-brand-text font-bold rounded-lg hover:bg-brand-light hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                             {channel.isProcessing ? 'Connecting...' : 'Generate Response & Connect'}
                        </button>
                        <span className="tooltip-text">Click to process User A's payload, establish a connection, and generate a response payload to send back.</span>
                    </div>
                    {channel.responderPayload && (
                       <CodeDisplay title="Connection Established. Send this Payload back to User A." code={channel.responderPayload} isLoading={false} placeholderText="" isClipboardSanitizerActive={appState.isClipboardSanitizerActive} onCopy={() => appState.setShowClipboardNotification(true)} />
                    )}
                </Step>

                <Step number={4} title="User A (Initiator): Finalize Connection" active={channel.handshakeState === 'initiated'}>
                     <div className="tooltip-container w-full">
                        <textarea value={channel.receivedPayload} onChange={e => channel.setReceivedPayload(e.target.value)} placeholder="Paste User B's Response Payload Here" className="w-full h-24 p-2 bg-brand-primary border-2 border-brand-accent rounded-lg focus:ring-2 focus:ring-brand-green-neon focus:border-brand-green-neon transition-colors duration-200 text-brand-text resize-none text-sm"/>
                        <span className="tooltip-text">As User A, paste the response payload you received from User B here.</span>
                     </div>
                     <div className="tooltip-container w-full">
                         <button onClick={channel.handleCompleteHandshake} disabled={!channel.receivedPayload || channel.isProcessing} className="w-full py-2 bg-brand-green-neon text-brand-primary font-bold rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {channel.isProcessing ? 'Connecting...' : 'Complete Handshake'}
                         </button>
                         <span className="tooltip-text">Click to process User B's response and finalize the secure channel.</span>
                     </div>
                </Step>
             </div>
        </div>
    )
};
