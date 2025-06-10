'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useConversation } from '@elevenlabs/react';

const AGENT_ID = process.env.AGENT_ID || '';
console.log('Using AGENT_ID:', AGENT_ID);

const ElevenLabsComponent = forwardRef(function Conversation(
    { startInterview, onEnd }: { startInterview: boolean; onEnd: () => void },
    ref) {

    // const [status, setStatus] = useState('idle');
    // const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // const convo = useConversation({
    //     onConnect: () => console.log('Connected'),
    //     onDisconnect: () => console.log('Disconnected'),
    //     onMessage: (message) => console.log('Message:', message),
    //     onError: (error) => console.error('Error:', error),
    // });

    const {
        startSession,
        endSession,
        status,
        isSpeaking,
    } = useConversation({
        onConnect: () => console.log('Connected'),
        onDisconnect: () => console.log('Disconnected'),
        onMessage: (message) => console.log('Message:', message),
        onError: (error) => console.error('Error:', error),
    });

    useImperativeHandle(ref, () => ({ // dk how this works
        end: handleEnd,
    }));

    useEffect(() => {
        if (startInterview) {
            handleStart();
        }
    }, [startInterview]);

    const handleStart = async () => {
        // explain allowing access to mic 
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true }); // request mic access

            const response = await fetch('/api/get-elevenlabs-signed-url'); // make req to backend
            if (!response.ok) throw new Error('Failed to get signed URL');
            const { signed_url } = await response.json();

            console.log('Starting 11labs session with url:', signed_url);
            await startSession({ signedUrl: signed_url }); // ask about this later
        } catch (err) {
            console.error('ElevenLabs error:', err);
            setError(String(err));
            alert('Failed to start conversation: ' + String(err)); alert('Microphone access denied.');
        }
    };

    const handleEnd = async () => {
        try {
            await endSession();
            onEnd();
        } catch (err) {
            console.error('Error ending ElevenLabs session:', err);
            setError(String(err));
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="text-black mt-2">Status: {status}</div>
            <div className="text-black mt-2">{isSpeaking ? 'Interviewer speaking' : 'User speaking'}</div>
            {error && <div className="text-red-500 mt-2">Error: {error}</div>}
        </div>
    );
});
export default ElevenLabsComponent;