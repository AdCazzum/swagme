import { createPublicClient, http } from "viem";
import { defineChain } from "viem";
import TestContractABI from "../abi/TestContract.json";
import { MiniKit } from "@worldcoin/minikit-js";

// Constants
const WORLD_CHAIN_SEPOLIA_ID = 4801; // World Chain Sepolia ID
const WORLD_CHAIN_SEPOLIA_RPC_URL =
  "https://worldchain-sepolia.g.alchemy.com/public";
const WORLD_CHAIN_SEPOLIA_EXPLORER_URL =
  "https://worldchain-sepolia.explorer.alchemy.com";

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

// Client for reading from contract
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

export interface TransactionResult {
  transactionId: string;
  status: "success" | "error";
  errorCode?: string;
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

  // Check if formId is a valid number
  if (isNaN(Number(formId))) {
    throw new ValidationError("Form ID must be a valid number");
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

// Function to submit form answers to the smart contract using MiniKit
export async function submitFormToContract(
  submission: FormSubmission
): Promise<string> {
  try {
    console.log("Submitting form with data:", submission);

    // Check if MiniKit is available
    if (!isMiniKitAvailable()) {
      throw new ContractError("MiniKit is not available");
    }

    // Check if user is authenticated (optional but recommended)
    try {
      // MiniKit automatically handles authentication
      // We can check if the app is installed which indicates user is logged in
      const isInstalled = MiniKit.isInstalled();
      console.log("MiniKit installation status:", isInstalled);

      if (!isInstalled) {
        throw new ContractError(
          "World App is not installed or user is not authenticated"
        );
      }
    } catch (authError) {
      console.log("Could not check MiniKit status:", authError);
      // Continue anyway - MiniKit will handle authentication during transaction
    }

    // Validate and prepare transaction parameters
    const {
      formIdBigInt,
      username,
      email,
      answers: cleanAnswers,
    } = prepareTransactionParams(submission);

    // Ensure contract address is in correct format (checksum)
    const contractAddress = CONTRACT_ADDRESS;
    console.log("Using contract address:", contractAddress);
    console.log("Active Chain ID:", WORLD_CHAIN_SEPOLIA_ID);
    console.log("Chain configured for Sepolia testnet");

    // First, let's verify the contract exists
    const contractExists = await verifyContractExists();
    if (!contractExists) {
      throw new ContractError(
        "Contract not found on the network. Please verify the contract address and network."
      );
    }

    // Prepare transaction parameters with proper formatting for MiniKit
    const transactionParams = {
      transaction: [
        {
          address: contractAddress,
          abi: TestContractABI,
          functionName: "submitForm",
          args: [
            formIdBigInt.toString(), // Converti BigInt in stringa per MiniKit
            username,
            email,
            cleanAnswers,
          ],
        },
      ],
      // Aggiungi parametri di rete espliciti per Sepolia World
      chainId: WORLD_CHAIN_SEPOLIA_ID,
    };

    console.log(
      "Transaction parameters:",
      JSON.stringify(
        {
          ...transactionParams,
          transaction: [
            {
              ...transactionParams.transaction[0],
              args: [
                `BigInt(${formIdBigInt.toString()})`,
                username,
                email,
                `Array[${cleanAnswers.length}]`,
              ],
            },
          ],
        },
        null,
        2
      )
    );

    console.log(
      "🔄 Sending transaction via MiniKit - user will be prompted for confirmation and gas fees..."
    );

    // Use MiniKit to send transaction
    // This will automatically:
    // 1. Prompt user for authentication if needed
    // 2. Show transaction details and gas fees
    // 3. Ask for user confirmation
    // 4. Handle the transaction submission
    const response = await MiniKit.commandsAsync.sendTransaction(
      transactionParams
    );

    console.log("MiniKit response:", response);

    const { finalPayload } = response;

    // Check if the transaction was successful
    if (finalPayload.status === "error") {
      console.error("Transaction failed:", finalPayload);

      // Provide more specific error messages based on error code
      let errorMessage = "Transaction failed";
      if (finalPayload.error_code === "invalid_contract") {
        errorMessage =
          "Contract not found or invalid on this network. Please verify the contract address and network.";
      } else if (finalPayload.error_code === "user_rejected") {
        errorMessage = "Transaction rejected by user";
      } else if (
        finalPayload.error_code?.includes("funds") ||
        finalPayload.error_code?.includes("balance")
      ) {
        errorMessage =
          "Insufficient funds for transaction. Please add ETH to your World App wallet.";
      } else if (
        finalPayload.error_code?.includes("network") ||
        finalPayload.error_code?.includes("connection")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (
        finalPayload.error_code?.includes("input") ||
        finalPayload.error_code?.includes("parameter")
      ) {
        errorMessage =
          "Invalid transaction parameters. Please check your input data.";
      } else {
        errorMessage = finalPayload.error_code || "Unknown transaction error";
      }

      throw new ContractError(errorMessage, finalPayload.error_code);
    }

    if (!finalPayload.transaction_id) {
      throw new ContractError("No transaction ID received");
    }

    console.log(
      "Form submitted successfully with transaction ID:",
      finalPayload.transaction_id
    );
    return finalPayload.transaction_id;
  } catch (error) {
    console.error("Error submitting form to contract:", error);

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

// Function to verify contract exists on the chain
export async function verifyContractExists(): Promise<boolean> {
  try {
    // Try to call a simple read function to verify contract exists
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

// Function to get contract code (verify deployment)
export async function getContractCode(): Promise<string | null> {
  try {
    const code = await publicClient.getBytecode({
      address: CONTRACT_ADDRESS,
    });

    console.log("Contract bytecode length:", code?.length || 0);
    return code || null;
  } catch (error) {
    console.error("Error getting contract code:", error);
    return null;
  }
}

// Debug function to check contract and network status
export async function debugContractStatus(): Promise<{
  contractExists: boolean;
  contractCode: string | null;
  networkConnected: boolean;
  miniKitAvailable: boolean;
}> {
  const contractExists = await verifyContractExists();
  const contractCode = await getContractCode();
  const miniKitAvailable = isMiniKitAvailable();

  let networkConnected = true;
  try {
    await publicClient.getBlockNumber();
  } catch (error) {
    console.error("Network connection failed:", error);
    networkConnected = false;
  }

  const status = {
    contractExists,
    contractCode,
    networkConnected,
    miniKitAvailable,
  };

  console.log("Contract debug status:", status);
  return status;
}

// Test function to be called from the UI for debugging
export async function testContractConnection(): Promise<void> {
  console.log("=== Contract Connection Test ===");
  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("Network: World Chain Sepolia");
  console.log("Chain ID:", WORLD_CHAIN_SEPOLIA_ID);
  console.log("RPC URL:", WORLD_CHAIN_SEPOLIA_RPC_URL);

  const status = await debugContractStatus();
  const balanceInfo = await checkUserBalance();

  if (!status.miniKitAvailable) {
    console.error("❌ MiniKit is not available");
    console.log("Make sure you're running this inside World App");
    return;
  }

  if (!status.networkConnected) {
    console.error("❌ Network connection failed");
    console.log("Check your internet connection and try again");
    return;
  }

  if (!status.contractExists) {
    console.error("❌ Contract does not exist on this network");
    console.log(
      "Verify contract deployment at:",
      `${WORLD_CHAIN_SEPOLIA_EXPLORER_URL}/address/${CONTRACT_ADDRESS}`
    );

    // Prova a verificare su altri network comuni per debug
    console.log("Debugging: Checking if contract exists on other networks...");
    try {
      const mainnetClient = createPublicClient({
        chain: {
          id: 1,
          name: "Ethereum",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: ["https://eth.llamarpc.com"] } },
        },
        transport: http(),
      });
      const mainnetCode = await mainnetClient.getBytecode({
        address: CONTRACT_ADDRESS,
      });
      if (mainnetCode && mainnetCode !== "0x") {
        console.log(
          "⚠️  Contract found on Ethereum Mainnet, but we need Sepolia World"
        );
      }
    } catch {
      console.log("Contract not found on Ethereum Mainnet either");
    }
    return;
  }

  console.log("✅ All checks passed!");
  console.log("Contract bytecode length:", status.contractCode?.length || 0);
  console.log("Balance status:", balanceInfo);
  console.log("📝 Ready to submit transactions!");

  // Test a simple read operation
  try {
    console.log("Testing contract read operations...");
    const totalForms = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TestContractABI,
      functionName: "totalForms",
      args: [],
    });
    console.log("✅ Contract read test successful. Total forms:", totalForms);
  } catch (error) {
    console.error("❌ Contract read test failed:", error);
  }
}

// Enhanced MiniKit diagnostic function
export async function diagnoseMiniKitIssues(): Promise<{
  miniKitInstalled: boolean;
  worldAppDetected: boolean;
  networkSupported: boolean;
  contractReachable: boolean;
  suggestedActions: string[];
}> {
  const diagnostics = {
    miniKitInstalled: false,
    worldAppDetected: false,
    networkSupported: false,
    contractReachable: false,
    suggestedActions: [] as string[],
  };

  try {
    // Test 1: MiniKit Installation
    diagnostics.miniKitInstalled = typeof MiniKit !== "undefined";
    if (!diagnostics.miniKitInstalled) {
      diagnostics.suggestedActions.push(
        "Ensure MiniKit SDK is properly imported and initialized"
      );
      return diagnostics;
    }

    // Test 2: World App Detection
    try {
      diagnostics.worldAppDetected = MiniKit.isInstalled();
      if (!diagnostics.worldAppDetected) {
        diagnostics.suggestedActions.push(
          "Open this app inside World App to access MiniKit features"
        );
      }
    } catch {
      diagnostics.suggestedActions.push(
        "Could not detect World App - ensure you're running inside World App"
      );
    }

    // Test 3: Network Support
    try {
      const blockNumber = await publicClient.getBlockNumber();
      diagnostics.networkSupported = Number(blockNumber) > 0;
      if (!diagnostics.networkSupported) {
        diagnostics.suggestedActions.push(
          "World Chain Sepolia network is not responding"
        );
      }
    } catch {
      diagnostics.suggestedActions.push(
        "Network connection failed - check internet connection"
      );
    }

    // Test 4: Contract Reachability
    try {
      const contractExists = await verifyContractExists();
      diagnostics.contractReachable = contractExists;
      if (!diagnostics.contractReachable) {
        diagnostics.suggestedActions.push(
          `Contract ${CONTRACT_ADDRESS} not found on World Chain Sepolia`
        );
        diagnostics.suggestedActions.push(
          `Verify deployment at: ${WORLD_CHAIN_SEPOLIA_EXPLORER_URL}/address/${CONTRACT_ADDRESS}`
        );
      }
    } catch {
      diagnostics.suggestedActions.push(
        "Could not reach contract - verify address and network"
      );
    }

    // Success case
    if (
      diagnostics.miniKitInstalled &&
      diagnostics.worldAppDetected &&
      diagnostics.networkSupported &&
      diagnostics.contractReachable
    ) {
      diagnostics.suggestedActions.push(
        "✅ All systems ready for transactions!"
      );
    }
  } catch (error) {
    diagnostics.suggestedActions.push(
      `Unexpected error during diagnostics: ${error}`
    );
  }

  return diagnostics;
}

// Utility function to format transaction result
export function formatTransactionResult(
  transactionId: string,
  status: "success" | "error",
  errorCode?: string
): TransactionResult {
  return {
    transactionId,
    status,
    errorCode,
  };
}

// Helper function to check if MiniKit is available
export function isMiniKitAvailable(): boolean {
  try {
    return typeof MiniKit !== "undefined" && MiniKit.isInstalled();
  } catch {
    return false;
  }
}

// Function to check if user has sufficient balance for transaction
export async function checkUserBalance(): Promise<{
  hasBalance: boolean;
  balance: string;
  formattedBalance: string;
}> {
  try {
    // Get the current user's address (if available)
    // Note: MiniKit might not expose the user address directly for privacy
    // But we can still check general network status

    const blockNumber = await publicClient.getBlockNumber();
    console.log("Current block number:", blockNumber);

    // For privacy reasons, MiniKit doesn't expose user address
    // The balance check will happen automatically during transaction
    return {
      hasBalance: true, // Assume true, MiniKit will handle insufficient funds
      balance: "unknown", // Cannot check specific balance for privacy
      formattedBalance: "Will be checked during transaction",
    };
  } catch (error) {
    console.error("Error checking network status:", error);
    return {
      hasBalance: false,
      balance: "error",
      formattedBalance: "Network error",
    };
  }
}

// Function to validate and prepare transaction parameters
function prepareTransactionParams(submission: FormSubmission) {
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

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ValidationError("At least one answer is required");
  }

  // Assicuriamoci che tutti i parametri siano del tipo corretto
  const formIdBigInt = BigInt(formId);

  // Validazione stringa per username ed email
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  // Validazione array answers
  const cleanAnswers = answers
    .map((answer) =>
      typeof answer === "string" ? answer.trim() : String(answer)
    )
    .filter((answer) => answer.length > 0);

  if (cleanAnswers.length === 0) {
    throw new ValidationError("At least one non-empty answer is required");
  }

  console.log("Prepared transaction data:", {
    formId: formIdBigInt.toString(),
    username: cleanUsername,
    email: cleanEmail,
    answersCount: cleanAnswers.length,
  });

  return {
    formIdBigInt,
    username: cleanUsername,
    email: cleanEmail,
    answers: cleanAnswers,
  };
}

// Test transaction with sample data
export async function testTransactionWithSampleData(): Promise<void> {
  console.log("=== Testing Transaction with Sample Data ===");

  // Run diagnostics first
  const diagnostics = await diagnoseMiniKitIssues();
  console.log("Diagnostics:", diagnostics);

  if (diagnostics.suggestedActions.length > 0) {
    console.log("Issues found:", diagnostics.suggestedActions);
    if (
      !diagnostics.miniKitInstalled ||
      !diagnostics.worldAppDetected ||
      !diagnostics.contractReachable
    ) {
      console.log(
        "❌ Cannot proceed with test transaction due to critical issues"
      );
      return;
    }
  }

  // Create sample submission data
  const sampleSubmission: FormSubmission = {
    formId: "1", // Test with form ID 1
    username: "testuser",
    email: "test@example.com",
    answers: ["Sample answer 1", "Sample answer 2", "Sample answer 3"],
  };

  console.log("🧪 Testing with sample data:", sampleSubmission);

  try {
    const transactionId = await submitFormToContract(sampleSubmission);
    console.log("✅ Test transaction successful!");
    console.log("Transaction ID:", transactionId);
    console.log(
      "View on explorer:",
      `${WORLD_CHAIN_SEPOLIA_EXPLORER_URL}/tx/${transactionId}`
    );
  } catch (error) {
    console.error("❌ Test transaction failed:", error);

    if (error instanceof ContractError) {
      console.log("This is a contract-specific error. Check:");
      console.log("1. Contract address and network");
      console.log("2. Form ID exists and is active");
      console.log("3. User hasn't already submitted to this form");
    } else if (error instanceof ValidationError) {
      console.log("This is a validation error. Check input data format.");
    } else {
      console.log("This might be a MiniKit or network issue.");
    }
  }
}
