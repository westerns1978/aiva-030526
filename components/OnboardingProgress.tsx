// ============================================================
// components/OnboardingProgress.tsx
// Left-panel step tracker — aligned to 8-step ONBOARDING_STEPS
// Drop into: src/components/OnboardingProgress.tsx
// ============================================================

import React from 'react';
import { ONBOARDING_STEPS } from '../constants';
import { CheckCircleIcon } from './icons';

interface OnboardingProgressProps {
    completedSteps: string[];
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

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
    completedSteps,
    onStepClick,
    activeStepId,
}) => {
    const total     = ONBOARDING_STEPS.length;
    const doneCount = completedSteps.length;
    const pct       = Math.round((doneCount / total) * 100);

    return (
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg h-full flex flex-col">
            <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-1 px-2">
                Your Onboarding Journey
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 px-2">
                I'm Aiva, your guide. Follow these steps for a smooth start, or ask me anything!
            </p>

            {/* Overall progress bar */}
            <div className="px-2 mb-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    <span>{doneCount} of {total} complete</span>
                    <span>{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#0d9488] to-emerald-400 transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {ONBOARDING_STEPS.map((step) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isActive    = step.id === activeStepId;
                    return (
                        <StepButton
                            key={step.id}
                            step={step}
                            isCompleted={isCompleted}
                            isActive={isActive}
                            onClick={() => onStepClick(step.prompt, step.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// ─── StepButton ───────────────────────────────────────────────────────────────

interface StepButtonProps {
    step:        typeof ONBOARDING_STEPS[0];
    isCompleted: boolean;
    isActive:    boolean;
    onClick:     () => void;
}

const StepButton: React.FC<StepButtonProps> = ({ step, isCompleted, isActive, onClick }) => {
    const Icon   = step.icon;
    const status = isCompleted ? 'completed' : isActive ? 'in_progress' : 'pending';

    const containerCls = {
        completed:   'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/50 cursor-default',
        in_progress: 'bg-brand-secondary/10 dark:bg-brand-secondary/20 border-brand-secondary dark:border-brand-secondary/80 ring-2 ring-brand-secondary/30',
        pending:     'bg-slate-50 dark:bg-slate-800/60 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600',
    }[status];

    const iconCls = {
        completed:   'bg-green-100 dark:bg-green-800/60 text-green-600 dark:text-green-400',
        in_progress: 'bg-brand-secondary text-white',
        pending:     'bg-brand-light dark:bg-slate-700 text-brand-primary dark:text-slate-300',
    }[status];

    const titleCls = {
        completed:   'text-slate-500 dark:text-slate-400',
        in_progress: 'text-brand-dark dark:text-white',
        pending:     'text-brand-dark dark:text-white',
    }[status];

    // Strip "Step N: " prefix for compact display
    const shortTitle = step.title.split(': ')[1] || step.title;

    return (
        <button
            onClick={onClick}
            disabled={isCompleted}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${containerCls}`}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300 ${iconCls}`}>
                {isCompleted
                    ? <CheckCircleIcon className="w-5 h-5" />
                    : <Icon className="w-5 h-5" />
                }
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm transition-colors duration-300 truncate ${titleCls}`}>
                    {shortTitle}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {step.description.length > 55
                        ? step.description.slice(0, 52) + '…'
                        : step.description}
                </p>
            </div>

            {/* Spinner for active step */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isActive && !isCompleted && (
                    <SpinnerIcon className="w-4 h-4 text-brand-secondary animate-spin" />
                )}
            </div>
        </button>
    );
};

export default OnboardingProgress;
