
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiSparkIcon } from '../icons';
import { Terminal, ShieldCheck, Activity, ChevronRight, FileText } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: string | null;
  isLoading: boolean;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary, isLoading }) => {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl p-10 relative overflow-hidden group min-h-[400px] flex flex-col transition-all hover:border-brand-primary/20">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-[2000ms] group-hover:scale-110 pointer-events-none">
          <FileText className="w-80 h-80 text-brand-primary" />
      </div>

      <header className="flex items-center justify-between mb-12 shrink-0 relative z-10">
          <div className="flex items-center gap-5">
              <div className="p-4 bg-brand-primary rounded-[1.5rem] text-white shadow-xl shadow-brand-primary/20 group-hover:scale-110 transition-transform">
                <AiSparkIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Strategic Synthesis</h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.4em]">Neural Audit Protocol v9.5</p>
                </div>
              </div>
          </div>
          {isLoading && (
              <div className="flex items-center gap-3 px-5 py-2 bg-slate-100 rounded-full border border-slate-200">
                  <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reasoning...</span>
              </div>
          )}
      </header>

      <div className="flex-1 prose prose-slate max-w-none prose-chat leading-relaxed font-medium relative z-10">
        {!isLoading && summary ? (
            <div className="animate-fadeIn text-lg text-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
        ) : !isLoading && !summary ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-6">
                <Activity className="w-16 h-16 opacity-20" />
                <p className="font-black text-sm uppercase tracking-[0.5em] text-slate-400">Listening for Operational Uplink...</p>
            </div>
        ) : (
            <div className="space-y-6 mt-4">
                <div className="h-6 bg-slate-100 rounded-xl w-full animate-pulse"></div>
                <div className="h-6 bg-slate-100 rounded-xl w-[94%] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-6 bg-slate-100 rounded-xl w-[88%] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <div className="h-6 bg-slate-100 rounded-xl w-[91%] animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
        )}
      </div>

      <footer className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between relative z-10">
          <div className="flex gap-8">
              <div className="flex items-center gap-3 group/foot cursor-help">
                  <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100"><ShieldCheck className="w-4 h-4 text-emerald-600" /></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 group-hover/foot:text-slate-900 transition-colors">Audit Verified</span>
              </div>
              <div className="flex items-center gap-3 group/foot cursor-help">
                  <div className="p-1.5 bg-brand-primary/5 rounded-lg border border-brand-primary/10"><Activity className="w-4 h-4 text-brand-primary" /></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 group-hover/foot:text-slate-900 transition-colors">Live Telemetry</span>
              </div>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-primary transition-colors">
              Logical Report Trace <ChevronRight className="w-3.5 h-3.5" />
          </button>
      </footer>
    </div>
  );
};
