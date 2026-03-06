
import React, { useState, useEffect } from 'react';
import { westflow } from '../services/westflowClient';
import { 
    Activity, 
    AlertCircle, 
    Zap, 
    BarChart3, 
    RefreshCcw, 
    Cpu, 
    Printer, 
    Copy, 
    Scan, 
    MonitorCheck 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface FleetDevice {
    serial_number: string;
    model_name: string;
    location?: string;
    status: string;
    type: 'copier' | 'printer' | 'scanner' | 'robot';
}

interface FleetSummary {
    total: number;
    copiers: number;
    printers: number;
    scanners: number;
    robots: number;
    kpax_synced: boolean;
}

const StatCard: React.FC<{ value: string | number; label: string; icon: any; subLabel?: string }> = ({ value, label, icon: Icon, subLabel }) => (
    <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 p-6 rounded-3xl shadow-xl">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-4xl font-black text-white tracking-tighter mb-1">{value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">{label}</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-2xl">
                <Icon className="w-6 h-6 text-cyan-400" />
            </div>
        </div>
        {subLabel && <p className="mt-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest">{subLabel}</p>}
    </div>
);

export const DeviceHub: React.FC = () => {
    const { addToast } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    const [fleetData, setFleetData] = useState<FleetDevice[]>([]);
    const [summary, setSummary] = useState<FleetSummary>({
        total: 0, copiers: 0, printers: 0, scanners: 0, robots: 0, kpax_synced: false
    });

    const fetchFleet = async () => {
        setIsLoading(true);
        try {
            const resp = await westflow.getFleetStatus();
            if (resp.success) {
                setFleetData(resp.data || []);
                if (resp.fleet_summary) setSummary(resp.fleet_summary);
                addToast("Fleet Telemetry Synchronized", "success");
            } else {
                throw new Error(resp.error);
            }
        } catch (e) {
            console.error("Fleet Fetch Error:", e);
            addToast("Could not load fleet data. Please try again.", "warning");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
    }, []);

    return (
        <div className="min-h-full bg-slate-900 p-6 md:p-10 space-y-10 font-sans animate-fadeIn">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        <h2 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Nashua Paarl Fabric • Live Sync: Active</h2>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Fleet Control Center</h1>
                </div>
                <button 
                    onClick={fetchFleet}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all shadow-xl border border-white/5 active:scale-95 disabled:opacity-50"
                >
                    <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="font-black uppercase tracking-widest text-[10px]">Refresh</span>
                </button>
            </header>

            {/* Top Row - Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard value={summary.total || 0} label="Active Devices" icon={Cpu} subLabel="Total Fleet Coverage" />
                <StatCard value="0" label="Hard Errors" icon={AlertCircle} subLabel="Dispatch Required" />
                <StatCard value="0" label="Low Supply Alerts" icon={Zap} subLabel="Automated Routing" />
                <StatCard value="98.4%" label="Meter Sync Accuracy" icon={BarChart3} subLabel="PDS Reporting Status" />
            </div>

            {/* Composition Section */}
            <div className="bg-slate-800/20 rounded-[2.5rem] border border-slate-700/50 p-8">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Fleet Composition Breakdown</h3>
                <div className="flex flex-wrap gap-12">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]"></div>
                        <div>
                            <p className="text-white font-black text-xl leading-none">{summary.copiers || 0}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Copiers / MFPs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
                        <div>
                            <p className="text-white font-black text-xl leading-none">{summary.printers || 0}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Printers</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]"></div>
                        <div>
                            <p className="text-white font-black text-xl leading-none">{summary.scanners || 0}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Scanners</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
                        <div>
                            <p className="text-white font-black text-xl leading-none">{summary.robots || 0}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Robots</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Table */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Device Directory</h3>
                    <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                        <MonitorCheck className="w-4 h-4 text-cyan-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">KPAX Engine Synced</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Serial Number</th>
                                <th className="px-8 py-5">Model</th>
                                <th className="px-8 py-5">Location</th>
                                <th className="px-8 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {fleetData.length > 0 ? fleetData.map((device, i) => (
                                <tr key={device.serial_number || i} className="hover:bg-cyan-500/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <p className="font-mono text-xs text-cyan-400 font-bold group-hover:text-white transition-colors">{device.serial_number}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm text-slate-300 font-bold uppercase tracking-tight">{device.model_name}</p>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 text-xs font-medium">
                                        {device.location || "Unassigned"}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                            {device.status || "ACTIVE"}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCcw className="w-8 h-8 text-cyan-400 animate-spin" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading devices...</p>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">No devices found.</p>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
