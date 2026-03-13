import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RefreshIcon, MagnifyingGlassIcon, WhatsAppIcon, ComputerDesktopIcon, AiSparkIcon, CloseIcon } from './icons';
import { Loader2, Send, FileCheck, Filter, Trash2, ArrowRight } from 'lucide-react';
import { useAgent } from '../hooks/useWestFlow';
import { useAppContext } from '../context/AppContext';
import { DemoReset } from './DemoReset';
import { realtimeService } from '../services/realtimeService';

interface PipelineItem {
  id: string;
  staff_name: string;
  staff_id: string;
  phone: string;
  step_reached: number;
  status: string;
  updated_at: string;
  created_at: string;
  metadata?: {
      channel?: 'whatsapp' | 'web';
      contract_status?: 'pending' | 'signed' | 'countersigned';
      profile_photo_url?: string;
  };
}

// ─── FrictionReasoning ───────────────────────────────────────────────────────
// Labels align with the 8-step ONBOARDING_STEPS definition:
//   1 = Offer acceptance
//   2 = ID verification
//   3 = Address verification
//   4 = Banking details
//   5 = Policy review
//   6 = Benefits & document signing
//   7 = Contract signing
//   8 = Final review / countersign wait

const STEP_LABELS: Record<number, string> = {
    1: 'Reviewing offer',
    2: 'ID verification',
    3: 'Address verification',
    4: 'Banking details',
    5: 'Policy review',
    6: 'Benefits & documents',
    7: 'Contract signing',
    8: 'Awaiting countersign',
};

const FrictionReasoning: React.FC<{ step: number; contractStatus?: string }> = ({ step, contractStatus }) => {
    if (contractStatus === 'countersigned') {
        return (
            <div className="flex items-center gap-2" title="Fully countersigned — export complete.">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Complete ✓</span>
            </div>
        );
    }

    if (contractStatus === 'signed') {
        return (
            <div className="flex items-center gap-2 animate-pulse" title="Employee has signed — awaiting MD countersignature.">
                <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-tighter">Step 8 · Needs MD Signature</span>
            </div>
        );
    }

    const label = STEP_LABELS[step] || 'In progress';

    return (
        <div className="flex items-center gap-2 cursor-help" title={`Step ${step} of 8 — ${label}`}>
            <div className="p-1.5 bg-brand-primary/5 rounded-lg border border-brand-primary/10">
                <AiSparkIcon className="w-3.5 h-3.5 text-brand-primary" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 italic truncate max-w-[180px]">
                Step {step} · {label}
            </span>
        </div>
    );
};

// ─── Action label for the pipeline row button ─────────────────────────────────
const getActionLabel = (step: number, contractStatus?: string): string => {
    if (contractStatus === 'countersigned') return 'View Record';
    if (contractStatus === 'signed')        return 'Countersign ✍️';
    const labels: Record<number, string> = {
        1: 'Review Offer',
        2: 'Check ID',
        3: 'Check Address',
        4: 'Check Banking',
        5: 'Review Policies',
        6: 'Review Docs',
        7: 'Review Contract',
        8: 'Countersign',
    };
    return labels[step] || 'View File';
};

// ─── Progress bar color based on % complete ───────────────────────────────────
const getProgressBarColor = (progress: number): string => {
    if (progress <= 25) return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]';
    if (progress <= 50) return 'bg-[#0d9488] shadow-[0_0_8px_rgba(13,148,136,0.3)]';
    if (progress <= 75) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
};

const TOTAL_STEPS = 8; // Keep in sync with ONBOARDING_STEPS length

// ─── Component ────────────────────────────────────────────────────────────────

