"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Webcam from "react-webcam";
import { OnResultFunction } from "react-qr-reader";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';

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
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraMode] = useState<"environment" | "user">("environment");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const { isInstalled } = useMiniKit();

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: cameraMode,
  };

  const requestMicrophonePermission = useCallback(async () => {
    if (!isInstalled) {
      console.error('MiniKit is not installed');
      return false;
    }

    try {
      // Request permission from MiniKit first
      const permissionResult = await MiniKit.commandsAsync.requestPermission({
        permission: 'microphone'
      });

      if (permissionResult.finalPayload.status === 'success') {
        console.log('Permission granted by MiniKit');
        setPermissionError(null);
        return true;
      } else {
        console.error('Permission denied by MiniKit:', permissionResult.finalPayload);
        setPermissionError('Permission denied. Please allow microphone access in the app settings.');
        return false;
      }
    } catch (error: any) {
      console.error('Error requesting permission:', error);
      
      if (error.code === 'world_app_permission_not_enabled' || error.code === 'permission_disabled') {
        setPermissionError(
          'Please enable microphone access for World App in your device settings first, then try again.'
        );
      } else {
        setPermissionError('Failed to request microphone permission. Please try again.');
      }
      return false;
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
      // First request permission from MiniKit
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        return;
      }

      // Then request browser permission
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(newStream);
        setIsMicOn(true);
        setPermissionError(null);
      } catch (error: any) {
        console.error('Error accessing microphone:', error);
        
        if (error.name === 'NotAllowedError') {
          setPermissionError('Microphone access denied by browser. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('No microphone found on this device.');
        } else {
          setPermissionError('Failed to access microphone. Please try again.');
        }
      }
    }
  }, [isMicOn, stream, requestMicrophonePermission]);

  const capturePhoto = useCallback(async () => {
    console.log(webcamRef);

    if (!webcamRef.current) {
      throw new Error("Failed to access webcam");
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      throw new Error("Failed to capture image");
    }

    const img = new Image();

    img.src = imageSrc;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to load captured image"));
    });
  }, []);

  const handleScan: OnResultFunction = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any | undefined | null,
    error?: Error | undefined | null
  ) => {
    setButtonState("pending");

    const text = result?.getText();

    if (text) {
      setSurveyId(text);
      setScanning(false);
      setButtonState("success");

      console.log("Survey ID", text);
    }

    if (error) {
      setButtonState("failed");
      setTimeout(() => {
        setButtonState(undefined);
      }, 2000);

      console.error("Error scanning QR code:", error);
    }

    await toggleMicrophone();
  };

  useEffect(() => {
    if (scanning && webcamRef.current) {
      const interval = setInterval(() => {
        if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
          capturePhoto();
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [scanning, capturePhoto]);

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Scan</p>
      
      {/* Permission Error Display */}
      {permissionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Microphone Permission Required
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{permissionError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Microphone Toggle Button */}
      <Button
        onClick={toggleMicrophone}
        size="sm"
        variant={isMicOn ? "secondary" : "primary"}
        className="w-full mb-2"
      >
        {isMicOn ? "🎤 Microphone On" : "🎤 Enable Microphone"}
      </Button>

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
          onClick={() => {
            setScanning(true);
          }}
          disabled={buttonState === "pending"}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Scan QR Code
        </Button>
        {scanning && (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
        )}
        {/* {scanning && (
          <div className="mt-2">
            <QrScanner
              scanDelay={300}
              onResult={handleScan}
              containerStyle={{ width: "250px" }}
              constraints={{ facingMode: "environment" }}
            />
          </div>
        )}
        {surveyId && (
          <div className="mt-2 text-green-700 font-bold">{surveyId}</div>
        )} */}
      </LiveFeedback>
    </div>
  );
};
