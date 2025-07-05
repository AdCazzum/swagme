"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Webcam from "react-webcam";
import { OnResultFunction } from "react-qr-reader";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";

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
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: cameraMode,
  };

  const toggleMicrophone = useCallback(async () => {
    if (isMicOn) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setIsMicOn(false);
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(newStream);
        setIsMicOn(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  }, [isMicOn, stream]);

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
