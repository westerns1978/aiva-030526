import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheckIcon,
    AiSparkIcon,
} from './icons';
import { westflow } from '../services/westflowClient';
import { useAppContext } from '../context/AppContext';
import { USER_PERSONAS } from '../constants/personas';
import { Sparkles, Activity, FileText, Loader2, Send, User, ArrowRight, ShieldCheck, LayoutDashboard, Users, Filter, X, MessageCircle, Database } from 'lucide-react';
import { OnboardingPipeline } from './OnboardingPipeline';
import { QrCodeGenerator } from './QrCodeGenerator';
import { DocumentVault } from './DocumentVault';
import { HRSyncTab } from './HRSyncTab';

const STEP_DESCRIPTIONS = [
    "Step 1: Offer Acceptance",
    "Step 2: ID Verification",
    "Step 3: Proof of Residence",
    "Step 4: Banking Details",
    "Step 5: Policy Packets",
    "Step 6: Employment Contract",
    "Step 7: Final Review"
];

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

const TabButton: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void; badge?: number }> = ({ icon: Icon, label, active, onClick, badge }) => (
    <button 
        onClick={onClick} 
        className={`px-6 py-2.5 rounded-xl flex items-center gap-3 transition-all text-[11px] font-black uppercase tracking-widest relative whitespace-nowrap ${
            active 
            ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm border border-slate-200 dark:border-white/10' 
            : 'text-slate-500 hover:text-[#0d9488] hover:bg-white/50 dark:hover:bg-white/5'
        }`}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-[#0d9488] text-white text-[8px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-800 shadow-sm">
                {badge}
            </span>
        )}
    </button>
);

const QuickStat: React.FC<{ label: string; value: string | number; color: string; bgColor: string; borderClass?: string; loading?: boolean; onClick?: () => void }> = ({ label, value, color, bgColor, borderClass = 'border-slate-200 dark:border-white/10', loading, onClick }) => (
    <div 
        onClick={onClick}
        className={`border ${borderClass} p-6 rounded-2xl flex flex-col items-center justify-center flex-1 min-w-[150px] shadow-sm transition-all relative group ${bgColor} ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#0d9488]/40 hover:-translate-y-0.5' : ''}`}
    >
        {loading ? (
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        ) : (
            <span className={`text-3xl font-bold tracking-tight ${color}`}>{value}</span>
        )}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 text-center">{label}</span>
        
        {onClick && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                <ArrowRight className="w-3.5 h-3.5 text-[#0d9488]" />
            </div>
        )}
    </div>
);

