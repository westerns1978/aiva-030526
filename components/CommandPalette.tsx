
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { MagnifyingGlassIcon, QrCodeIcon, ChartBarIcon, BookOpenIcon, UserGroupIcon, SparklesIcon, MoonIcon, SunIcon, ClipboardDocumentListIcon } from './icons';

export const CommandPalette: React.FC = () => {
    const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveView, isManager, openModal, setTheme, theme, initiateContextualChat } = useAppContext();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const commands = [
        { id: 'nav-dash', title: 'Go to Dashboard', icon: ChartBarIcon, action: () => setActiveView('home') },
        { id: 'nav-train', title: 'Go to Training Center', icon: BookOpenIcon, action: () => setActiveView('training') },
        { id: 'nav-onboarding', title: 'Start Employee Onboarding', icon: ClipboardDocumentListIcon, action: () => setActiveView('onboarding') },
        // FIX: Changed 'managerDashboard' to 'managerHub' to match the AppView union type defined in types.ts
        { id: 'tool-bi', title: 'Open BI Dashboard', icon: ChartBarIcon, action: () => setActiveView('managerHub'), managerOnly: true },
        { id: 'ai-stay', title: 'Request Stay Interview Analysis', icon: UserGroupIcon, action: () => initiateContextualChat("Aiva, analyze recent team friction metrics and suggest candidates for a Stay Interview.") },
        { id: 'theme-toggle', title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? SunIcon : MoonIcon, action: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    ];

    // Handle special "onboard [name]" command
    const handleCommandAction = (cmd: any) => {
        if (query.toLowerCase().startsWith('onboard ')) {
            const name = query.substring(8);
            setActiveView('onboarding');
            initiateContextualChat(`I am beginning the induction for ${name}. Activate Step 1: Offer to Employ verification.`);
        } else {
            cmd.action();
        }
        setIsCommandPaletteOpen(false);
    };

    const filteredCommands = commands.filter(c => 
        (!c.managerOnly || isManager) && 
        c.title.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isCommandPaletteOpen) {
            const timer = setTimeout(() => {
                setQuery('');
                inputRef.current?.focus();
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isCommandPaletteOpen]);

    if (!isCommandPaletteOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => setIsCommandPaletteOpen(false)}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 mr-3" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Type 'onboard [name]' or a command..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white text-lg placeholder-slate-400"
                    />
                    <kbd className="hidden sm:block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-mono text-slate-500">ESC</kbd>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                    {query.toLowerCase().startsWith('onboard ') && (
                         <button
                            onClick={() => handleCommandAction({})}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-voltage/10 text-slate-900 dark:text-white transition-colors text-left group"
                        >
                            <div className="p-2 bg-voltage rounded-lg">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-slate-900" />
                            </div>
                            <span className="font-black italic uppercase tracking-tighter">Execute Numerical Sequence for: {query.substring(8)}</span>
                        </button>
                    )}
                    {filteredCommands.length > 0 ? filteredCommands.map(cmd => (
                        <button
                            key={cmd.id}
                            onClick={() => handleCommandAction(cmd)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                        >
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-brand-secondary group-hover:text-white transition-colors">
                                <cmd.icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{cmd.title}</span>
                        </button>
                    )) : !query.toLowerCase().startsWith('onboard ') && (
                        <div className="p-8 text-center text-slate-400">No commands found. Try 'onboard [name]'.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
