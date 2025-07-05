import { useState } from "react";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import {
  submitFormToContract,
  publicClient,
  FormSubmission,
} from "../services/contract";

export function useSubmitForm() {
  const [transactionId, setTransactionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hook per aspettare la conferma della transazione
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    client: publicClient,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_APP_ID!,
    },
    transactionId: transactionId,
  });

  const submitForm = async (formData: FormSubmission) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Invia la transazione e ottieni il transaction ID
      const txId = await submitFormToContract(formData);
      setTransactionId(txId);

      console.log("Transaction submitted:", txId);

      return txId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Submit failed";
      setSubmitError(errorMessage);
      console.error("Submit failed:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setTransactionId("");
    setIsSubmitting(false);
    setSubmitError(null);
  };

  return {
    // Actions
    submitForm,
    reset,

    // State
    transactionId,
    isSubmitting,
    submitError,

    // Transaction confirmation state
    isConfirming,
    isConfirmed,
    isConfirmError,
    confirmError,

    // Computed states
    isLoading: isSubmitting || isConfirming,
    isSuccess: isConfirmed,
    hasError: !!submitError || isConfirmError,
    errorMessage: submitError || confirmError?.message,
  };
}
