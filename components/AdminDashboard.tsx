
import React, { useState, useEffect } from 'react';
import { ChartBarIcon, UserGroupIcon, QrCodeIcon, DocumentTextIcon, SparklesIcon, AiSparkIcon, TrendingUpIcon, ClockIcon, StarIcon } from './icons';
import type { PermanentStaff, TechPerformance } from '../types';
import { QrCodeGenerator } from './QrCodeGenerator';
import { useAppContext } from '../context/AppContext';
import { BusinessIntelligenceDashboard } from './bi_dashboard/BusinessIntelligenceDashboard';
import { storageService, type OnboardingRecord } from '../services/storageService';
import { westflow } from '../services/westflowClient';

interface ManagerDashboardProps {
  permanentStaff: PermanentStaff[];
}

const PerformanceHub: React.FC = () => {
    const { initiateContextualChat } = useAppContext();
    const [performanceData, setPerformanceData] = useState<TechPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const resp = await westflow.getTechPerformance();
            if (resp.success) setPerformanceData(resp.data);
            setLoading(false);
        };
        fetchStats();
    }, []);

    const handleAskAiva = (prompt: string) => initiateContextualChat(prompt);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Performance Overview</h3>
                    <p className="text-slate-500 font-medium">Strategic technician development and skill-gap analysis.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleAskAiva("Analyze my team's performance metrics and identify the biggest growth opportunities for this month.")}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                    >
                        <AiSparkIcon className="w-4 h-4" /> Team Audit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Live Technician Telemetry</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            AIVA Sync Stable
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-4">Technician</th>
                                <th className="px-8 py-4">Completion</th>
                                <th className="px-8 py-4">Satisfaction</th>
                                <th className="px-8 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {performanceData.map(tech => (
                                <tr key={tech.tech_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 font-black text-slate-800 dark:text-slate-100">{tech.name}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full bg-brand-secondary" style={{ width: `${tech.call_completion_rate}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{tech.call_completion_rate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-1">
                                            <StarIcon className="w-3 h-3 text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-black">{tech.satisfaction_score}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <button 
                                            onClick={() => handleAskAiva(`Give me a detailed performance review and training recommendations for ${tech.name}.`)}
                                            className="p-2 hover:bg-brand-primary/10 rounded-lg text-brand-primary transition-all"
                                        >
                                            <TrendingUpIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><AiSparkIcon className="w-48 h-48" /></div>
                    <div className="relative z-10 flex-1">
                        <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Training Spotlight</span>
                        <h4 className="text-2xl font-black mt-2 leading-tight uppercase italic">Skill-Gap Intelligence</h4>
                        <div className="mt-8 space-y-6">
                            {[
                                { label: "Solar PWC P1 Certification", count: 3, tech: "Pieter, Mike, Sarah" },
                                { label: "Managed Print: Level 3", count: 1, tech: "Sipho Zulu" },
                                { label: "iNForm CRM Logging", count: 8, tech: "General Sales" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="p-2 bg-white/10 rounded-xl"><ClockIcon className="w-4 h-4 text-brand-secondary" /></div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{item.count} Candidates: {item.tech}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => handleAskAiva("Draft a training schedule for the technical team focusing on the identified skill gaps.")}
                        className="relative z-10 w-full py-4 mt-8 bg-brand-secondary hover:brightness-110 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all shadow-lg"
                    >
                        Draft Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

import { realtimeService } from '../services/realtimeService';

const WorkforceLiveView: React.FC = () => {
    const [records, setRecords] = useState<OnboardingRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await storageService.getOnboardingRecords();
            setRecords(data);
            setLoading(false);
        };
        load();
        const unsubscribe = realtimeService.subscribeToPipeline(() => {
            load();
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="p-20 text-center text-slate-500 font-mono animate-pulse uppercase tracking-widest text-xs">Loading dashboard...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">Live Ingestion Telemetry</h3>
                    <p className="text-sm text-slate-500 font-medium">Real-time monitoring of seasonal worker onboarding sessions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff</span>
                        <span className="text-xl font-black text-brand-secondary">{records.filter(r => r.status === 'in_progress').length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-8 py-5">Worker / ID</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Last Activity</th>
                            <th className="px-8 py-5">Audit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {records.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                <td className="px-8 py-5">
                                    <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{record.full_name}</p>
                                    <p className="text-[10px] font-mono text-slate-400 uppercase">ID: {record.worker_id}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        record.status === 'completed' ? 'bg-green-500/10 text-green-600' : 
                                        record.status === 'in_progress' ? 'bg-brand-secondary/10 text-brand-secondary animate-pulse' : 
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(record.last_action_at).toLocaleTimeString()}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(record.last_action_at).toLocaleDateString()}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand-primary transition-all">
                                        <DocumentTextIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active onboarding sessions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ permanentStaff }) => {
    const [activeTab, setActiveTab] = useState<'analytics' | 'mailroom' | 'strategic' | 'workforce' | 'qr_generator' | 'performance'>('analytics');
    const { setActiveView } = useAppContext();
    
    return (
        <div className="p-6 md:p-10 space-y-6 animate-fadeIn h-full overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <nav className="flex space-x-2 overflow-x-auto p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-[2rem] border border-white/10" aria-label="Tabs">
                    {[
                        { id: 'analytics', label: 'Dashboard', icon: ChartBarIcon },
                        { id: 'performance', label: 'Performance', icon: TrendingUpIcon },
                        { id: 'qr_generator', label: 'Invite Center', icon: QrCodeIcon },
                        { id: 'workforce', label: 'Live Telemetry', icon: UserGroupIcon },
                        { id: 'strategic', label: 'ROI Command', icon: SparklesIcon },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 py-3 px-6 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-sm ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-brand-primary'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-10">
                {activeTab === 'analytics' && <BusinessIntelligenceDashboard />}
                {activeTab === 'performance' && <PerformanceHub />}
                {activeTab === 'strategic' && <div className="p-20 text-center text-slate-400 uppercase font-black tracking-widest">ROI Command Processor Ready...</div>}
                {/* FIX: Removed unused 'workers' prop from QrCodeGenerator as it fetches its own data from WestFlow pipeline */}
                {activeTab === 'qr_generator' && <QrCodeGenerator />}
                {activeTab === 'workforce' && <WorkforceLiveView />}
            </div>
        </div>
    );
};
