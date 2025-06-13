'use client'; // not in original code
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    ReactNode,
} from "react";
// import * as faceapi from "face-api.js";
import axios from 'axios';

interface MediaContextProps {
    isEnabled: boolean;
    isReady: boolean;
    selectedAudioDeviceId: string | null;
    setSelectedAudioDeviceId: (id: string | null) => void;
    selectedVideoDeviceId: string | null;
    setSelectedVideoDeviceId: (id: string | null) => void;
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
    mediaStream: MediaStream | null;
    setMediaStream: (stream: MediaStream | null) => void;
    getStreams: () => Promise<MediaStream | null>;
    enableStreams: () => Promise<MediaStream | null>;
    disableStreams: () => void;
    isAudioAllowed: boolean;
    isVideoAllowed: boolean;
    setIsAudioAllowed: (allowed: boolean) => void;
    setIsVideoAllowed: (allowed: boolean) => void;
    // Recording related properties and methods
    isRecording: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    recordingRef: React.MutableRefObject<Blob[]>;
    faceInFrame: boolean | null;
    findFace: (videoElement: HTMLVideoElement) => Promise<boolean>;
    enableFaceAPI: () => void;
    disableFaceAPI: () => void;
}

const MIME_TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8,opus"];

const MediaContext = createContext<MediaContextProps | undefined>(undefined);

