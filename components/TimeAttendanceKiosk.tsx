
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_PERMANENT_STAFF } from '../constants/permanentStaff';
import type { PermanentStaff } from '../types';
import { CheckCircleIcon, QrCodeIcon, ShieldCheckIcon, UserArrowInIcon, CloseIcon, MicrophoneIcon, IdCardIcon, FaceSmileIcon, ClockIcon, AiSparkIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { DocumentCamera } from './seasonal_onboarding/DocumentCamera';
import { processDocumentWithGemini } from '../services/geminiService';
import { logCirrusAudit } from '../services/cirrusService';
import { westflow } from '../services/westflowClient';

interface TimeAttendanceKioskProps {
  isOpen: boolean;
  onClose: () => void;
}

type KioskView = 'selection' | 'identifying' | 'biometrics' | 'actions' | 'success';

const BiometricOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("SAYING_HELLO");

    useEffect(() => {
        const statuses = ["HI_THERE", "LOOKING_FOR_YOU", "ALMOST_DONE", "WELCOME_BACK"];
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + 1.5;
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 800);
                    return 100;
                }
                return next;
            });
            setStatus(statuses[Math.floor((progress / 100) * statuses.length)]);
        }, 30);
        return () => clearInterval(interval);
    }, [onComplete, progress]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 text-white animate-fadeIn">
            <div className="relative w-80 h-80 mb-12">
                <div className="absolute inset-0 border-2 border-brand-secondary/30 rounded-full animate-ping"></div>
                <div className="absolute inset-4 border border-brand-secondary/20 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <FaceSmileIcon className="w-32 h-32 text-white animate-pulse" />
                </div>
                
                <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="h-0.5 w-full bg-brand-secondary/50 shadow-lg absolute top-0 animate-scan-fast"></div>
                </div>
            </div>
            
            <div className="text-center space-y-4 w-full max-w-xs">
                <p className="text-sm font-mono text-brand-secondary uppercase tracking-[0.3em] font-black">{status}</p>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-secondary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <style>{`
                @keyframes scan-fast {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(320px); }
                }
                .animate-scan-fast { animation: scan-fast 1.5s linear infinite; }
            `}</style>
        </div>
    );
};

