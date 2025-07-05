"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface VerificationContextType {
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
  verificationLevel: string | null;
  setVerificationLevel: (level: string | null) => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(
  undefined
);

export const useVerification = (): VerificationContextType => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error(
      "useVerification must be used within a VerificationProvider"
    );
  }
  return context;
};

interface VerificationProviderProps {
  children: ReactNode;
}

export const VerificationProvider: React.FC<VerificationProviderProps> = ({
  children,
}) => {
  const [isVerified, setIsVerifiedState] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState<string | null>(
    null
  );

  // Load verification status from localStorage on mount
  useEffect(() => {
    const savedVerification = localStorage.getItem("worldapp-verification");
    const savedLevel = localStorage.getItem("worldapp-verification-level");

    if (savedVerification === "true") {
      setIsVerifiedState(true);
    }
    if (savedLevel) {
      setVerificationLevel(savedLevel);
    }
  }, []);

  // Wrapper function to save to localStorage when setting verification
  const setIsVerified = (verified: boolean) => {
    setIsVerifiedState(verified);
    localStorage.setItem("worldapp-verification", verified.toString());
    if (!verified) {
      localStorage.removeItem("worldapp-verification-level");
      setVerificationLevel(null);
    }
  };

  // Wrapper function to save verification level to localStorage
  const setVerificationLevelWrapper = (level: string | null) => {
    setVerificationLevel(level);
    if (level) {
      localStorage.setItem("worldapp-verification-level", level);
    } else {
      localStorage.removeItem("worldapp-verification-level");
    }
  };

  return (
    <VerificationContext.Provider
      value={{
        isVerified,
        setIsVerified,
        verificationLevel,
        setVerificationLevel: setVerificationLevelWrapper,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
};
