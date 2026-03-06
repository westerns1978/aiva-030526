
import React from 'react';
import { QrCodeIcon, UserCheckIcon, CheckCircleIcon, DocumentTextIcon } from '../icons';

export type OnboardingStepId = 
  'identification' |
  'document_checklist' |
  'photo_capture' | 
  'complete';

const STEPS = [
  { id: 'identification', label: 'Identification', Icon: QrCodeIcon },
  { id: 'document_checklist', label: 'Documents', Icon: DocumentTextIcon },
  { id: 'photo_capture', label: 'Take Photo', Icon: UserCheckIcon },
  { id: 'complete', label: 'Done', Icon: CheckCircleIcon },
];

interface StepIndicatorProps {
  currentStep: OnboardingStepId;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = currentStepIndex > index;
          const isActive = currentStepIndex === index;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center text-center w-20">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    isActive ? 'bg-brand-secondary border-brand-secondary text-white animate-pulse' : 
                    'bg-slate-700 border-slate-500 text-slate-400'
                  }`}
                >
                  <step.Icon className="w-6 h-6" />
                </div>
                <p className={`mt-1 text-xs font-semibold transition-colors duration-300 ${
                    isCompleted || isActive ? 'text-white' : 'text-slate-400'
                }`}>
                    {step.label}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-600'
                }`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
