
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { LifebuoyIcon } from '../icons';

export const AiDataChat: React.FC = () => {
    const { initiateContextualChat } = useAppContext();
    
    const suggestionPrompts = [
        "Use the business intelligence context tool to tell me which department has the highest turnover.",
        "Analyze the BI report to explain our overall compliance rate.",
        "Based on the financial metrics in the BI context, what is the total Aiva savings this quarter?",
    ];

    const handlePromptClick = (prompt: string) => {
        initiateContextualChat(prompt);
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <LifebuoyIcon className="w-5 h-5 text-brand-secondary" /> Ask Aiva About Your Data
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Use natural language to get deeper insights. Try one of the suggestions below, or ask your own question in the Co-Pilot.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestionPrompts.map((prompt, index) => (
                    <button
                        key={index}
                        onClick={() => handlePromptClick(prompt)}
                        className="text-left p-3 text-sm font-medium text-brand-secondary dark:text-brand-secondary bg-brand-secondary/10 dark:bg-brand-secondary/20 rounded-lg hover:bg-brand-secondary/20 dark:hover:bg-brand-secondary/30 transition-colors"
                    >
                        "{prompt.replace('Use the business intelligence context tool to ', '').replace('Analyze the BI report to ', '').replace('Based on the financial metrics in the BI context, ', '')}"
                    </button>
                ))}
            </div>
        </div>
    );
};
