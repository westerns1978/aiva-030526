import React, { useState, useEffect, useRef } from 'react';
import { TRAINING_MODULES } from '../constants/trainingModules';
import type { InterviewScenario, InterviewFeedback } from '../types';
import { getInterviewFeedbackFromGemini, transcribeAudioWithGemini } from '../services/geminiService';
import { CloseIcon, MicrophoneIcon, ChevronLeftIcon, AiSparkIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppContext } from '../context/AppContext';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

interface InterviewCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const readinessModule = TRAINING_MODULES.find(m => m.type === 'readiness-lab');

type View = 'selection' | 'recording' | 'analyzing' | 'feedback';

export const InterviewCoachModal: React.FC<InterviewCoachModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useAppContext();
  const [view, setView] = useState<View>('selection');
  const [activeScenario, setActiveScenario] = useState<InterviewScenario | null>(null);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const resetState = () => {
    setView('selection');
    setActiveScenario(null);
    setTranscript('');
    setFeedback(null);
    setIsLoading(false);
    setIsRecording(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
        
        // Start analysis
        setView('analyzing');
        setIsLoading(true);
        try {
            setLoadingMessage('Syncing verbal node to mesh...');
            const transcriptText = await transcribeAudioWithGemini(audioBlob);
            setTranscript(transcriptText);

            setLoadingMessage('Aiva Reasoning: Aligning with Nashua Standards...');
            if (activeScenario) {
                const feedbackResult = await getInterviewFeedbackFromGemini(
                    transcriptText, 
                    `Operational Context: ${activeScenario.question}. Focus feedback on workflow alignment and clarity rather than judgment.`
                );
                setFeedback(feedbackResult);
                setView('feedback');
            }
        } catch (error) {
            console.error(error);
            addToast("Protocol handshake failed. Restart simulation.", "error");
            setView('selection');
        } finally {
            setIsLoading(false);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      addToast("Hardware link blocked.", "error");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSelectScenario = (scenario: InterviewScenario) => {
    setActiveScenario(scenario);
    setView('recording');
  };

  const renderContent = () => {
    switch (view) {
      case 'selection':
        return (
          <div className="p-8 space-y-6">
            <div className="text-center mb-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Operational Readiness Scenarios</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Select a strategic simulation node to refine your branch workflow.</p>
            </div>
            <div className="space-y-4">
              {readinessModule?.interviewScenarios?.map(sc => (
                <button key={sc.id} onClick={() => handleSelectScenario(sc)} className="group w-full text-left p-6 bg-slate-50 dark:bg-slate-900 border-2 border-transparent hover:border-brand-primary rounded-[2rem] transition-all flex items-center gap-6 shadow-sm hover:shadow-xl">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                      <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-brand-secondary uppercase text-xs tracking-widest">{sc.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 italic leading-snug">"{sc.description}"</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 'recording':
        return (
            <div className="p-10 flex flex-col items-center justify-center text-center h-full space-y-10 animate-fadeIn">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-brand-secondary tracking-[0.4em]">{activeScenario?.title}</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white italic tracking-tighter leading-tight max-w-lg mx-auto">"{activeScenario?.question}"</h3>
                </div>
                
                <div className="relative">
                    {isRecording && <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>}
                    <button
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 transform hover:scale-105 shadow-2xl z-10 ${isRecording ? 'bg-red-600 border-4 border-red-400' : 'bg-brand-primary border-4 border-blue-400'}`}
                    >
                        <MicrophoneIcon className="w-10 h-10 text-white mb-2" />
                        <span className="text-[9px] font-black uppercase text-white tracking-widest">{isRecording ? 'STOP' : 'REC'}</span>
                    </button>
                </div>
                
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] h-6">{isRecording ? "Transmitting verbal node..." : "Tap to initialize recording protocol"}</p>
            </div>
        );
      case 'analyzing':
        return (
            <div className="p-20 flex flex-col items-center justify-center text-center h-full space-y-8 animate-fadeIn">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-voltage border-t-transparent rounded-full animate-spin"></div>
                    <AiSparkIcon className="absolute inset-0 m-auto w-10 h-10 text-voltage animate-pulse" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Strategic Audit Active</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase tracking-widest">{loadingMessage}</p>
                </div>
            </div>
        );
      case 'feedback':
        return (
            <div className="p-8 h-full flex flex-col animate-fadeIn">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Readiness Insights</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Clinical Alignment Analysis</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto copilot-scrollbar pr-4 space-y-8">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 italic">
                        <h4 className="text-[9px] font-black uppercase text-slate-400 mb-2">Verbal Specimen</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">"{transcript}"</p>
                    </div>

                    {feedback && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                            <FeedbackSection title="Strategic Accuracy" content={feedback.starAnalysis} icon={Activity} />
                            <FeedbackSection title="Clarity Protocol" content={feedback.clarity} icon={Zap} />
                            <FeedbackSection title="Key Support Areas" content={feedback.strengths} icon={ShieldCheck} />
                            <FeedbackSection title="Calibration Targets" content={feedback.improvements} icon={AiSparkIcon} />
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex gap-4">
                    <button onClick={() => setView('recording')} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Repeat Simulation</button>
                    <button onClick={resetState} className="flex-1 py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] hover:scale-105 transition-all">New Node</button>
                </div>
            </div>
        );
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fadeIn">
      <div className="bg-white dark:bg-slate-950 rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col overflow-hidden border border-white/10">
        <header className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
            <div className='flex items-center gap-4'>
                {view !== 'selection' && (
                    <button onClick={resetState} className="p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-500 hover:text-brand-primary transition-all shadow-sm">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-10 bg-brand-primary rounded-full"></div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Operational Readiness Lab</h2>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Module: Simulation Sync</p>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white dark:bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm">
                <CloseIcon className="w-6 h-6" />
            </button>
        </header>
        <main className="flex-1 overflow-hidden relative">
            {/* Background Branding */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none -rotate-12">
                <AiSparkIcon className="w-[600px] h-[600px]" />
            </div>
            <div className="relative z-10 h-full overflow-y-auto copilot-scrollbar">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

const FeedbackSection: React.FC<{ title: string; content: string, icon: any }> = ({ title, content, icon: Icon }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 text-brand-secondary">
            <Icon className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    </div>
);