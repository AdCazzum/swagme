"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OnResultFunction } from "react-qr-reader";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";

const QrScanner = dynamic(
  () => import("react-qr-reader").then((mod) => mod.QrReader),
  { ssr: false }
);

export const Scan = () => {
  const [buttonState, setButtonState] = useState<
    "pending" | "success" | "failed" | undefined
  >(undefined);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { isInstalled } = useMiniKit();

  const requestMicrophonePermission = useCallback(async () => {
    if (!isInstalled) {
      console.log("MiniKit is not installed, skipping permission request");
      return true; // Assume permission granted if not in MiniKit environment
    }

    try {
      // For MiniKit environments, we'll handle permissions gracefully
      // without making specific API calls that might cause "already granted" errors
      console.log("MiniKit detected, proceeding with microphone access");
      setPermissionError(null);
      return true;
    } catch (error: unknown) {
      console.log("Permission check result:", error);

      // Handle any error as success since we want transparent UX
      setPermissionError(null);
      return true;
    }
  }, [isInstalled]);

  const toggleMicrophone = useCallback(async () => {
    if (isMicOn) {
      // Stop microphone access
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        setStream(null);
      }
      setIsMicOn(false);
    } else {
      // First request permission from MiniKit (silently)
      await requestMicrophonePermission();

      // Then request browser permission
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(newStream);
        setIsMicOn(true);
        setPermissionError(null);
      } catch (error: unknown) {
        console.error("Error accessing microphone:", error);

        const errorName = (error as { name?: string })?.name;

        if (errorName === "NotAllowedError") {
          setPermissionError(
            "Microphone access denied by browser. Please allow microphone access and try again."
          );
        } else if (errorName === "NotFoundError") {
          setPermissionError("No microphone found on this device.");
        } else {
          setPermissionError("Failed to access microphone. Please try again.");
        }
      }
    }
  }, [isMicOn, stream, requestMicrophonePermission]);

  const handleScan: OnResultFunction = useCallback(
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result?: any | undefined | null,
      error?: Error | undefined | null
    ) => {
      if (buttonState === "success" || !scanning) return; // Prevent multiple scans

      const text = result?.getText();

      if (text && text.trim()) {
        console.log("QR Code detected:", text);
        setSurveyId(text);
        setScanning(false);
        setButtonState("success");

        // Reset state after showing success
        setTimeout(() => {
          setButtonState(undefined);
        }, 2000);
        return;
      }

      if (error) {
        console.warn("Scanner error (continuing):", error);
        // Don't show failed state for scanning errors, just continue scanning
      }
    },
    [buttonState, scanning]
  );

  const startScanning = useCallback(async () => {
    if (scanning) return; // Prevent multiple start calls

    setScanning(true);
    setButtonState("pending");
    setSurveyId(null); // Reset previous scan result

    // Request camera permissions explicitly before starting
    try {
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      console.log("Camera permission granted");
    } catch (error) {
      console.error("Camera permission denied:", error);
      setPermissionError(
        "Camera access is required for QR scanning. Please allow camera access."
      );
      setScanning(false);
      setButtonState("failed");
      return;
    }

    // Automatically enable microphone when starting scan (silently)
    if (!isMicOn) {
      await toggleMicrophone();
    }
  }, [scanning, isMicOn, toggleMicrophone]);

  useEffect(() => {
    // Auto-enable microphone on component mount for better UX (silently)
    const autoEnableMicrophone = async () => {
      if (!isMicOn && !permissionError) {
        await requestMicrophonePermission();
      }
    };

    autoEnableMicrophone();
  }, [isMicOn, permissionError, requestMicrophonePermission]);

  // Set camera ready state when scanning starts
  useEffect(() => {
    if (scanning) {
      // Small delay to allow camera to initialize
      const timer = setTimeout(() => {
        setCameraReady(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCameraReady(false);
    }
  }, [scanning]);

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Scan</p>

      {/* Permission Error Display */}
      {permissionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Permission Required
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{permissionError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <LiveFeedback
        label={{
          failed: "Failed to scan",
          pending: "Scanning",
          success: "Scanned",
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={startScanning}
          disabled={buttonState === "pending" || scanning}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          {scanning ? "Scanning..." : "Scan QR Code"}
        </Button>

        {scanning && (
          <div className="mt-4 w-full">
            <div className="relative bg-black rounded-lg overflow-hidden w-full h-64">
              {/* QR Scanner with visible camera feed */}
              <div className="absolute inset-0 z-0">
                <QrScanner
                  scanDelay={300}
                  onResult={handleScan}
                  containerStyle={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius: "8px",
                  }}
                  videoStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  constraints={{
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                />
              </div>

              {/* Loading indicator while camera starts */}
              {!cameraReady && (
                <div className="absolute inset-0 z-10 bg-gray-900 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Starting camera...</p>
                  </div>
                </div>
              )}

              {/* Scanning overlay with better visual feedback */}
              <div className="absolute inset-0 z-5 pointer-events-none">
                {/* Overlay to darken edges and focus on center */}
                <div className="absolute inset-0 bg-black/20"></div>

                {/* Central scanning area */}
                <div className="absolute inset-6 border-2 border-white/80 rounded-xl shadow-lg">
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
                </div>

                {/* Animated scanning line */}
                <div className="absolute top-6 left-6 right-6 bottom-6 overflow-hidden rounded-xl">
                  <div
                    className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"
                    style={{
                      top: "50%",
                      transform: "translateY(-50%)",
                      boxShadow: "0 0 8px rgba(59, 130, 246, 0.8)",
                    }}
                  ></div>
                </div>

                {/* Instructions overlay */}
                <div className="absolute bottom-12 left-0 right-0 text-center">
                  <div className="bg-black/60 text-white px-3 py-1 rounded-full mx-auto inline-block text-xs">
                    Position the QR code in the frame
                  </div>
                </div>
              </div>

              {/* Stop button */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                <Button
                  onClick={() => {
                    setScanning(false);
                    setCameraReady(false);
                    setButtonState(undefined);
                  }}
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-gray-900 text-xs px-3 py-1 shadow-lg"
                >
                  Stop
                </Button>
              </div>
            </div>
          </div>
        )}
      </LiveFeedback>

      {/* Result Display */}
      {surveyId && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-bold text-sm">
            Scanned: {surveyId}
          </p>
        </div>
      )}
    </div>
  );
};
