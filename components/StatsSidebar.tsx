import React from 'react';
import { ShieldCheckIcon, GraduationCapIcon, ClipboardDocumentCheckIcon } from './icons';

interface StatsSidebarProps {
  progress: {
    induction: number;
    training: number;
    healthAndSafety: boolean;
  };
}

const StatItem: React.FC<{ Icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; value: string; isComplete: boolean }> = ({ Icon, label, value, isComplete }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : 'text-slate-400'}`} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <span className={`text-sm font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {value}
        </span>
    </div>
);

export const StatsSidebar: React.FC<StatsSidebarProps> = ({ progress }) => {
  return (
    <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
      <h3 className="text-md font-bold text-brand-dark dark:text-white px-2">Your Progress</h3>
      <StatItem
        Icon={ClipboardDocumentCheckIcon}
        label="Induction"
        value={`${progress.induction}%`}
        isComplete={progress.induction >= 100}
      />
      <StatItem
        Icon={GraduationCapIcon}
        label="Training"
        value={`${progress.training}%`}
        isComplete={progress.training >= 100}
      />
      <StatItem
        Icon={ShieldCheckIcon}
        label="H&S Compliance"
        value={progress.healthAndSafety ? 'Met' : 'Pending'}
        isComplete={progress.healthAndSafety}
      />
    </div>
  );
};
