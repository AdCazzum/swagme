"use client";
import React, { useEffect, useState } from "react";
import { Button, LiveFeedback } from "@worldcoin/mini-apps-ui-kit-react";
import {
  getFormQuestions,
  getFormInfo,
  submitFormToContract,
  testContractConnection,
  FormQuestion,
  FormInfo,
  ContractError,
  ValidationError,
} from "../../services/contract";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<
    "pending" | "success" | "failed" | undefined
  >(undefined);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carica le informazioni del form e le domande in parallelo
        const [info, questionsData] = await Promise.all([
          getFormInfo(formId),
          getFormQuestions(formId),
        ]);

        setFormInfo(info);
        setQuestions(questionsData);

        // Inizializza le risposte vuote
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

    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const validateForm = (): boolean => {
    // Check if username and email are provided
    if (!username.trim()) {
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      return false;
    }

    // Check required questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[i];

      if (question.isRequired && (!answer || answer.trim() === "")) {
        return false;
      }
    }
    return true;
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
      setSubmitting(true);
      setSubmitState("pending");
      setError(null);

      // Debug: Test contract connection first
      console.log("Testing contract connection before submission...");
      await testContractConnection();

      // Submit form to smart contract
      const transactionId = await submitFormToContract({
        formId,
        username,
        email,
        answers: answers.filter((answer) => answer.trim() !== ""),
      });

      console.log(
        "Form submitted successfully with transaction ID:",
        transactionId
      );
      setSubmitState("success");

      // Go back after success
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      console.error("Error submitting form:", err);

      let errorMessage = "Error submitting answers. Please try again.";

      if (err instanceof ValidationError) {
        errorMessage = err.message;
      } else if (err instanceof ContractError) {
        errorMessage = `Contract error: ${err.message}`;
      }

      setError(errorMessage);
      setSubmitState("failed");
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Survey</p>
        <Button onClick={onBack} variant="tertiary" size="sm">
          Back
        </Button>
      </div>

      {/* Form Info */}
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

      {/* User Information */}
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
            disabled={submitting}
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
            disabled={submitting}
            required
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
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
              <h3 className="text-sm font-medium text-red-800">Warning</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
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
              disabled={submitting}
            />

            {question.isRequired && (
              <p className="mt-1 text-xs text-gray-500">Required field</p>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
        <LiveFeedback
          label={{
            failed: "Submission failed",
            pending: "Submitting...",
            success: "Submitted successfully!",
          }}
          state={submitState}
          className="w-full"
        >
          <Button
            onClick={handleSubmit}
            disabled={submitting || !validateForm()}
            size="lg"
            variant="primary"
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Answers"}
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
