'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useMedia } from './MediaStore';
import CallUI from './CallUI';

const Conversation = forwardRef(function Conversation(
    { isInterviewing, onEnd, llmChoice, mediaStream }:
        { isInterviewing: boolean; onEnd: () => void; llmChoice: string; mediaStream: MediaStream | null },
    ref) {

    // track loaded SDKs
    const [retellModule, setRetellModule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [webClient, setWebClient] = useState<any>(null); // replace any with proper tyep?? 
    const [error, setError] = useState<string | null>(null);
    const [retellStatus, setRetellStatus] = useState<'idle' | 'connecting' | 'active' | 'connected' | 'disconnected' | 'error' | 'ended'>('idle');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(false);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [timer, setTimer] = useState<number>(0);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
    const [callId, setCallId] = useState<string | null>(null);
    const [audioOnly, setAudioOnly] = useState(false);
    const endingRef = useRef(false);

    // recording
    const { isRecording, startRecording, stopRecording, recordingRef } = useMedia();

    useEffect(() => {
        if (webClient) {
            webClient.on('agent_start_talking', () => setIsAgentSpeaking(true));
            webClient.on('agent_stop_talking', () => setIsAgentSpeaking(false));
        }
    }, [webClient]);

    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const audioContext = useRef<AudioContext | null>(null);

    // simple voice detection
    useEffect(() => {
        if (videoStream && !audioContext.current) {
            audioContext.current = new AudioContext();
            const analyzer = audioContext.current.createAnalyser();
            analyzer.fftSize = 256;

            // connect stream to analyzer
            const source = audioContext.current.createMediaStreamSource(videoStream);
            source.connect(analyzer);

            // data array for analysis
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);

            // check audio levels at intervals
            const interval = setInterval(() => {
                if (isMuted) {
                    setIsUserSpeaking(false);
                    return;
                }
                analyzer.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                setIsUserSpeaking(average > 15); // threshold for the ring to appear
            }, 100);
            return () => clearInterval(interval);
        }
    }, [videoStream, isMuted]);

    // load retell sdk 
    // this shd only happen once not every time the inter actually nvm
    useEffect(() => {
        if (isInterviewing) {
            setIsLoading(true);
            import("retell-client-js-sdk").then(({ RetellWebClient }) => {
                setRetellModule({ RetellWebClient });
                setIsLoading(false);
            }).catch((err) => {
                console.log("FAILED TO LOAD RETELL SDK: ", err);
                setIsLoading(false);
            });
        }
    }, [isInterviewing]);


    // start the convo
    useEffect(() => {
        if (!isInterviewing || !retellModule) return;

        const interval = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);

        if (isInterviewing) handleRetellStart();
        startVideo(); // function will handle constraints based on audioOnly
        if (!audioOnly) startRecording();

        // cleanup
        return () => {
            if (webClient) {
                (webClient as any).removeAllListeners()?.();
                handleRetellEnd();
            }
        }
    }, [isInterviewing, retellModule]); // ensures call only starts when sdk loads

    // connection bw stream & element happens once
    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    const startVideo = async () => {

        if (mediaStream) {
            setVideoStream(mediaStream);
            return;
        }

        // fallback
        try {
            const constraints = audioOnly ? { audio: true } : { video: true, audio: true }
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setVideoStream(stream);
            setIsVideoPaused(audioOnly);
        } catch (err) {
            console.error('error accessing mic / camera', err);
        }
    }

    const handleRetellStart = async () => {
        if (!retellModule) return;

        try {
            setRetellStatus('connecting');
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
            setCallId(data.call_id);
            console.log('Call created');
            // , JSON.stringify(data, null, 2)

            // init client (without api key)
            const client = new retellModule.RetellWebClient();
            setWebClient(client);

            if (!data.access_token) {
                // const errorMsg = `Missing Retell agent ID. ${llmChoice} id not set.`;
                const errorMsg = `ran out of credits LOL plz make a new trial account`;
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
        if (endingRef.current) return;
        endingRef.current = true;

        console.log('handleRetellEnd called');
        if (webClient) {
            try {
                console.log('webclient');
                await webClient.stopCall();
                if (!audioOnly) await stopRecording();

                setRetellStatus('ended');
                onEnd();
            } catch (err) {
                console.error('Error ending call:', err);
            }
        }
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
    };

    const saveRecording = () => {
        // blob constructor with recording ref
        // create download link with url.createobjecturl
        if (!recordingRef.current || recordingRef.current.length === 0) {
            console.error('No recording data available');
            return;
        }
        const blob = new Blob(recordingRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `interview-recording-${callId}.mp4`;
        document.body.appendChild(link);

        setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url);
        }, 100)
    }

    const toggleMute = () => {
        // initial: false, but tracks are enabled
        // is there a way to set it based on whether tracks are enabled.
        if (videoStream) {
            videoStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
        if (webClient) {
            if (isMuted) {
                webClient.unmute();
            } else {
                webClient.mute();
            }
        }
        setIsMuted(!isMuted);
        console.log('toggled audio to', isMuted);
    };

    const toggleVideo = () => {
        if (videoStream) {
            videoStream.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled; // should use the opposite of current state
            });
            setIsVideoPaused(!isVideoPaused);
            console.log('toggled video to', !isVideoPaused);
        } else {
            console.warn('No video stream available to toggle');
        }
    };

    useImperativeHandle(ref, () => ({
        end: async () => {
            handleRetellEnd();
        },
        downloadRecording: () => {
            saveRecording();
        }
    }));

    return (
        <CallUI
            videoRef={videoRef}
            videoStream={videoStream}
            isMuted={isMuted}
            isVideoPaused={isVideoPaused}
            isAgentSpeaking={isAgentSpeaking}
            isUserSpeaking={isUserSpeaking}
            status={retellStatus}
            timer={timer}
            error={error}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            startVideo={startVideo}
            audioOnly={audioOnly}
            handleRetellEnd={handleRetellEnd} // dont know why handleretellend doesnt work 
        />
    );
});

export default Conversation;