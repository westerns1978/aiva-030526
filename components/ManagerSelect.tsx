import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { MOCK_PERMANENT_STAFF } from '../constants/permanentStaff';

const MANAGER_USERS = [
    { employeeNumber: 'PW293',  name: 'Deon Boshoff',  role: 'Managing Director', branch: 'Nashua Paarl',  avatarUrl: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/deon-boshoff.png' },
    { employeeNumber: 'GEM001', name: 'Derek Flower',  role: 'CEO — Gemynd',      branch: 'Observer',      avatarUrl: 'https://storage.googleapis.com/gemynd-public/projects/aiva/derek-flower.png' },
    { employeeNumber: 'GEM002', name: 'Dan Western',   role: 'CVO — Gemynd',      branch: 'System Admin',  avatarUrl: 'https://storage.googleapis.com/gemynd-public/projects/aiva/dan-western.png' },
];

interface ManagerSelectProps {
    onSelect: () => void;
}

export const ManagerSelect: React.FC<ManagerSelectProps> = ({ onSelect }) => {
    const { setPersona } = useAppContext();
    const [selected, setSelected] = useState<string | null>(null);

    const handleLogin = (empNum: string) => {
        try { localStorage.setItem('aiva-manager-id', empNum); } catch(e) {}
        setSelected(empNum);
        setTimeout(() => {
            setPersona('manager');
            onSelect();
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn">
            {/* Subtle background accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0d9488]"></div>

            <div className="relative z-10 w-full max-w-sm space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-[9px] font-black text-[#0d9488] uppercase tracking-[0.5em] mb-3">
                        Nashua Workforce Central
                    </p>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Who's logging in?
                    </h1>
                </div>

                {/* Manager cards */}
                <div className="space-y-3">
                    {MANAGER_USERS.map(manager => (
                        <button
                            key={manager.employeeNumber}
                            onClick={() => handleLogin(manager.employeeNumber)}
                            disabled={selected !== null}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left shadow-sm
                                ${selected === manager.employeeNumber
                                    ? 'bg-[#0d9488] border-[#0d9488] shadow-lg shadow-[#0d9488]/20 scale-[1.02]'
                                    : selected !== null
                                        ? 'opacity-30 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-[#0d9488] hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                                }`}
                        >
                            <img
                                src={manager.avatarUrl}
                                alt={manager.name}
                                className={`w-14 h-14 rounded-xl object-cover shrink-0 border-2 transition-all ${selected === manager.employeeNumber ? 'border-white/30' : 'border-slate-100 dark:border-white/10'}`}
                            />
                            <div className="min-w-0 flex-1">
                                <p className={`font-black text-base uppercase italic tracking-tight truncate transition-colors ${selected === manager.employeeNumber ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                    {manager.name}
                                </p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 transition-colors ${selected === manager.employeeNumber ? 'text-white/80' : 'text-[#0d9488]'}`}>
                                    {manager.role}
                                </p>
                                <p className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${selected === manager.employeeNumber ? 'text-white/60' : 'text-slate-400'}`}>
                                    {manager.branch}
                                </p>
                            </div>
                            {selected === manager.employeeNumber ? (
                                <div className="ml-auto w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="ml-auto w-7 h-7 rounded-full border-2 border-slate-200 dark:border-white/10 shrink-0 group-hover:border-[#0d9488]" />
                            )}
                        </button>
                    ))}
                </div>

                <p className="text-center text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] pt-2">
                    Powered by Gemynd WestFlow
                </p>
            </div>
        </div>
    );
};
