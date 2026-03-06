import React, { useState, useCallback } from 'react';
import { Trash2, RefreshCw, CheckCircle, AlertTriangle, Loader2, Zap, X } from 'lucide-react';
import { westflow } from '../services/westflowClient';
import { useAppContext } from '../context/AppContext';

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

type ResetStep = 'idle' | 'confirm' | 'archiving' | 'creating' | 'done' | 'error';

interface DemoResetProps {
    onComplete?: () => void;
}

export const DemoReset: React.FC<DemoResetProps> = ({ onComplete }) => {
    const { addToast, triggerHubRefresh } = useAppContext();
    const [step, setStep] = useState<ResetStep>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [newHireId, setNewHireId] = useState<string | null>(null);

    const appendLog = (msg: string) => setLog(prev => [...prev, msg]);

    const handleReset = useCallback(async () => {
        setStep('archiving');
        setLog([]);
        setNewHireId(null);

        try {
            // Step 1: Fetch all current hires
            appendLog('Fetching current pipeline...');
            const pipelineResp = await westflow.getOnboardingPipeline();
            const hires: any[] = pipelineResp?.pipeline || [];
            appendLog(`Found ${hires.length} hire record${hires.length !== 1 ? 's' : ''}.`);

            // Step 2: Archive all hires by setting status = 'demo_archived'
            if (hires.length > 0) {
                appendLog('Archiving existing records...');
                const archivePromises = hires.map(hire =>
                    fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hire.id}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ status: 'demo_archived' })
                    })
                );
                await Promise.all(archivePromises);
                appendLog(`✓ ${hires.length} record${hires.length !== 1 ? 's' : ''} archived.`);
            }

            // Step 3: Create fresh demo candidate
            setStep('creating');
            appendLog('Creating fresh demo candidate...');
            const demoNames = [
                'Sipho Dlamini',
                'Amara Nkosi', 
                'Lerato Sithole',
                'Thabo Mokoena',
                'Zanele Khumalo'
            ];
            const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
            
            const createResp = await westflow.createNewHire(
                randomName,
                undefined, // no phone — demo candidate for in-person walkthrough
                'Sales Representative'
            );

            if (createResp?.success && createResp?.data?.id) {
                setNewHireId(createResp.data.id);
                appendLog(`✓ Demo candidate created: ${randomName}`);
            } else {
                appendLog('✓ Pipeline cleared. Add candidate via Dispatch when ready.');
            }

            // Step 4: Clear localStorage so no stale hireId lingers
            try { localStorage.removeItem('aiva-active-hire-id'); } catch (e) { /* Ignore storage errors */ }

            appendLog('✓ Demo environment ready.');
            setStep('done');
            triggerHubRefresh();
            onComplete?.();

        } catch (e: any) {
            appendLog(`✗ Error: ${e?.message || 'Unknown error'}`);
            setStep('error');
            addToast('Demo reset failed. Check console.', 'error');
        }
    }, [addToast, triggerHubRefresh, onComplete]);

    // Idle state — just the button
    if (step === 'idle') {
        return (
            <button
                onClick={() => setStep('confirm')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/20 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest group"
                title="Archive all test hires and prep a clean demo state"
            >
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                Reset Demo
            </button>
        );
    }

    // Confirm modal
    if (step === 'confirm') {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setStep('idle')} />
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl p-8 max-w-sm w-full animate-slide-up-fade">
                    <button
                        onClick={() => setStep('idle')}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center mb-5">
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">
                        Reset Demo?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                        This will archive all current hire records and create a fresh demo candidate. 
                        Data is preserved — not deleted. Pipeline will appear clean.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('idle')}
                            className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border-b-2 border-rose-700"
                        >
                            <Zap className="w-3.5 h-3.5" /> Reset Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // In progress / done / error — log panel
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl p-8 max-w-sm w-full">
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                    step === 'done' ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20' :
                    step === 'error' ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20' :
                    'bg-[#0d9488]/10 border border-[#0d9488]/20'
                }`}>
                    {step === 'done' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> :
                     step === 'error' ? <AlertTriangle className="w-6 h-6 text-rose-500" /> :
                     <Loader2 className="w-6 h-6 text-[#0d9488] animate-spin" />}
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-1">
                    {step === 'done' ? 'Demo Ready!' :
                     step === 'error' ? 'Reset Failed' :
                     step === 'archiving' ? 'Archiving Records...' : 'Creating Candidate...'}
                </h3>

                {/* Log output */}
                <div className="mt-4 space-y-1.5 mb-6">
                    {log.map((line, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-1 h-1 rounded-full shrink-0 ${
                                line.startsWith('✓') ? 'bg-emerald-500' :
                                line.startsWith('✗') ? 'bg-rose-500' :
                                'bg-slate-300 animate-pulse'
                            }`} />
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{line}</span>
                        </div>
                    ))}
                </div>

                {(step === 'done' || step === 'error') && (
                    <div className="flex flex-col gap-2">
                        {step === 'done' && newHireId && (
                            <p className="text-[9px] text-center text-slate-400 font-mono mb-2">
                                Demo candidate ID: {newHireId.slice(0, 8)}...
                            </p>
                        )}
                        <button
                            onClick={() => { setStep('idle'); setLog([]); }}
                            className="w-full py-3 bg-[#0d9488] hover:brightness-110 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border-b-2 border-[#0a7c72]"
                        >
                            {step === 'done' ? 'Back to Dashboard' : 'Dismiss'}
                        </button>
                        {step === 'error' && (
                            <button
                                onClick={handleReset}
                                className="w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
