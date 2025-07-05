"use client";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { MiniKit, User, VerificationLevel } from "@worldcoin/minikit-js";
import { useState } from "react";

export const Verify = (user: User) => {
  const [buttonState, setButtonState] = useState<"pending" | "success" | "failed" | undefined>(undefined);
  const [whichVerification, setWhichVerification] = useState<VerificationLevel>(VerificationLevel.Device);

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
      console.log(user);
    } else {
      setButtonState("failed");
      setTimeout(() => setButtonState(undefined), 2000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Verify</p>
      <LiveFeedback
        label={{ failed: "Failed to verify", pending: "Verifying", success: "Verified" }}
        state={whichVerification === VerificationLevel.Device ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={() => onClickVerify(VerificationLevel.Device)}
          disabled={buttonState === "pending"}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Verify
        </Button>
      </LiveFeedback>
    </div>
  );
};
