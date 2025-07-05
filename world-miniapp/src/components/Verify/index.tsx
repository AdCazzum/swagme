"use client";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { MiniKit, User, VerificationLevel } from "@worldcoin/minikit-js";
import { useState } from "react";
import { useVerification } from "../../contexts/VerificationContext";

export const Verify = (user: User) => {
  const { isVerified, setIsVerified, setVerificationLevel } = useVerification();
  const [buttonState, setButtonState] = useState<
    "pending" | "success" | "failed" | undefined
  >(undefined);
  const [whichVerification, setWhichVerification] = useState<VerificationLevel>(
    VerificationLevel.Device
  );

  const onClickVerify = async (verificationLevel: VerificationLevel) => {
    setButtonState("pending");
    setWhichVerification(verificationLevel);

    const result = await MiniKit.commandsAsync.verify({
      action: "verify-human",
      verification_level: verificationLevel,
    });

    const response = await fetch("/api/verify-proof", {
      method: "POST",
      body: JSON.stringify({
        payload: result.finalPayload,
        action: "verify-human",
      }),
    });

    const data = await response.json();

    if (data.verifyRes.success) {
      setButtonState("success");
      setIsVerified(true);
      setVerificationLevel(verificationLevel.toString());
      console.log("Verification successful:", user);
    } else {
      setButtonState("failed");
      setTimeout(() => setButtonState(undefined), 2000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Verify</p>
        <div className="flex items-center gap-2">
          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            Step 1: Identity
          </div>
          {isVerified && (
            <div className="flex items-center gap-2 text-green-600 bg-green-100 px-3 py-1 rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>
      <LiveFeedback
        label={{
          failed: "Failed to verify",
          pending: "Verifying",
          success: "Verified",
        }}
        state={
          whichVerification === VerificationLevel.Device
            ? buttonState
            : undefined
        }
        className="w-full"
      >
        <Button
          onClick={() => onClickVerify(VerificationLevel.Device)}
          disabled={buttonState === "pending" || isVerified}
          size="lg"
          variant={isVerified ? "secondary" : "tertiary"}
          className="w-full"
        >
          {isVerified ? "Already Verified" : "Verify"}
        </Button>
      </LiveFeedback>
      {isVerified && (
        <p className="text-xs text-green-600 text-center">
          ✓ Verification complete! You can now scan QR codes to access surveys.
        </p>
      )}
    </div>
  );
};
