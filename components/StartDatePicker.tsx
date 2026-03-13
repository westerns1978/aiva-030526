// ============================================================
// components/StartDatePicker.tsx
// Drop into: src/components/StartDatePicker.tsx
//
// Usage (in OnboardingJourney step1 offer flow or FormEngine):
//
//   import { StartDatePicker } from './StartDatePicker';
//
//   <StartDatePicker
//     value={startDate}
//     onChange={(date) => saveFormDataToMetadata({ start_date: date })}
//   />
//
// Also exports: getNextFirstOfMonth() for use anywhere else.
// ============================================================

import React, { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';   // already in your deps

// ─── Helper: next 1st of month ────────────────────────────────────────────────
// Returns ISO date string (YYYY-MM-DD) for the 1st of next month.
// If today IS the 1st, still returns the 1st of NEXT month
// (employee can't start same day they're being onboarded).

export function getNextFirstOfMonth(): string {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toISOString().split('T')[0];
}

// Returns a display-friendly label e.g. "1 April 2026"
export function formatStartDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StartDatePickerProps {
    value?: string;                   // ISO date string YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
    helpText?: string;
    disabled?: boolean;
    className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StartDatePicker: React.FC<StartDatePickerProps> = ({
    value,
    onChange,
    label = 'Start Date',
    helpText = 'Salary payments begin on the 25th of your first month.',
    disabled = false,
    className = '',
}) => {
    const defaultDate = getNextFirstOfMonth();
    const [selected, setSelected] = useState<string>(value || defaultDate);

    // Fire onChange with the default immediately so metadata is populated
    // even if the manager doesn't interact with the picker.
    useEffect(() => {
        if (!value) {
            onChange(defaultDate);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync if parent updates value
    useEffect(() => {
        if (value && value !== selected) setSelected(value);
    }, [value]);  // eslint-disable-line react-hooks/exhaustive-deps

    // Min date: tomorrow (can't start today)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    // Max date: 12 months out
    const maxD = new Date();
    maxD.setFullYear(maxD.getFullYear() + 1);
    const maxDate = maxD.toISOString().split('T')[0];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setSelected(v);
        onChange(v);
    };

    // Quick-pick buttons: next 3 consecutive 1sts of month
    const quickPicks: { label: string; value: string }[] = Array.from({ length: 3 }, (_, i) => {
        const now = new Date();
        const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
        return {
            label: d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
            value: d.toISOString().split('T')[0],
        };
    });

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Label */}
            <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0d9488]" />
                <label className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                    {label} <span className="text-red-500">*</span>
                </label>
            </div>

            {/* Quick-pick buttons */}
            <div className="flex gap-2 flex-wrap">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-center">Quick pick:</span>
                {quickPicks.map(q => (
                    <button
                        key={q.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => { setSelected(q.value); onChange(q.value); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                            selected === q.value
                                ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-[#0d9488] hover:text-[#0d9488]'
                        }`}
                    >
                        1 {q.label}
                    </button>
                ))}
            </div>

            {/* Date input */}
            <div className="relative">
                <input
                    type="date"
                    value={selected}
                    min={minDate}
                    max={maxDate}
                    disabled={disabled}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:border-[#0d9488] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Formatted preview */}
            {selected && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0d9488]/5 border border-[#0d9488]/20 rounded-xl">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#0d9488] shrink-0" />
                    <span className="text-[11px] font-black text-[#0d9488]">
                        Start date: {formatStartDate(selected)}
                    </span>
                </div>
            )}

            {/* Help text */}
            {helpText && (
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{helpText}</p>
            )}
        </div>
    );
};

export default StartDatePicker;
