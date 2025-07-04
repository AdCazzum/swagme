"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
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

  const handleScan: OnResultFunction = (
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

      // Reset the button state after 3 seconds
      setTimeout(() => {
        setButtonState(undefined);
      }, 2000);

      console.error("Error scanning QR code:", error);
    }
  };

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
          onClick={() => setScanning(true)}
          disabled={buttonState === "pending"}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Scan QR Code
        </Button>
        {scanning && (
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
        )}
      </LiveFeedback>
    </div>
  );
};