const ActivityItem: React.FC<{ item: any; formatTime: (t: string) => string; onClick: () => void }> = ({ item, formatTime, onClick }) => {
    const stepLabel = item?.step ? (STEP_DESCRIPTIONS[item.step - 1] || 'Processing Update') : 'Processing Update';
    
    const [now] = useState(() => Date.now());
    const statusBadge = useMemo(() => {
        const updatedAt = item?.updatedAt ? new Date(item.updatedAt).getTime() : now;
        const hoursStalled = (now - updatedAt) / 3600000;
        
        if (item?.status === 'completed' || (item?.step || 0) >= 7) return { text: 'COMPLETED', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' };
        if (hoursStalled > 24) return { text: 'NEEDS ATTENTION', color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' };
        if (item?.step === 6) return { text: 'READY TO SIGN', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' };
        if (item?.step === 1) return { text: 'PENDING SIGNATURE', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-200/20' };
        return { text: 'IN PROGRESS', color: 'text-[#0d9488] bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20' };
    }, [item, now]);

    return (
        <div 
            onClick={onClick}
            className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer group border-b border-slate-100 dark:border-white/5 last:border-0"
        >
            {item?.profilePhoto ? (
                <img src={item.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#0d9488]/20 shadow-sm shrink-0" />
            ) : (
                <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#0d9488]/20 to-[#0d9488]/5 flex items-center justify-center text-[#0d9488] text-sm font-bold border border-[#0d9488]/20 shadow-inner">
                    {(item?.name || '?').charAt(0)}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white uppercase truncate group-hover:text-[#0d9488] transition-colors">{item?.name || 'Unknown'}</p>
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-black">{formatTime(item?.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none truncate max-w-[120px]">{stepLabel}</p>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${statusBadge.color}`}>
                        {statusBadge.text}
                    </span>
                </div>
            </div>
        </div>
    );
};

import { realtimeService } from '../services/realtimeService';
import { telemetryService } from '../services/telemetryService';

const StaffDashboard: React.FC = () => {
    const { setIsCopilotOpen, triggerHubRefresh, hubRefreshKey, homeActiveTab, setHomeActiveTab, setFocusedHireId, setCurrentHire, setCurrentHireId, openMedia, currentUser, persona } = useAppContext();
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [overviewFilter, setOverviewFilter] = useState<'all' | 'stalled' | 'in-progress' | 'completed'>('all');
    const [serverMetrics, setServerMetrics] = useState<any>(null);

    const fetchServerMetrics = async () => {
        try {
            const data = await telemetryService.getDashboardMetrics();
            if (data) {
                setServerMetrics(data);
            }
        } catch (e) {
            console.warn('[Dashboard] Server metrics fetch failed:', e);
        }
    };

    const fetchData = async (isAuto = false) => {
        if (!isAuto) setLoading(true);
        setIsRefreshing(true);
        try {
            const hires = await telemetryService.getAllHires();
            setPipeline(hires || []);
            setLastRefresh(new Date());
            
            // Secondary fetch for server-side metrics
            fetchServerMetrics();
        } catch (e) {
            console.error("Dashboard refresh failure", e);
        } finally {
            if (!isAuto) setLoading(false);
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    };

    useEffect(() => {
        fetchData();
        
        if (localStorage.getItem('aiva-theme-preference') === 'dark') {
            document.documentElement.classList.add('dark');
        }

        const unsubscribe = realtimeService.subscribeToPipeline(() => {
            fetchData(true);
        });

        return () => unsubscribe();
    }, [hubRefreshKey]);

    const metrics = useMemo(() => {
        const now = new Date();
        const safePipeline = pipeline || [];
        const activeList = safePipeline.filter(h => h?.status?.toLowerCase() === 'in_progress' || !h?.status || h?.status?.toLowerCase() === 'pending');
        const active = activeList.length;
        const completedCount = safePipeline.filter(h => h?.status?.toLowerCase() === 'completed' || (h?.step_reached || 0) >= 7).length;
        
        const stalledList = safePipeline.filter(h => {
            if (h?.status?.toLowerCase() === 'completed' || (h?.step_reached || 0) >= 7) return false;
            const updatedTime = h?.updated_at || h?.created_at;
            if (!updatedTime) return false;
            const updated = new Date(updatedTime);
            const diffHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
            return diffHours > 24;
        });
        
        const pendingCountersignCount = safePipeline.filter(h => 
            h?.metadata?.contract_status === 'signed' && !h?.metadata?.countersigned_at
        ).length;

        // "Attention Needed" card should include BOTH stalled hires AND pending countersigns
        const stalled = stalledList.length + pendingCountersignCount;

        return { active, stalled, stalledList, pendingCountersignCount, completedCount };
    }, [pipeline]);

    const cycleDisplay = useMemo(() => {
        const avgDays = serverMetrics?.avg_days_to_complete 
            ? parseFloat(serverMetrics.avg_days_to_complete) 
            : null;

        if (avgDays === null || isNaN(avgDays)) return '< 1 day';
        if (avgDays < 1) return `${Math.max(1, Math.round(avgDays * 24))}h`;
        if (avgDays === 1) return '1 Day';
        return `${avgDays.toFixed(1)} Days`;
    }, [serverMetrics]);

    const filteredRecentActivity = useMemo(() => {
        const now = new Date();
        const safePipeline = pipeline || [];
        let list = safePipeline.map(hire => ({
            name: hire?.staff_name || 'Unknown',
            step: hire?.step_reached || 1,
            status: hire?.status?.toLowerCase() || 'pending',
            updatedAt: hire?.updated_at || hire?.created_at || now.toISOString(),
            profilePhoto: hire?.metadata?.profile_photo_url || null,
            id: hire?.id || Math.random().toString(),
            raw: hire
        }));

        if (overviewFilter === 'stalled') {
            list = list.filter(h => {
                if (h.status === 'completed' || h.step >= 7) return false;
                const diffHours = (now.getTime() - new Date(h.updatedAt).getTime()) / (1000 * 60 * 60);
                return diffHours > 24;
            });
        } else if (overviewFilter === 'in-progress') {
            list = list.filter(h => h.status !== 'completed' && h.step < 7);
        } else if (overviewFilter === 'completed') {
            list = list.filter(h => h.status === 'completed' || h.step >= 7);
        }

        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20);
    }, [pipeline, overviewFilter]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const managerName = currentUser?.name?.split(' ')[0] || (persona && (USER_PERSONAS as any)[persona]?.name) || 'Manager';

    const formatTimeAgo = (t: string) => {
        if (!t) return '';
        const s = Math.floor((new Date().getTime() - new Date(t).getTime()) / 1000);
        if (s < 60) return 'now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    const handleActivityClick = (hire: any) => {
        const contractStatus = hire?.metadata?.contract_status?.toLowerCase();
        
        if (contractStatus === 'signed' && (hire?.step_reached || 0) >= 6) {
            if (setCurrentHire) setCurrentHire(hire);
            if (setCurrentHireId) setCurrentHireId(hire?.id);
            
            const contractUrl = hire?.metadata?.signed_pdf_path || 
                'https://storage.googleapis.com/gemynd-public/projects/aiva/documents/Nashua%20Paarl%20Employment%20Contract%20Template_3.pdf';
            if (openMedia) openMedia(contractUrl);
        } else {
            if (hire?.id) {
                setFocusedHireId(hire.id);
                setHomeActiveTab('pipeline');
            }
        }
    };

    return (
        <div className="p-6 md:p-10 bg-[#f8f9fb] dark:bg-transparent min-h-full transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-4 pb-10">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">{getGreeting()}, {managerName}</h1>
                        <div className="flex items-center gap-3 mt-1">
                             <p className="text-sm text-slate-500 dark:text-slate-400">
                                Onboarding overview and hiring activity.
                                <span className="text-[8px] text-slate-300 dark:text-slate-600 ml-3 uppercase tracking-widest font-black">
                                    Last Sync {lastRefresh.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                             </p>
                             <button 
                                onClick={() => { triggerHubRefresh(); fetchData(); }} 
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all text-slate-400"
                                title="Refresh"
                             >
                                <Loader2 className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
                             </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    
                    <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                            <QuickStat label="Active Hires" value={metrics?.active || 0} color="text-[#0d9488]" bgColor="bg-teal-50 dark:bg-teal-500/5" borderClass="border-teal-200 dark:border-teal-500/20" loading={loading} onClick={() => setHomeActiveTab('pipeline')} />
                            <QuickStat label="Attention Needed" value={metrics?.stalled || 0} color={(metrics?.stalled || 0) > 0 ? "text-amber-600" : "text-emerald-600"} bgColor={(metrics?.stalled || 0) > 0 ? "bg-amber-50 dark:bg-amber-500/5" : "bg-emerald-50 dark:bg-emerald-500/5"} borderClass={(metrics?.stalled || 0) > 0 ? "border-amber-200 dark:border-amber-500/20" : "border-emerald-200 dark:border-emerald-500/20"} loading={loading} onClick={() => { setOverviewFilter('stalled'); setHomeActiveTab('overview'); }} />
                            <QuickStat label="Fully Onboarded" value={metrics?.completedCount || 0} color="text-emerald-600" bgColor="bg-emerald-50 dark:bg-emerald-500/5" borderClass="border-emerald-200 dark:border-emerald-500/20" loading={loading} onClick={() => { setOverviewFilter('completed'); setHomeActiveTab('overview'); }} />
                            <QuickStat label="Avg. Cycle Time" value={cycleDisplay} color="text-blue-600" bgColor="bg-blue-50 dark:bg-blue-500/5" borderClass="border-blue-200 dark:border-blue-500/20" loading={loading} />
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit shadow-sm border border-slate-200 dark:border-white/5 overflow-x-auto max-w-full">
                            <TabButton label="Overview" icon={LayoutDashboard} active={homeActiveTab === 'overview'} onClick={() => setHomeActiveTab('overview')} />
                            <TabButton label="Pipeline" icon={Users} active={homeActiveTab === 'pipeline'} onClick={() => setHomeActiveTab('pipeline')} badge={metrics?.active || 0} />
                            <TabButton label="Dispatch" icon={Send} active={homeActiveTab === 'dispatch'} onClick={() => setHomeActiveTab('dispatch')} />
                            <TabButton label="Documents" icon={FileText} active={homeActiveTab === 'documents'} onClick={() => setHomeActiveTab('documents')} />
                            <TabButton label="HR Sync" icon={Database} active={homeActiveTab === 'hr_sync'} onClick={() => setHomeActiveTab('hr_sync')} />
                        </div>

                        {homeActiveTab === 'overview' && (
                            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm animate-fadeIn">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hiring Activity Stream</h3>
                                    
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                                        {(['all', 'stalled', 'in-progress', 'completed'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setOverviewFilter(f)}
                                                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${overviewFilter === f ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {f.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-0 max-h-[420px] overflow-y-auto copilot-scrollbar pr-2">
                                    {filteredRecentActivity.length > 0 ? filteredRecentActivity.map((item) => (
                                        <ActivityItem key={item.id} item={item} formatTime={formatTimeAgo} onClick={() => handleActivityClick(item.raw)} />
                                    )) : (
                                        <div className="py-24 text-center">
                                            <Activity className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4 opacity-50" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No hiring activity yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {homeActiveTab === 'pipeline' && <OnboardingPipeline />}
                        {homeActiveTab === 'dispatch' && <QrCodeGenerator />}
                        {homeActiveTab === 'documents' && <DocumentVault />}
                        {homeActiveTab === 'hr_sync' && <HRSyncTab />}
                    </div>

                    <div className="lg:col-span-4 space-y-4 order-2 lg:order-1 lg:sticky lg:top-8">
                        <div className="bg-[#0f172a] p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000 hidden md:block">
                                <Sparkles className="w-48 h-48 text-[#0d9488]" />
                            </div>
                            <div className="relative z-10 space-y-3 md:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border-2 border-[#0d9488]/40 shrink-0">
                                        <video src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-bold text-[#0d9488] uppercase tracking-[0.15em]">HR Assistant</p>
                                        <h4 className="text-base md:text-xl font-bold italic tracking-tighter uppercase">AIVA IS ONLINE</h4>
                                    </div>
                                    <button onClick={() => setIsCopilotOpen(true)} className="md:hidden px-4 py-2 bg-[#0d9488] text-white font-bold rounded-lg uppercase tracking-widest text-[8px] shrink-0">Brief</button>
                                </div>
                                <p className="hidden md:block text-[11px] text-slate-400 font-medium leading-relaxed italic tracking-tight">
                                    {(pipeline || []).length === 0 && "No hires yet. Use Dispatch to send onboarding invites."}
                                    {(pipeline || []).length > 0 && (metrics?.active || 0) === 0 && `${(pipeline || []).length} employee${(pipeline || []).length > 1 ? 's' : ''} in registry. All onboarding complete.`}
                                    {(metrics?.active || 0) > 0 && `${metrics.active} active onboarding${metrics.active > 1 ? 's' : ''} in progress.`}
                                </p>

                                {/* Proactive nudge — shows when there's actionable data */}
                                {metrics?.stalledList?.length > 0 ? (
                                    <div className="mt-3 px-3 py-2.5 bg-white/10 rounded-xl animate-fadeIn">
                                        <p className="text-[10px] text-white/80 leading-relaxed">
                                            <span className="font-bold text-amber-400">⚡</span>{' '}
                                            {metrics.stalledList.length} hire{metrics.stalledList.length > 1 ? 's' : ''} stalled 
                                            for 24h+. Want me to send a nudge?
                                        </p>
                                    </div>
                                ) : (metrics?.pendingCountersignCount || 0) > 0 ? (
                                    <div className="mt-3 px-3 py-2.5 bg-white/10 rounded-xl animate-fadeIn">
                                        <p className="text-[10px] text-white/80 leading-relaxed">
                                            <span className="font-bold text-teal-400">📋</span>{' '}
                                            {metrics.pendingCountersignCount} contract{metrics.pendingCountersignCount > 1 ? 's' : ''} awaiting 
                                            your countersignature.
                                        </p>
                                    </div>
                                ) : (pipeline || []).filter(h => h?.status === 'in_progress').length > 0 ? (
                                    <div className="mt-3 px-3 py-2.5 bg-white/10 rounded-xl animate-fadeIn">
                                        <p className="text-[10px] text-white/80 leading-relaxed">
                                            <span className="font-bold text-emerald-400">✅</span>{' '}
                                            All hires progressing smoothly. No action needed.
                                        </p>
                                    </div>
                                ) : null}

                                <button onClick={() => setIsCopilotOpen(true)} className="hidden md:flex w-full py-4 bg-[#0d9488] text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-[#0d9488]/20 hover:scale-105 active:scale-[0.98] transition-all items-center justify-center gap-3 border-b-4 border-[#0a7c72]">
                                    <MessageCircle className="w-4 h-4" /> TALK TO AIVA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 

export default StaffDashboard;