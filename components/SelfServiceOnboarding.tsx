
import React, { useState, useEffect } from 'react';
import { westflow } from '../services/westflowClient';
import { Loader2, CheckCircle2, ChevronRight, Send, Camera, ShieldCheck, User, MapPin, Banknote, FileCheck, Video, Info, Upload } from 'lucide-react';
import { AivaLogo, AiSparkIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface SelfServiceOnboardingProps {
    hireId: string;
}

export const SelfServiceOnboarding: React.FC<SelfServiceOnboardingProps> = ({ hireId }) => {
    const { addToast } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [hire, setHire] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const resp = await westflow.getHireDetails(hireId);
                if (resp.success) {
                    setHire(resp.data);
                    setStep(resp.data.step_reached || 1);
                } else {
                    setError("Onboarding link expired or invalid.");
                }
            } catch (e) {
                setError("Portal offline.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [hireId]);

    const handleNext = async (data: any) => {
        setSubmitting(true);
        try {
            const nextStep = step + 1;
            const resp = await westflow.advanceOnboardingStep(hireId, nextStep);
            if (resp.success) {
                setStep(nextStep);
                setHire((prev: any) => ({ ...prev, step_reached: nextStep }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) {
            addToast("Verification failed. Please check your data uplink.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
            <Loader2 className="w-12 h-12 text-brand-secondary animate-spin mb-4" />
            <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Opening Onboarding Portal...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/40">
                <Info className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{error}</h2>
            <p className="text-slate-400 max-w-xs">Please contact your hiring manager for a new link.</p>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1 hire={hire} onNext={handleNext} submitting={submitting} />;
            case 2: return <Step2 hire={hire} onNext={handleNext} submitting={submitting} />;
            case 3: return <Step3 hire={hire} onNext={handleNext} submitting={submitting} />;
            case 4: return <Step4 hire={hire} onNext={handleNext} submitting={submitting} />;
            case 5: return <Step5 hire={hire} onNext={handleNext} submitting={submitting} />;
            case 6: return <Step6 hire={hire} onNext={() => {}} submitting={submitting} />;
            default: return <Step6 hire={hire} onNext={() => {}} submitting={submitting} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <header className="bg-brand-dark p-6 sticky top-0 z-20 flex justify-between items-center shadow-lg border-b border-white/5">
                <div className="w-24 h-6 flex items-center">
                    <AivaLogo className="w-full h-full object-contain object-left" />
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Portal ID</p>
                    <p className="text-xs font-black text-brand-secondary uppercase italic tracking-tight">{hire.staff_id || 'PENDING'}</p>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-6 pb-24">
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary transition-all duration-700" style={{ width: `${(step / 6) * 100}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-brand-primary uppercase">Step {step}/6</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">
                        Welcome, {hire.staff_name.split(' ')[0]}
                    </h1>
                </div>

                <div className="animate-fadeIn">
                    {renderStep()}
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-center z-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Nashua Employee Onboarding v2.1</p>
            </footer>
        </div>
    );
};

const Step1 = ({ hire, onNext, submitting }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-brand-primary rounded-2xl text-white shadow-lg"><FileCheck className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Accept Offer</h2>
        </div>
        <p className="text-slate-600 font-medium leading-relaxed">
            Congratulations on your offer! By proceeding, you acknowledge and accept the terms of employment and the **Daily Rhythm for Success** at Nashua Paarl & West Coast.
        </p>
        <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
            <label className="flex items-start gap-4 cursor-pointer">
                <input type="checkbox" required className="mt-1 w-5 h-5 rounded border-2 border-slate-300 text-brand-primary focus:ring-brand-primary" />
                <span className="text-sm font-bold text-slate-700">I formally accept the employment offer and agree to start my onboarding journey.</span>
            </label>
        </div>
        <button 
            onClick={() => onNext({})} 
            disabled={submitting}
            className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm hover:scale-[1.02] transition-all"
        >
            {submitting ? <Loader2 className="animate-spin" /> : "Confirm & Get Started"}
        </button>
    </div>
);

const Step2 = ({ hire, onNext, submitting }: any) => {
    const [captured, setCaptured] = useState(false);
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-lg"><User className="w-8 h-8" /></div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Identity Check</h2>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center space-y-6">
                {!captured ? (
                    <>
                        <Upload className="w-12 h-12 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-500">Please scan or upload a photo of your ID Document or Passport.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => setCaptured(true)} className="w-full py-4 bg-brand-secondary text-white font-black rounded-2xl uppercase tracking-widest text-[10px]">Open Camera</button>
                            <label className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl uppercase tracking-widest text-[10px] cursor-pointer text-center">
                                Import File
                                <input type="file" className="hidden" />
                            </label>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="aspect-[3/4] bg-slate-200 rounded-2xl animate-pulse"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Extracting information...</p>
                        <button onClick={() => onNext({})} className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl">Confirm Identity Data</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Step3 = ({ hire, onNext, submitting }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500 rounded-2xl text-white shadow-lg"><MapPin className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Proof of Residence</h2>
        </div>
        <div className="p-6 bg-slate-50 rounded-3xl text-center space-y-6">
            <Upload className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-500">Upload a recent utility bill or bank statement to confirm your address.</p>
            <label className="w-full py-4 block bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl uppercase tracking-widest text-[10px] cursor-pointer">
                Select Document
                <input type="file" className="hidden" />
            </label>
        </div>
        <button 
            onClick={() => onNext({})}
            disabled={submitting}
            className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
            {submitting ? <Loader2 className="animate-spin" /> : "Verify Address"}
        </button>
    </div>
);

const Step4 = ({ hire, onNext, submitting }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg"><Banknote className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Banking Details</h2>
        </div>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNext({}); }}>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bank Name</label>
                <input type="text" required placeholder="e.g. FNB, Standard Bank" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-brand-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Account Number</label>
                <input type="number" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-brand-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Branch Code</label>
                <input type="number" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-brand-primary outline-none transition-all" />
            </div>
            <button 
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
                {submitting ? <Loader2 className="animate-spin" /> : "Save Banking Data"}
            </button>
        </form>
    </div>
);

const Step5 = ({ hire, onNext, submitting }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500 rounded-2xl text-white shadow-lg"><FileCheck className="w-8 h-8" /></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Sign Contract</h2>
        </div>
        <p className="text-sm text-slate-500 font-medium">Please review your employment contract and provide your digital signature.</p>
        <div className="aspect-[4/3] bg-slate-900 rounded-[2rem] flex items-center justify-center text-white/20 p-10 border border-white/5 italic">
            Contract Preview...
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Type Full Name to Sign</label>
            <input type="text" required className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black italic text-xl focus:border-brand-primary outline-none transition-all" />
        </div>
        <button 
            onClick={() => onNext({})}
            disabled={submitting}
            className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
        >
            {submitting ? <Loader2 className="animate-spin" /> : "Sign & Execute"}
        </button>
    </div>
);

const Step6 = ({ hire, onNext, submitting }: any) => (
    <div className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-primary rounded-2xl text-white shadow-lg"><Video className="w-8 h-8" /></div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic leading-none">Company Orientation</h2>
            </div>
            <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group">
                <video src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4" controls className="w-full h-full" />
                <div className="absolute top-4 left-4 bg-brand-primary/80 px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Welcome Briefing</div>
            </div>
            <div className="bg-green-50 p-6 rounded-3xl border border-green-200">
                <h4 className="font-black text-green-700 uppercase italic mb-4">Onboarding Complete</h4>
                <div className="space-y-3">
                    {[
                        "Identity Verified",
                        "Residence Confirmed",
                        "Payroll Details Set",
                        "Contract Signed",
                        "Orientation Finished"
                    ].map(item => (
                        <div key={item} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-bold text-slate-700">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-12 bg-slate-900 rounded-[3rem] text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><AiSparkIcon className="w-48 h-48 text-brand-secondary" /></div>
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white">
                <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">You're All Set!</h2>
            <p className="text-slate-400 font-medium">Welcome to the Nashua family. Your manager has been notified of your successful onboarding.</p>
            <button 
                onClick={() => window.location.href = '/'}
                className="px-16 py-5 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl"
            >
                Enter Staff Portal
            </button>
        </div>
    </div>
);
