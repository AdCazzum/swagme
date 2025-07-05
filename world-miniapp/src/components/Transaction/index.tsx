"use client";

import SwagFormABI from "@/abi/SwagForm.json";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import { MiniKit } from "@worldcoin/minikit-js";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { worldchain } from "viem/chains";

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";
const RESET_DELAY = 3000;

export const Transaction = () => {
  const [buttonState, setButtonState] = useState<
    "pending" | "success" | "failed" | undefined
  >();
  const [whichButton, setWhichButton] = useState<"getToken" | "usePermit2">(
    "getToken"
  );
  const [transactionId, setTransactionId] = useState<string>("");

  const client = createPublicClient({
    chain: worldchain,
    transport: http(RPC_URL),
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
    error,
  } = useWaitForTransactionReceipt({
    client,
    appConfig: {
      app_id: process.env.WLD_CLIENT_ID as `app_${string}`,
    },
    transactionId,
  });

  const resetButtonState = () => {
    setTimeout(() => setButtonState(undefined), RESET_DELAY);
  };

  useEffect(() => {
    if (!transactionId || isConfirming) return;

    if (isConfirmed) {
      console.log("Transaction confirmed!");
      setButtonState("success");
      resetButtonState();
    } else if (isError) {
      console.error("Transaction failed:", error);
      setButtonState("failed");
      resetButtonState();
    }
  }, [isConfirmed, isConfirming, isError, error, transactionId]);

  const onClickGetToken = async () => {
    setTransactionId("");
    setWhichButton("getToken");
    setButtonState("pending");

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESS,
            abi: SwagFormABI,
            functionName: "mintToken",
            args: [],
          },
        ],
      });

      if (finalPayload.status === "success") {
        console.log(
          "Transaction submitted, waiting for confirmation:",
          finalPayload.transaction_id
        );
        setTransactionId(finalPayload.transaction_id);
      } else {
        console.error("Transaction submission failed:", finalPayload);
        setButtonState("failed");
        resetButtonState();
      }
    } catch (err) {
      console.error("Error sending transaction:", err);
      setButtonState("failed");
      resetButtonState();
    }
  };

  const onClickUsePermit2 = async () => {
    setTransactionId("");
    setWhichButton("usePermit2");
    setButtonState("pending");

    const address = (await MiniKit.getUserByUsername("alex")).walletAddress;
    const amount = (0.5 * 10 ** 18).toString();
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000
    ).toString();

    const permitTransfer = {
      permitted: {
        token: CONTRACT_ADDRESS,
        amount,
      },
      nonce: Date.now().toString(),
      deadline,
    };

    const transferDetails = {
      to: address,
      requestedAmount: amount,
    };

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESS,
            abi: SwagFormABI,
            functionName: "signatureTransfer",
            args: [
              [
                [
                  permitTransfer.permitted.token,
                  permitTransfer.permitted.amount,
                ],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              [transferDetails.to, transferDetails.requestedAmount],
              "PERMIT2_SIGNATURE_PLACEHOLDER_0",
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: CONTRACT_ADDRESS,
          },
        ],
      });

      if (finalPayload.status === "success") {
        console.log(
          "Transaction submitted, waiting for confirmation:",
          finalPayload.transaction_id
        );
        setTransactionId(finalPayload.transaction_id);
      } else {
        console.error("Transaction submission failed:", finalPayload);
        setButtonState("failed");
        resetButtonState();
      }
    } catch (err) {
      console.error("Error sending transaction:", err);
      setButtonState("failed");
      resetButtonState();
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Transaction</p>
      <LiveFeedback
        label={{
          failed: "Transaction failed",
          pending: "Transaction pending",
          success: "Transaction successful",
        }}
        state={whichButton === "getToken" ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickGetToken}
          disabled={buttonState === "pending"}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Get Token
        </Button>
      </LiveFeedback>
      <LiveFeedback
        label={{
          failed: "Transaction failed",
          pending: "Transaction pending",
          success: "Transaction successful",
        }}
        state={whichButton === "usePermit2" ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickUsePermit2}
          disabled={buttonState === "pending"}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Use Permit2
        </Button>
      </LiveFeedback>
    </div>
  );
};
