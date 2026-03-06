import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Search, QrCode, ArrowLeft, User, Hash, Phone } from 'lucide-react';
import { QRScanner } from './seasonal_onboarding/QRScanner';

interface PhoneIdentificationStepProps {
    onIdentify: (phone: string) => Promise<void>;
    onBack: () => void;
}

type LookupMode = 'pin' | 'phone' | 'name';

export const PhoneIdentificationStep: React.FC<PhoneIdentificationStepProps> = ({ onIdentify, onBack }) => {
    const [lookupMode, setLookupMode] = useState<LookupMode>('pin');
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [phoneInput, setPhoneInput] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus first PIN digit on mount
    useEffect(() => {
        if (lookupMode === 'pin') {
            setTimeout(() => pinRefs.current[0]?.focus(), 100);
        }
    }, [lookupMode]);

    const handlePinChange = (idx: number, val: string) => {
        const digit = val.replace(/\D/g, '').slice(-1);
        const newPin = [...pin];
        newPin[idx] = digit;
        setPin(newPin);
        setError(null);
        if (digit && idx < 5) {
            pinRefs.current[idx + 1]?.focus();
        }
        // Auto-submit when all 6 filled
        if (digit && idx === 5 && newPin.every(d => d !== '')) {
            submitPin(newPin.join(''));
        }
    };

    const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
            pinRefs.current[idx - 1]?.focus();
        }
    };

    const submitPin = async (pinStr: string) => {
        setIsSearching(true);
        setError(null);
        try {
            await onIdentify(`PIN:${pinStr}`);
        } catch {
            setError('Invalid PIN — please check and try again');
            setPin(['', '', '', '', '', '']);
            setTimeout(() => pinRefs.current[0]?.focus(), 100);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (lookupMode === 'pin') {
            const pinStr = pin.join('');
            if (pinStr.length < 6) { setError('Enter all 6 digits'); return; }
            await submitPin(pinStr);
        } else {
            const input = lookupMode === 'phone' ? phoneInput : nameInput;
            if (input.length < 3) return;
            setIsSearching(true);
            try { await onIdentify(input); }
            finally { setIsSearching(false); }
        }
    };

    if (isScanning) {
        return (
            <div className="fixed inset-0 z-[300] bg-black">
                <QRScanner
                    onScan={(text) => { onIdentify(text); setIsScanning(false); }}
                    onClose={() => setIsScanning(false)}
                />
            </div>
        );
    }

    const tabs: { key: LookupMode; label: string; icon: React.FC<any> }[] = [
        { key: 'pin',   label: 'PIN Code', icon: Hash },
        { key: 'phone', label: 'Mobile',   icon: Phone },
        { key: 'name',  label: 'Name',     icon: User },
    ];

    return (
        <div className="min-h-screen-safe bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #1e3a8a 1px, transparent 0)`,
                backgroundSize: '30px 30px'
            }} />

            <div className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_32px_128px_rgba(0,0,0,0.08)] border border-slate-200 relative z-10">

                {/* Header */}
                <div className="text-center mb-7">
                    <div className="w-14 h-14 bg-[#0d9488] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0d9488]/20">
                        <Hash className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                        Employee Access
                    </h2>
                    <p className="text-slate-400 mt-1.5 text-xs font-medium">
                        Enter your PIN or use another method below
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200 gap-0.5">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setLookupMode(key); setError(null); setPin(['','','','','','']); }}
                            className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1
                                ${lookupMode === key ? 'bg-white text-[#0d9488] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icon className="w-3 h-3" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* PIN Entry */}
                {lookupMode === 'pin' && (
                    <div className="space-y-5">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-center mb-4">
                                Your 6-digit onboarding PIN
                            </label>
                            <div className="flex gap-2 justify-center">
                                {pin.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={el => { pinRefs.current[idx] = el; }}
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handlePinChange(idx, e.target.value)}
                                        onKeyDown={e => handlePinKeyDown(idx, e)}
                                        disabled={isSearching}
                                        className={`w-11 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all
                                            ${digit ? 'bg-[#0d9488]/10 border-[#0d9488] text-[#0d9488]' : 'bg-slate-50 border-slate-200 text-slate-900'}
                                            focus:border-[#0d9488] focus:bg-[#0d9488]/5
                                            ${error ? 'border-red-400 bg-red-50' : ''}`}
                                    />
                                ))}
                            </div>
                            {error && (
                                <p className="text-center text-[10px] text-red-500 font-bold mt-3">{error}</p>
                            )}
                        </div>

                        <button
                            onClick={() => handleSubmit()}
                            disabled={isSearching || pin.some(d => d === '')}
                            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-[#0d9488]/20 disabled:opacity-30 flex items-center justify-center gap-3 border-b-4 border-[#0a6660] active:border-b-0 active:translate-y-0.5"
                        >
                            {isSearching ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>
                            ) : (
                                <><Search className="w-4 h-4" /><span>Start Onboarding</span></>
                            )}
                        </button>
                    </div>
                )}

                {/* Phone Entry */}
                {lookupMode === 'phone' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mobile Number</label>
                            <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-[#0d9488] focus-within:bg-white transition-all">
                                <span className="px-3 py-3.5 bg-slate-200 text-slate-700 font-black text-[10px] border-r border-slate-300">+27</span>
                                <input
                                    type="tel"
                                    className="flex-1 bg-transparent px-4 py-3.5 text-slate-900 text-xl font-black outline-none placeholder:text-slate-300"
                                    placeholder="82 000 0000"
                                    value={phoneInput}
                                    onChange={e => setPhoneInput(e.target.value.replace(/[^0-9\s]/g, ''))}
                                    disabled={isSearching}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching || phoneInput.length < 5}
                            className="w-full bg-[#0d9488] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                            {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : <><Search className="w-4 h-4" />Find My Record</>}
                        </button>
                    </form>
                )}

                {/* Name Entry */}
                {lookupMode === 'name' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                            <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-[#0d9488] focus-within:bg-white transition-all">
                                <div className="px-3 py-3.5 text-slate-300"><User className="w-5 h-5" /></div>
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent px-2 py-3.5 text-slate-900 text-lg font-black outline-none placeholder:text-slate-300 uppercase italic"
                                    placeholder="Jan Dlamini..."
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    disabled={isSearching}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching || nameInput.length < 3}
                            className="w-full bg-[#0d9488] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
                        >
                            {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : <><Search className="w-4 h-4" />Find My Record</>}
                        </button>
                    </form>
                )}

                {/* Bottom actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                        onClick={() => setIsScanning(true)}
                        className="py-3 bg-slate-50 border-2 border-slate-200 hover:border-[#0d9488] hover:bg-white rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-[#0d9488] font-black transition-all"
                    >
                        <QrCode className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-[8px]">Scan QR</span>
                    </button>
                    <button
                        onClick={onBack}
                        className="py-3 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-black transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-[8px]">Back</span>
                    </button>
                </div>
            </div>

            <p className="mt-6 text-[8px] text-slate-400 font-black uppercase tracking-[0.6em] opacity-40">
                Powered by Gemynd WestFlow
            </p>
        </div>
    );
};
