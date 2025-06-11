'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useConversation } from '@elevenlabs/react';

const ElevenLabsComponent = forwardRef(function Conversation(
    { startInterview, onEnd, llmChoice }: {
        startInterview: boolean;
        onEnd: () => void;
        llmChoice: string;
    }, ref) {

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
        // get mic access
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (micError) {
            console.error('Microphone access denied:', micError);
            alert('Microphone access denied. Please allow microphone access and try again.');
            return;
        }

        // api request
        try {
            console.log('sending choice: ', llmChoice);
            const response = await fetch(`/api/get-elevenlabs-signed-url?llm=${llmChoice}`);
            // pass llm id? 
            if (!response.ok) {
                const errorMsg = await response.text();
                // console.error('api error:', response.status, errorMsg);
                throw new Error(`api error: ${response.status} - ${errorMsg}`);
            }

            const data = await response.json();
            if (!data.signed_url) {
                console.error('No signed URL in response:', data);
                throw new Error('Missing signed URL in API response');
            }
            console.log('Starting 11labs session with url:', data.signed_url);
            await startSession({ signedUrl: data.signed_url });

        } catch (err) {
            console.error('ElevenLabs error:', err);
            setError(String(err));
            alert('Failed to start conversation: ' + String(err));
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