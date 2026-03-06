
import React, { useState, useMemo, useEffect } from 'react';
import type { TrainingModule, TrainingModuleType } from '../types';
import { AcademicCapIcon, ChatBubbleBottomCenterTextIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, DevicePhoneMobileIcon, PencilSquareIcon, ShieldCheckIcon, VideoCameraIcon, AiSparkIcon, BookOpenIcon } from './icons';
import { QuizModule } from './training/QuizModule';
import { CertificateView } from './training/CertificateView';
import { FlashcardTrainer } from './FlashcardTrainer';
import { useAppContext } from '../context/AppContext';
import { generateContent } from '../services/geminiService';
import { Search, Info, Zap, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';

interface TrainingCenterProps {
  allModules: TrainingModule[];
}

const ModuleIcon: React.FC<{ type: TrainingModuleType }> = ({ type }) => {
  if (type === 'video') return <VideoCameraIcon className="w-5 h-5" />;
  if (type === 'quiz') return <PencilSquareIcon className="w-5 h-5" />;
  if (type === 'workflow-sandbox') return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
  if (type === 'readiness-lab') return <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />;
  if (type === 'webapp') return <DevicePhoneMobileIcon className="w-5 h-5" />;
  if (type === 'flashcards') return <BookOpenIcon className="w-5 h-5" />;
  return <AcademicCapIcon className="w-5 h-5" />;
};

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ allModules }) => {
    const {
        persona,
        currentUser,
        trainingStatus,
        updateTrainingProgress,
        completeQuiz,
        signCertificate,
        openModal,
        initiateContextualChat,
        addToast
    } = useAppContext();

  const [generatedScenarioPrompt, setGeneratedScenarioPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const visibleModules = useMemo(() => {
    return allModules.filter(m => m.role.includes(persona!));
  }, [allModules, persona]);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(visibleModules[0]?.id || null);

  const activeModule = useMemo(() => {
    return allModules.find(m => m.id === activeModuleId);
  }, [allModules, activeModuleId]);

  useEffect(() => {
      setActiveVideoUrl(null);
  }, [activeModule?.id]);

  const handleGenerateScenario = async () => {
      if (!generatedScenarioPrompt) return;
      setIsGenerating(true);
      try {
          const prompt = `Generate a supportive operational readiness scenario for Nashua Paarl. Topic: "${generatedScenarioPrompt}". 
          Focus on helping the user master the workflow rather than testing them. 
          Return a JSON object with: title, description, and systemPrompt (persona: Zephyr HR Assistant).`;
          const response = await generateContent(prompt);
          addToast("Workflow Sandbox prepared. Initiating sync...", "success");
          initiateContextualChat(`I've prepared a sandbox session for "${generatedScenarioPrompt}". How should we approach this workflow?`);
      } catch (e) {
          addToast("Something went wrong. Please try again.", "error");
      } finally {
          setIsGenerating(false);
          setGeneratedScenarioPrompt('');
      }
  };

  const renderContent = () => {
    if (!activeModule) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <Info className="w-16 h-16 text-slate-300 mb-6" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Select a Module</p>
            <p className="text-slate-400 mt-2 text-sm">Select a module from the sidebar to begin.</p>
        </div>
      );
    }
    
    if (activeModule.type === 'workflow-sandbox') {
        return (
            <div className="flex flex-col h-full animate-fadeIn">
                <div className="text-center p-10 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800">
                    <div className="p-5 rounded-[2.5rem] bg-brand-primary/10 text-brand-primary mb-6 shadow-sm">
                        <ChatBubbleLeftRightIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">{activeModule.title}</h2>
                    <p className="mt-4 max-w-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">"{activeModule.description}"</p>
                    <button 
                        onClick={() => openModal('rolePlay')}
                        className="mt-10 px-12 py-5 bg-brand-primary text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl uppercase tracking-widest text-xs border-b-4 border-blue-900"
                    >
                        Enter Sandbox Session
                    </button>
                </div>
                
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 flex-1">
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-voltage" />
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Workflow Scenario Pilot</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            Describe a specific branch situation (e.g., 'A client is disputing a Ricoh service contract'). Aiva will initialize a safe sandbox environment to refine your approach.
                        </p>
                        <div className="flex gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm focus-within:border-brand-primary transition-all">
                            <input 
                                type="text" 
                                value={generatedScenarioPrompt}
                                onChange={(e) => setGeneratedScenarioPrompt(e.target.value)}
                                placeholder="e.g. Explaining the 15-day annual leave cycle..."
                                className="flex-1 px-4 py-3 bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-100"
                            />
                            <button 
                                onClick={handleGenerateScenario}
                                disabled={isGenerating || !generatedScenarioPrompt}
                                className="px-6 py-3 bg-brand-primary text-white font-black rounded-xl hover:brightness-110 disabled:opacity-30 transition-all uppercase tracking-widest text-[10px]"
                            >
                                {isGenerating ? 'Syncing...' : 'Deploy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeModule.type === 'readiness-lab') {
      return (
          <div className="flex flex-col items-center justify-center text-center h-full p-10 animate-fadeIn">
              <div className="p-5 rounded-[2.5rem] bg-amber-500/10 text-amber-500 mb-6 shadow-sm">
                  <ChatBubbleBottomCenterTextIcon className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">{activeModule.title}</h2>
              <p className="mt-4 max-w-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">"{activeModule.description}"</p>
              <button 
                  onClick={() => openModal('readinessLab')}
                  className="mt-10 px-12 py-5 bg-amber-500 text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl uppercase tracking-widest text-xs border-b-4 border-amber-700"
              >
                  Launch Readiness Simulation
              </button>
          </div>
      );
    }

    if (activeModule.type === 'flashcards') {
        return (
            <div className="p-8 animate-fadeIn">
                <FlashcardTrainer />
            </div>
        );
    }
    
    const status = trainingStatus[activeModule.id];
    if (!status) return <div>Module not found.</div>;

    if (status.completed && activeModule.isCompliance) {
      return (
        <div className="p-4 md:p-10">
            <CertificateView 
                module={activeModule} 
                userName={currentUser?.name || 'Authorized Personnel'}
                isCertified={status.certified}
                onSign={signCertificate}
            />
        </div>
      );
    }
    
    switch (activeModule.type) {
      case 'video':
        return (
            <div className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase italic tracking-tight">{activeModule.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{activeModule.description}</p>
                
                <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-xl border border-white/5 relative">
                        <video 
                            key={activeVideoUrl || activeModule.videoUrl}
                            src={activeVideoUrl || activeModule.videoUrl} 
                            controls 
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                            onTimeUpdate={(e) => {
                                const video = e.currentTarget;
                                if (video.duration > 0 && !activeVideoUrl) {
                                    const progress = Math.round((video.currentTime / video.duration) * 100);
                                    updateTrainingProgress(activeModule.id, progress);
                                }
                            }}
                            onEnded={() => {
                                if (activeModule.supplementaryVideos?.length) {
                                    if (!activeVideoUrl) {
                                        setActiveVideoUrl(activeModule.supplementaryVideos[0].url);
                                    } else {
                                        const currentIdx = activeModule.supplementaryVideos.findIndex(v => v.url === activeVideoUrl);
                                        const nextClip = activeModule.supplementaryVideos[currentIdx + 1];
                                        if (nextClip) setActiveVideoUrl(nextClip.url);
                                    }
                                }
                            }}
                        />
                    </div>

                    {activeModule.supplementaryVideos && activeModule.supplementaryVideos.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Related Clips / Playlist</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <button 
                                    onClick={() => setActiveVideoUrl(null)}
                                    className={`p-3 rounded-xl border transition-all text-left group ${
                                        !activeVideoUrl 
                                            ? 'bg-[#0d9488]/10 border-[#0d9488]/30 shadow-sm' 
                                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-[#0d9488]/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black ${
                                            !activeVideoUrl ? 'bg-[#0d9488] text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                        }`}>
                                            0
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                                            !activeVideoUrl ? 'text-[#0d9488]' : 'text-slate-600 dark:text-slate-300'
                                        }`}>
                                            Main Feature
                                        </span>
                                    </div>
                                </button>
                                {activeModule.supplementaryVideos.map((clip, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setActiveVideoUrl(clip.url)}
                                        className={`p-3 rounded-xl border transition-all text-left group ${
                                            activeVideoUrl === clip.url 
                                                ? 'bg-[#0d9488]/10 border-[#0d9488]/30 shadow-sm' 
                                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-[#0d9488]/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black ${
                                                activeVideoUrl === clip.url ? 'bg-[#0d9488] text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                activeVideoUrl === clip.url ? 'text-[#0d9488]' : 'text-slate-600 dark:text-slate-300'
                                            }`}>
                                                {clip.title}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!activeModule.isCompliance && (
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Progress</span>
                                <span className="text-xs font-black text-brand-secondary">{status.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-brand-secondary h-1.5 rounded-full transition-all duration-1000" style={{ width: `${status.progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
      case 'quiz':
        return (
            <div className="p-8 space-y-10">
                {activeModule.supplementaryVideos && activeModule.supplementaryVideos.length > 0 && (
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 ml-1">
                            <VideoCameraIcon className="w-4 h-4 text-brand-secondary" />
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preparatory Briefing</h4>
                        </div>
                        <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-xl border border-white/5">
                            <video 
                                key={activeVideoUrl || activeModule.supplementaryVideos[0].url}
                                src={activeVideoUrl || activeModule.supplementaryVideos[0].url} 
                                controls 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                             {activeModule.supplementaryVideos.map((clip, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setActiveVideoUrl(clip.url)}
                                    className={`p-3 rounded-xl border transition-all text-left group ${
                                        activeVideoUrl === clip.url || (!activeVideoUrl && i === 0)
                                            ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' 
                                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-amber-500/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black ${
                                            activeVideoUrl === clip.url || (!activeVideoUrl && i === 0) ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                                            activeVideoUrl === clip.url || (!activeVideoUrl && i === 0) ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'
                                        }`}>
                                            {clip.title}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-white/5 my-8" />
                     </div>
                )}
                <QuizModule module={activeModule} onComplete={completeQuiz} />
            </div>
        );
      default:
        return <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-xs">Ready.</div>;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-transparent">
      <div className="max-w-[1600px] mx-auto w-full p-6 md:p-10 flex-1 flex gap-8 overflow-hidden">
        
        {/* Left Nav: Knowledge Registry */}
        <aside className="hidden lg:flex w-80 shrink-0 h-full flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-white/5 h-full flex flex-col">
            <div className="mb-8">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Knowledge Registry</h2>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 leading-tight">Nashua Paarl Strategic Repository</p>
            </div>
            
            <nav className="flex-1 overflow-y-auto pr-2 space-y-3 copilot-scrollbar">
              {visibleModules.map(module => {
                const status = trainingStatus[module.id];
                const isActive = module.id === activeModuleId;

                const handleModuleClick = () => {
                    if (module.type === 'webapp' && module.externalUrl) {
                        window.open(module.externalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                        setActiveModuleId(module.id);
                    }
                };
                
                return (
                  <button
                    key={module.id}
                    onClick={handleModuleClick}
                    className={`w-full text-left p-4 rounded-2xl transition-all group border-2 ${isActive && module.type !== 'webapp' ? 'bg-brand-secondary/5 border-brand-secondary/30 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive && module.type !== 'webapp' ? 'bg-brand-secondary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                        <ModuleIcon type={module.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black uppercase tracking-tight text-[11px] truncate leading-tight ${isActive && module.type !== 'webapp' ? 'text-brand-secondary' : 'text-slate-700 dark:text-slate-300'}`}>{module.title}</p>
                        {module.isCompliance ? (
                            <div className="mt-1 flex items-center gap-1.5 text-[8px] font-black uppercase text-amber-500">
                                <ShieldCheckIcon className="w-2.5 h-2.5"/> Mandatory
                            </div>
                        ) : (
                            <p className="mt-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Optional</p>
                        )}
                      </div>
                       <div className="shrink-0 pt-1">
                            {status?.completed && <CheckCircleIcon className="w-4 h-4 text-emerald-500" />}
                       </div>
                    </div>
                    {status && !status.completed && status.progress > 0 && (
                        <div className="mt-4 pl-13">
                             <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                <div className="bg-brand-secondary h-full transition-all duration-700" style={{ width: `${status.progress}%` }}></div>
                            </div>
                        </div>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Aiva Policy Pilot Callout */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2">Aiva Policy Pilot</h4>
                    <p className="text-[9px] text-slate-400 leading-relaxed">Ask Aiva anything about our commission manual or performance standards.</p>
                </div>
                <button 
                    onClick={() => initiateContextualChat("Aiva, initialize the Policy Pilot. I want to search the corporate registry for grounded answers regarding branch performance.")}
                    className="w-full p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-xl hover:scale-[1.02] transition-all text-left flex items-center gap-4 group"
                >
                    <div className="p-2 bg-white/10 dark:bg-slate-900/10 rounded-lg group-hover:bg-brand-secondary transition-colors">
                        <Search className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase italic tracking-tighter">Initialize Pilot</p>
                        <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mt-0.5">Grounded Q&A</p>
                    </div>
                </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 h-full min-w-0">
          <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-white/5 h-full overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto copilot-scrollbar">
                {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
