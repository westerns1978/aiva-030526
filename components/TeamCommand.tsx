
import React, { useState, useEffect, useMemo } from 'react';
import { westflow } from '../services/westflowClient';
import type { SupabaseUser, FdActivity } from '../types';
import { 
    UsersIcon, 
    AiSparkIcon,
    RefreshIcon, 
    CheckCircleIcon, 
    UserCheckIcon,
    StarIcon,
    TrendingUpIcon,
    ExclamationTriangleIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    ChartBarIcon
} from './icons';
import { Trophy, Activity, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const TeamCommand: React.FC = () => {
    const { addToast, triggerSuccessFeedback } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<SupabaseUser[]>([]);
    const [activities, setActivities] = useState<FdActivity[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersData, activitiesData] = await Promise.all([
                westflow.getTeamUsers(),
                westflow.getFdActivities()
            ]);
            setUsers(usersData || []);
            setActivities(activitiesData || []);
        } catch (e) {
            addToast("Data Uplink Interrupted", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const totalBillableHours = useMemo(() => activities.reduce((acc, act) => acc + (act.billable_hours || 0), 0), [activities]);
    
    const leaderboard = useMemo(() => {
        const stats = users.map(user => {
            const userHours = activities
                .filter(act => act.fd_agent_id && act.fd_agent_id === user.fd_agent_id)
                .reduce((acc, act) => acc + (act.billable_hours || 0), 0);
            return {
                ...user,
                total_hours: userHours,
                revenue_flow: userHours * 450 // Strategic Revenue Factor
            };
        });
        return stats.sort((a, b) => b.total_hours - a.total_hours);
    }, [users, activities]);

    const maxHours = Math.max(...leaderboard.map(u => u.total_hours)) || 1;
    const maxRev = Math.max(...leaderboard.map(u => u.revenue_flow)) || 1;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <RefreshIcon className="w-10 h-10 text-brand-secondary animate-spin" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Querying Workforce Nodes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-12">
            
            {/* Top AI Audit Alert */}
            <div className="bg-slate-900/60 backdrop-blur-xl border-l-4 border-cyan-500 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl group">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-48 h-48 text-cyan-500" /></div>
                <div className="flex items-start gap-6">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-400">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Aiva Workforce Audit</h3>
                        <p className="text-lg text-slate-100 font-medium leading-relaxed italic max-w-4xl">
                            "Team utilization is currently trending at {Math.round((totalBillableHours/(8*users.length))*100)}%. Analysis suggests focusing on technical certifications for the bottom decile to drive Q4 revenue growth."
                        </p>
                        <button className="mt-4 text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                            Full Analytics <ChevronRightIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Section: Matrix and Stats */}
                <div className="lg:col-span-3 space-y-8">
                    
                    {/* Main Chart Card */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-10 rounded-[3rem] shadow-2xl relative">
                        <div className="flex items-center justify-between mb-12">
                             <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Energy Distribution Matrix</h3>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billable Hours</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue Flow</span>
                                </div>
                             </div>
                        </div>

                        <div className="h-80 flex items-end justify-between gap-6 px-4 border-b border-white/5 pb-6">
                            {leaderboard.slice(0, 8).map((tech) => (
                                <div key={tech.id} className="flex-1 flex flex-col items-center group">
                                    <div className="flex items-end gap-1.5 w-full h-full">
                                        <div 
                                            className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all duration-1000 group-hover:brightness-125 shadow-[0_0_20px_rgba(34,211,238,0.2)]" 
                                            style={{ height: `${Math.max(5, (tech.total_hours / maxHours) * 100)}%` }}
                                        ></div>
                                        <div 
                                            className="flex-1 bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-lg transition-all duration-1000 group-hover:brightness-125 shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                                            style={{ height: `${Math.max(10, (tech.revenue_flow / maxRev) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mt-4 truncate w-full text-center group-hover:text-white transition-colors">{tech.full_name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activities List */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Operations Stream
                            </h3>
                            <button onClick={fetchData} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <RefreshIcon className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto copilot-scrollbar">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {activities.length > 0 ? activities.map((act, i) => {
                                        const user = users.find(u => u.fd_agent_id === act.fd_agent_id);
                                        return (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-black text-[10px] text-brand-primary border border-brand-primary/5">{user?.full_name?.[0] || 'S'}</div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">{user?.full_name || 'System Node'}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{act.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="inline-flex items-center gap-3">
                                                        <span className="text-xs font-mono text-brand-secondary font-black">{act.billable_hours?.toFixed(2)}h</span>
                                                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${act.status === 'Complete' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{act.status}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={2} className="px-8 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">No recent activities detected.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">
                    
                    {/* Throughput Card */}
                    <div className="bg-brand-primary rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><ChartBarIcon className="w-24 h-24 text-white" /></div>
                        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-8">Fabric Throughput</h3>
                        <div className="space-y-6">
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total Billable Units</p>
                                <p className="text-4xl font-black text-white tracking-tighter">{totalBillableHours.toFixed(1)} <span className="text-xs uppercase text-white/40">hrs</span></p>
                            </div>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Fleet Node Count</p>
                                <p className="text-4xl font-black text-white tracking-tighter">{users.length} <span className="text-xs uppercase text-white/40">active</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Elite Leaderboard */}
                    <div className="bg-slate-900 border border-white/5 p-8 rounded-[3rem] shadow-2xl flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-voltage" /> Rewards Hub
                            </h3>
                            <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest border border-cyan-400/30 px-2 py-0.5 rounded">Live Points</span>
                        </div>
                        
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-8">Top Technicians</h4>

                        <div className="flex-1 space-y-2 overflow-y-auto copilot-scrollbar pr-2">
                            {leaderboard.map((user, i) => (
                                <div key={user.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs font-black text-slate-600 w-4">{i + 1}</div>
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
                                            {i < 3 ? <StarIcon className="w-5 h-5 text-voltage fill-voltage" /> : <UserCheckIcon className="w-5 h-5 text-slate-500" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{user.full_name}</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase">{user.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-cyan-400">{Math.round(user.total_hours * 10)} pts</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
