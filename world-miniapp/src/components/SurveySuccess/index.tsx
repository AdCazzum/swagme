"use client";
import React from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { FormInfo } from "../../services/contract";

interface SurveySuccessProps {
  formInfo: FormInfo | null;
  username: string;
  transactionId: string;
  onBackToScanner: () => void;
  onSubmitAnother: () => void;
}

export const SurveySuccess: React.FC<SurveySuccessProps> = ({
  formInfo,
  username,
  transactionId,
  onBackToScanner,
  onSubmitAnother,
}) => {
  return (
    <div className="flex flex-col gap-6 rounded-xl w-full border-2 border-green-200 p-4 bg-green-50">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-green-800">Survey Completed</p>
        <Button onClick={onBackToScanner} variant="tertiary" size="sm">
          Back to Scanner
        </Button>
      </div>

      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
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
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
          <p className="text-green-700 mb-4">
            Your survey response has been successfully recorded on the
            blockchain.
          </p>
          {formInfo && (
            <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">
                {formInfo.title}
              </h3>
              <p className="text-sm text-green-600">
                Response submitted by: {username}
              </p>
            </div>
          )}
        </div>
      </div>

      {transactionId && (
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Transaction Details
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-green-700">
              <span className="font-medium">Status:</span> ✅ Confirmed on
              blockchain
            </p>
            <p className="text-sm text-green-700">
              <span className="font-medium">Transaction ID:</span>
            </p>
            <p className="text-xs text-green-600 font-mono break-all bg-green-50 p-2 rounded">
              {transactionId}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={onBackToScanner}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Scan Another QR Code
        </Button>
        <Button
          onClick={onSubmitAnother}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Submit Another Response
        </Button>
      </div>

      {/* Additional success animations */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-green-600">
          <span className="animate-pulse">🎉</span>
          <span>Survey response recorded permanently on blockchain</span>
          <span className="animate-pulse">🎉</span>
        </div>
      </div>
    </div>
  );
};
