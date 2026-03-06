
import React from 'react';
import type { OnboardingStep } from '../types';
import { CheckCircleIcon } from './icons';

interface OnboardingProgressProps {
    steps: OnboardingStep[];
    onStepClick: (prompt: string, stepId: string) => void;
    activeStepId: string | null;
}

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);


const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ steps, onStepClick, activeStepId }) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg h-full flex flex-col">
            <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-1 px-2">Your Onboarding Journey</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 px-2">
                I'm Aiva, your guide. Follow these steps for a smooth start, or ask me anything!
            </p>
            <div className="space-y-3">
                {steps.map((step) => (
                    <StepButton
                        key={step.id}
                        step={step}
                        onClick={() => onStepClick(step.prompt, step.id)}
                        isActive={step.id === activeStepId}
                    />
                ))}
            </div>
        </div>
    );
};

interface StepButtonProps {
    step: OnboardingStep;
    onClick: () => void;
    isActive: boolean;
}

const StepButton: React.FC<StepButtonProps> = ({ step, onClick, isActive }) => {
    const Icon = step.icon;
    const isCompleted = step.completed;

    const status = isCompleted ? 'completed' : isActive ? 'in_progress' : 'pending';

    const containerClasses = {
        completed: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/50 cursor-default',
        in_progress: 'bg-brand-secondary/10 dark:bg-brand-secondary/20 border-brand-secondary dark:border-brand-secondary/80 ring-2 ring-brand-secondary/30',
        pending: 'bg-slate-50 dark:bg-slate-800/60 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
    }[status];

    const iconContainerClasses = {
        completed: 'bg-green-100 dark:bg-green-800/60 text-green-600 dark:text-green-400',
        in_progress: 'bg-brand-secondary text-white',
        pending: 'bg-brand-light dark:bg-slate-700 text-brand-primary dark:text-slate-300'
    }[status];
    
    const titleClasses = {
        completed: 'text-slate-500 dark:text-slate-400',
        in_progress: 'text-brand-dark dark:text-white',
        pending: 'text-brand-dark dark:text-white'
    }[status];

    const descriptionClasses = {
        completed: 'text-slate-400 dark:text-slate-500',
        in_progress: 'text-slate-600 dark:text-slate-300',
        pending: 'text-slate-500 dark:text-slate-400'
    };

    return (
        <button
            onClick={onClick}
            disabled={isCompleted}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${containerClasses}`}
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${iconContainerClasses}`}>
                {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </div>
            <div className="flex-1">
                <h3 className={`font-semibold transition-colors duration-300 ${titleClasses}`}>{step.title}</h3>
                <p className={`text-xs transition-colors duration-300 ${descriptionClasses}`}>{step.description}</p>
            </div>
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isActive && <SpinnerIcon className="w-5 h-5 text-brand-secondary animate-spin" />}
            </div>
        </button>
    )
}

export default OnboardingProgress;
