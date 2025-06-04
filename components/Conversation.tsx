'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useConversation } from '@11labs/react';

const AGENT_ID = process.env.AGENT_ID || '';
console.log('Using AGENT_ID:', AGENT_ID);

const Conversation = forwardRef(function Conversation(
    { startInterview, onEnd }: { startInterview: boolean; onEnd: () => void },
    ref) {
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

            await startSession({ signedUrl: signed_url }); // ask about this later
        } catch (err) {
            alert('Microphone access denied.');
        }
    };

    const handleEnd = async () => {
        await endSession();
        onEnd();
    };

    return (
        <div className="flex flex-col items-center">
            <div className="text-black mt-2">Status: {status}</div>
        </div>
    );
});
export default Conversation;