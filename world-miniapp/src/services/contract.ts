import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import TestContractABI from "../abi/TestContract.json";
import { MiniKit } from "@worldcoin/minikit-js";

// Constants
const WORLD_CHAIN_SEPOLIA_ID = 4801;
const WORLD_CHAIN_SEPOLIA_RPC_URL =
  "https://worldchain-sepolia.g.alchemy.com/public";
const WORLD_CHAIN_SEPOLIA_EXPLORER_URL = "https://sepolia.worldscan.org";

// World Chain Sepolia definition
export const sepoliaWorld = defineChain({
  id: WORLD_CHAIN_SEPOLIA_ID,
  name: "World Chain Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [WORLD_CHAIN_SEPOLIA_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "World Chain Explorer",
      url: WORLD_CHAIN_SEPOLIA_EXPLORER_URL,
    },
  },
  testnet: true,
});

// Contract configuration
export const CONTRACT_ADDRESS =
  "0xC22820E58D27094941Ce5B85BeE65a4351c9B26c" as const;

// Client per leggere dal contratto
export const publicClient = createPublicClient({
  chain: sepoliaWorld,
  transport: http(),
});

// Types
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

// Error classes
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

// Validation utilities
function validateFormId(formId: string): void {
  if (!formId || formId.trim() === "") {
    throw new ValidationError("Form ID is required");
  }
  if (isNaN(Number(formId))) {
    throw new ValidationError("Form ID must be a valid number");
  }
}

function validateSubmission(submission: FormSubmission): void {
  const { formId, username, email, answers } = submission;

  if (!formId?.trim()) {
    throw new ValidationError("Form ID is required");
  }
  if (!username?.trim()) {
    throw new ValidationError("Username is required");
  }
  if (!email?.trim()) {
    throw new ValidationError("Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ValidationError("At least one answer is required");
  }
}

// Function to get form questions
export async function getFormQuestions(
  formId: string
): Promise<FormQuestion[]> {
  try {
    validateFormId(formId);

    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TestContractABI,
      functionName: "getFormQuestions",
      args: [BigInt(formId)],
    });

    return result as FormQuestion[];
  } catch (error) {
    console.error("Error retrieving questions:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ContractError("Unable to retrieve form questions");
  }
}

// Function to get form information
export async function getFormInfo(formId: string): Promise<FormInfo> {
  try {
    validateFormId(formId);

    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TestContractABI,
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
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ContractError("Unable to retrieve form information");
  }
}

// Simplified submit function - returns transaction_id for use with useWaitForTransactionReceipt hook
export async function submitFormToContract(
  submission: FormSubmission
): Promise<string> {
  try {
    console.log("Submitting form:", submission);

    // Validate input
    validateSubmission(submission);

    // Check MiniKit availability
    if (!MiniKit.isInstalled()) {
      throw new ContractError(
        "World App is not installed or user is not authenticated"
      );
    }

    // Prepare transaction parameters
    const { formId, username, email, answers } = submission;
    const cleanAnswers = answers
      .map((answer) => String(answer).trim())
      .filter((answer) => answer.length > 0);

    if (cleanAnswers.length === 0) {
      throw new ValidationError("At least one non-empty answer is required");
    }

    // Send transaction using MiniKit
    const transactionResult = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: CONTRACT_ADDRESS,
          abi: TestContractABI,
          functionName: "submitForm",

          args: [BigInt(formId), username.trim(), email.trim(), cleanAnswers],
        },
      ],
    });
    const { finalPayload } = transactionResult;

    console.log("******************");
    console.log("Transaction result:", transactionResult);
    console.log("******************");

    // Check for errors
    if (finalPayload.status === "error") {
      const errorMessage = getErrorMessage(finalPayload.error_code);
      throw new ContractError(errorMessage, finalPayload.error_code);
    }

    if (!finalPayload.transaction_id) {
      throw new ContractError("No transaction ID received");
    }

    console.log(
      "Transaction submitted successfully:",
      finalPayload.transaction_id
    );
    return finalPayload.transaction_id;
  } catch (error) {
    console.error("Error submitting form:", error);

    if (error instanceof ValidationError || error instanceof ContractError) {
      throw error;
    }

    throw new ContractError(
      error instanceof Error
        ? error.message
        : "Failed to submit form to contract"
    );
  }
}

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode?: string): string {
  if (!errorCode) return "Unknown transaction error";

  switch (errorCode) {
    case "invalid_contract":
      return "Contract not found or invalid on this network";
    case "user_rejected":
      return "Transaction rejected by user";
    case "insufficient_funds":
      return "Insufficient funds for transaction. Please add ETH to your wallet";
    case "network_error":
    case "connection_error":
      return "Network error. Please check your connection and try again";
    case "invalid_input":
    case "invalid_parameter":
      return "Invalid transaction parameters. Please check your input data";
    default:
      return errorCode;
  }
}

// Function to check if user has already submitted a form
export async function hasUserSubmitted(
  formId: string,
  userAddress: string
): Promise<boolean> {
  try {
    validateFormId(formId);

    if (!userAddress || !userAddress.startsWith("0x")) {
      throw new ValidationError("Invalid user address format");
    }

    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TestContractABI,
      functionName: "hasSubmitted",
      args: [BigInt(formId), userAddress as `0x${string}`],
    });

    return result as boolean;
  } catch (error) {
    console.error("Error checking submission status:", error);
    if (error instanceof ValidationError) {
      throw error;
    }
    // Return false for read operations that fail
    return false;
  }
}

// Utility to check if MiniKit is available
export function isMiniKitAvailable(): boolean {
  try {
    return typeof MiniKit !== "undefined" && MiniKit.isInstalled();
  } catch {
    return false;
  }
}

// Utility to get explorer URL for a transaction hash
export function getExplorerUrl(transactionHash: string): string {
  return `${WORLD_CHAIN_SEPOLIA_EXPLORER_URL}/tx/${transactionHash}`;
}

// Debug function to verify contract exists
export async function verifyContractExists(): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TestContractABI,
      functionName: "totalForms",
      args: [],
    });
    console.log("Contract verification successful. Total forms:", result);
    return true;
  } catch (error) {
    console.error("Contract verification failed:", error);
    return false;
  }
}
