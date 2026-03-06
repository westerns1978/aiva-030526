
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, CloseIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import type { ToastMessage, ToastType } from '../context/AppContext';

const ICONS: Record<ToastType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  success: CheckCircleIcon,
  error: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const COLORS: Record<ToastType, { bg: string; text: string; icon: string; border: string; progress: string }> = {
  success: {
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-100',
    icon: 'text-green-500',
    border: 'border-green-500/20',
    progress: 'bg-green-500'
  },
  error: {
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-100',
    icon: 'text-red-500',
    border: 'border-red-500/20',
    progress: 'bg-red-500'
  },
  info: {
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-100',
    icon: 'text-sky-500',
    border: 'border-sky-500/20',
    progress: 'bg-sky-500'
  },
  warning: {
    bg: 'bg-white dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-100',
    icon: 'text-amber-500',
    border: 'border-amber-500/20',
    progress: 'bg-amber-500'
  },
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const duration = 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    const interval = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (duration / 100))));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [toast.id, onDismiss]);

  const Icon = ICONS[toast.type];
  const color = COLORS[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative w-72 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-slide-in-right border-2 ${color.bg} ${color.text} ${color.border} overflow-hidden transition-all hover:scale-105`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${color.icon}`} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 mb-0.5">Aiva System</p>
        <p className="text-xs font-bold leading-tight">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <CloseIcon className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <div className="absolute bottom-0 left-0 h-0.5 bg-slate-100 dark:bg-slate-700 w-full">
        <div className={`h-full ${color.progress}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppContext();

  // Allow success and error messages, and info messages containing verification details
  const visibleToasts = toasts.filter(t => 
    t.type === 'error' || 
    t.type === 'warning' || 
    t.type === 'success' ||
    (t.type === 'info' && (t.message.includes('Verified') || t.message.includes('Confidence') || t.message.includes('Identity')))
  );

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-[200] space-y-3 pointer-events-none">
      <div className="pointer-events-auto">
        {visibleToasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
};
