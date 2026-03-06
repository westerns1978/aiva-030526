
import React from 'react';
import { BI_MOCK_DATA } from '../../constants/biMockData';
import { AiSparkIcon, ShieldCheckIcon, TrendingUpIcon, StarIcon, FaceSmileIcon, ExclamationTriangleIcon } from '../icons';
import { useAppContext } from '../../context/AppContext';

export const StrategicForesight: React.FC = () => {
    const { initiateContextualChat } = useAppContext();
    const { prescriptive_insights, workforce } = BI_MOCK_DATA;

    const getInsightColor = (type: string) => {
        if (type === 'risk') return 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400';
        if (type === 'opportunity') return 'border-brand-secondary bg-blue-50 dark:bg-blue-900/10 text-brand-secondary dark:text-blue-400';
        return 'border-voltage bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Prescriptive Action Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <AiSparkIcon className="w-6 h-6 text-brand-secondary" />
                        Strategic Prescriptions
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Powered by Gemini Foresight</span>
                </div>
                
                <div className="space-y-4">
                    {prescriptive_insights.map(insight => (
                        <div key={insight.id} className={`p-6 rounded-3xl border-2 transition-all hover:scale-[1.01] ${getInsightColor(insight.type)}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h4 className="font-black uppercase text-sm tracking-tight mb-2">{insight.title}</h4>
                                    <p className="text-sm font-medium opacity-80 leading-relaxed mb-4">{insight.description}</p>
                                    <button 
                                        onClick={() => initiateContextualChat(`Aiva, execute strategic action: ${insight.title}. Give me a step-by-step implementation plan.`)}
                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm hover:shadow-md transition-all border border-current"
                                    >
                                        {insight.actionLabel}
                                    </button>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black uppercase mb-1 opacity-60">Impact</p>
                                    <p className="text-2xl font-black">{insight.impactScore}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Neural Vibe Check */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col border border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FaceSmileIcon className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Workforce Vibe Meter</span>
                    <h4 className="text-2xl font-black mt-2 leading-tight uppercase italic mb-8">Neural Sentiment</h4>
                    
                    <div className="flex flex-col items-center justify-center my-10">
                        <div className="relative w-40 h-40">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray={440} strokeDashoffset={440 - (workforce.sentiment_vibe / 100) * 440}
                                    className="text-green-500 transition-all duration-1000" />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black">{workforce.sentiment_vibe}%</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Positive</span>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <TrendingUpIcon className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Retention</span>
                            </div>
                            <span className="text-xs font-mono text-green-400">+12% vs LY</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Burnout Risk</span>
                            </div>
                            <span className="text-xs font-mono text-amber-400">{workforce.burnout_risk_score}% LOW</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => initiateContextualChat("Aiva, perform a deep-dive sentiment analysis on the Tech department interactions from the last 30 days.")}
                    className="relative z-10 w-full py-4 mt-auto bg-brand-secondary hover:brightness-110 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all shadow-lg"
                >
                    Extract Deep Vibe
                </button>
            </div>
        </div>
    );
};
