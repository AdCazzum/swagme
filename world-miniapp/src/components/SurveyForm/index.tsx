"use client";
import React, { useEffect, useState } from "react";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import {
  getFormQuestions,
  getFormInfo,
  FormQuestion,
  FormInfo,
  ContractError,
  ValidationError,
} from "../../services/contract";
import { useSubmitForm } from "../../hooks/useSubmitForm";

interface SurveyFormProps {
  formId: string;
  onBack: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({ formId, onBack }) => {
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    submitForm,
    transactionId,
    isLoading: isSubmitting,
    isConfirming,
    isConfirmed,
    hasError,
    errorMessage,
    reset: resetSubmit,
  } = useSubmitForm();

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [info, questionsData] = await Promise.all([
          getFormInfo(formId),
          getFormQuestions(formId),
        ]);

        setFormInfo(info);
        setQuestions(questionsData);
        setAnswers(new Array(questionsData.length).fill(""));
      } catch (err) {
        console.error("Error loading form:", err);
        let errorMessage = "Error loading form";
        if (err instanceof ValidationError || err instanceof ContractError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (formId) loadFormData();
  }, [formId]);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const validateForm = (): boolean => {
    if (!username.trim() || !email.trim() || !email.includes("@")) return false;

    return questions.every(
      (question, i) =>
        !question.isRequired || (answers[i] && answers[i].trim() !== "")
    );
  };
  const handleSubmit = async () => {
    if (!validateForm()) {
      if (!username.trim()) {
        setError("Please enter your username");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }
      setError("Please complete all required questions");
      return;
    }

    try {
      setError(null);
      resetSubmit();
      const txId = await submitForm({
        formId,
        username,
        email,
        answers: answers.filter((answer) => answer.trim() !== ""),
      });
      console.log("Transaction submitted:", txId);
    } catch (err) {
      console.error("Error submitting form:", err);
      let errorMessage = "Error submitting answers. Please try again.";
      if (err instanceof ValidationError) {
        errorMessage = err.message;
      } else if (err instanceof ContractError) {
        errorMessage = `Contract error: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      const timer = setTimeout(() => {
        onBack();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, onBack]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 rounded-xl w-full border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Loading Survey...</p>
          <Button onClick={onBack} variant="tertiary" size="sm">
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && !formInfo) {
    return (
      <div className="flex flex-col gap-4 rounded-xl w-full border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Error</p>
          <Button onClick={onBack} variant="tertiary" size="sm">
            Back
          </Button>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Loading Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl w-full border-2 border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Survey</p>
        <Button onClick={onBack} variant="tertiary" size="sm">
          Back
        </Button>
      </div>

      {formInfo && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h2 className="text-xl font-bold text-blue-900 mb-2">
            {formInfo.title}
          </h2>
          {formInfo.description && (
            <p className="text-blue-700 mb-3">{formInfo.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-blue-600">
            <span>📝 {questions.length} questions</span>
            <span>📊 {formInfo.totalSubmissions.toString()} responses</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                formInfo.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {formInfo.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Your Information</h3>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting || isConfirming}
            required
          />
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting || isConfirming}
            required
          />
        </div>
      </div>

      {(isSubmitting || isConfirming || isConfirmed || transactionId) && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0">
              {isSubmitting || isConfirming ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              ) : isConfirmed ? (
                <svg
                  className="h-5 w-5 text-green-500"
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
              ) : (
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <h3 className="text-sm font-medium text-blue-800">
              {isSubmitting
                ? "Submitting Transaction..."
                : isConfirming
                ? "Waiting for Confirmation..."
                : isConfirmed
                ? "Transaction Confirmed!"
                : "Transaction Submitted"}
            </h3>
          </div>
          <p className="text-sm text-blue-700 mb-2">
            {isSubmitting
              ? "Please confirm the transaction in World App"
              : isConfirming
              ? "Transaction is being confirmed on blockchain..."
              : isConfirmed
              ? "Your survey response has been recorded on blockchain!"
              : "Transaction ID received"}
          </p>
          {transactionId && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-1">
                Transaction ID:
              </p>
              <p className="text-xs text-blue-600 font-mono break-all">
                {transactionId}
              </p>
              {isConfirmed && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ✅ Confirmed on blockchain
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {(error || (hasError && errorMessage)) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <label className="block text-sm font-medium text-gray-900 mb-3">
              <span className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {index + 1}
                </span>
                {question.questionText}
                {question.isRequired && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </span>
            </label>
            <textarea
              value={answers[index] || ""}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Enter your answer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              disabled={isSubmitting || isConfirming}
            />
            {question.isRequired && (
              <p className="mt-1 text-xs text-gray-500">Required field</p>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
        <LiveFeedback
          label={{
            failed: hasError
              ? errorMessage || "Transaction failed"
              : "Submit failed",
            pending: isConfirming
              ? "Confirming on blockchain..."
              : isSubmitting
              ? "Processing transaction..."
              : "Processing...",
            success: isConfirmed
              ? "Transaction confirmed on blockchain!"
              : "Submitted successfully!",
          }}
          state={
            hasError
              ? "failed"
              : isSubmitting || isConfirming
              ? "pending"
              : isConfirmed
              ? "success"
              : undefined
          }
          className="w-full"
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isConfirming || !validateForm()}
            size="lg"
            variant="primary"
            className="w-full"
          >
            {isSubmitting
              ? "Submitting..."
              : isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Submit to Blockchain"}
          </Button>
        </LiveFeedback>
        {questions.some((q) => q.isRequired) && (
          <p className="mt-2 text-xs text-gray-500 text-center">
            * Required fields to complete
          </p>
        )}
      </div>
    </div>
  );
};
