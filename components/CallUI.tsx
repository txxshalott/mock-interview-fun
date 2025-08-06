'use client';

import React from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface CallUIProps {
    audioOnly: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    videoStream: MediaStream | null;
    isMuted: boolean;
    isVideoPaused: boolean;
    timer: number;
    isAgentSpeaking: boolean;
    error: string | null;
    isUserSpeaking: boolean;
    status: string;

    toggleMute: () => void;
    toggleVideo: () => void;
    startVideo: () => void;
    handleRetellEnd: () => void;
}

const CallUI: React.FC<CallUIProps> = ({
    audioOnly, isUserSpeaking, videoRef, videoStream, isMuted, isVideoPaused, timer, error,
    toggleMute, status, toggleVideo, startVideo, handleRetellEnd, isAgentSpeaking }) => {

    // formatting timer
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    isUserSpeaking = isUserSpeaking && !isMuted;

    return (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Ribbon Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center">
                    <div className="font-bold text-green-600 text-xl flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></span>
                        Interview in Progress...
                    </div>
                </div>
            </div>
            {/* Content Container */}
            <div className="flex flex-col items-center justify-center my-4">
                <div className="text-black">Agent status: {status}</div>
                {error && <div className="text-red-500 mt-2">Error: {error}</div>}
            </div>
            <div className="flex w-full h-72 p-6 gap-6 box-border">
                {/* left */}
                <div className="flex-1 flex items-center justify-center rounded-lg">
                    <div className={
                        `${audioOnly ? "bg-white w-50 h-50 rounded-full" : "bg-gray-300 w-full h-full rounded-lg "}
                        ring-2 ring-gray-200 flex items-center justify-center relative`}>
                        <div className="relative flex text-indigo-500 items-center justify-center w-full h-full">
                            <img src="/avatar.PNG" alt="jokebear" className="w-3/4 h-3/5" />
                            {isAgentSpeaking && (
                                <span className={`absolute inset-0 pointer-events-none z-10 block w-full h-full ${audioOnly ? "rounded-full" : "rounded-lg"} ring-4 ring-indigo-500 animate-pulse`}></span>
                                // <span
                                //     className={`absolute pointer-events-none z-10 block ${audioOnly ? "rounded-full" : "rounded-lg"} ring-4 ring-indigo-500 animate-pulse`}
                                //     style={{ width: '50%', height: '50%', top: '25%', left: '25%' }}
                                // ></span>
                            )}
                        </div>
                    </div>
                </div>
                {/* right */}
                <div className="flex-1 flex items-center justify-center rounded-lg">
                    <div className={
                        `${audioOnly ? "bg-white w-50 h-50 rounded-full" : "bg-gray-300 w-full h-full rounded-lg "}
                        ring-2 ring-gray-200 flex items-center justify-center relative`}>
                        {audioOnly ? (
                            <div className="relative flex text-indigo-500 items-center justify-center w-full h-full">
                                user
                                {isUserSpeaking && (
                                    <span className={`absolute inset-0 pointer-events-none z-10 block w-full h-full ${audioOnly ? "rounded-full" : "rounded-lg"} ring-4 ring-indigo-500 animate-pulse`}></span>
                                )}
                            </div>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover rounded-lg transform -scale-x-100"
                                />
                                {isVideoPaused && (
                                    <div className="absolute inset-0 text-white flex items-center justify-center">
                                        Video paused
                                    </div>
                                )}
                                {isUserSpeaking && (
                                    <span className="absolute inset-0 pointer-events-none z-10 block w-full h-full rounded-lg ring-4 ring-indigo-500 animate-pulse"></span>
                                )}
                            </>
                        )
                            // : (
                            //     <div className="text-gray-600">video unavailable</div>
                            // )
                        }
                    </div>
                </div>
            </div>
            {/* Control Bar */}
            <div className="p-4 flex items-center justify-between bg-white">
                <div className="flex space-x-2">
                    {/* Mute button */}
                    <button
                        onClick={toggleMute}
                        className={`w-10 h-10 flex items-center justify-center rounded-full ${isMuted ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-700'}`}
                    >
                        {isMuted ? (
                            <MicOff className="h-5 w-5" />
                        ) : (
                            <Mic className="h-5 w-5" />
                        )}
                    </button>

                    {/* Video toggle button */}
                    {!audioOnly && (
                        <button
                            onClick={() => {
                                if (!videoStream) {
                                    // reaching here rn? 
                                    startVideo();
                                } else {
                                    toggleVideo();
                                }
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${isVideoPaused ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {isVideoPaused ? (
                                <VideoOff className="h-5 w-5" />
                            ) : (
                                <Video className="h-5 w-5" />
                            )}
                        </button>
                    )}
                </div>
                {/* Timer */}
                <div className="text-red-400 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mx-2"> </span>
                    {formatTime(timer)}
                </div>

                {/* End Call Button */}
                <button
                    onClick={handleRetellEnd}
                    className="bg-red-400 hover:bg-red-500 text-white px-4 py-1.5 rounded-full text-sm"
                >
                    End call
                </button>
            </div>
        </div>
    );
};

export default CallUI; 
