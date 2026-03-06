
import React from 'react';
import { Target, Trophy, Lock, Unlock } from 'lucide-react';

interface GateOpenerGaugeProps {
  currentGP: number;
  target: number; // Usually R50,000
}

export const GateOpenerGauge: React.FC<GateOpenerGaugeProps> = ({ currentGP, target }) => {
  const percentage = Math.min((currentGP / target) * 100, 100);
  const isUnlocked = currentGP >= target;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-panel p-10 rounded-[3.5rem] shadow-xl border-white/20 dark:border-white/5 flex flex-col items-center justify-between relative overflow-hidden group h-full transition-all">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
          <Trophy className="w-48 h-48 text-[#0d9488]" />
      </div>
      
      <div className="text-center w-full z-10">
        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">APPROVAL STATUS</h3>
        <div className="flex items-center justify-center gap-2">
            {isUnlocked ? <Unlock className="w-3 h-3 text-[#0d9488]" /> : <Lock className="w-3 h-3 text-slate-400" />}
            <p className={`text-lg font-black uppercase tracking-tighter ${isUnlocked ? 'text-[#0d9488]' : 'text-slate-500'}`}>
                {isUnlocked ? 'Unlocked' : 'PENDING APPROVAL'}
            </p>
        </div>
      </div>

      <div className="relative w-48 h-48 my-8 z-10 group-hover:scale-105 transition-transform duration-700">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-white/5" />
          <circle 
            cx="96" cy="96" r={radius} 
            stroke="currentColor" strokeWidth="12" fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${isUnlocked ? 'text-[#0d9488]' : 'text-[#0d9488]/40'} transition-all duration-[2000ms] ease-out shadow-[0_0_20px_rgba(13,148,136,0.2)]`} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white">
                R{(currentGP/1000).toFixed(0)}k
            </p>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">GP Margin</span>
        </div>
      </div>

      <div className="w-full space-y-4 z-10">
        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div 
                className="h-full bg-[#0d9488] rounded-full transition-all duration-[2500ms]" 
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
        <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 tracking-widest">
            <div className="flex items-center gap-1.5">
                <Target className="w-2.5 h-2.5" />
                <span>Goal R{target.toLocaleString()}</span>
            </div>
            <span className="text-[#0d9488]">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
