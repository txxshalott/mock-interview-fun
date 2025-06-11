'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import ElevenLabsComponent from './ElevenLabsComponent'; // Assuming this is the component for ElevenLabs

const Conversation = forwardRef(function Conversation(
    { startInterview, onEnd, llmChoice }: { startInterview: string; onEnd: () => void; llmChoice: string; },
    ref) {

    // track loaded SDKs
    const [retellModule, setRetellModule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [webClient, setWebClient] = useState<any>(null); // replace any with proper tyep?? 
    const [error, setError] = useState<string | null>(null);

    // load retell sdk if selected 
    useEffect(() => {
        if (startInterview === 'retell' && !retellModule) {
            setIsLoading(true);
            import("retell-client-js-sdk").then(({ RetellWebClient }) => {
                setRetellModule({ RetellWebClient });
                setIsLoading(false);
            }).catch((err) => {
                console.log("FAILED TO LOAD RETELL SDK: ", err);
                setIsLoading(false);
            });
        }
    }, [startInterview, retellModule]);


    // start the convo
    useEffect(() => {
        if (!startInterview) return;
        if (startInterview === 'retell') handleRetellStart();

        // cleanup
        return () => {
            if (webClient) {
                (webClient as any).removeAllListeners()?.();
                handleRetellEnd(); // end call if component unmounts
            }
        }
    }, [startInterview, retellModule]);

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ llm: llmChoice }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            // get call data
            const data = await response.json();
            console.log('Call created: ', JSON.stringify(data, null, 2));

            // init client (without api key)
            const client = new retellModule.RetellWebClient();
            setWebClient(client);

            if (!data.access_token) {
                const errorMsg = `Missing Retell agent ID. ${llmChoice} id not set.`;
                console.error(errorMsg);
                setError(errorMsg);
                setRetellStatus('error');
                return; // Return early to prevent trying to start the call
            }

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
    /**
     * "when parent passes ref, give them access to the 'end' method"
     * the method changes based on which interview is active
     */
    useImperativeHandle(ref, () => {
        return {
            // end: startInterview === 'retell' ? handleRetellEnd : undefined
            end: async () => {
                if (startInterview === 'retell') {
                    return handleRetellEnd();
                } else if (startInterview === 'eleven') {
                    console.log('Trying to end 11labs session');
                    // call 11labs end on component 
                }
            }
        };
    });


    return (
        <div className="flex flex-col items-center">
            {startInterview == 'retell' && (
                <>
                    <div className="text-black mt-2"> Retell Status: {retellStatus} </div>
                    {error && <div className="text-red-500 mt-2">Error: {error}</div>}
                </>
            )}
            {startInterview == 'eleven' && (
                <div>
                    <ElevenLabsComponent
                        startInterview={true}
                        onEnd={onEnd}
                        llmChoice={llmChoice}
                        ref={ref} // what is ref..
                    />
                </div>
            )}
        </div>
    );
});

export default Conversation;