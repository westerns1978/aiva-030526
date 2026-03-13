import React, { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, User, ChevronRight, AlertCircle } from 'lucide-react';
import { MANAGER_CREDENTIALS } from '../constants/permanentStaff';

interface LoginScreenProps {
    onLogin: (employeeNumber: string) => void;
    onKioskMode: () => void;
    onDemoBypass: (role: 'employee' | 'manager') => void;
}

const QUICK_SELECT = [
    { name: 'Deon',  role: 'MD',  email: 'deon@afridroids.com' },
    { name: 'Dan',   role: 'CVO', email: 'dan.western@gemyndflow.com' },
    { name: 'Derek', role: 'CEO', email: 'derek.flower@gemyndflow.com' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onKioskMode, onDemoBypass }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        await new Promise(r => setTimeout(r, 600));

        const cred = MANAGER_CREDENTIALS[email.toLowerCase().trim()];
        if (!cred) {
            setError('Email address not recognised.');
            setIsLoading(false);
            return;
        }
        if (cred.password !== password) {
            setError('Incorrect password. Please try again.');
            setIsLoading(false);
            return;
        }

        onLogin(cred.employeeNumber);
    };

    const quickFill = (emailAddr: string) => {
        setEmail(emailAddr);
        setPassword('lekker1');
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0d9488]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0d9488] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#0d9488]/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">AIVA Manager Hub</h1>
                    <p className="text-slate-500 text-xs mt-1">Nashua Paarl & West Coast</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_32px_128px_rgba(0,0,0,0.08)] p-6 shadow-2xl">

                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                        {/* Quick select */}
                        <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Quick Select</p>
                            <div className="grid grid-cols-3 gap-2">
                                {QUICK_SELECT.map(({ name, role, email: e }) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => quickFill(e)}
                                        className={`py-2.5 px-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-0.5
                                            ${email === e
                                                ? 'bg-[#0d9488]/10 border-[#0d9488] text-[#0d9488]'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#0d9488]/50 hover:text-slate-700'
                                            }`}
                                    >
                                        <span>{name}</span>
                                        <span className={`text-[7px] font-bold tracking-widest ${email === e ? 'text-[#0d9488]/70' : 'text-slate-400'}`}>{role}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email</label>
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-[#0d9488] transition-all overflow-hidden">
                                <div className="px-3 py-3 text-slate-500"><Mail className="w-4 h-4" /></div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(null); }}
                                    placeholder="you@afridroids.com"
                                    className="flex-1 bg-transparent py-3 pr-4 text-slate-900 text-sm outline-none placeholder:text-slate-300"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Password</label>
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 focus-within:border-[#0d9488] transition-all overflow-hidden">
                                <div className="px-3 py-3 text-slate-500"><Lock className="w-4 h-4" /></div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(null); }}
                                    placeholder="••••••••"
                                    className="flex-1 bg-transparent py-3 text-slate-900 text-sm outline-none placeholder:text-slate-300"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="px-3 py-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <p className="text-[10px] text-red-400 font-bold">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-[#0d9488]/20 disabled:opacity-40 flex items-center justify-center gap-2 border-b-4 border-[#0a6660] active:border-b-0 active:translate-y-0.5"
                        >
                            {isLoading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                : <><ChevronRight className="w-4 h-4" /> Sign In</>
                            }
                        </button>
                    </form>
                </div>

                {/* Employee kiosk button */}
                <button
                    onClick={onKioskMode}
                    className="mt-4 w-full py-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 bg-white font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2"
                >
                    <User className="w-3.5 h-3.5" /> Employee Onboarding Access
                </button>

                <p className="text-center text-slate-400 text-[8px] font-black uppercase tracking-widest mt-6">
                    Powered by Gemynd WestFlow
                </p>
            </div>
        </div>
    );
};
