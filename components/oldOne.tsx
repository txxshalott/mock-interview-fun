'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';

const Conversation = forwardRef(function Conversation(
    { startInterview, onEnd }: { startInterview: string; onEnd: () => void },
    ref) {

    // track loaded SDKs
    const [elevenLabsModule, setElevenLabsModule] = useState<any>(null);
    const [retellModule, setRetellModule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [webClient, setWebClient] = useState<any>(null); // replace any with proper tyep?? 

    // conditionally import sdks based on selected model
    useEffect(() => {
        async function loadSDK() {
            if (startInterview === 'retell' && !retellModule) {
                setIsLoading(true);
                try {
                    const { RetellWebClient } = await import("retell-client-js-sdk");
                    setRetellModule({ RetellWebClient })
                } catch (error) {
                    console.log("FAILED TO LOAD RETELL SDK: ", error)
                    setIsLoading(false);
                }

            } else if (startInterview === 'eleven' && !elevenLabsModule) {
                setIsLoading(true);
                try {

                    const [elevenImport, elevenReactImport] = await Promise.all([
                        import("@elevenlabs/client"),
                        import("@elevenlabs/react")
                    ]);

                    const { useConversation } = await import("@elevenlabs/react");
                    setElevenLabsModule({ useConversation });

                } catch (error) {
                    console.log("FAILED TO LOAD ELEVEN SDK", error)
                    setIsLoading(false);
                }
            }
        }
        if (startInterview) {
            loadSDK();
        }
    }, [startInterview, retellModule, elevenLabsModule]);

    // startSession, endSession, status, isSpeaking
    const elevenLabsConvo = elevenLabsModule.useConversation({
        onConnect: () => console.log('Connected'),
        onDisconnect: () => console.log('Disconnected'),
        onMessage: (message: any) => console.log('Message:', message),
        onError: (error: any) => console.error('Error:', error),
    });

    // start convo based on selected service
    useEffect(() => {
        if (!startInterview) return;
        if (startInterview === 'retell') handleRetellStart();
        else if (startInterview === 'elevenlabs' && elevenLabsModule) handle11Start();

        // cleanup
        return () => {
            if (webClient) {
                (webClient as any).removeAllListeners()?.();
                handleRetellEnd(); // end call if component unmounts
            }
        }
    }, [startInterview, elevenLabsModule, retellModule]);


    const handle11Start = async () => {
        if (!elevenLabsModule) return;
        try {
            const response = await fetch('/api/get-elevenlabs-signed-url');
            if (!response.ok) throw new Error('Failed to get signed URL');
            const { signed_url } = await response.json();

            await elevenLabsConvo.startSession({ signedUrl: signed_url });
        } catch (err) {
            console.error('11 labs error: ', err);
            alert('Failed to start 11labs conversation');
        }
    };

    const handle11End = async () => {
        if (elevenLabsModule) {
            try {
                await elevenLabsModule.endSession(); // cant find the right function
                onEnd();
            } catch (err) {
                console.error('error ennding 11labs session: ', err);
                alert('Failed to end 11labs conversation');
            }
        }
    };


    const [retellStatus, setRetellStatus] = useState<'idle' | 'connecting' | 'active' | 'connected' | 'disconnected' | 'error' | 'ended'>('idle');

    const handleRetellStart = async () => {
        if (!retellModule) return;

        try {
            setRetellStatus('connecting');
            // get mic access
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // ensure existing client is cleaned up
            if (webClient) {
                await webClient.stopCall();
                (webClient as any).removeAllListeners?.();
            }
            // call next js api route
            const response = await fetch('/api/create-retell-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }); // make req to backend
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            // get call data
            const data = await response.json();
            console.log('Call created:', data);

            // init client (without api key)
            const client = new retellModule.RetellWebClient();
            setWebClient(client);

            // start call w token from backend
            await client.startCall({ accessToken: data.access_token });
            setRetellStatus('active');

            (client as any).on("call_ended", () => {
                console.log("call ended");
                setRetellStatus('ended');
                onEnd();
            });

        } catch (err) {
            console.error(err);
            setRetellStatus('error');
            alert('Failed to start call: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleRetellEnd = async () => {
        if (webClient) {
            try {
                await webClient.stopCall();
                setRetellStatus('ended');
                onEnd();
            } catch (err) {
                console.error('Error ending call:', err);
            }
        }
    };

    // useImperativeHandle is
    useImperativeHandle(ref, () => ({
        end: startInterview === 'retell' ? handleRetellEnd : handle11End
    }));

    return (
        <div className="flex flex-col items-center">
            {startInterview == 'retell' && (
                <div className="text-black mt-2"> Retell Status: {retellStatus} </div>
            )}
            {startInterview == 'elevenlabs' && (
                <div className="text-black mt-2"> ElevenLabs Status: {elevenLabsConvo.status}, Speaking: {elevenLabsModule.isSpeaking ? 'Yes' : 'No'} </div>
            )}
        </div>
    );
});

export default Conversation;