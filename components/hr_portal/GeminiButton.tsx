import React from 'react';

interface GeminiButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
}

export const GeminiButton: React.FC<GeminiButtonProps> = ({ onClick, children, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center gap-2 font-medium px-4 py-2 rounded-lg text-sm
            bg-brand-secondary/10 text-brand-secondary dark:bg-brand-secondary/20 dark:text-brand-secondary
            border border-brand-secondary/20 dark:border-brand-secondary/20
            hover:bg-brand-secondary/20 dark:hover:bg-brand-secondary/30
            transition-all duration-200 shadow-sm hover:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {children}
        </button>
    );
};