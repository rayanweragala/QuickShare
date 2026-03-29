/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext(null);

const ONBOARDING_KEY = 'quickshare-onboarding-completed';

export const OnboardingProvider = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const skipOnboarding = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const completeOnboarding = () => {
    setIsActive(false);
    setIsOnboardingComplete(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const resetOnboarding = () => {
    setIsOnboardingComplete(false);
    localStorage.removeItem(ONBOARDING_KEY);
    setCurrentStep(0);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        isActive,
        currentStep,
        startOnboarding,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