export const TimeAttendanceKiosk: React.FC<TimeAttendanceKioskProps> = ({ isOpen, onClose }) => {
    const { addToast, triggerSuccessFeedback } = useAppContext();
    const [view, setView] = useState<KioskView>('selection');
    const [identifiedUser, setIdentifiedUser] = useState<PermanentStaff | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('');

    const handleIdScan = async (blob: Blob) => {
        setIsProcessing(true);
        addToast("Pulse: Extracting Identity Data...", "info");
        try {
            const result = await processDocumentWithGemini(blob, "Employee ID / Passport");
            
            if (result.fullName) {
                // SUCCESS CONFIRMATION
                addToast(`ID Verified: ${result.fullName}`, "success");
                
                // DATA CONFIDENCE PULSE
                if (result.idNumber) {
                    const confidencePercent = Math.round((result.confidence || 0.98) * 100);
                    addToast(`ID Number: ${result.idNumber} (Confidence: ${confidencePercent}%)`, "info");
                }

                const user = MOCK_PERMANENT_STAFF.find(u => 
                    u.name.toLowerCase().includes(result.fullName!.toLowerCase()) ||
                    result.fullName!.toLowerCase().includes(u.name.toLowerCase())
                );
                
                if (user) {
                    setIdentifiedUser(user);
                    setView('actions');
                    triggerSuccessFeedback(`Mesh Linked: Welcome Back, ${user.name.split(' ')[0]}!`);
                } else {
                    addToast(`Identity node for '${result.fullName}' not found in registry.`, "error");
                    setView('selection');
                }
            } else {
                // SPECIFIC ERROR REASONING
                const errorMessage = result.message || "I couldn't isolate an identity node from that specimen. Please try again with better lighting.";
                addToast(errorMessage, "warning");
                setView('selection');
            }
        } catch (e) {
            addToast("Hardware Link Error: Extraction protocol aborted.", "error");
            setView('selection');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBiometricComplete = () => {
        const demoUser = MOCK_PERMANENT_STAFF[0]; 
        setIdentifiedUser(demoUser);
        setView('actions');
        triggerSuccessFeedback("Nice to see you!");
    };

    const handleClockAction = async (action: string) => {
        if (!identifiedUser) return;
        setStatus(action);
        setIsProcessing(true);
        
        try {
            await westflow.recordTelemetry('PAARL-KIOSK-01', `${identifiedUser.name} performed ${action}`, ['ATTENDANCE']);
        } catch (e) {
            console.warn('Telemetry failed:', e);
        }

        setTimeout(() => {
            setIsProcessing(false);
            setView('success');
            triggerSuccessFeedback(`All sorted! ${action} recorded.`);
        }, 1200);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col items-center justify-center p-6 animate-fadeIn font-sans">
            <header className="absolute top-8 left-8 flex items-center gap-4">
                 <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                    <ClockIcon className="w-7 h-7 text-white" />
                 </div>
                 <div className="text-white">
                    <h2 className="text-2xl font-bold leading-none tracking-tight italic uppercase">Team Check-In</h2>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-mono">Location: Paarl HQ</p>
                 </div>
            </header>

            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                <CloseIcon className="w-6 h-6" />
            </button>

            <main className="w-full max-w-4xl flex flex-col items-center justify-center">
                {view === 'selection' && (
                    <div className="space-y-8 text-center animate-fadeIn">
                        <div className="mb-12">
                             <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4 uppercase italic">Welcome Back</h1>
                             <p className="text-xl text-slate-400 font-medium">Please identify yourself to start your session.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                            <button onClick={() => setView('identifying')} className="p-10 bg-white/5 border-2 border-white/10 rounded-[2.5rem] hover:border-brand-secondary hover:bg-white/10 transition-all group shadow-xl">
                                <IdCardIcon className="w-16 h-16 text-brand-secondary mb-4 mx-auto group-hover:scale-110 transition-transform" />
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Scan My ID</h3>
                                <p className="text-slate-500 mt-2 font-mono text-[10px] uppercase tracking-widest">Fast & Secure</p>
                            </button>
                            <button onClick={() => setView('biometrics')} className="p-10 bg-white/5 border-2 border-white/10 rounded-[2.5rem] hover:border-brand-secondary hover:bg-white/10 transition-all group shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><AiSparkIcon className="w-20 h-20 text-brand-secondary" /></div>
                                <FaceSmileIcon className="w-16 h-16 text-brand-secondary mb-4 mx-auto group-hover:scale-110 transition-transform" />
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Smile to Check-In</h3>
                                <p className="text-slate-500 mt-2 font-mono text-[10px] uppercase tracking-widest">Face Match</p>
                            </button>
                        </div>
                    </div>
                )}

                {view === 'identifying' && (
                    <DocumentCamera onCapture={handleIdScan} onClose={() => setView('selection')} documentType="Employee ID / Passport" />
                )}

                {view === 'biometrics' && (
                    <BiometricOverlay onComplete={handleBiometricComplete} />
                )}

                {view === 'actions' && identifiedUser && (
                    <div className="text-center space-y-8 animate-fadeIn w-full max-w-lg">
                        <div className="flex flex-col items-center">
                            <div className="relative group mb-6">
                                <img src={identifiedUser.avatarUrl} className="w-40 h-40 rounded-[3rem] border-4 border-brand-secondary shadow-lg object-cover" alt={identifiedUser.name} />
                                <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-xl border-4 border-slate-900"><CheckCircleIcon className="w-6 h-6 text-white" /></div>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Hi, {identifiedUser.name.split(' ')[0]}!</h2>
                            <p className="text-brand-secondary font-mono text-xs mt-2 uppercase tracking-[0.3em] font-black">{identifiedUser.department}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {["Check In", "Start Break", "End Break", "Check Out"].map(act => (
                                <button 
                                    key={act} 
                                    onClick={() => handleClockAction(act)}
                                    disabled={isProcessing}
                                    className="p-8 bg-white/5 rounded-[2rem] text-white font-black uppercase tracking-widest text-sm hover:bg-brand-primary transition-all border border-white/10 active:scale-95 disabled:opacity-50 shadow-2xl"
                                >
                                    {act}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'success' && identifiedUser && (
                    <div className="text-center animate-fadeIn">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_#22c55e] mx-auto mb-10 border-4 border-white/20">
                            <CheckCircleIcon className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{status} DONE</h2>
                        <p className="text-xl text-slate-400 mt-6 font-medium">Have a wonderful day with the team!</p>
                        <button onClick={onClose} className="mt-12 px-16 py-5 bg-white text-slate-900 font-black rounded-3xl hover:scale-105 transition-all shadow-2xl uppercase tracking-widest text-xs">
                            Finish
                        </button>
                    </div>
                )}
            </main>

            {isProcessing && (
                <div className="absolute inset-0 z-[70] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
                    <div className="w-20 h-20 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-8 font-black text-xl tracking-[0.4em] font-mono uppercase text-brand-secondary animate-pulse">Syncing with team...</p>
                </div>
            )}
        </div>
    );
};

export default TimeAttendanceKiosk;
