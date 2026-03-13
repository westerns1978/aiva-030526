
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Fingerprint, ArrowLeft, ShieldCheck, User, Key } from 'lucide-react';
import { AivaLogo, CheckCircleIcon } from './icons';
import { westflow } from '../services/westflowClient';
import { useAppContext } from '../context/AppContext';
import { IValtMfaModal } from './IValtMfaModal';

interface PinConfirmationScreenProps {
    hireId: string;
    expectedPin: string;
    onSuccess: () => void;
    autoVerify?: boolean; // true when PIN came from URL — skip iValt, auto-authenticate
}

export const PinConfirmationScreen: React.FC<PinConfirmationScreenProps> = ({ hireId, expectedPin, onSuccess, autoVerify = false }) => {
    const { addToast, triggerSuccessFeedback, handleGoHome, setCurrentHire, setPersona, setIsIdentified, setLanguageSelected, setActiveView } = useAppContext();
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(autoVerify);
    const [showMfa, setShowMfa] = useState(false);
    const [hireName, setHireName] = useState('New Hire');
    const [phone, setPhone] = useState('');
    const inputRefs = [
        useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)
    ];

    useEffect(() => {
        const fetchHire = async () => {
            try {
                const resp = await westflow.getHireDetails(hireId);
                if (resp.success && resp.data) {
                    setHireName(resp.data.staff_name);
                    setPhone(resp.data.phone || '');

                    // ── Two valid PIN sources ──────────────────────────────────
                    // 1. Dispatch flow: PIN is derived deterministically from hireId hex.
                    //    No kiosk_session in metadata — validate by re-deriving and comparing.
                    // 2. In-person/kiosk flow: PIN written to metadata.kiosk_session by handleBeginInPerson.
                    //    Validate against that record + check expiry.

                    const derivedPin = String(parseInt(hireId.replace(/-/g, '').slice(-6), 16))
                        .slice(-6).padStart(6, '0');

                    const session = resp.data.metadata?.kiosk_session;

                    if (expectedPin === derivedPin) {
                        // Dispatch flow — PIN matches hireId derivation, always valid, no expiry
                        return;
                    } else if (session && session.pin === expectedPin) {
                        // In-person kiosk flow — check expiry
                        const expiry = new Date(session.expires_at).getTime();
                        if (Date.now() > expiry) {
                            addToast('Session expired. Please request a new code.', 'warning');
                            handleGoHome();
                        }
                        // Valid kiosk session — proceed
                    } else {
                        // PIN doesn't match either source
                        addToast('Session expired or invalid. Contact your manager.', 'error');
                        handleGoHome();
                    }
                }
            } catch (e) {
                console.error('Session lookup failed', e);
            }
        };
        fetchHire();
    }, [hireId, expectedPin, addToast, handleGoHome]);

    const finalizeAuth = async () => {
        setIsVerifying(false);
        triggerSuccessFeedback("Identity Mesh Sync Successful");
        
        const resp = await westflow.getHireDetails(hireId);
        if (resp.success) {
            setCurrentHire(resp.data);
            setPersona('employee');
            setIsIdentified(true);
            setLanguageSelected(false); // Force language selection
            setActiveView('onboarding');
            onSuccess();
            
            // Clear URL params
            const url = new URL(window.location.href);
            url.search = '';
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        
        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);

        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerify = async () => {
        const enteredPin = pin.join('');
        if (enteredPin !== expectedPin) {
            addToast("Incorrect PIN. Please retry.", "error");
            setPin(['', '', '', '', '', '']);
            inputRefs[0].current?.focus();
            return;
        }

        setIsVerifying(true);
        // Dispatch flow (PIN from URL) — skip iValt entirely
        setTimeout(() => {
            finalizeAuth();
        }, 800);
    };

    // Auto-verify when PIN came from URL (dispatch flow) — no manual entry needed
    useEffect(() => {
        if (autoVerify && expectedPin) {
            setTimeout(() => {
                finalizeAuth();
            }, 1000);
        }
    }, [autoVerify, expectedPin, finalizeAuth]);

    if (showMfa) {
        return (
            <IValtMfaModal 
                phoneNumber={phone} 
                onSuccess={finalizeAuth} 
                onClose={() => {
                    setShowMfa(false);
                    setIsVerifying(false);
                }} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center overflow-y-auto font-sans relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            
            <div className="w-full max-w-md animate-slide-up-fade relative z-10">
                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center">
                    <AivaLogo className="h-20 w-auto mb-10" />
                    
                    <div className="space-y-3 mb-10">
                        <div className="flex items-center justify-center gap-2">
                            <User className="w-5 h-5 text-brand-secondary" />
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Welcome, {hireName.split(' ')[0]}</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Enter your 6-digit security PIN</p>
                    </div>

                    <div className="flex gap-2 mb-10">
                        {pin.map((digit, i) => (
                            <input
                                key={i}
                                ref={inputRefs[i]}
                                type="text"
                                inputMode="numeric"
                                value={digit}
                                onChange={(e) => handlePinChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-11 h-16 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl text-center text-2xl font-black text-[#0d9488] focus:border-brand-primary outline-none transition-all shadow-inner"
                            />
                        ))}
                    </div>

                    <button 
                        onClick={handleVerify}
                        disabled={isVerifying || pin.some(d => !d)}
                        className="w-full py-5 bg-brand-primary text-white font-black rounded-[1.5rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs border-b-4 border-blue-950 disabled:opacity-30"
                    >
                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                        {isVerifying ? 'VERIFYING...' : 'VERIFY & START'}
                    </button>

                    <button 
                        onClick={handleGoHome}
                        className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-white font-black uppercase tracking-widest text-[9px] transition-all"
                    >
                        CANCEL SESSION
                    </button>
                </div>
                
                <footer className="mt-8 flex flex-col items-center gap-4 opacity-40">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-brand-secondary" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">twAIn v3.2 Encrypted Node</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
