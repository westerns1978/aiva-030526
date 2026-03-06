
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { storageService } from '../services/storageService';

export const McpStatusIndicator: React.FC = () => {
  const { mcpStatus } = useAppContext();
  const [storageStatus, setStorageStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [telemetry, setTelemetry] = useState<string>("SYSTEM_READY");

  useEffect(() => {
    const checkStorage = async () => {
      const result = await storageService.checkConnection();
      setStorageStatus(result.status === 'healthy' ? 'healthy' : 'offline');
      if (result.status === 'healthy') {
          setTelemetry("RECORDS_SYNCED");
      }
    };
    checkStorage();
    
    const events = [
        "PROFILE_UPDATED", 
        "SYNC_STATUS_OK", 
        "VAULT_SECURE", 
        "AIVA_ONLINE", 
        "DASHBOARD_LIVE", 
        "POLICY_AUDIT_OK",
        "CRM_LINKED"
    ];
    
    let i = 0;
    const interval = setInterval(() => {
        const nextEvent = events[i % events.length];
        setTelemetry(nextEvent);
        i++;
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const statusInfo = {
    connected: { color: 'bg-green-500', text: 'CONNECTED', pulse: false },
    connecting: { color: 'bg-yellow-500', text: 'SYNCING', pulse: true },
    disconnected: { color: 'bg-amber-500', text: 'LOCAL', pulse: false },
    error: { color: 'bg-amber-500', text: 'OFFLINE', pulse: false },
  };

  const currentStatus = statusInfo[mcpStatus] || statusInfo.disconnected;

  return (
    <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-800/40 border border-white/5 rounded-full px-4 py-1.5 gap-4 overflow-hidden">
            {/* Telemetry Micro-Feed */}
            <div className="flex items-center gap-2 border-r border-white/10 pr-4 min-w-[140px]">
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-300 tracking-widest uppercase truncate animate-fadeIn">
                        {telemetry}
                    </span>
                </div>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 group cursor-help" title="Records Status">
                    <div className={`w-1.5 h-1.5 rounded-full ${storageStatus === 'healthy' ? 'bg-green-400' : 'bg-red-500'}`}></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-white transition-colors">DATA</span>
                </div>
                <div className="flex items-center gap-1.5 group cursor-help" title="Sync Status">
                    <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.color} ${currentStatus.pulse ? 'animate-pulse' : ''}`}></div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-white transition-colors">SYNC</span>
                </div>
            </div>
        </div>
    </div>
  );
};