export const MediaProvider = ({ children }: { children: ReactNode }) => {
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<
        string | null
    >(null);
    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<
        string | null
    >(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [isAudioAllowed, setIsAudioAllowed] = useState<boolean>(false);
    const [isVideoAllowed, setIsVideoAllowed] = useState<boolean>(false);
    const [faceInFrame, setFaceInFrame] = useState<boolean | null>(null);

    const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const faceAPIEnabled = useRef<boolean>(false);
    // const faceApiOptions = new faceapi.TinyFaceDetectorOptions();

    // const findFace = useCallback(async (videoElement: HTMLVideoElement) => {
    //   const detections = await faceapi.detectAllFaces(
    //     videoElement,
    //     faceApiOptions
    //   );
    //   return detections.length > 0;
    // }, []);

    const getDevices = async (
        kind: MediaDeviceKind
    ): Promise<MediaDeviceInfo[]> => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === kind);
    };

    const enableStreams = useCallback(async () => {
        console.log("[MediaStore] Enabling streams...");
        if (mediaStream) {
            console.log("[MediaStore] Cleaning previous media streams");
            disableStreams();
        }
        setIsEnabled(true);
        setIsReady(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedVideoDeviceId
                    ? { deviceId: selectedVideoDeviceId }
                    : true,
                audio: selectedAudioDeviceId
                    ? { deviceId: selectedAudioDeviceId }
                    : true,
            });

            setMediaStream(stream);
            setIsReady(true);
            console.log("[MediaStore] Streams enabled successfully");

            return stream;
        } catch (error) {
            console.error("[MediaStore] Error enabling media streams:", error);
            setIsReady(false);
            setIsEnabled(false);
            return null;
        }
    }, [selectedAudioDeviceId, selectedVideoDeviceId, mediaStream]);

    const disableStreams = useCallback(() => {
        if (mediaStream) {
            console.log("Disabling media streams");
            mediaStream.getTracks().forEach((track) => track.stop());
            setMediaStream(null);
            setIsReady(false);
            setIsEnabled(false);
        } else {
            console.log("Oops. Media stream not found, skipping");
        }
    }, [mediaStream]);

    const getStreams = async () => {
        return mediaStream || (await enableStreams());
    };

    const checkPermissions = async () => {
        if (!mediaStream) return;
        const checkPermission = async (kind: "audio" | "video") => {
            try {
                // const stream = await navigator.mediaDevices.getUserMedia({
                //   [kind]: {
                //     deviceId:
                //       kind === "audio" ? selectedAudioDeviceId : selectedVideoDeviceId,
                //   },
                // });
                // return stream.getTracks().length > 0;
                let track = null;
                if (kind === "audio") {
                    track = mediaStream
                        .getAudioTracks()
                        .find(
                            (audioTrack) =>
                                audioTrack.getSettings().deviceId === selectedAudioDeviceId
                        );
                } else if (kind === "video") {
                    track = mediaStream
                        .getVideoTracks()
                        .find(
                            (videoTrack) =>
                                videoTrack.getSettings().deviceId === selectedVideoDeviceId
                        );
                }
                return track !== null;
            } catch {
                return false;
            }
        };

        const audioPerm = await checkPermission("audio");
        const videoPerm = await checkPermission("video");

        setIsAudioAllowed(audioPerm);
        setIsVideoAllowed(videoPerm);
    };

    const initializeDevices = useCallback(async () => {
        try {
            const audioDevices = await getDevices("audioinput");
            const videoDevices = await getDevices("videoinput");

            setAudioDevices(audioDevices);
            setVideoDevices(videoDevices);

            if (!selectedAudioDeviceId && audioDevices[0]?.deviceId) {
                setSelectedAudioDeviceId(audioDevices[0].deviceId);
            }
            if (!selectedVideoDeviceId && videoDevices[0]?.deviceId) {
                setSelectedVideoDeviceId(videoDevices[0].deviceId);
            }
        } catch (error) {
            console.error("Error initializing devices:", error);
        }
    }, [selectedAudioDeviceId, selectedVideoDeviceId]);

    useEffect(() => {
        // By default on first run
        // When fully enabled, initialize the device
        if (isEnabled && isReady && mediaStream) initializeDevices();
    }, [isEnabled, isReady, mediaStream, initializeDevices]);

    useEffect(() => {
        if (isReady) {
            console.log("Detected device changes, re-enabling streams...");
            enableStreams();

            checkPermissions();
            faceDetectionIntervalRef.current = setInterval(checkPermissions, 1000);
        }

        return () => {
            if (faceDetectionIntervalRef.current)
                clearInterval(faceDetectionIntervalRef.current);
        };
    }, [selectedAudioDeviceId, selectedVideoDeviceId]);

    useEffect(() => {
        let debounceTimeout: NodeJS.Timeout;

        const handleDeviceChange = async () => {
            if (debounceTimeout) clearTimeout(debounceTimeout);

            debounceTimeout = setTimeout(async () => {
                console.log("Device change detected, reinitializing devices...");
                await initializeDevices();
            }, 300); // Adjust debounce delay as needed
        };

        navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

        return () => {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            navigator.mediaDevices.removeEventListener(
                "devicechange",
                handleDeviceChange
            );
        };
    }, [initializeDevices]);

    // useEffect(() => {
    //   const loadModelAndCreateVideoElement = async () => {
    //     await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    //     const videoElement = document.createElement("video");
    //     videoElement.style.display = "none";
    //     videoElement.autoplay = true;
    //     videoElement.muted = true;
    //     document.body.append(videoElement);
    //     videoElementRef.current = videoElement;
    //   };

    //   loadModelAndCreateVideoElement();

    //   return () => {
    //     if (videoElementRef.current) {
    //       videoElementRef.current.remove();
    //     }
    //   };
    // }, []);

    // Recording related state and functions
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecordRef = useRef<MediaRecorder | null>(null);
    const recordingRef = useRef<Blob[]>([]);

    const handleDataAvailable = (e: any) => {
        if (e.data.size) {
            console.log("Saving recording");
            recordingRef.current.push(e.data);
            console.log(recordingRef.current);
        }
    };

    const startRecording = () => { 
        if (mediaStream) {
            recordingRef.current = [];
            setIsRecording(true);
            let suitableMimeType = MIME_TYPES.find((t) =>
                MediaRecorder.isTypeSupported(t)
            );
            const option = { mimeType: suitableMimeType, videoBitsPerSecond: 100000 };
            const mediaRecorder = new MediaRecorder(mediaStream, option);
            mediaRecordRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.onerror = (e) => {
                console.error("Recording failed", e);
            };
            mediaRecorder.start();
            console.log("Recording started.");
            // if (faceAPIEnabled.current) {
            //   console.log("FaceAPI is currently enabled");
            //   checkFacePresence();
            // } else {
            //   console.log("FaceAPI is currently disabled");
            // }
        }
    };

    // const periodCheckFace = async () => {
    //   if (faceAPIEnabled.current == false) {
    //     if (faceDetectionIntervalRef.current) {
    //       clearInterval(faceDetectionIntervalRef.current!);
    //       console.log("FaceAPI is now stopped and disabled");
    //     }
    //     return;
    //   }
    //   const detections = await faceapi.detectAllFaces(
    //     videoElementRef.current!,
    //     faceApiOptions
    //   );
    //   if (detections.length === 0) {
    //     setFaceInFrame(false);
    //   } else {
    //     setFaceInFrame(true);
    //   }
    // };

    // const checkFacePresence = async () => {
    //   if (!videoElementRef.current) return;

    //   try {
    //     const stream = mediaStream;
    //     videoElementRef.current!.srcObject = stream;
    //     videoElementRef.current!.play();
    //     faceDetectionIntervalRef.current = setInterval(periodCheckFace, 5000);
    //     periodCheckFace();
    //   } catch (err) {
    //     console.error("Error accessing webcam: ", err);
    //   }
    // };

    const waitForData = () => {
        return new Promise<void>((resolve) => {
            const checkData = () => {
                if (recordingRef.current.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkData, 100); // Check again after 100ms
                }
            };
            checkData();
        });
    };

    const stopRecording = async () => {
        if (
            mediaRecordRef.current &&
            mediaRecordRef.current.state === "recording"
        ) {
            mediaRecordRef.current.stop();
            setIsRecording(false);
            console.log('recording stopped')
            await waitForData();
            if (faceDetectionIntervalRef.current) {
                clearInterval(faceDetectionIntervalRef.current);
            }
        }
    };

    const enableFaceAPI = () => {
        faceAPIEnabled.current = true;
        console.log("FaceAPI is now enabled");
    };

    const disableFaceAPI = () => {
        faceAPIEnabled.current = false;
        console.log("FaceAPI is now disabled");
    };

    return (
        <MediaContext.Provider
      value= {{
        isEnabled,
            isReady,
            selectedAudioDeviceId,
            setSelectedAudioDeviceId,
            selectedVideoDeviceId,
            setSelectedVideoDeviceId,
            audioDevices,
            videoDevices,
            mediaStream,
            setMediaStream,
            getStreams,
            enableStreams,
            disableStreams,
            isAudioAllowed,
            isVideoAllowed,
            setIsAudioAllowed,
            setIsVideoAllowed,
            // Recording related properties and methods
            isRecording,
            startRecording,
            stopRecording,
            recordingRef,
            faceInFrame,
            findFace: async () => false,
            enableFaceAPI,
            disableFaceAPI,
      }
}
    >
    { children }
    </MediaContext.Provider>
  );
};

export const useMedia = (): MediaContextProps => {
    const context = useContext(MediaContext);
    if (!context) {
        throw new Error("useMedia must be used within a MediaProvider");
    }
    return context;
};
