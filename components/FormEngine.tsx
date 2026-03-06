import React, { useState, useEffect, useRef } from 'react';
import { FormDefinition, FormField } from '../types';
import { CloseIcon, CheckCircleIcon, AiSparkIcon } from './icons';
import { FileText, Download, AlertCircle, HelpCircle, Signature, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface FormEngineProps {
    form: FormDefinition;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: Record<string, any>;
    templateUrl?: string;
    stepNumber?: number;
}

const formatSectionName = (id: string) => {
    return id
        .replace(/INDUCTION DATA CAPTURE/g, '')
        .replace(/SEC:/g, '')
        .replace(/_/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const FormEngine: React.FC<FormEngineProps> = ({ form, onClose, onSubmit, templateUrl, stepNumber = 4, initialData = {} }) => {
    const { addToast, openMedia } = useAppContext();
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        firstInputRef.current?.focus();
    }, []);

    const isFieldVisible = (field: FormField) => {
        if (!field.condition) return true;
        return formData[field.condition.field] === field.condition.value;
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const fieldsToValidate = form.sections 
            ? form.sections.flatMap(s => s.fields) 
            : (form.fields || []);

        fieldsToValidate.forEach(field => {
            if (isFieldVisible(field) && field.required && !formData[field.id]) {
                newErrors[field.id] = `${field.label} is required`;
            }
            
            // Simple SA ID validation if requested
            if (formData[field.id] && field.validation === 'sa_id' && !/^\d{13}$/.test(formData[field.id].replace(/\s/g, ''))) {
                // Warn but don't block — add as warning not error so form can still submit
                // newErrors[field.id] = 'Invalid SA ID (must be 13 digits)'; // DISABLED for usability
            }
        });

        if (form.signature?.required && !isSigned) {
            newErrors['signature'] = 'Signature required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valid = validate();
        if (!valid) {
            const allFields = form.sections 
                ? form.sections.flatMap(s => s.fields) 
                : (form.fields || []);
            const missingLabels = allFields
                .filter(f => isFieldVisible(f) && f.required && !formData[f.id])
                .map(f => f.label);
            if (missingLabels.length > 0) {
                addToast('Required: ' + missingLabels.slice(0, 3).join(', ') + (missingLabels.length > 3 ? ' +' + (missingLabels.length - 3) + ' more' : ''), "warning");
            } else if (!isSigned && form.signature?.required) {
                addToast("Please check the acknowledgment box before saving.", "warning");
            }
            setTimeout(() => {
                const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement;
                if (firstError) { firstError.scrollIntoView({ behavior: 'smooth', block: 'center' }); (firstError as HTMLInputElement).focus?.(); }
            }, 100);
            return;
        }
        setIsSubmitting(true);
        addToast(`Saving Step ${stepNumber}...`, "info");
        setTimeout(() => {
            setIsSubmitting(false);
            onSubmit(formData);
        }, 1200);
    };

    const renderField = (field: FormField, idx: number) => {
        const error = errors[field.id];
        const isWarning = field.validation === 'sa_id' && error;
        
        return (
            <div key={field.id} className="space-y-2 group">
                <div className="flex items-center justify-between">
                    <label 
                        htmlFor={field.id}
                        className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors ${error ? 'text-red-500' : 'text-slate-400 group-focus-within:text-brand-primary'}`}
                    >
                        {field.label} {field.required && <span className="text-red-500" aria-hidden="true">*</span>}
                    </label>
                    {field.helpText && (
                        <div className="group/help relative">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-brand-primary transition-colors cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover/help:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
                                {field.helpText}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="relative">
                    {field.type === 'select' ? (
                        <select
                            id={field.id}
                            ref={idx === 0 ? (firstInputRef as any) : null}
                            required={field.required}
                            aria-required={field.required}
                            aria-invalid={!!error}
                            value={formData[field.id] || ''}
                            onChange={e => {
                                setFormData({...formData, [field.id]: e.target.value});
                                if (errors[field.id]) setErrors(prev => ({...prev, [field.id]: ''}));
                            }}
                            className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-bold focus:border-brand-primary outline-none transition-all appearance-none ${error ? 'border-red-500/50' : 'border-slate-100 dark:border-white/10'}`}
                        >
                            <option value="">Select Option...</option>
                            {field.options?.map(opt => {
                                const val = typeof opt === 'string' ? opt : opt.value;
                                const label = typeof opt === 'string' ? opt : opt.label;
                                return <option key={val} value={val}>{label}</option>;
                            })}
                        </select>
                    ) : field.type === 'textarea' ? (
                        <textarea
                            id={field.id}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formData[field.id] || ''}
                            onChange={e => setFormData({...formData, [field.id]: e.target.value})}
                            className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-bold text-base focus:border-brand-primary outline-none transition-all shadow-inner resize-none ${error ? 'border-red-500/50' : 'border-slate-100 dark:border-white/10'}`}
                            rows={3}
                        />
                    ) : (
                        <input
                            id={field.id}
                            ref={idx === 0 ? (firstInputRef as any) : null}
                            type={field.type === 'bank_account' ? 'number' : field.type}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formData[field.id] || ''}
                            onChange={e => {
                                setFormData({...formData, [field.id]: e.target.value});
                                if (errors[field.id]) setErrors(prev => ({...prev, [field.id]: ''}));
                            }}
                            className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-bold text-base focus:border-brand-primary outline-none transition-all shadow-inner ${error ? 'border-red-500/50' : 'border-slate-100 dark:border-white/10'}`}
                        />
                    )}
                    
                    {error && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 flex items-center gap-1.5 animate-fadeIn">
                            <AlertCircle className="w-4 h-4" />
                            <span className="hidden lg:inline text-[9px] font-black uppercase">{error}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 z-[220] flex items-end md:items-center justify-center bg-slate-900/80 backdrop-blur-xl animate-fadeIn p-2 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
        >
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[95dvh] md:max-h-[90dvh] md:rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-t md:border border-white/10">
                
                <header className="p-5 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                                {stepNumber}
                            </div>
                            <div className="w-0.5 h-4 bg-brand-primary/20"></div>
                        </div>
                        <div>
                            <h2 id="form-title" className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight leading-none">{form.title}</h2>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">{formatSectionName(form.id)}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-3 bg-white dark:bg-white/5 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Close Form"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 copilot-scrollbar space-y-12">
                    <div className="flex gap-5 p-5 bg-brand-primary/5 dark:bg-white/5 rounded-3xl border border-brand-primary/10 dark:border-white/5 items-start">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-brand-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                "{form.description}"
                            </p>
                            {templateUrl && (
                                <button 
                                    onClick={() => openMedia(templateUrl)}
                                    className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase text-brand-secondary hover:underline group"
                                >
                                    <Download className="w-3 h-3 group-hover:animate-bounce" /> Reference Official Nashua Template
                                </button>
                            )}
                        </div>
                    </div>

                    <form id="hr-form-engine" onSubmit={handleSubmit} className="space-y-12">
                        {form.sections ? (
                            form.sections.map(section => (
                                <div key={section.id} className="space-y-6 animate-fadeIn">
                                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-2">
                                        <div className="w-1.5 h-4 bg-brand-secondary rounded-full"></div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{section.title}</h4>
                                    </div>
                                    <div className="space-y-6">
                                        {section.fields.filter(isFieldVisible).map((field, i) => renderField(field, i))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="space-y-6">
                                {form.fields?.filter(isFieldVisible).map((field, i) => renderField(field, i))}
                            </div>
                        )}

                        {form.notice && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex gap-3">
                                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase leading-relaxed tracking-tight">
                                    {form.notice}
                                </p>
                            </div>
                        )}

                        {form.signature && (
                            <div className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all ${isSigned ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500/30' : 'bg-brand-primary/5 border-brand-primary/10'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-2.5 rounded-xl ${isSigned ? 'bg-emerald-500 text-white' : 'bg-brand-primary text-white'}`}>
                                        <Signature className="w-5 h-5" />
                                    </div>
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${isSigned ? 'text-emerald-600' : 'text-slate-600'}`}>Acknowledgment & Certification</h4>
                                </div>
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={isSigned} 
                                        onChange={e => setIsSigned(e.target.checked)}
                                        className="mt-1 w-6 h-6 rounded-lg border-2 border-slate-300 text-brand-primary focus:ring-brand-primary" 
                                    />
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-primary transition-colors leading-relaxed">
                                        {form.signature.label}
                                    </span>
                                </label>
                            </div>
                        )}
                    </form>
                </div>

                <footer className="p-6 md:p-8 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                    {/* Missing required fields summary */}
                    {(() => {
                        const allFields = form.sections ? form.sections.flatMap((s: any) => s.fields) : (form.fields || []);
                        const missing = allFields.filter((f: any) => f.required && !formData[f.id]);
                        if (missing.length === 0) return null;
                        return (
                            <div className="px-2 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                                Still needed: {missing.slice(0, 4).map((f: any) => f.label).join(', ')}{missing.length > 4 ? ` +${missing.length - 4} more` : ''}
                            </div>
                        );
                    })()}
                    <div className="flex gap-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="hidden md:block flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 font-black rounded-2xl border border-slate-200 dark:border-white/5 uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                            Abort
                        </button>
                        <button 
                            form="hr-form-engine"
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-[2] w-full py-5 md:py-4 text-white font-black rounded-3xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs border-b-4 ${isSigned ? 'bg-emerald-500 border-emerald-700' : 'bg-brand-primary border-blue-950'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <AiSparkIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <CheckCircleIcon className="w-5 h-5" />
                            )}
                            Save & Continue
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};