export const OnboardingPipeline: React.FC = () => {
  const { addToast, setCurrentHire, setActiveView, setPersona, persona, hubFilter, setHubFilter, focusedHireId, setFocusedHireId } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const { callTool, loading: isLoading, westflow } = useAgent('AIVA');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showDemoReset, setShowDemoReset] = useState(false);
  const focusedRef = useRef<HTMLTableRowElement>(null);

  const fetchPipeline = useCallback(async (silent: boolean = false) => {
    if (silent) setIsRefreshing(true);
    const resp = await callTool('get_pipeline');
    if (resp?.success) {
      setPipeline(resp.pipeline || []);
    } else if (!silent) {
       addToast("Unable to refresh hiring list", "error");
    }
    setIsRefreshing(false);
  }, [callTool, addToast]);

  useEffect(() => {
    fetchPipeline();
    const unsubscribe = realtimeService.subscribeToPipeline(() => {
        fetchPipeline(true);
    });
    return () => unsubscribe();
  }, [fetchPipeline]);

  useEffect(() => {
    if (focusedHireId && focusedRef.current) {
        focusedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => setFocusedHireId(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [focusedHireId, pipeline, setFocusedHireId]);

  const handleNudge = async (item: PipelineItem) => {
      setActionInProgress(item.id);
      try {
          const resp = await westflow.nudgeHire(item.id);
          if (resp.success) {
              addToast(`Reminder sent to ${item.staff_name}.`, "success");
          }
      } catch {
          addToast("Unable to send nudge.", "error");
      } finally {
          setActionInProgress(null);
      }
  };

  const handleEnterJourney = (item: PipelineItem) => {
    setCurrentHire(item);
    if (persona !== 'manager') {
        setPersona('employee');
    }
    setActiveView('onboarding');
  };

  const filteredPipeline = useMemo(() => {
    let list = pipeline.filter(p =>
        p.status !== 'demo_archived' && (
        p.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.staff_id && p.staff_id.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    if (hubFilter === 'stalled') {
        const now = new Date();
        list = list.filter(h => {
            const status = h.status?.toLowerCase() || '';
            const contractStatus = h.metadata?.contract_status?.toLowerCase();
            if (status === 'completed' || status === 'contract_signed' || contractStatus === 'countersigned') return false;
            const updated = new Date(h.updated_at || h.created_at);
            return (now.getTime() - updated.getTime()) / 3600000 > 24;
        });
    } else if (hubFilter === 'completed') {
        list = list.filter(h => {
            const status = h.status?.toLowerCase() || '';
            const contractStatus = h.metadata?.contract_status?.toLowerCase();
            return status === 'completed' || status === 'contract_signed' || contractStatus === 'countersigned';
        });
    }

    return list;
  }, [pipeline, searchTerm, hubFilter]);

  return (
    <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Hiring Pipeline</h2>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1.5">Process Status</p>
                </div>
                {hubFilter !== 'all' && (
                    <div className="flex items-center gap-2 bg-[#0d9488]/10 text-[#0d9488] px-3 py-1.5 rounded-full border border-[#0d9488]/20 animate-fadeIn">
                        <Filter className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{hubFilter} Records</span>
                        <button onClick={() => setHubFilter('all')} className="ml-1 p-0.5 hover:bg-[#0d9488]/20 rounded-full transition-colors">
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex gap-2">
                 <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-lg text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all w-48"
                    />
                </div>
                <button onClick={() => fetchPipeline()} className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                    <RefreshIcon className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <DemoReset key={showDemoReset ? 'open' : 'closed'} onComplete={() => { setShowDemoReset(false); fetchPipeline(); }} />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-slate-100 dark:border-white/5">
                    <tr>
                        <th className="px-8 py-5">Candidate</th>
                        <th className="px-8 py-5">Method</th>
                        <th className="px-8 py-5">Onboarding Progress</th>
                        <th className="px-8 py-5">HR Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {isLoading && pipeline.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-24 text-center text-slate-400 font-mono text-[9px] uppercase tracking-widest animate-pulse">
                                Checking records...
                            </td>
                        </tr>
                    ) : filteredPipeline.length > 0 ? filteredPipeline.map(item => {
                        const isFocused       = item.id === focusedHireId;
                        // ✅ Fixed: divide by TOTAL_STEPS (8) not 7
                        const progress        = Math.round((item.step_reached / TOTAL_STEPS) * 100);
                        const contractStatus  = item.metadata?.contract_status;
                        const needsCountersign = contractStatus === 'signed';
                        const isComplete      = contractStatus === 'countersigned';

                        return (
                            <tr
                                key={item.id}
                                ref={isFocused ? focusedRef : null}
                                className={`transition-all duration-700 group ${
                                    isFocused       ? 'bg-[#0d9488]/10 ring-2 ring-[#0d9488] ring-inset' :
                                    needsCountersign ? 'bg-amber-500/5 hover:bg-amber-500/10' :
                                    isComplete      ? 'bg-emerald-500/5 hover:bg-emerald-500/10' :
                                    'hover:bg-slate-50 dark:hover:bg-[#0d9488]/5'
                                }`}
                            >
                                {/* Candidate */}
                                <td className="px-8 py-5 cursor-pointer" onClick={() => handleEnterJourney(item)}>
                                    <div className="flex items-center gap-3">
                                        {item.metadata?.profile_photo_url ? (
                                            <img
                                                src={item.metadata.profile_photo_url}
                                                alt=""
                                                className="w-9 h-9 rounded-full object-cover border-2 border-[#0d9488]/20 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0d9488]/20 to-[#0d9488]/5 flex items-center justify-center text-[#0d9488] text-sm font-bold border border-[#0d9488]/20 shadow-inner shrink-0">
                                                {item.staff_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter italic group-hover:text-[#0d9488] transition-colors truncate max-w-[160px]">
                                                {item.staff_name}
                                            </p>
                                            <p className="text-[8px] font-mono text-slate-400 uppercase mt-0.5 tracking-widest">
                                                ID: {item.staff_id || item.id.slice(0, 8)}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Method */}
                                <td className="px-8 py-5">
                                    {item.metadata?.channel === 'whatsapp' ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-black uppercase text-[8px] tracking-widest bg-emerald-50 dark:bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/10 inline-flex">
                                            <WhatsAppIcon className="w-3" /> WhatsApp
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-blue-600 font-black uppercase text-[8px] tracking-widest bg-blue-50 dark:bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-500/10 inline-flex">
                                            <ComputerDesktopIcon className="w-3" /> Web Portal
                                        </div>
                                    )}
                                </td>

                                {/* Progress — /8 */}
                                <td className="px-8 py-5">
                                    <div className="space-y-2 w-36" title={`Step ${item.step_reached} of ${TOTAL_STEPS}`}>
                                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                            <span>Progress</span>
                                            <span className="text-slate-700 dark:text-slate-300">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${getProgressBarColor(progress)}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* HR Status */}
                                <td className="px-8 py-5">
                                    <FrictionReasoning step={item.step_reached} contractStatus={contractStatus} />
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleNudge(item)}
                                            disabled={!!actionInProgress || isComplete}
                                            className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all disabled:opacity-30 shrink-0"
                                            title="Send WhatsApp Reminder"
                                        >
                                            {actionInProgress === item.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />
                                            }
                                        </button>
                                        <button
                                            onClick={() => handleEnterJourney(item)}
                                            className={`px-4 py-2 font-black text-[9px] uppercase tracking-widest rounded-lg border transition-all shadow-sm whitespace-nowrap min-w-[100px] ${
                                                needsCountersign
                                                    ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-amber-500/20 animate-pulse'
                                                    : isComplete
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100'
                                                    : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-[#0d9488] hover:text-white dark:hover:bg-[#0d9488] border-slate-200 dark:border-white/10'
                                            }`}
                                        >
                                            {getActionLabel(item.step_reached, contractStatus)}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={5} className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                                No candidates found matching current filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};
