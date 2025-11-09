import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Button } from './Button';

const tourSteps = [
  {
    target: 'send-files',
    title: 'Send Files Instantly',
    description: 'Click here to start sending files. You can send to a single device or share with multiple recipients.',
    placement: 'bottom',
  },
  {
    target: 'receive-files',
    title: 'Receive Files',
    description: 'Enter a 6-digit session code to receive files from others. Simple and secure!',
    placement: 'bottom',
  },
  {
    target: 'public-rooms',
    title: 'Public Rooms',
    description: 'Browse and join public rooms to share files with communities. Sort, filter, and discover!',
    placement: 'top',
  },
  {
    target: 'theme-toggle',
    title: 'Theme Customization',
    description: 'Switch between light and dark modes, or let the system choose for you.',
    placement: 'bottom',
  },
];

export const OnboardingTour = () => {
  const { isActive, currentStep, nextStep, previousStep, skipOnboarding, completeOnboarding } = useOnboarding();
  const [highlightRect, setHighlightRect] = useState(null);

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  useEffect(() => {
    if (!isActive || !currentTourStep) {
      setHighlightRect(null);
      return;
    }

    // Find and highlight the target element
    const updateHighlight = () => {
      const element = document.querySelector(`[data-onboarding="${currentTourStep.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [isActive, currentStep, currentTourStep]);

  if (!isActive) return null;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.x - 8}
                  y={highlightRect.y - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlight border */}
        {highlightRect && (
          <div
            className="absolute border-2 border-green-500 rounded-xl shadow-lg shadow-green-500/50 animate-pulse"
            style={{
              left: `${highlightRect.x - 8}px`,
              top: `${highlightRect.y - 8}px`,
              width: `${highlightRect.width + 16}px`,
              height: `${highlightRect.height + 16}px`,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {highlightRect && currentTourStep && (
        <div
          className="fixed z-[101] pointer-events-auto"
          style={{
            left: currentTourStep.placement === 'bottom'
              ? `${highlightRect.left}px`
              : `${highlightRect.left}px`,
            top: currentTourStep.placement === 'bottom'
              ? `${highlightRect.bottom + 16}px`
              : `${highlightRect.top - 16}px`,
            transform: currentTourStep.placement === 'bottom'
              ? 'translateY(0)'
              : 'translateY(-100%)',
          }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 max-w-sm animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {currentTourStep.title}
                </h3>
                <p className="text-sm text-zinc-400">
                  Step {currentStep + 1} of {tourSteps.length}
                </p>
              </div>
              <button
                onClick={skipOnboarding}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Skip tour"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <p className="text-sm text-zinc-300 mb-4">
              {currentTourStep.description}
            </p>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={skipOnboarding}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Skip tour
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  icon={isLastStep ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                >
                  {isLastStep ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
