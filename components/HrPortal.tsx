
import React, { useState, useEffect } from 'react';
import { HrContent } from './hr_portal/HrContent';
import { HR_POLICY_SECTIONS, HrSectionId, FULL_POLICY_TEXT } from '../constants/hrConstants';
import { BookOpenIcon, PlusIcon, CloudIcon, AiSparkIcon, SparklesIcon, CheckCircleIcon, CloseIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { storageService, type AgentKnowledgeRecord } from '../services/storageService';
import { generateContent } from '../services/geminiService';

const HrPortal: React.FC = () => {
    const { isManager, addToast } = useAppContext();
    const [activeHrSection, setActiveHrSection] = useState<HrSectionId | 'manual' | 'dynamic'>('home');
    const [isIngesting, setIsIngesting] = useState(false);
    const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [dynamicKnowledge, setDynamicKnowledge] = useState<AgentKnowledgeRecord[]>([]);

    useEffect(() => {
        loadDynamicKnowledge();
    }, []);

    const loadDynamicKnowledge = async () => {
        const records = await storageService.getAgentKnowledge();
        setDynamicKnowledge(records);
    };

    const handleAIEnhance = async () => {
        if (!newKnowledge.content) return;
        setIsSaving(true);
        addToast("Aiva Reasoning: Structuring Policy...", "info");
        try {
            const prompt = `Convert the following rough notes into a formal, professional HR policy section for Nashua Paarl. Use standard corporate formatting. Notes: ${newKnowledge.content}`;
            const enhanced = await generateContent(prompt);
            setNewKnowledge(prev => ({ ...prev, content: enhanced }));
            addToast("Policy Enhanced by Gemini.", "success");
        } catch (e) {
            addToast("AI Enhancement failed.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveKnowledge = async () => {
        if (!newKnowledge.title || !newKnowledge.content) {
            addToast("Title and Content are required.", "warning");
            return;
        }
        setIsSaving(true);
        try {
            await storageService.saveKnowledge(newKnowledge);
            addToast("Knowledge Pulsed to Supabase Mesh.", "success");
            setNewKnowledge({ title: '', content: '' });
            setIsIngesting(false);
            loadDynamicKnowledge();
        } catch (e) {
            addToast("Ingestion Failure.", "error");
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto copilot-scrollbar">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark dark:text-white mb-2 italic uppercase tracking-tighter">Strategic Knowledge Hub</h1>
                    <p className="text-slate-600 dark:text-slate-400">Explore core policies or contribute to the dynamic organization brain.</p>
                </div>
                {isManager && (
                    <button 
                        onClick={() => setIsIngesting(!isIngesting)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${isIngesting ? 'bg-slate-800 text-white' : 'bg-voltage text-slate-900 hover:scale-105'}`}
                    >
                        {isIngesting ? <CloseIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                        {isIngesting ? 'Close Editor' : 'Ingest Knowledge'}
                    </button>
                )}
            </div>

            {isIngesting && (
                <div className="mb-10 p-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-voltage/30 shadow-2xl animate-fadeIn">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-voltage/20 rounded-2xl">
                            <CloudIcon className="w-6 h-6 text-voltage" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Neural Ingestion Portal</h3>
                            <p className="text-[10px] text-voltage font-bold uppercase">Target: agent_knowledge table</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Record Title</label>
                            <input 
                                type="text"
                                value={newKnowledge.title}
                                onChange={(e) => setNewKnowledge({...newKnowledge, title: e.target.value})}
                                placeholder="e.g. Remote Work Policy Addendum"
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:border-voltage/50 outline-none transition-all shadow-inner"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Strategic Content</label>
                            <textarea 
                                value={newKnowledge.content}
                                onChange={(e) => setNewKnowledge({...newKnowledge, content: e.target.value})}
                                placeholder="Paste policy text or rough notes here..."
                                rows={6}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-medium focus:border-voltage/50 outline-none transition-all shadow-inner copilot-scrollbar"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={handleAIEnhance}
                                disabled={isSaving || !newKnowledge.content}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                AI Structural Check
                            </button>
                            <button 
                                onClick={handleSaveKnowledge}
                                disabled={isSaving || !newKnowledge.title}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-voltage text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Pulse to Brain
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="border-b border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto copilot-scrollbar">
                <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Policy Sections">
                    {HR_POLICY_SECTIONS.map(({ id, title, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveHrSection(id)}
                            className={`whitespace-nowrap group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-black text-[11px] uppercase tracking-widest transition-all ${
                                activeHrSection === id
                                ? 'border-voltage text-voltage'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            {title}
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveHrSection('dynamic')}
                        className={`whitespace-nowrap group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-black text-[11px] uppercase tracking-widest transition-all ${
                            activeHrSection === 'dynamic'
                            ? 'border-voltage text-voltage'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <AiSparkIcon className="w-5 h-5" />
                        Aiva Brain
                    </button>
                    <button
                        onClick={() => setActiveHrSection('manual')}
                        className={`whitespace-nowrap group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-black text-[11px] uppercase tracking-widest transition-all ${
                            activeHrSection === 'manual'
                            ? 'border-voltage text-voltage'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
                        }`}
                    >
                        <BookOpenIcon className="w-5 h-5" />
                        Full Manual
                    </button>
                </nav>
            </div>
            
            {activeHrSection === 'manual' ? (
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 animate-fadeIn">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-8 uppercase tracking-tighter">Core Strategic Manual</h2>
                    <div className="hr-prose max-w-none text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {FULL_POLICY_TEXT}
                    </div>
                </div>
            ) : activeHrSection === 'dynamic' ? (
                <div className="space-y-6 animate-fadeIn">
                    {dynamicKnowledge.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 flex flex-col items-center">
                            <AiSparkIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest text-xs">Aiva brain has no dynamic memories yet.</p>
                        </div>
                    ) : (
                        dynamicKnowledge.map(record => (
                            <div key={record.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-voltage transition-colors">{record.title}</h3>
                                    <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded uppercase tracking-widest text-slate-500">Pulsed {new Date(record.created_at!).toLocaleDateString()}</span>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap italic opacity-80">
                                    {record.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <HrContent activeSectionId={activeHrSection} />
            )}
        </div>
    );
};

export default HrPortal;
