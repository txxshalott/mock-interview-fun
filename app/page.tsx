'use client';
import React from 'react';
import Conversation from '../components/Conversation';
import { useState, useRef } from 'react';

export default function App() {
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [startInterview, setStartInterview] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // lets parent control actions inside conversation component
  const conversationRef = useRef<{ end: () => void }>(null);

  const handleStart = async () => {
    setIsInterviewing(true);
    setStartInterview(true);
    setInterviewEnded(false);
  };

  const handleEnd = () => {
    conversationRef.current?.end();
    setIsInterviewing(false);
    setInterviewEnded(true);
    
    // Important: stop any tracks when done to avoid memory leaks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const [micAllowed, setMicAllowed] = useState(false);
  const requestMicAccess = async (): Promise<MediaStream | null> => {
    try {
      // Check if the API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API or getUserMedia not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted", stream);
      setMicAllowed(true);
      return stream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Start Interview button at the top */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleStart}
          disabled={isInterviewing}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-white ${isInterviewing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isInterviewing ? (
            <>
              <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
              Interview in Progress...
            </>
          ) : (
            'Start Interview'
          )}
        </button>
      </div>

      {isInterviewing && (
        <div className="max-w-2xl flex flex-col items-center justify-center mx-auto bg-white p-9 rounded-lg shadow-md">
          {!micAllowed ? (
            <>
              <div className="mb-4 text-gray-700">
                This interview requires microphone access. Please allow access to continue.
              </div>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full"
                onClick={requestMicAccess}
              >
                Allow Microphone Access
              </button>
            </>
          ) : (
            <>
              <Conversation
                ref={conversationRef}
                startInterview={startInterview}
                onEnd={handleEnd} />
              {interviewEnded && (
                <div className="text-center text-gray-500">Session ended</div>
              )}
              <button
                onClick={handleEnd}
                className="mt-6 bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-full"
              >
                End interview.
              </button>
            </>
          )}
        </div>
      )}

      {interviewEnded && (
        <div className="flex justify-center mt-8 text-xl text-gray-600 font-semibold">
          Interview ended.
        </div>
      )}
    </div>
  );
}