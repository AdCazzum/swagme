"use client";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { OnResultFunction } from "react-qr-reader";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import { SurveyForm } from "../SurveyForm";

const QrScanner = dynamic(() => import("react-qr-reader").then((mod) => mod.QrReader), { ssr: false });

export const Scan = () => {
  const [buttonState, setButtonState] = useState<"pending" | "success" | "failed" | undefined>(undefined);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const { isInstalled } = useMiniKit();

  const requestMicrophonePermission = useCallback(async () => {
    if (!isInstalled) {
      console.log("MiniKit is not installed, skipping permission request");
      return true;
    }
    try {
      console.log("MiniKit detected, proceeding with microphone access");
      setPermissionError(null);
      return true;
    } catch (error: unknown) {
      console.log("Permission check result:", error);
      setPermissionError(null);
      return true;
    }
  }, [isInstalled]);

  const toggleMicrophone = useCallback(async () => {
    if (isMicOn) {
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        setStream(null);
      }
      setIsMicOn(false);
    } else {
      await requestMicrophonePermission();
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(newStream);
        setIsMicOn(true);
        setPermissionError(null);
      } catch (error: unknown) {
        console.error("Error accessing microphone:", error);
        const errorName = (error as { name?: string })?.name;
        if (errorName === "NotAllowedError") {
          setPermissionError("Microphone access denied by browser. Please allow microphone access and try again.");
        } else if (errorName === "NotFoundError") {
          setPermissionError("No microphone found on this device.");
        } else {
          setPermissionError("Failed to access microphone. Please try again.");
        }
      }
    }
  }, [isMicOn, stream, requestMicrophonePermission]);

  const handleScan: OnResultFunction = useCallback((result?: unknown | undefined | null, error?: Error | undefined | null) => {
    if (buttonState === "success" || !scanning) return;

    const text = (result as { getText?: () => string })?.getText?.();
    if (text && text.trim()) {
      console.log("QR Code detected:", text);
      setSurveyId(text);
      setScanning(false);
      setButtonState("success");
      setTimeout(() => {
        setShowSurveyForm(true);
        setButtonState(undefined);
      }, 1500);
      return;
    }

    if (error) {
      console.warn("Scanner error (continuing):", error);
    }
  }, [buttonState, scanning]);

  const startScanning = useCallback(async () => {
    if (scanning) return;

    setScanning(true);
    setButtonState("pending");
    setSurveyId(null);

    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      console.log("Camera permission granted");
    } catch (error) {
      console.error("Camera permission denied:", error);
      setPermissionError("Camera access is required for QR scanning. Please allow camera access.");
      setScanning(false);
      setButtonState("failed");
      return;
    }

    if (!isMicOn) {
      await toggleMicrophone();
    }
  }, [scanning, isMicOn, toggleMicrophone]);

  useEffect(() => {
    const autoEnableMicrophone = async () => {
      if (!isMicOn && !permissionError) {
        await requestMicrophonePermission();
      }
    };
    autoEnableMicrophone();
  }, [isMicOn, permissionError, requestMicrophonePermission]);

  useEffect(() => {
    if (scanning) {
      const timer = setTimeout(() => setCameraReady(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setCameraReady(false);
    }
  }, [scanning]);

  const handleBackToScan = useCallback(() => {
    setShowSurveyForm(false);
    setSurveyId(null);
    setButtonState(undefined);
  }, []);

  if (showSurveyForm && surveyId) {
    return <SurveyForm formId={surveyId} onBack={handleBackToScan} />;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl w-full border-2 border-gray-200 p-4">
      <div className="flex flex-row items-center justify-between">
        <p className="text-lg font-semibold">QR Scanner</p>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Survey Access</div>
      </div>

      {permissionError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Permission Required</h3>
              <div className="mt-2 text-sm text-red-700"><p>{permissionError}</p></div>
            </div>
          </div>
        </div>
      )}

      <LiveFeedback
        label={{ failed: "Failed to scan", pending: "Scanning", success: "Scanned" }}
        state={buttonState}
        className="w-full"
      >
        <Button onClick={startScanning} disabled={buttonState === "pending" || scanning} size="lg" variant="tertiary" className="w-full">
          {scanning ? "Scanning..." : "Scan QR Code"}
        </Button>

        {scanning && (
          <div className="mt-4 w-full">
            <div className="relative bg-black rounded-lg overflow-hidden w-full h-64">
              <div className="absolute inset-0 z-0">
                <QrScanner
                  scanDelay={300}
                  onResult={handleScan}
                  containerStyle={{ width: "100%", height: "100%", position: "relative", borderRadius: "8px" }}
                  videoStyle={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                  constraints={{ facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }}
                />
              </div>

              {!cameraReady && (
                <div className="absolute inset-0 z-10 bg-gray-900 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Starting camera...</p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 z-5 pointer-events-none">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-6 border-2 border-white/80 rounded-xl shadow-lg">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
                </div>
                <div className="absolute top-6 left-6 right-6 bottom-6 overflow-hidden rounded-xl">
                  <div
                    className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"
                    style={{ top: "50%", transform: "translateY(-50%)", boxShadow: "0 0 8px rgba(59, 130, 246, 0.8)" }}
                  ></div>
                </div>
                <div className="absolute bottom-12 left-0 right-0 text-center">
                  <div className="bg-black/60 text-white px-3 py-1 rounded-full mx-auto inline-block text-xs">
                    Position the QR code in the frame
                  </div>
                </div>
              </div>

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

      {surveyId && !showSurveyForm && (
        <div className="mt-2 space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-bold text-sm">QR Code Scanned: {surveyId}</p>
          </div>
          <Button onClick={() => setShowSurveyForm(true)} size="lg" variant="primary" className="w-full">
            Open Survey
          </Button>
        </div>
      )}
    </div>
  );
};
