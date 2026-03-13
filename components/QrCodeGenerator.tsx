import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CloseIcon, AiSparkIcon, RefreshIcon, UsersIcon, MagnifyingGlassIcon, AivaLogo } from './icons';
import { Loader2, CheckCircle2, Zap, MessageSquare, ChevronRight, ToggleLeft, ToggleRight, Smartphone, Send, Copy, Link, MapPin, Volume2, ShieldCheck, User, Clock, Key, FileUp, FileText } from 'lucide-react';
import { JobDescriptionSelector } from './JobDescriptionSelector';
import { westflow } from '../services/westflowClient';
import { supabase } from '../services/storageService';
import { useAppContext } from '../context/AppContext';
import { MOCK_FARM_WORKERS, type FarmWorker } from '../constants/farmWorkers';
import { languageOptions } from '../constants';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import QRCode from 'qrcode';

interface JobDescription {
    id: string;
    title: string;
    file_url: string;
    branch: string;
}

interface DispatchModalProps {
    worker: FarmWorker;
    onClose: () => void;
}

type InviteTone = 'warm' | 'urgent' | 'detailed';
type Branch = 'paarl' | 'west_coast';

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

// Manager phone routing — completion notifications go to whoever dispatched
const GROUP_JID = '120363423479055395@g.us'; // Aiva Testing Crew — Dan, Deon, Derek
const MANAGER_PHONES: Record<string, string> = {
    'PW293':  GROUP_JID,
    'GEM001': GROUP_JID,
    'GEM002': GROUP_JID,
    'default': GROUP_JID,
};

