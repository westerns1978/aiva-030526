
import React from 'react';
import { ShieldCheckIcon } from '../icons';
import { StrategicForesight } from './StrategicForesight';
import { Activity, Timer, Zap, Radio, Globe, BarChart2, TrendingUp, Users } from 'lucide-react';

const MetricCard: React.FC<{ title: string; value: string; trend: string; icon: any; color: string; bgColor: string }> = ({ title, value, trend, icon: Icon, color, bgColor }) => (
    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-brand-primary/30 transition-all relative overflow-hidden group">
        <div className={`absolute -right-8 -bottom-8 p-12 opacity-[0.04] group-hover:opacity-[0.1] transition-all duration-1000 group-hover:scale-125 ${color}`}>
            <Icon className="w-48 h-48" />
        </div>
        <div className="relative z-10">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-slate-100 shadow-sm ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-10 h-10" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">{title}</p>
            <h4 className="text-5xl font-black text-slate-900 tracking-tighter italic mb-6">{value}</h4>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <TrendingUp className={`w-4 h-4 ${color}`} />
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{trend}</p>
            </div>
        </div>
    </div>
);

const TelemetryRow: React.FC<{ name: string; activity: string; status: 'active' | 'warning'; time: string }> = ({ name, activity, status, time }) => (
    <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 transition-all hover:bg-slate-50 hover:shadow-xl group cursor-pointer">
        <div className="flex items-center gap-6">
            <div className="relative shrink-0">
                <div className={`w-3.5 h-3.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                {status === 'active' && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30"></div>}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 uppercase truncate group-hover:text-brand-primary transition-colors">{name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] truncate mt-1">{activity}</p>
            </div>
        </div>
        <div className="text-right shrink-0">
            <p className="text-[10px] font-mono text-slate-400 font-black">{time}</p>
        </div>
    </div>
);

export const BusinessIntelligenceDashboard: React.FC = () => {
  return (
    <div className="space-y-10 animate-fadeIn">
      
      {/* 1. TOP METRIC LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard title="Induction Speed" value="3.2 Days" trend="64.8% Time Reduction" icon={Timer} color="text-brand-primary" bgColor="bg-brand-primary/5" />
          <MetricCard title="Audit Readiness" value="98.4%" trend="POPIA Compliant" icon={ShieldCheckIcon} color="text-emerald-600" bgColor="bg-emerald-50" />
          <MetricCard title="Admin Savings" value="R 345k" trend="Annual Ops Reclaim" icon={Zap} color="text-amber-500" bgColor="bg-amber-50" />
          <MetricCard title="Registry Nodes" value="50" trend="Active Personnel Data" icon={Users} color="text-indigo-600" bgColor="bg-indigo-50" />
      </div>

      {/* 2. CORE INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
              <StrategicForesight />
          </div>

          {/* Real-time Telemetry Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-[4rem] p-12 border border-slate-200 shadow-2xl flex flex-col relative overflow-hidden h-fit sticky top-28">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none -rotate-12"><Radio className="w-80 h-80 text-brand-primary" /></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-14">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Team Pulse</h3>
                            <p className="text-[11px] text-brand-primary font-black uppercase tracking-[0.4em] mt-4">Live Operational Uplink</p>
                        </div>
                        <div className="p-5 bg-brand-primary/5 rounded-[1.5rem] border border-brand-primary/10 shadow-inner">
                            <Activity className="w-8 h-8 text-brand-primary" />
                        </div>
                    </div>

                    <div className="space-y-4 mb-14">
                        <TelemetryRow name="Sipho Zulu" activity="Field Repair: Cluster NP-3" status="active" time="0.4s ago" />
                        <TelemetryRow name="Pieter van Zyl" activity="Sales Matrix: West Coast" status="active" time="1.2s ago" />
                        <TelemetryRow name="Kobus Pretorius" activity="Step 4: Remuneration Link" status="warning" time="STALLED" />
                        <TelemetryRow name="Anna Jacobs" activity="Registry: Ingestion Sync" status="active" time="2.1s ago" />
                        <TelemetryRow name="Lerato Dlamini" activity="Operational Drift Detected" status="active" time="0.1s ago" />
                    </div>

                    <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 space-y-8 shadow-inner">
                        <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-brand-primary" />
                                <span>Mesh Sync Status</span>
                            </div>
                            <span className="text-emerald-600">STABLE</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-brand-primary" style={{ width: '84%' }}></div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm"><BarChart2 className="w-6 h-6 text-brand-primary" /></div>
                             <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Utilization: 92% System Efficiency</p>
                        </div>
                    </div>
                </div>
          </div>
      </div>
    </div>
  );
};
