
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AiSparkIcon, BanknoteIcon, ShieldCheckIcon, UserGroupIcon, TrendingUpIcon, ArrowRightIcon, ComputerDesktopIcon, SunIcon } from './icons';

const RoadmapStep: React.FC<{ label: string; active: boolean; index: number }> = ({ label, active, index }) => (
    <div className="flex-1 flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-700 mb-2 z-10 ${active ? 'bg-brand-secondary text-white ring-4 ring-brand-secondary/30 scale-110 shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
            {index + 1}
        </div>
        <p className={`text-[10px] uppercase font-bold text-center leading-tight ${active ? 'text-brand-secondary' : 'text-slate-400'}`}>
            {label}
        </p>
    </div>
);

const InsightCard: React.FC<{ title: string; subtitle: string; icon: React.FC<any>; color: string; prompt: string }> = ({ title, subtitle, icon: Icon, color, prompt }) => {
    const { initiateContextualChat } = useAppContext();
    
    return (
        <button 
            onClick={() => initiateContextualChat(prompt)}
            className="group relative overflow-hidden p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 text-left w-full h-full flex flex-col"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon className={`w-24 h-24 ${color}`} />
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color.replace('text-', 'bg-').replace('500', '100')} dark:bg-slate-700`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-brand-secondary transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{subtitle}</p>
            <div className="mt-auto pt-4 flex items-center text-xs font-semibold text-brand-secondary uppercase tracking-wider">
                <AiSparkIcon className="w-4 h-4 mr-1" /> Run Nashua Intelligence
            </div>
        </button>
    );
};

export const StrategicInsights: React.FC = () => {
    const insights = [
        {
            title: "Print to Solar Pivot",
            subtitle: "Analysis of the 20% Security/Solar revenue split. How can Aiva streamline technical training for solar installations?",
            icon: SunIcon,
            color: "text-amber-500",
            prompt: "Analyze our revenue split: 40% Print, 30% IT, 20% Security/Solar. Suggest how Aiva can help field techs in the Security/Solar division stay certified."
        },
        {
            title: "Onboarding ROI (ZAR 345k)",
            subtitle: "Our projected annual savings. How reducing manager time from 3 hours to 45 mins per hire transforms management bandwidth.",
            icon: BanknoteIcon,
            color: "text-green-500",
            prompt: "Explain the ROI of Aiva for a 50-person franchise. Use the 180 min vs 45 min manager time metric and the ZAR 345k projected savings."
        },
        {
            title: "IT Solutions Growth",
            subtitle: "Leveraging Aiva to support our 30% IT/Connectivity division. Automating helpdesk queries to free up senior engineers.",
            icon: ComputerDesktopIcon,
            color: "text-blue-500",
            prompt: "How can Aiva support our IT Solutions department specifically? Focus on reducing internal support queries for the 50 employees."
        },
        {
            title: "Shadow IT Eradication",
            subtitle: "The drop from 15 to 2 WhatsApp-based HR incidents. Impact on our 98% audit completeness and POPIA governance.",
            icon: ShieldCheckIcon,
            color: "text-purple-500",
            prompt: "Explain the strategic importance of eradicating 'Shadow IT' WhatsApp groups at Nashua Paarl. Reference our audit completeness score."
        }
    ];

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto animate-fadeIn bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <AiSparkIcon className="w-5 h-5 text-brand-secondary" />
                            <span className="text-xs font-bold text-brand-secondary uppercase tracking-widest">Nashua Paarl & West Coast</span>
                        </div>
                        <h1 className="text-3xl font-bold text-brand-dark dark:text-white leading-tight">Strategic Intelligence Center</h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
                            Transforming the 50-person workforce from manual repetition to digital intelligence. 
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                         <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Admin Hours Saved</p>
                             <p className="text-xl font-bold text-brand-secondary">112 hrs/mo</p>
                         </div>
                    </div>
                </div>

                {/* Evolutionary Roadmap Visualizer */}
                <div className="bg-brand-dark p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                         <AiSparkIcon className="w-32 h-32 text-brand-secondary" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-8 flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-brand-secondary" />
                        Aiva Maturity Roadmap: Nashua Franchise
                    </h3>
                    <div className="relative flex justify-between items-center gap-2">
                        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-700/50"></div>
                        <RoadmapStep index={0} label="Paper" active={true} />
                        <RoadmapStep index={1} label="Digitized" active={true} />
                        <RoadmapStep index={2} label="Agentic" active={true} />
                        <RoadmapStep index={3} label="Autonomous" active={false} />
                        <RoadmapStep index={4} label="Symbiotic" active={false} />
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-400 font-mono italic">
                            Current Stage: <span className="text-brand-secondary font-bold">AGENTIC (AIVA 2.0)</span>. Next Milestone: Phase 3 (Warehouse Humanoids).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.map((insight, index) => (
                        <InsightCard key={index} {...insight} />
                    ))}
                </div>
                
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-1 rounded-3xl shadow-xl">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[1.4rem] flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0 w-24 h-24 bg-brand-light dark:bg-brand-dark rounded-2xl flex items-center justify-center">
                            <SunIcon className="w-12 h-12 text-brand-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Business Case: The $20k Field Tech Companion</h3>
                            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                                Our <span className="font-bold text-brand-secondary">Security & Solar</span> technicians face high downtime during onboarding. By deploying Aiva Kiosks, we've reduced time-to-productivity by <span className="font-bold text-green-500">64%</span>.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-4">
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Manual Cost</p>
                                    <p className="font-bold text-lg text-red-500">R 12,000 / hire</p>
                                </div>
                                <div className="px-4 py-2 bg-brand-light dark:bg-brand-dark rounded-xl border border-brand-primary/20">
                                    <p className="text-[10px] uppercase font-bold text-brand-primary">Aiva Cost</p>
                                    <p className="font-bold text-lg text-brand-primary">R 3,800 / hire</p>
                                </div>
                                <div className="px-4 py-2 bg-green-50 dark:bg-green-900/40 rounded-xl border border-green-500/20">
                                    <p className="text-[10px] uppercase font-bold text-green-600">Admin Gain</p>
                                    <p className="font-bold text-lg text-green-600">80% Faster</p>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:scale-105 transition-all">
                            View ROI Blueprint <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