const DispatchModal: React.FC<DispatchModalProps> = ({ worker, onClose }) => {
    const { addToast, triggerSuccessFeedback, currentUser } = useAppContext();
    const { speak, isSpeaking } = useTextToSpeech();
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [isDispatching, setIsDispatching] = useState(false);
    const [dispatchedId, setDispatchedId] = useState<string | null>(null);
    const [dispatchMode, setDispatchMode] = useState<'remote' | 'inperson'>('inperson');
    const [showInPersonQR, setShowInPersonQR] = useState(false);
    const [mirrorMode, setMirrorMode] = useState(true);
    
    const [selectedLanguage, setSelectedLanguage] = useState('en-ZA');
    const [selectedTone, setSelectedTone] = useState<InviteTone>('warm');
    const [selectedBranch, setSelectedBranch] = useState<Branch>('paarl');

    const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
    const [selectedJobDescription, setSelectedJobDescription] = useState<string>('');
    const [isUploadingJD, setIsUploadingJD] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if ((worker as any).phone) {
            setPhone((worker as any).phone.replace(/\D/g, ''));
        }
    }, [worker]);

    const fetchJobDescriptions = async () => {
        try {
            const { data, error } = await supabase
                .from('job_descriptions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setJobDescriptions(data || []);
            
            // Auto-select first one if available and none selected
            if (data && data.length > 0 && !selectedJobDescription) {
                setSelectedJobDescription(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching job descriptions:', error);
            addToast("Failed to load job descriptions.", "error");
        }
    };

    useEffect(() => {
        fetchJobDescriptions();
    }, []);

    const handleJDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
            addToast("Only PDF and DOCX files are allowed for Job Descriptions.", "error");
            return;
        }

        setIsUploadingJD(true);
        try {
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filePath = `job-descriptions/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('documents') // Assuming 'documents' bucket exists and is used for this, or create a 'job-descriptions' bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 2. Insert into Database
            const branchName = selectedBranch === 'paarl' ? 'Nashua Paarl' : 'Nashua West Coast';
            const { data: insertData, error: dbError } = await supabase
                .from('job_descriptions')
                .insert({
                    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
                    file_url: publicUrl,
                    branch: branchName
                })
                .select()
                .single();

            if (dbError) throw dbError;

            addToast("Job Description uploaded successfully.", "success");
            await fetchJobDescriptions(); // Refresh list
            if (insertData) {
                setSelectedJobDescription(insertData.id); // Auto-select the newly uploaded one
            }

        } catch (error: any) {
            console.error('Upload JD error:', error);
            addToast(error.message || "Failed to upload Job Description.", "error");
        } finally {
            setIsUploadingJD(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const onboardUrl = dispatchedId
        ? (() => {
            const pin = String(parseInt(dispatchedId.replace(/-/g,'').slice(-6), 16)).slice(-6).padStart(6,'0');
            return `${window.location.origin}/?session=${dispatchedId}&pin=${pin}`;
          })()
        : `${window.location.origin}/?id=pending`;

    useEffect(() => {
        QRCode.toDataURL(onboardUrl, { width: 192, margin: 1, color: { dark: '#1e3a8a', light: '#ffffff' } })
            .then(setQrDataUrl)
            .catch(console.error);
    }, [onboardUrl]);

    const getPreviewText = () => {
        const link = dispatchedId ? `${window.location.origin}/?id=${dispatchedId}` : '[PORTAL_LINK]';
        const branchName = selectedBranch === 'paarl' ? 'Nashua Paarl' : 'Nashua West Coast';
        
        switch(selectedTone) {
            case 'urgent': return `🚨 ACTION REQUIRED: Hi ${worker.name}, your ${branchName} induction starts now. Please use this secure link to verify your ID and Banking immediately: ${link}`;
            case 'detailed': return `📋 ${branchName.toUpperCase()} ONBOARDING: Welcome ${worker.name}. To finalize your start, please use our AIVA portal to upload your SA ID, Proof of Residence, and Banking details. Link: ${link}`;
            default: return `👋 Welcome to the team, ${worker.name}! We're excited to have you at ${branchName}. Click this link to start your smooth, AI-guided onboarding journey: ${link}`;
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(onboardUrl);
        addToast("Link copied to clipboard.", "success");
    };

    const handleVoicePreview = () => {
        const branchName = selectedBranch === 'paarl' ? 'Nashua Paarl' : 'Nashua West Coast';
        speak(`Greeting for ${worker.name} in ${selectedLanguage}. Welcome to the ${branchName} team! I am Aiva, and I'll be your onboarding co pilot.`);
    };

    const handleDispatch = async () => {
        if (dispatchMode === 'remote' && (!phone || phone.length < 9)) {
            addToast("Valid mobile node required.", "warning");
            return;
        }

        if (!selectedJobDescription) {
            addToast("Please select a Job Description.", "warning");
            return;
        }

        setIsDispatching(true);
        try {
            const selectedJD = jobDescriptions.find(jd => jd.id === selectedJobDescription);
            
            const hireResp = await westflow.createNewHire(
                worker.name, 
                phone, 
                'Team Member',
                selectedJD?.title,
                selectedJD?.file_url,
                true // suppress_notification — we send our own template below
            );
            
            if (!hireResp.success) {
                addToast(hireResp.error || "Registry sync failed.", "error");
                return;
            }

            const hire = hireResp.data;
            const hireId = hire.id;
            setDispatchedId(hireId);

            const cleanPhone = phone.replace(/\D/g, '');
            // ── Derive 6-digit PIN from hireId — same algorithm everywhere ──
            const hirePin = String(parseInt(hireId.replace(/-/g, '').slice(-6), 16)).slice(-6).padStart(6, '0');
            // Include PIN in the link so tapping WhatsApp auto-authenticates — no typing needed
            const onboardLink = `${window.location.origin}/?session=${hireId}&pin=${hirePin}`;

            // Save onboard link + dispatch metadata — merge with existing
            const existingResp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const existingData = await existingResp.json();
            const existingMeta = existingData?.[0]?.metadata || {};

            await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    metadata: {
                        ...existingMeta,
                        onboard_link: onboardLink,
                        dispatched_at: new Date().toISOString(),
                        dispatched_by: currentUser?.name || 'Manager',
                        manager_phone: MANAGER_PHONES[currentUser?.employeeNumber || 'default'] || MANAGER_PHONES['default'],
                        branch: selectedBranch,
                        dispatch_mode: dispatchMode,
                        job_description: selectedJD?.title || '',
                        job_description_url: selectedJD?.file_url || '',
                        position: selectedJD?.title || '',
                        branch_name: selectedBranch === 'paarl' ? 'Nashua Paarl' : 'Nashua West Coast',
                        start_date: new Date().toLocaleDateString('en-ZA'),
                        reporting_to: 'Deon Boshoff (MD)',
                    }
                })
            });

            // Send nashua_welcome template — 2 body params: name + link (PIN baked into URL)
            const templateResult = await westflow.call('AIVA', 'send_whatsapp_template', {
                phone: cleanPhone,
                template_name: "nashua_welcome",
                language: "en",
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: worker.name },
                            { type: "text", text: onboardLink }
                        ]
                    }
                ]
            });
            console.log('[Dispatch] Template result:', JSON.stringify(templateResult));

            if (templateResult.success) {
                triggerSuccessFeedback(`Onboarding link sent to ${worker.name}`);
            } else {
                addToast(`WhatsApp sent but delivery unconfirmed — use Copy Link as backup.`, "warning");
            }
            
            // Always show QR after dispatch — it's the universal fallback
            setShowInPersonQR(true);
        } catch (e) {
            console.error("Dispatch Error:", e);
            addToast("Uplink failure.", "error");
        } finally {
            setIsDispatching(false);
        }
    };

    // In-person mode: after dispatch, show fullscreen QR for employee to scan
    if (showInPersonQR && dispatchedId) {
        // 6-digit PIN derived from hireId — last 6 hex chars → decimal
        const pin = String(parseInt(dispatchedId.replace(/-/g, '').slice(-6), 16)).slice(-6).padStart(6, '0');
        const onboardLink = `${window.location.origin}/?session=${dispatchedId}&pin=${pin}`;
        
        return (
            <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0d9488]/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center gap-6 text-center w-full max-w-lg">
                    
                    {/* Name + position */}
                    <div>
                        <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-[0.6em] mb-2 animate-pulse">Onboarding Ready For</p>
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{worker.name}</h2>
                        <p className="text-slate-400 text-sm mt-1 font-medium">{jobDescriptions.find(jd => jd.id === selectedJobDescription)?.title || 'New Hire'}</p>
                    </div>

                    {/* Three access methods */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                        
                        {/* QR Code */}
                        <div className="col-span-1 flex flex-col items-center gap-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">📱 Scan QR</p>
                            <div className="bg-white p-3 rounded-2xl shadow-xl">
                                {qrDataUrl ? (
                                    <img src={qrDataUrl} alt="Scan to start" className="w-32 h-32" />
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300 w-8 h-8" /></div>
                                )}
                            </div>
                        </div>

                        {/* PIN */}
                        <div className="col-span-1 flex flex-col items-center justify-center gap-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">🔑 PIN Code</p>
                            <div className="bg-[#0d9488]/10 border-2 border-[#0d9488]/30 rounded-2xl px-4 py-5 w-full flex flex-col items-center justify-center">
                                <p className="text-3xl font-black text-[#0d9488] tracking-[0.3em] font-mono">{pin}</p>
                                <p className="text-[8px] text-slate-500 mt-2 font-medium">Enter at login screen</p>
                            </div>
                        </div>

                        {/* WhatsApp status */}
                        <div className="col-span-1 flex flex-col items-center justify-center gap-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">💬 WhatsApp</p>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-5 w-full flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Sent to</p>
                                <p className="text-[11px] text-[#0d9488] font-mono mt-1">+{phone.replace(/\D/g,'').slice(0,4)}••••{phone.replace(/\D/g,'').slice(-3)}</p>
                                <p className="text-[8px] text-slate-500 mt-2">& Aiva Testing Crew</p>
                            </div>
                        </div>
                    </div>

                    {/* Direct link */}
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <p className="text-[9px] font-mono text-[#0d9488] truncate">{onboardLink}</p>
                        <button
                            onClick={() => { navigator.clipboard.writeText(onboardLink); addToast('Link copied', 'success'); }}
                            className="text-[8px] font-black text-slate-400 hover:text-white uppercase tracking-widest shrink-0 transition-colors"
                        >
                            Copy
                        </button>
                    </div>

                    <button
                        onClick={() => { setShowInPersonQR(false); onClose(); }}
                        className="px-10 py-3.5 bg-[#0d9488] text-white font-black uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all text-sm"
                    >
                        Done — Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/60 backdrop-blur-xl animate-fadeIn">
            <div className="absolute inset-0" onClick={onClose}></div>
            
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row overflow-hidden">
                <div className="md:w-5/12 bg-slate-50 dark:bg-[#232a3b]/40 p-8 md:p-12 flex flex-col border-r border-slate-100 dark:border-white/5 overflow-y-auto copilot-scrollbar">
                    <div className="text-center mb-8">
                        <span className="text-[8px] font-black text-brand-primary uppercase tracking-[0.4em]">Dispatch Protocol</span>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mt-1">{worker.name}</h2>
                    </div>
                    
                    <div className="bg-white p-4 rounded-3xl shadow-xl relative group overflow-hidden mx-auto mb-10 shrink-0 border border-slate-100">
                         {qrDataUrl ? (
                             <img src={qrDataUrl} alt="QR" className="w-32 h-32 md:w-44 md:h-44 transition-transform group-hover:scale-105 duration-700" />
                         ) : (
                             <div className="w-32 h-32 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                         )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                             <div className="flex justify-between items-center px-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Script Preview</p>
                                <button 
                                    onClick={handleVoicePreview}
                                    className={`p-1.5 rounded-lg transition-all ${isSpeaking ? 'bg-[#0d9488] text-white animate-pulse' : 'bg-slate-200 dark:bg-white/5 text-slate-500 hover:text-[#0d9488]'}`}
                                    title="Listen to greeting"
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                             <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-100 dark:border-white/5 italic text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium shadow-inner">
                                 "{getPreviewText()}"
                             </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopyLink}
                                className="flex-1 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 font-black rounded-xl uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5 transition-all shadow-sm"
                            >
                                <Copy className="w-3 h-3" /> Link
                            </button>
                            <button 
                                onClick={handleVoicePreview}
                                className="flex-1 py-3 bg-[#0d9488]/10 hover:bg-[#0d9488]/20 text-[#0d9488] font-black rounded-xl uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 border border-[#0d9488]/10 transition-all"
                            >
                                <Volume2 className="w-3 h-3" /> Voice Preview
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-center gap-2 text-slate-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">twAIn 3.2 Secure Tunnel</span>
                    </div>
                </div>

                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-between bg-white dark:bg-[#1a1f2e] overflow-y-auto copilot-scrollbar">
                    <div className="space-y-8">
                        {/* ── Dispatch Mode Toggle ── */}
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            <button
                                onClick={() => setDispatchMode('remote')}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${dispatchMode === 'remote' ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm' : 'text-slate-400'}`}
                            >
                                <Send className="w-3 h-3" /> Send WhatsApp
                            </button>
                            <button
                                onClick={() => setDispatchMode('inperson')}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${dispatchMode === 'inperson' ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm' : 'text-slate-400'}`}
                            >
                                <User className="w-3 h-3" /> Person is Here
                            </button>
                        </div>

                    <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{dispatchMode === 'remote' ? 'Candidate Node (Mobile)' : 'Mobile (optional for in-person)'}</label>
                            <div className="relative">
                                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d9488]" />
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="e.g. 27821234567 or 18165551234"
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-[#232a3b] border border-slate-100 dark:border-white/10 rounded-2xl font-black text-xl text-slate-900 dark:text-white outline-none transition-all shadow-inner focus:border-[#0d9488]"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleJDUpload} 
                                accept=".pdf,.docx" 
                                className="hidden" 
                            />
                            <JobDescriptionSelector 
                                jobDescriptions={jobDescriptions}
                                selectedId={selectedJobDescription}
                                onSelect={setSelectedJobDescription}
                                isUploadingJD={isUploadingJD}
                                onUploadClick={() => fileInputRef.current?.click()}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Branch Node</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setSelectedBranch('paarl')}
                                    className={`py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all border-2 ${selectedBranch === 'paarl' ? 'bg-[#0d9488]/5 border-[#0d9488] text-[#0d9488] shadow-sm' : 'bg-slate-50 dark:bg-[#232a3b] border-slate-100 dark:border-white/5 text-slate-400'}`}
                                >
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Paarl HQ</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedBranch('west_coast')}
                                    className={`py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all border-2 ${selectedBranch === 'west_coast' ? 'bg-[#0d9488]/5 border-[#0d9488] text-[#0d9488] shadow-sm' : 'bg-slate-50 dark:bg-[#232a3b] border-slate-100 dark:border-white/5 text-slate-400'}`}
                                >
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">West Coast</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Language Logic Node</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {languageOptions.slice(0, 4).map(lang => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => setSelectedLanguage(lang.code)}
                                        className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border-2 transition-all ${selectedLanguage === lang.code ? 'bg-[#0d9488] border-[#0d9488] text-white shadow-md' : 'bg-slate-50 dark:bg-[#232a3b] border-slate-100 dark:border-white/5 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Invite Urgency Calibration</label>
                            <div className="flex gap-3">
                                {(['warm', 'urgent', 'detailed'] as InviteTone[]).map(tone => (
                                    <button 
                                        key={tone}
                                        onClick={() => setSelectedTone(tone)}
                                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedTone === tone ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 shadow-sm' : 'bg-slate-50 dark:bg-[#232a3b] border-slate-100 dark:border-white/5 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-emerald-100 transition-all" onClick={() => setMirrorMode(!mirrorMode)}>
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                <div>
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight leading-none">Aiva Mirror Protocol</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Direct WhatsApp Sync</p>
                                </div>
                            </div>
                            {mirrorMode ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button onClick={onClose} className="flex-1 py-5 bg-slate-50 dark:bg-[#232a3b] text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:text-slate-700 transition-all border border-slate-200 dark:border-white/5">Abort</button>
                        <button 
                            onClick={handleDispatch}
                            disabled={isDispatching || !!dispatchedId}
                            className={`flex-[2] py-5 text-white font-black rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-xs border-b-4 active:border-b-0 active:translate-y-1 ${dispatchedId ? 'bg-emerald-600 border-emerald-800' : 'bg-[#0d9488] border-[#0a7c72] hover:brightness-110'}`}
                        >
                            {isDispatching ? <Loader2 className="w-5 h-5 animate-spin" /> : dispatchedId ? <CheckCircle2 className="w-5 h-5" /> : dispatchMode === 'inperson' ? <User className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                            {isDispatching ? 'Registering...' : dispatchedId ? (dispatchMode === 'inperson' ? 'Show QR Code →' : 'Pulse Dispatched') : dispatchMode === 'inperson' ? 'Register & Show QR' : 'Initialize Dispatch'}
                        </button>
                    </div>
                </div>
                
                <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const InPersonRegistration: React.FC = () => {
    const { addToast, triggerSuccessFeedback, currentUser } = useAppContext();
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<{
        hireId: string;
        hireName: string;
        pin: string;
        qrData: string;
        expiresAt: number;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    const fetchHires = async () => {
        setLoading(true);
        try {
            const resp = await westflow.getOnboardingPipeline();
            if (resp.success) {
                // Show hires who are pending or only at step 1
                setPipeline(resp.pipeline?.filter((h: any) => h.status !== 'COMPLETED' && h.step_reached <= 1) || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHires();
    }, []);

    useEffect(() => {
        if (!activeSession) return;
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining === 0) setActiveSession(null);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    const handleBeginInPerson = async (hire: any) => {
        // ── Always derive PIN from hireId — same algorithm as dispatch QR ──
        // This ensures the PIN shown on screen matches what's embedded in the QR URL
        const pin = String(parseInt(hire.id.replace(/-/g, '').slice(-6), 16)).slice(-6).padStart(6, '0');
        const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000);
        const expiresAtTimestamp = expiresAtDate.getTime();
        
        const baseUrl = window.location.origin;
        const sessionUrl = `${baseUrl}/?session=${hire.id}&pin=${pin}`;
        
        try {
            // Write to onboarding_sessions table
            const { error } = await supabase.from('onboarding_sessions').insert({
                hire_id: hire.id,
                pin: pin,
                created_by: currentUser?.name || 'Deon Boshoff',
                expires_at: expiresAtDate.toISOString()
            });

            if (error) throw error;

            // Also update hire metadata for redundancy
            await westflow.updateHireMetadata(hire.id, {
                kiosk_session: {
                    pin,
                    expires_at: expiresAtDate.toISOString(),
                    created_at: new Date().toISOString()
                }
            });

            const qrData = await QRCode.toDataURL(sessionUrl, { 
                width: 512, 
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' }
            });

            setActiveSession({
                hireId: hire.id,
                hireName: hire.staff_name,
                pin,
                qrData,
                expiresAt: expiresAtTimestamp
            });
            
            triggerSuccessFeedback(`Induction Session Active for ${hire.staff_name}`);
        } catch (e) {
            addToast("Session initialization failed. Data link unstable.", "error");
        }
    };

    if (activeSession) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return (
            <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn overflow-hidden font-sans">
                {/* Mesh Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-primary/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse"></div>
                
                <div className="w-full max-w-5xl flex flex-col items-center relative z-10">
                    <div className="text-center mb-12">
                        <span className="text-xs font-black text-brand-secondary uppercase tracking-[0.8em] mb-4 block animate-pulse">Identity Registry Ready</span>
                        <h3 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-tight">
                            READY FOR: <span className="text-brand-secondary underline decoration-8 decoration-brand-secondary/20 underline-offset-[16px]">{activeSession.hireName}</span>
                        </h3>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-32 w-full">
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-8 rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,0.8)] group transition-transform hover:scale-[1.02] duration-700 relative border-8 border-white/5">
                                <img src={activeSession.qrData} alt="Session QR" className="w-64 h-64 md:w-96 md:h-96" />
                                <div className="absolute inset-0 border-[16px] border-slate-950/10 rounded-[4rem] pointer-events-none"></div>
                            </div>
                            <p className="mt-10 text-base font-bold text-slate-400 uppercase tracking-[0.6em] flex items-center gap-4">
                                <Smartphone className="w-6 h-6 text-brand-secondary animate-bounce" />
                                Scan to Synchronize
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-12">
                            <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-12 w-full max-w-lg text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-brand-secondary/20">
                                    <div className="h-full bg-brand-secondary animate-voltage-flow" style={{ width: '50%' }}></div>
                                </div>
                                <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10">SECURITY PIN</p>
                                <div className="flex justify-center gap-6">
                                    {activeSession.pin.split('').map((digit, i) => (
                                        <div key={i} className="w-24 h-32 bg-slate-900 rounded-3xl border-4 border-brand-secondary flex items-center justify-center text-7xl font-black text-brand-secondary shadow-[0_0_50px_rgba(13,148,136,0.3)] transform transition-transform hover:scale-105">
                                            {digit}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-12 flex items-center justify-center gap-4 text-slate-400">
                                    <Key className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Manual Entry Protocol</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-8">
                                <div className="flex items-center gap-4 px-10 py-5 bg-white/5 rounded-full border-2 border-white/10 text-white shadow-2xl backdrop-blur-md">
                                    <Clock className="w-8 h-8 text-brand-secondary" />
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Session TTL</span>
                                        <span className="text-3xl font-black font-mono tabular-nums">{mins}:{secs < 10 ? `0${secs}` : secs}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveSession(null)}
                                    className="px-20 py-6 bg-brand-secondary hover:bg-brand-secondary/90 text-white font-black uppercase tracking-[0.3em] text-sm rounded-[2.5rem] shadow-[0_20px_60px_rgba(13,148,136,0.3)] transition-all border-b-8 border-[#0a7c72] active:border-b-0 active:translate-y-2 hover:scale-105"
                                >
                                    DONE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <footer className="absolute bottom-12 py-6 opacity-30">
                    <div className="flex items-center gap-4 text-slate-400">
                        <AivaLogo className="h-8 w-auto !grayscale" />
                        <div className="h-4 w-px bg-slate-700"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.6em]">Nashua Paarl Secure Node</span>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Kiosk Hand-off</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Select a pending candidate for in-person onboarding</p>
                </div>
                <button 
                    onClick={fetchHires}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                    <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pipeline.map(hire => (
                    <button 
                        key={hire.id}
                        onClick={() => handleBeginInPerson(hire)}
                        className="group relative bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-brand-primary/40 transition-all text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 transition-transform"><User className="w-24 h-24" /></div>
                        <div className="flex items-start gap-4 mb-6">
                            {hire.metadata?.profile_photo_url ? (
                                <img src={hire.metadata.profile_photo_url} className="w-12 h-12 rounded-2xl object-cover border border-slate-200" alt="" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/5 shadow-inner">
                                    <User className="w-6 h-6" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tighter truncate">{hire.staff_name}</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {hire.staff_id || 'PENDING'}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol: IN-PERSON</span>
                            <div className="p-2 bg-brand-primary text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md group-hover:translate-x-1">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </button>
                ))}
                {pipeline.length === 0 && !loading && (
                    <div className="col-span-full py-16 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 text-center">
                        <UsersIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">All dispatched hires have started onboarding.</p>
                        <p className="text-[9px] text-slate-300 uppercase font-bold tracking-widest">Use the form above to dispatch new hires.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const QrCodeGenerator: React.FC = () => {
  const { addToast, triggerSuccessFeedback } = useAppContext();
  const [activeMode, setActiveMode] = useState<'remote' | 'local'>('remote');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<FarmWorker | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [liveHires, setLiveHires] = useState<FarmWorker[]>([]);
  const [isLoadingHires, setIsLoadingHires] = useState(true);

  // ── Add New Employee form state ────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLanguage, setNewLanguage] = useState('en-ZA');
  const [isCreating, setIsCreating] = useState(false);
  const [addFormJDs, setAddFormJDs] = useState<{id: string; title: string; file_url: string; branch: string}[]>([]);
  const [selectedAddJD, setSelectedAddJD] = useState<string>('');

  // Fetch JDs for the add form
  const fetchAddFormJDs = async () => {
      try {
          const { data, error } = await supabase
              .from('job_descriptions')
              .select('*')
              .order('created_at', { ascending: false });
          if (!error && data) {
              setAddFormJDs(data);
              if (data.length > 0 && !selectedAddJD) setSelectedAddJD(data[0].id);
          }
      } catch (e) { /* ignore */ }
  };

  useEffect(() => {
      if (showAddForm) fetchAddFormJDs();
  }, [showAddForm]);

  // Fetch live hires from Supabase pipeline
  const fetchLiveDirectory = async () => {
      setIsLoadingHires(true);
      try {
          const resp = await westflow.getOnboardingPipeline();
          if (resp.success && resp.pipeline) {
              // Convert pipeline hires to FarmWorker shape, excluding archived
              const pipelineWorkers: FarmWorker[] = resp.pipeline
                  .filter((h: any) => h.status !== 'demo_archived')
                  .map((h: any) => ({
                  id: h.id,
                  name: h.staff_name || 'Unknown',
                  language: h.metadata?.language || 'en-ZA',
                  phone: h.phone || '',
                  onboardingCompleted: h.status === 'COMPLETED',
                  healthSafetyCompleted: (h.step_reached || 0) >= 5,
                  supervisor: h.metadata?.supervisor || 'Deon Boshoff',
                  _fromPipeline: true,
                  _step: h.step_reached,
                  _status: h.status,
              }));
              setLiveHires(pipelineWorkers);
          }
      } catch (e) {
          console.warn('[Dispatch] Pipeline fetch failed, using seed directory');
      } finally {
          setIsLoadingHires(false);
      }
  };

  useEffect(() => {
      fetchLiveDirectory();
  }, []);

  // Merge live hires + seed employees (dedup by name)
  const directory = useMemo(() => {
      const liveNames = new Set(liveHires.map(h => h.name.toLowerCase()));
      // Only include seed workers not already in pipeline
      const seedWorkers = MOCK_FARM_WORKERS.filter(w => !liveNames.has(w.name.toLowerCase()));
      // Live hires first, then seed
      return [...liveHires, ...seedWorkers];
  }, [liveHires]);

  const filteredWorkers = useMemo(() => 
    directory.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm, directory]
  );

  // Create new hire
  const handleCreateHire = async () => {
      if (newName.trim().length < 2) {
          addToast('Please enter the employee name.', 'warning');
          return;
      }
      setIsCreating(true);
      try {
          const selectedJD = addFormJDs.find(jd => jd.id === selectedAddJD);
          const result = await westflow.createNewHire(
              newName.trim(),
              newPhone.trim() || undefined,
              selectedJD?.title || 'Sales Consultant',
              selectedJD?.title || undefined,
              selectedJD?.file_url || undefined
          );
          if (result.success) {
              triggerSuccessFeedback(`${newName.trim()} added to directory`);
              setNewName('');
              setNewPhone('');
              setSelectedAddJD(addFormJDs[0]?.id || '');
              setNewLanguage('en-ZA');
              setShowAddForm(false);
              await fetchLiveDirectory();
          } else {
              addToast(result.error || 'Failed to create hire.', 'error');
          }
      } catch (e) {
          addToast('Failed to create hire.', 'error');
      } finally {
          setIsCreating(false);
      }
  };

  return (
    <div className="space-y-8 animate-fadeIn h-full flex flex-col pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
            <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Induction Dispatch</h2>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest">Candidate Invitation Control Center</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                <button 
                    onClick={() => setActiveMode('remote')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeMode === 'remote' ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Smartphone className="w-3.5 h-3.5" /> WhatsApp Dispatch
                </button>
                <button 
                    onClick={() => setActiveMode('local')}
                    className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeMode === 'local' ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <User className="w-3.5 h-3.5" /> In-Person Hand-off
                </button>
            </div>
        </div>

        {activeMode === 'remote' ? (
            <div className="space-y-8 h-full flex flex-col">
                <div className="flex justify-between items-center gap-4">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-[#0d9488] hover:bg-[#0a7c72] text-white font-black rounded-xl uppercase tracking-widest text-[9px] shadow-lg border-b-2 border-[#0a7c72] active:border-b-0 transition-all"
                    >
                        <Zap className="w-3.5 h-3.5" /> Add New Employee
                    </button>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search directory..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all w-64 shadow-sm" 
                        />
                    </div>
                </div>

                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-[3rem] shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden flex-1 flex flex-col min-h-0 relative">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12"><AiSparkIcon className="w-64 h-64 text-brand-primary" /></div>
                    
                    <div className="flex-1 overflow-y-auto copilot-scrollbar p-6 relative z-10">
                        {isLoadingHires ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-[#0d9488] animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredWorkers.slice(0, 40).map(worker => {
                                    const isPipeline = (worker as any)._fromPipeline;
                                    const step = (worker as any)._step;
                                    const status = (worker as any)._status;
                                    return (
                                        <div key={worker.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-[3px] border-l-[#0d9488] border-y border-r border-slate-100 dark:border-white/5 hover:shadow-md hover:-translate-y-0.5 transition-all group shadow-sm flex flex-col relative">
                                            <div className="absolute top-4 left-4">
                                                <img src="https://storage.googleapis.com/gemynd-public/projects/aiva/AfriDroids2%20(1).png" className="w-5 h-5 object-contain opacity-30 grayscale" alt="" />
                                            </div>
                                            <div className="flex justify-end mb-4 gap-1.5">
                                                {isPipeline && (
                                                    <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                        status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                        step > 0 ? 'bg-amber-100 text-amber-600' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {status === 'COMPLETED' ? 'Done' : step > 0 ? `Step ${step}` : 'New'}
                                                    </span>
                                                )}
                                                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-full">{worker.language}</span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase italic tracking-tight mb-1 group-hover:text-[#0d9488] transition-colors truncate mt-2">{worker.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-auto mb-6">
                                                {isPipeline ? 'ACTIVE HIRE' : 'EMPLOYEE NODE'}
                                            </p>
                                            <button 
                                                onClick={() => setSelectedWorker(worker)}
                                                className="w-full py-2.5 bg-transparent hover:bg-[#0d9488] text-[#0d9488] hover:text-white font-black rounded-xl transition-all uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 border border-[#0d9488]/30 shadow-sm"
                                            >
                                                <Zap className="w-3 h-3" /> Generate Invite
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <InPersonRegistration />
        )}
        
        {selectedWorker && <DispatchModal worker={selectedWorker} onClose={() => setSelectedWorker(null)} />}

        {/* ── Add New Employee Modal ─────────────────────────────────────── */}
        {showAddForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#0d9488] rounded-2xl text-white shadow-lg shrink-0">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Add New Employee</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Create hire & add to directory</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name *</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="e.g. Thandi Mokoena"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={newPhone}
                                onChange={e => setNewPhone(e.target.value)}
                                placeholder="e.g. 0721234567"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Position / Job Description</label>
                                {addFormJDs.length > 0 ? (
                                    <select
                                        value={selectedAddJD}
                                        onChange={e => setSelectedAddJD(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all"
                                    >
                                        {addFormJDs.map(jd => (
                                            <option key={jd.id} value={jd.id}>{jd.title}{jd.branch ? ` — ${jd.branch}` : ''}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-400 italic">
                                        No job descriptions uploaded yet
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Language</label>
                                <select
                                    value={newLanguage}
                                    onChange={e => setNewLanguage(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all"
                                >
                                    {languageOptions.map(l => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={handleCreateHire}
                            disabled={isCreating || newName.trim().length < 2}
                            className="w-full py-4 bg-[#0d9488] hover:bg-[#0a7c72] text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg border-b-4 border-[#0a7c72] active:border-b-0 flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {isCreating ? 'Creating...' : 'Create & Add to Directory'}
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
