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
                    <div className="font-bold text-indigo-600 text-xl flex items-center gap-2">
                        <span>●</span>
                        product name
                    </div>
                </div>
            </div>
            {/* Content Container */}
            <div className="flex flex-col items-center justify-center my-4">
                <div className="text-black">Retell Status: {status}</div>
                {error && <div className="text-red-500 mt-2">Error: {error}</div>}
            </div>
            <div className="flex w-full h-72 p-6 gap-6 box-border">
                {/* left */}
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="bg-gray-300 w-full h-full rounded-lg flex items-center justify-center">
                        <div className="font-bold text-indigo-600 text-lg flex items-center gap-2">
                            product logo
                        </div>
                    </div>
                    {isAgentSpeaking && (
                        <span className="absolute inset-0 pointer-events-none z-10 block w-full h-full rounded-lg ring-4 ring-indigo-400 animate-pulse"></span>
                    )}
                </div>
                {/* right */}
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="bg-gray-300 w-full h-full rounded-lg flex items-center justify-center relative">
                        {videoStream ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover rounded-lg transform -scale-x-100
                                    ${isVideoPaused ? 'opacity-50' : ''}`} // blur if paused
                                />
                                {isVideoPaused && (
                                    <div className="absolute inset-0 text-white flex items-center justify-center">
                                        Video paused
                                    </div>
                                )}
                                {isUserSpeaking && (
                                    <span className="absolute inset-0 pointer-events-none z-10 block w-full h-full rounded-lg ring-3 ring-indigo-500 animate-pulse"></span>
                                )}
                            </>
                        ) : (
                            <div className="text-gray-600"> video unavailable" </div>
                        )}
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
                    <button
                        onClick={() => {
                            if (!videoStream) {
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
            {/* Error message */}
            {error && <div className="text-red-500 text-center p-2">{error}</div>}
        </div>
    );
};

export default CallUI; 
