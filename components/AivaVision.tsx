
import React, { useState } from 'react';
import { CloseIcon, RefreshIcon, ShieldCheckIcon, EyeIcon, ExclamationTriangleIcon } from './icons';
import { DocumentCamera } from './seasonal_onboarding/DocumentCamera';
import { analyzeOnSiteImage } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';

interface AivaVisionProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'capture' | 'analyzing' | 'result';
type Mode = 'general' | 'safety';

export const AivaVision: React.FC<AivaVisionProps> = ({ isOpen, onClose }) => {
    const { language, addToast } = useAppContext();
    const [view, setView] = useState<View>('capture');
    const [mode, setMode] = useState<Mode>('general');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCapture = async (blob: Blob) => {
        setView('analyzing');
        setCapturedImage(URL.createObjectURL(blob));
        try {
            // Simulated specialized safety prompt logic
            const result = await analyzeOnSiteImage(blob, language);
            setAnalysis(result);
            setView('result');
        } catch (error) {
            console.error("Aiva Vision analysis failed:", error);
            addToast("Sorry, I was unable to analyze that image.", "error");
            reset();
        }
    };

    const reset = () => {
        setView('capture');
        setCapturedImage(null);
        setAnalysis(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };
    
    const handleLogHazard = () => {
        addToast("Safety report logged to Manager Dashboard. Risk Score: HIGH.", "success");
        handleClose();
    }

    if (view === 'capture') {
        return (
            <div className="relative w-full h-full">
                <DocumentCamera onCapture={handleCapture} onClose={handleClose} documentType={mode === 'safety' ? "Safety Compliance / PPE" : "Object"} />
                
                {/* Mode Toggle Overlay */}
                <div className="fixed bottom-24 left-0 right-0 flex justify-center z-[60]">
                    <div className="bg-black/60 backdrop-blur-md p-1 rounded-full flex gap-1 border border-white/10 shadow-2xl">
                        <button 
                            onClick={() => setMode('general')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === 'general' ? 'bg-white text-black shadow-lg' : 'text-white hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-2">
                                <EyeIcon className="w-4 h-4" /> General Vision
                            </div>
                        </button>
                        <button 
                            onClick={() => setMode('safety')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === 'safety' ? 'bg-amber-500 text-white shadow-lg' : 'text-white hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4" /> Safety Audit
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn p-4">
            <header className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${mode === 'safety' ? 'bg-amber-500' : 'bg-brand-primary'}`}>
                        {mode === 'safety' ? <ShieldCheckIcon className="w-6 h-6 text-white"/> : <EyeIcon className="w-6 h-6 text-white"/>}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white leading-none">Aiva Intelligence</h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Neural Vision Engine</p>
                    </div>
                </div>
                <button onClick={handleClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </header>
            
            <main className="w-full max-w-5xl">
                {view === 'analyzing' && (
                    <div className="text-center text-white space-y-6">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className={`absolute inset-0 border-4 border-dashed rounded-full animate-spin ${mode === 'safety' ? 'border-amber-500' : 'border-brand-secondary'}`}></div>
                            <div className="absolute inset-4 bg-white/5 rounded-full flex items-center justify-center">
                                <EyeIcon className="w-8 h-8 text-white/50 animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{mode === 'safety' ? 'Auditing PPE Compliance...' : 'Processing Multimodal Input...'}</h3>
                            <p className="text-slate-400 mt-2 font-mono text-sm">
                                {mode === 'safety' 
                                    ? 'Validating Hard Hat, Safety Goggles, and High-Vis Vest status...' 
                                    : 'Identifying objects, text, and environmental context...'}
                            </p>
                        </div>
                    </div>
                )}
                {view === 'result' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="relative group">
                            <img src={capturedImage || ''} alt="Analysis Source" className={`rounded-3xl shadow-2xl max-h-[60vh] w-full object-cover border-4 ${mode === 'safety' ? 'border-amber-500' : 'border-brand-primary/50'}`} />
                            
                            {/* Simulated Bounding Boxes Overlay */}
                            {mode === 'safety' && (
                                <div className="absolute inset-0 pointer-events-none p-8">
                                    <div className="absolute top-10 left-1/4 w-32 h-32 border-2 border-green-500 rounded-lg">
                                        <span className="absolute -top-6 left-0 bg-green-500 text-[10px] font-bold text-white px-2 py-0.5 rounded">HARD_HAT (98%)</span>
                                    </div>
                                    <div className="absolute top-1/2 left-1/3 w-48 h-64 border-2 border-red-500 rounded-lg animate-pulse">
                                        <span className="absolute -top-6 left-0 bg-red-500 text-[10px] font-bold text-white px-2 py-0.5 rounded">HI_VIS_VEST (NOT_FOUND)</span>
                                    </div>
                                </div>
                            )}

                             <button onClick={reset} className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-md text-white rounded-full text-sm font-bold hover:bg-black transition-all border border-white/20">
                                <RefreshIcon className="w-4 h-4" /> New Analysis
                            </button>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 max-h-[60vh] overflow-y-auto flex flex-col shadow-2xl">
                            <h3 className={`font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2 ${mode === 'safety' ? 'text-amber-400' : 'text-brand-secondary'}`}>
                                <RefreshIcon className="w-4 h-4 animate-spin-slow" />
                                {mode === 'safety' ? 'Safety Risk Assessment' : 'Extracted Intelligence'}
                            </h3>
                            <div className="prose prose-invert prose-sm max-w-none flex-1">
                                <p className="text-slate-200 leading-relaxed text-base italic">"{analysis}"</p>
                            </div>
                            
                            {mode === 'safety' && (
                                <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-400 font-bold text-sm">Critical Compliance Gap</p>
                                            <p className="text-red-300/80 text-xs">Employee is missing High-Visibility clothing required for this zone.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleLogHazard}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-95"
                                    >
                                        <ShieldCheckIcon className="w-5 h-5" />
                                        Log Compliance Violation
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
