import { createPublicClient, http, defineChain } from "viem";
import SwagFormABI from "../abi/SwagForm.json";
import { MiniKit } from "@worldcoin/minikit-js";

const CHAIN_CONFIG = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || ""),
  name: "World Chain",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL,
};

export const sepoliaWorld = defineChain({
  id: CHAIN_CONFIG.id,
  name: CHAIN_CONFIG.name,
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: [CHAIN_CONFIG.rpcUrl || ""] } },
  blockExplorers: {
    default: { name: "Worldscan", url: CHAIN_CONFIG.explorerUrl || "" },
  },
  testnet: true,
});

export const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const publicClient = createPublicClient({
  chain: sepoliaWorld,
  transport: http(),
});

export interface FormQuestion {
  questionText: string;
  isRequired: boolean;
}

export interface FormInfo {
  title: string;
  description: string;
  questionsCount: bigint;
  isActive: boolean;
  totalSubmissions: bigint;
  createdAt: bigint;
  creator: string;
}

export interface FormSubmission {
  formId: string;
  username: string;
  email: string;
  answers: string[];
}

export class ContractError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "ContractError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const validateFormId = (formId: string): void => {
  if (!formId?.trim() || isNaN(Number(formId))) {
    throw new ValidationError("Valid form ID is required");
  }
};

const validateSubmission = ({
  formId,
  username,
  email,
  answers,
}: FormSubmission): void => {
  if (!formId?.trim()) throw new ValidationError("Form ID is required");
  if (!username?.trim()) throw new ValidationError("Username is required");
  if (!email?.trim()) throw new ValidationError("Email is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ValidationError("Invalid email format");
  if (!Array.isArray(answers) || answers.length === 0)
    throw new ValidationError("At least one answer is required");
};

export const getFormQuestions = async (
  formId: string
): Promise<FormQuestion[]> => {
  validateFormId(formId);
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: SwagFormABI,
      functionName: "getFormQuestions",
      args: [BigInt(formId)],
    });
    return result as FormQuestion[];
  } catch (error) {
    console.error("Error retrieving questions:", error);
    throw new ContractError("Unable to retrieve form questions");
  }
};

export const getFormInfo = async (formId: string): Promise<FormInfo> => {
  validateFormId(formId);
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: SwagFormABI,
      functionName: "getForm",
      args: [BigInt(formId)],
    });
    const [
      title,
      description,
      questionsCount,
      isActive,
      totalSubmissions,
      createdAt,
      creator,
    ] = result as [string, string, bigint, boolean, bigint, bigint, string];
    return {
      title,
      description,
      questionsCount,
      isActive,
      totalSubmissions,
      createdAt,
      creator,
    };
  } catch (error) {
    console.error("Error retrieving form information:", error);
    throw new ContractError("Unable to retrieve form information");
  }
};

const getErrorMessage = (errorCode?: string): string => {
  const errorMap: Record<string, string> = {
    invalid_contract: "Contract not found or invalid on this network",
    user_rejected: "Transaction rejected by user",
    insufficient_funds:
      "Insufficient funds for transaction. Please add ETH to your wallet",
    network_error: "Network error. Please check your connection and try again",
    connection_error:
      "Network error. Please check your connection and try again",
    invalid_input:
      "Invalid transaction parameters. Please check your input data",
    invalid_parameter:
      "Invalid transaction parameters. Please check your input data",
  };
  return errorMap[errorCode || ""] || errorCode || "Unknown transaction error";
};

export const submitFormToContract = async (
  submission: FormSubmission
): Promise<string> => {
  validateSubmission(submission);

  if (!MiniKit.isInstalled()) {
    throw new ContractError(
      "World App is not installed or user is not authenticated"
    );
  }

  const { formId, username, email, answers } = submission;
  const cleanAnswers = answers
    .map((answer) => String(answer).trim())
    .filter((answer) => answer.length > 0);

  if (cleanAnswers.length === 0) {
    throw new ValidationError("At least one non-empty answer is required");
  }

  try {
    const transactionResult = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: CONTRACT_ADDRESS,
          abi: SwagFormABI.filter((item) => item.name === "submitForm"),
          functionName: "submitForm",
          args: [BigInt(formId), username.trim(), email.trim(), cleanAnswers],
        },
      ],
    });

    const { finalPayload } = transactionResult;

    if (finalPayload.status === "error") {
      throw new ContractError(
        getErrorMessage(finalPayload.error_code),
        finalPayload.error_code
      );
    }

    if (!finalPayload.transaction_id) {
      throw new ContractError("No transaction ID received");
    }

    console.log("Transaction submitted:", finalPayload.transaction_id);
    return finalPayload.transaction_id;
  } catch (error) {
    console.error("Error submitting form:", error);
    if (error instanceof ValidationError || error instanceof ContractError)
      throw error;
    throw new ContractError(
      error instanceof Error
        ? error.message
        : "Failed to submit form to contract"
    );
  }
};

export const hasUserSubmitted = async (
  formId: string,
  userAddress: string
): Promise<boolean> => {
  validateFormId(formId);
  if (!userAddress?.startsWith("0x")) {
    throw new ValidationError("Invalid user address format");
  }
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: SwagFormABI,
      functionName: "hasSubmitted",
      args: [BigInt(formId), userAddress as `0x${string}`],
    });
    return result as boolean;
  } catch (error) {
    console.error("Error checking submission status:", error);
    return false;
  }
};

export const isMiniKitAvailable = (): boolean => {
  try {
    return typeof MiniKit !== "undefined" && MiniKit.isInstalled();
  } catch {
    return false;
  }
};

export const getExplorerUrl = (transactionHash: string): string =>
  `${CHAIN_CONFIG.explorerUrl}/tx/${transactionHash}`;

export const verifyContractExists = async (): Promise<boolean> => {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: SwagFormABI,
      functionName: "totalForms",
      args: [],
    });
    console.log("Contract verification successful. Total forms:", result);
    return true;
  } catch (error) {
    console.error("Contract verification failed:", error);
    return false;
  }
};
