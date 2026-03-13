import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ONBOARDING_STEPS, GCS_REGISTRY, languageOptions } from '../constants';
import { useAppContext } from '../context/AppContext';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { 
    CheckCircleIcon, 
    AiSparkIcon, 
    BanknoteIcon,
    PencilSquareIcon,
    ClockIcon
} from './icons';
import { DocumentHub } from './DocumentHub';
import { FormEngine } from './FormEngine';
import { PolicyPacketFlow } from './PolicyPacketFlow';
import { HR_FORMS } from '../constants/hrForms';
import { westflow } from '../services/westflowClient';
import { storageService } from '../services/storageService';
import { realtimeService } from '../services/realtimeService';
import { Scan, Signature, Monitor, Loader2, AlertCircle, Zap, CheckCircle2, FileSignature, Package, Smartphone, Maximize2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { stampEmployeeSignature } from '../utils/pdfStamper';
import { SignatureCapture, type SignatureResult } from './SignatureCapture';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

const ProfilePhotoCapture: React.FC<{
    onComplete: (url: string | null) => void;
    hireName: string;
    hireId: string;
}> = ({ onComplete, hireName, hireId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [captureState, setCaptureState] = useState<'preview' | 'review' | 'uploading'>('preview');
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 640, height: 640 } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            setError("We need camera access for your staff photo. You can skip this and add it later.");
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            startCamera();
        }, 0);
        return () => {
            clearTimeout(timer);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [startCamera]);

    const capturePhoto = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx || !videoRef.current) return;
        
        const video = videoRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        // Mirror horizontally for selfie
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);
        
        canvas.toBlob(blob => {
            if (blob) {
                setCapturedBlob(blob);
                setCapturedUrl(URL.createObjectURL(blob));
                setCaptureState('review');
            }
        }, 'image/jpeg', 0.85);
    };

    const uploadPhoto = async () => {
        if (!capturedBlob || !hireId) return;
        setCaptureState('uploading');
        try {
            const fileName = `profile_${hireId}_${Date.now()}.jpg`;
            const result = await storageService.uploadFile(
                capturedBlob, 
                fileName, 
                'profiles', 
                { type: 'profile_photo' },
                {
                    hireId: hireId,
                    documentType: 'profile',
                    appId: 'aiva',
                    documentStatus: 'uploaded'
                }
            );
            
            // Get fresh metadata before patching
            const getResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const currentData = await getResp.json();
            const freshMeta = currentData?.[0]?.metadata || {};
            
            await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        metadata: { ...freshMeta, profile_photo_url: result.publicUrl }
                    })
                }
            );
            
            // Small delay to ensure the patch is committed before resolving
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('[ProfilePhoto] Saved:', result.publicUrl);
            onComplete(result.publicUrl);
        } catch (e) {
            console.error('Upload photo error:', e);
            onComplete(null);
        }
    };

    const handleRetake = () => {
        setCapturedBlob(null);
        setCapturedUrl(null);
        setCaptureState('preview');
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[250] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[3rem] shadow-2xl p-8 flex flex-col items-center border border-white/10 mx-auto">
                <div className="text-center space-y-2 mb-8">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Welcome to the team, {(hireName || 'New Hire').split(' ')[0]}! 🎉</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Let's capture a photo for your staff profile.</p>
                </div>

                <div className="relative w-full max-h-[240px] aspect-square rounded-2xl overflow-hidden border-4 border-[#0d9488]/30 shadow-2xl bg-slate-100 dark:bg-slate-950 mb-8 flex items-center justify-center mx-auto">
                    {error ? (
                        <div className="p-6 text-center">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-bold">{error}</p>
                        </div>
                    ) : captureState === 'preview' ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="max-h-[240px] w-auto mx-auto rounded-2xl object-cover" 
                            style={{ transform: 'scaleX(-1)' }} 
                        />
                    ) : (
                        <img src={capturedUrl || ''} alt="Captured" className="max-h-[240px] w-auto mx-auto rounded-2xl object-cover" />
                    )}
                    
                    {captureState === 'uploading' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {!error && (
                    <div className="w-full space-y-4">
                        {captureState === 'preview' ? (
                            <button 
                                onClick={capturePhoto}
                                className="w-full py-4 bg-[#0d9488] text-white font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                            >
                                Capture Photo
                            </button>
                        ) : captureState === 'review' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleRetake}
                                    className="py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px]"
                                >
                                    Retake
                                </button>
                                <button 
                                    onClick={uploadPhoto}
                                    className="py-4 bg-[#0d9488] text-white font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Use This Photo
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}

                <button 
                    onClick={() => onComplete(null)}
                    disabled={captureState === 'uploading'}
                    className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline font-bold transition-colors"
                >
                    Skip for now →
                </button>
            </div>
        </div>
    );
};

// ─── Language Switcher Overlay ──────────────────────────────────────────────
const LanguageSwitcher: React.FC<{
    currentLang: string;
    onSelect: (lang: any) => void;
}> = ({ currentLang, onSelect }) => {
    // Show top 5 most common SA languages for Paarl area
    const featured = languageOptions.filter(l => ['en-ZA','af-ZA','xh-ZA','zu-ZA','st-ZA'].includes(l.code));
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-fadeIn">
            <div className="w-full max-w-sm mx-4 space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-5xl mb-4">🇿🇦</div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Welcome to AIVA</h2>
                    <p className="text-slate-400 text-sm">Choose your language to continue</p>
                    <p className="text-slate-500 text-xs italic">Kies jou taal · Khetha ulimi lwakho</p>
                </div>
                <div className="space-y-3">
                    {featured.map(opt => {
                        const FlagIcon = opt.Icon;
                        const isActive = currentLang === opt.code;
                        return (
                            <button
                                key={opt.code}
                                onClick={() => onSelect(opt.code)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-sm ${
                                    isActive 
                                        ? 'bg-[#0d9488] border-[#0d9488] text-white shadow-lg shadow-[#0d9488]/30' 
                                        : 'bg-white/5 border-white/10 text-white hover:border-[#0d9488]/50 hover:bg-white/10'
                                }`}
                            >
                                {FlagIcon ? (
                                    <FlagIcon className="w-8 h-8 rounded-md overflow-hidden shrink-0" />
                                ) : (
                                    <div className={`w-8 h-8 rounded-md ${opt.color} shrink-0`} />
                                )}
                                <span>{opt.name}</span>
                                {isActive && <span className="ml-auto text-xs">✓</span>}
                            </button>
                        );
                    })}
                </div>
                <p className="text-center text-[9px] text-slate-600 uppercase tracking-widest">
                    Nashua Paarl & West Coast · Powered by AIVA
                </p>
            </div>
        </div>
    );
};

// Removed WelcomeScreen

// ─── Upload Step Panel ────────────────────────────────────────────────────────
const UploadStepPanel: React.FC<{
    step: typeof ONBOARDING_STEPS[0];
    hireId: string;
    onComplete: () => void;
    onClose: () => void;
}> = ({ step, hireId, onComplete, onClose }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const uploadType = (step as any).uploadType || 'document';
    const instructions = (step as any).uploadInstructions || 'Please upload the required document.';

    const handleFileSelected = (file: File) => {
        setSelectedFile(file);
        setError(null);
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !hireId) return;
        setUploading(true);
        setError(null);
        try {
            const ext = selectedFile.name.split('.').pop() || 'jpg';
            const timestamp = Date.now();
            const filePath = `${hireId}/documents/${uploadType}_${timestamp}.${ext}`;

            // Upload to Supabase Storage
            const uploadResp = await fetch(
                `${SUPABASE_URL}/storage/v1/object/project-aiva-afridroids/${filePath}`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': selectedFile.type,
                        'x-upsert': 'true'
                    },
                    body: selectedFile
                }
            );
            if (!uploadResp.ok) throw new Error('Upload failed');

            // Insert row into uploaded_files (graceful — don't block on failure)
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/uploaded_files`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        hire_id: hireId,
                        document_type: uploadType,
                        document_status: 'uploaded',
                        app_id: 'aiva',
                        bucket_id: 'project-aiva-afridroids',
                        file_path: filePath,
                        file_name: selectedFile.name,
                        file_type: selectedFile.type,
                        file_size: selectedFile.size,
                        public_url: `${SUPABASE_URL}/storage/v1/object/public/project-aiva-afridroids/${filePath}`
                    })
                });
            } catch (insertErr) {
                console.warn('[UploadStepPanel] uploaded_files insert failed (non-blocking):', insertErr);
            }

            // Patch onboarding_telemetry metadata
            const getResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const currentData = await getResp.json();
            const freshMeta = currentData?.[0]?.metadata || {};

            await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        metadata: {
                            ...freshMeta,
                            [`${uploadType}_uploaded`]: true,
                            [`${uploadType}_path`]: filePath,
                            [`${uploadType}_uploaded_at`]: new Date().toISOString()
                        }
                    })
                }
            );

            setDone(true);
            setTimeout(() => { onComplete(); }, 1200);
        } catch (e) {
            console.error('[UploadStepPanel] Upload error:', e);
            setError('Upload failed. Please check your connection and try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
            <div className="bg-white dark:bg-[#1a1f2e] w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0d9488]/10">
                        <step.icon className="w-5 h-5 text-[#0d9488]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[8px] font-black text-[#0d9488] uppercase tracking-widest">Upload Required</p>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{step.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400">✕</button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Instructions */}
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">{instructions}</p>
                    </div>

                    {/* Preview */}
                    {selectedFile && (
                        <div className="rounded-2xl border-2 border-[#0d9488]/30 overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center min-h-[120px]">
                            {preview ? (
                                <img src={preview} alt="Preview" className="max-h-48 w-auto object-contain" />
                            ) : (
                                <div className="p-6 text-center">
                                    <div className="text-3xl mb-2">📄</div>
                                    <p className="text-xs font-black text-slate-600 dark:text-slate-300">{selectedFile.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Buttons */}
                    {done ? (
                        <div className="flex items-center justify-center gap-3 py-4 text-emerald-500">
                            <CheckCircle2 className="w-6 h-6" />
                            <span className="font-black uppercase tracking-widest text-sm">Uploaded successfully!</span>
                        </div>
                    ) : (
                        <>
                            {!selectedFile && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 py-5 bg-[#0d9488] text-white font-black rounded-2xl hover:brightness-110 transition-all shadow-md border-b-2 border-[#0a7c72]"
                                    >
                                        <Scan className="w-6 h-6" />
                                        <span className="text-[10px] uppercase tracking-widest">Take Photo</span>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 py-5 bg-white dark:bg-slate-800 text-[#0d9488] font-black rounded-2xl border-2 border-[#0d9488]/30 hover:border-[#0d9488] transition-all"
                                    >
                                        <Monitor className="w-6 h-6" />
                                        <span className="text-[10px] uppercase tracking-widest">Upload File</span>
                                    </button>
                                </div>
                            )}

                            {selectedFile && !uploading && (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleUpload}
                                        className="w-full py-4 bg-[#0d9488] text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:brightness-110 shadow-lg border-b-2 border-[#0a7c72] transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Upload & Continue
                                    </button>
                                    <button
                                        onClick={() => { setSelectedFile(null); setPreview(null); }}
                                        className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Choose Different File
                                    </button>
                                </div>
                            )}

                            {uploading && (
                                <div className="flex items-center justify-center gap-3 py-4 text-[#0d9488]">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-black text-xs uppercase tracking-widest">Uploading...</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Hidden file inputs */}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                    className="hidden" onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf"
                    className="hidden" onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
            </div>
        </div>
    );
};

const StepCard: React.FC<{ 
    step: typeof ONBOARDING_STEPS[0]; 
    index: number;
    isActive: boolean; 
    isCompleted: boolean; 
    currentHire: any;
    profilePhotoUrl?: string | null;
    onExecute: (mode: 'vision' | 'import' | 'form' | 'handshake' | 'provision' | 'execution' | 'invite' | 'review' | 'packet' | 'upload') => void;
    onSkip: () => void;
    onFinalize: () => void;
    onBriefing?: () => void;
}> = ({ step, index, isActive, isCompleted, currentHire, profilePhotoUrl, onExecute, onSkip, onFinalize, onBriefing }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isActive]);

    return (
        <div 
            ref={cardRef}
            id={`step-${step.id}`}
            className={`p-4 md:p-6 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-stretch gap-4 relative ${
                isCompleted ? 'bg-[#0d9488]/5 border-[#0d9488]/20' : 
                isActive ? 'bg-white dark:bg-slate-800 border-[#0d9488] shadow-[0_0_25px_rgba(13,148,136,0.15)] z-10 scale-[1.01] animate-pulse-slow' : 
                'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-40 grayscale pointer-events-none'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 md:p-4 rounded-2xl shrink-0 transition-all duration-500 ${isCompleted ? 'bg-[#0d9488] shadow-md shadow-[#0d9488]/20' : isActive ? 'bg-[#0d9488] shadow-md shadow-[#0d9488]/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <step.icon className={`w-6 h-6 md:w-8 md:h-8 transition-colors ${isCompleted || isActive ? 'text-white' : 'text-slate-400'}`} />
                </div>

                {/* Profile photo badge — shown on the active step only */}
                {isActive && profilePhotoUrl && (
                    <div className="relative shrink-0 -ml-1">
                        <img
                            src={profilePhotoUrl}
                            alt=""
                            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-[#0d9488]/40 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
                    </div>
                )}

                {step.actionType === 'review' && isActive && !isCompleted ? (
                    <div className="flex-1">
                         <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.2em] bg-[#0d9488] text-white">Step 0{index + 1}</span>
                            <span className="flex items-center gap-1.5 text-[8px] font-black text-[#0d9488] uppercase tracking-widest animate-pulse"><div className="w-1 h-1 rounded-full bg-[#0d9488]"></div> Final Review</span>
                        </div>

                        {/* Final Review Step — Conditional on Contract Status */}
                        {(() => {
                            const contractStatus = currentHire?.metadata?.contract_status?.toLowerCase();
                            const isCountersigned = contractStatus === 'countersigned';
                            const isSigned = contractStatus === 'signed';
                            const countersignerName = currentHire?.metadata?.countersigner_name || 'the Managing Director';
                            
                            if (isCountersigned) {
                                return (
                                    <div className="text-center space-y-6 py-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
                                            <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight">
                                                ✅ Contract Approved by {countersignerName}!
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                Finalizing your record now...
                                            </p>
                                        </div>
                                        <button 
                                            onClick={onFinalize}
                                            className="min-h-[44px] flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-xl border-b-2 border-[#0a7c72] transition-all mx-auto"
                                        >
                                            <CheckCircleIcon className="w-4 h-4" />
                                            FINALIZE NOW
                                        </button>
                                    </div>
                                );
                            } else if (isSigned) {
                                const CountdownRing = () => {
                                    const [countdown, setCountdown] = React.useState(15);
                                    React.useEffect(() => {
                                        const t = setInterval(() => setCountdown(c => c <= 1 ? 15 : c - 1), 1000);
                                        return () => clearInterval(t);
                                    }, []);
                                    const pct = ((15 - countdown) / 15) * 100;
                                    return (
                                        <div className="text-center space-y-6 py-4">
                                            {/* Animated ring with countdown */}
                                            <div className="relative w-24 h-24 mx-auto">
                                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                                                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-amber-100 dark:text-amber-900/30" />
                                                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6"
                                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                                                        strokeLinecap="round"
                                                        className="text-amber-500 transition-all duration-1000"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <ClockIcon className="w-7 h-7 text-amber-500" />
                                                    <span className="text-[11px] font-black text-amber-600 tabular-nums">{countdown}s</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight">
                                                    You're Done! 🎉
                                                </h3>
                                                <p className="text-[11px] font-bold text-[#0d9488] uppercase tracking-wider mt-1">Waiting for Deon to countersign</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-md mx-auto">
                                                    This usually takes just a few minutes. You can close this page — we'll send you a WhatsApp when everything is ready.
                                                </p>
                                                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                                    Checking every 15 seconds — this page will update automatically
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left space-y-2 max-w-sm mx-auto">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">What happens next</p>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-300">1. Deon countersigns your contract</p>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-300">2. Your record is exported to Sage HR</p>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-300">3. You receive your signed documents on WhatsApp</p>
                                            </div>
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                                                Nothing more needed from you — you're almost officially on the team!
                                            </p>
                                        </div>
                                    );
                                };
                                return <CountdownRing />;
                            } else {
                                // Check if employee has completed step7 (contract signed) — if so,
                                // contract_status may not reflect yet. Show waiting state, not error.
                                const step7Done = (currentHire?.metadata?.contract_status === 'signed') ||
                                    document.querySelector('[data-step="step7"][data-completed="true"]') !== null;
                                if (step7Done) {
                                    return (
                                        <div className="text-center space-y-4 py-4">
                                            <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto">
                                                <ClockIcon className="w-7 h-7 text-amber-500 animate-pulse" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white italic tracking-tight">You're Done! 🎉</h3>
                                                <p className="text-[11px] font-bold text-[#0d9488] uppercase tracking-wider mt-1">Waiting for Deon to countersign</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                                                    Nothing more needed from you — we'll send you a WhatsApp when your contract is fully signed.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="text-center space-y-4 py-4">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Please complete all previous steps before finalizing.
                                        </p>
                                        <button 
                                            onClick={() => {
                                                const firstIncomplete = document.querySelector('[class*="grayscale"]') as HTMLElement;
                                                if (firstIncomplete) firstIncomplete.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                            className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest hover:underline"
                                        >
                                            Go to incomplete step
                                        </button>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.2em] ${isActive ? 'bg-[#0d9488] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>Step 0{index + 1}</span>
                                {isActive && !isCompleted && (
                                    <>
                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-[#0d9488] uppercase tracking-widest animate-pulse"><div className="w-1 h-1 rounded-full bg-[#0d9488]"></div> AIVA assisting</span>
                                        {onBriefing && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onBriefing(); }}
                                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest hover:bg-amber-200 transition-all border border-amber-200/50"
                                            >
                                                <Zap className="w-2.5 h-2.5 fill-current" />
                                                AIVA Briefing
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            <h4 className="font-black uppercase text-base md:text-xl tracking-tighter italic text-slate-900 dark:text-white leading-tight">
                                {step.title.split(': ')[1] || step.title}
                            </h4>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">{step.description}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2 shrink-0">
                            {isActive && !isCompleted && (
                                <div className="flex flex-col gap-2">
                                    {step.actionType === 'dual' ? (
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => onExecute('vision')} 
                                                className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all"
                                            >
                                                <Scan className="w-4 h-4" /> Scan / Upload
                                            </button>
                                            <button 
                                                onClick={() => onExecute('form')} 
                                                className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-[#0d9488] font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-[#0d9488]/30 hover:border-[#0d9488] hover:bg-[#0d9488]/5 transition-all"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" /> Fill In Electronically
                                            </button>
                                        </div>
                                    ) : step.id === 'step1' ? (
                                        <button onClick={() => onExecute('execution')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <Signature className="w-4 h-4" /> Review Offer
                                        </button>
                                    ) : step.id === 'step7' ? (
                                        <button onClick={() => onExecute('execution')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <Signature className="w-4 h-4" /> Review & Sign Contract
                                        </button>
                                    ) : step.actionType === 'execution' ? (
                                        <button onClick={() => onExecute('execution')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <Signature className="w-4 h-4" /> Review & Accept
                                        </button>
                                    ) : step.actionType === 'upload' ? (
                                        <button onClick={() => onExecute('upload')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <Scan className="w-4 h-4" /> Upload Document
                                        </button>
                                    ) : step.actionType === 'form' ? (
                                        <button onClick={() => onExecute('form')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <PencilSquareIcon className="w-4 h-4" /> Fill Out Form
                                        </button>
                                    ) : step.actionType === 'packet' ? (
                                        <button onClick={() => onExecute('packet')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <FileSignature className="w-4 h-4" /> Review Policies
                                        </button>
                                    ) : (
                                        <button onClick={() => onExecute('vision')} className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 shadow-md border-b-2 border-[#0a7c72] transition-all">
                                            <Scan className="w-4 h-4" /> Take Photo
                                        </button>
                                    )}
                                    
                                    {/* Skip hidden for mandatory steps */}
                                    {step.id !== 'step2' && step.id !== 'step5' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSkip(); }}
                                            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-600 transition-all flex items-center justify-center gap-1.5 py-2"
                                        >
                                            Skip for now
                                        </button>
                                    )}
                                </div>
                            )}
                            {isCompleted && (
                                <div className="flex flex-col items-center justify-center gap-1 p-3 bg-[#0d9488]/5 rounded-2xl border border-[#0d9488]/20 animate-fadeIn">
                                    <CheckCircleIcon className="w-5 h-5 text-[#0d9488]" />
                                    <span className="text-[7px] font-black text-[#0d9488] uppercase tracking-widest italic">Saved</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { border-color: rgba(13, 148, 136, 1); box-shadow: 0 0 15px rgba(13, 148, 136, 0.15); }
                    50% { border-color: rgba(13, 148, 136, 0.4); box-shadow: 0 0 5px rgba(13, 148, 136, 0.05); }
                }
                .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};


// ─── Completion Packet ────────────────────────────────────────────────────────
interface CompletionPacketProps {
    hireName: string;
    profilePhotoUrl: string | null;
    metadata: Record<string, any>;
    onGoHome: () => void;
    onDownloadPDF: () => void;
}

const CompletionPacket: React.FC<CompletionPacketProps> = ({ hireName, profilePhotoUrl, metadata, onGoHome, onDownloadPDF }) => {
    const firstName = hireName.split(' ')[0];
    const docs = metadata.documents || {};

    const docItems = [
        {
            label: 'Employment Contract',
            status: metadata.contract_status === 'countersigned' ? 'countersigned' : metadata.contract_status === 'signed' ? 'signed' : null,
            url: metadata.countersigned_pdf_path || metadata.signed_pdf_path || null,
            signedBy: metadata.contract_signed_by || null,
            countersignedBy: metadata.countersigned_by || null,
            date: metadata.countersigned_at || metadata.contract_signed_at || null,
        },
        {
            label: 'Job Description',
            status: docs.job_description?.status || (metadata.jd_acknowledged ? 'acknowledged' : null),
            url: docs.job_description?.signed_url || metadata.job_description_url || null,
            date: docs.job_description?.signed_at || metadata.jd_acknowledged_at || null,
        },
        {
            label: 'Commission Manual',
            status: docs.commission_manual?.status || null,
            url: docs.commission_manual?.signed_url || null,
            date: docs.commission_manual?.signed_at || null,
        },
        {
            label: 'Performance Policy',
            status: docs.performance_policy?.status || null,
            url: docs.performance_policy?.signed_url || null,
            date: docs.performance_policy?.signed_at || null,
        },
    ].filter(d => d.status);

    const statusBadge = (status: string) => {
        if (status === 'countersigned') return { label: 'Countersigned', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' };
        if (status === 'signed') return { label: 'Signed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' };
        if (status === 'acknowledged') return { label: 'Acknowledged', color: 'text-[#0d9488] bg-[#0d9488]/10' };
        return { label: status, color: 'text-slate-400 bg-slate-100' };
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Hero */}
            <div className="bg-[#0f172a] rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AiSparkIcon className="w-48 h-48 text-[#0d9488]" />
                </div>
                {profilePhotoUrl && (
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#0d9488] shadow-xl mx-auto mb-4">
                        <img src={profilePhotoUrl} alt={hireName} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="w-12 h-12 bg-[#0d9488] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
                    Welcome, {firstName}!
                </h2>
                <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                    You're officially onboarded. All your documents are filed and your record has been exported to HR.
                </p>
                {metadata.job_description && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                        <Package className="w-4 h-4 text-[#0d9488]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{metadata.job_description}</span>
                    </div>
                )}
            </div>

            {/* Document Pack */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-[2rem] border border-slate-100 dark:border-white/10 overflow-hidden shadow-lg">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0d9488]/10">
                        <FileSignature className="w-4 h-4 text-[#0d9488]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Your Onboarding Pack</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{docItems.length} documents signed & filed</p>
                    </div>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {docItems.map((doc, i) => {
                        const badge = statusBadge(doc.status!);
                        return (
                            <div key={i} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#0d9488]/10 flex items-center justify-center shrink-0">
                                        <FileSignature className="w-4 h-4 text-[#0d9488]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-white">{doc.label}</p>
                                        {doc.date && (
                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">
                                                {new Date(doc.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {doc.countersignedBy ? ` · ${doc.countersignedBy}` : doc.signedBy ? ` · ${doc.signedBy}` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                    {doc.url && (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-[#0d9488] transition-colors"
                                        >
                                            <Smartphone className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {docItems.length === 0 && (
                        <div className="px-6 py-8 text-center text-slate-400 text-xs">
                            Documents loading...
                        </div>
                    )}
                </div>
            </div>

            {/* Export confirmation */}
            <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                    <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">HR Record Exported</p>
                    <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">Your employee record has been sent to Sage HR. Your documents are ready to download below.</p>
                </div>
            </div>

            {/* Download packet */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-[2rem] border border-slate-100 dark:border-white/10 overflow-hidden shadow-lg">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#0d9488]/10">
                        <Package className="w-4 h-4 text-[#0d9488]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Download Your Documents</h3>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Save copies for your records</p>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {metadata.signed_pdf_path && (
                        <a
                            href={metadata.countersigned_pdf_path || metadata.signed_pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-[#0d9488]/40 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#0d9488]/10 flex items-center justify-center">
                                    <FileSignature className="w-4 h-4 text-[#0d9488]" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white">Employment Contract</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">{metadata.contract_status === 'countersigned' ? 'Fully signed copy' : 'Your signed copy'}</p>
                                </div>
                            </div>
                            <Smartphone className="w-4 h-4 text-slate-300 group-hover:text-[#0d9488] transition-colors" />
                        </a>
                    )}
                    {metadata.sage_csv_path && (
                        <a
                            href={`${SUPABASE_URL}/storage/v1/object/public/project-aiva-afridroids/${metadata.sage_csv_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-[#0d9488]/40 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <BanknoteIcon className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white">Sage HR Export</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">CSV import file for payroll</p>
                                </div>
                            </div>
                            <Smartphone className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </a>
                    )}
                    {!metadata.signed_pdf_path && !metadata.sage_csv_path && (
                        <p className="text-center text-xs text-slate-400 py-4">Documents are being prepared — check back shortly.</p>
                    )}
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={onDownloadPDF}
                className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-[#0d9488] text-[#0d9488] font-black rounded-2xl uppercase tracking-widest text-xs transition-all hover:bg-[#0d9488]/5 flex items-center justify-center gap-2"
            >
                <FileSignature className="w-4 h-4" />
                Download My Employment Record (PDF)
            </button>
            <button
                onClick={onGoHome}
                className="w-full py-4 bg-[#0d9488] hover:bg-[#0a7c72] text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg border-b-4 border-[#0a7c72] active:border-b-0 flex items-center justify-center gap-2"
            >
                <CheckCircleIcon className="w-4 h-4" />
                Go to My Dashboard
            </button>
        </div>
    );
};

const OnboardingJourney: React.FC = () => {
    const { 
        triggerSuccessFeedback, 
        openMedia, 
        currentHire, 
        setCurrentHire,
        currentHireId, 
        workerId: contextId, 
        addToast, 
        initiateContextualChat, 
        handleGoHome, 
        language,
        setLanguage,
        kioskMode,
        setKioskMode
    } = useAppContext();
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [isDocHubOpen, setIsDocHubOpen] = useState(false);
    const [showPolicyPacket, setShowPolicyPacket] = useState(false);
    const [activeFormStep, setActiveFormStep] = useState<string | null>(null);
    const [isHydrating, setIsHydrating] = useState(true);
    const isOffline = useOfflineStatus();
    const [syncStatus, setSyncStatus] = useState<string>('IDLE');
    const [syncFailed, setSyncFailed] = useState(false);
    const [pendingStepId, setPendingStepId] = useState<string | null>(null);
    const [offlineQueue, setOfflineQueue] = useState<string[]>(() => {
        // Restore any queued steps from a previous offline session
        try { return JSON.parse(localStorage.getItem('aiva_offline_queue') || '[]'); } catch { return []; }
    });
    const [showFinalReview, setShowFinalReview] = useState(false);
    const [showPhotoCapture, setShowPhotoCapture] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showJDReview, setShowJDReview] = useState(false);
    const [showJDPreOffer, setShowJDPreOffer] = useState(false);
    const [jdAcknowledged, setJdAcknowledged] = useState(false);
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const [showSignCapture, setShowSignCapture] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(() => {
        // Show language picker on first load if not previously set
        return !localStorage.getItem('aiva-language-preference');
    });
    const [onboardingStartTime, setOnboardingStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Sticky photo URL state + Ref
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
        currentHire?.metadata?.profile_photo_url || null
    );
    const capturedPhotoRef = useRef<string | null>(
        currentHire?.metadata?.profile_photo_url || null
    );

    // Sync profilePhotoUrl when currentHire loads async (fixes thumbnail not showing during flow)
    useEffect(() => {
        const url = currentHire?.metadata?.profile_photo_url;
        if (url && !profilePhotoUrl) {
            capturedPhotoRef.current = url;
            setProfilePhotoUrl(url);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentHire?.metadata?.profile_photo_url]);
    
    // PWA resilience: persist hireId to localStorage so page refresh recovers correctly
    const recoveredHireId = (() => {
        try { return localStorage.getItem('aiva-active-hire-id'); } catch { return null; }
    })();
    const hireId = currentHireId || currentHire?.id || contextId || recoveredHireId || null;

    // Persist hireId whenever it resolves
    useEffect(() => {
        if (hireId && UUID_REGEX.test(hireId)) {
            try { localStorage.setItem('aiva-active-hire-id', hireId); } catch { /* Ignore storage errors */ }
        }
    }, [hireId]);

    // Duplicate tab detection — two tabs writing to same hire record causes data corruption
    useEffect(() => {
        if (!hireId) return;
        try {
            const channel = new BroadcastChannel(`aiva-onboarding-${hireId}`);
            channel.postMessage({ type: 'TAB_OPEN', ts: Date.now() });
            channel.onmessage = (e) => {
                if (e.data?.type === 'TAB_OPEN') {
                    addToast('⚠ This onboarding is open in another tab. Please close this one.', 'warning');
                }
            };
            return () => channel.close();
        } catch (e) {
            console.warn('BroadcastChannel not supported or failed:', e);
        }
    }, [hireId, addToast]);
    const identifiedName = currentHire?.staff_name || null;

    const hydrateState = useCallback(async () => {
        if (!hireId || !UUID_REGEX.test(hireId)) {
            setIsHydrating(false);
            return;
        }
        
        try {
            const resp = await westflow.getHireDetails(hireId);
            if (resp.success && resp.data) {
                const hireData = resp.data;
                const stepReached = hireData.step_reached || 1;
                const meta = hireData.metadata || {};
                const contractStatus = meta.contract_status?.toLowerCase();
                const previouslyCompleted = [];
                for (let i = 1; i < stepReached; i++) {
                    previouslyCompleted.push(`step${i}`);
                }

                // If contract is countersigned and we're at step6, auto-advance to review step
                // This handles the case where Deon countersigns externally and hire reloads
                if (contractStatus === 'countersigned' && stepReached <= 6 && !previouslyCompleted.includes('step6')) {
                    previouslyCompleted.push('step6');
                }

                setCompletedSteps(previouslyCompleted);
                setCurrentHire(hireData);

                // Auto-fire export if countersigned but export not yet done
                if (contractStatus === 'countersigned' && !meta.export_completed) {
                    setTimeout(async () => {
                        try {
                            await exportOnboardingRecord(hireId);
                            // Mark export as done in metadata to prevent re-firing
                            await fetch(
                                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                                {
                                    method: 'PATCH',
                                    headers: {
                                        'apikey': SUPABASE_KEY,
                                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                                        'Content-Type': 'application/json',
                                        'Prefer': 'return=minimal'
                                    },
                                    body: JSON.stringify({
                                        metadata: { ...meta, export_completed: true, export_completed_at: new Date().toISOString() }
                                    })
                                }
                            );
                        } catch (exportErr) {
                            console.warn('[hydrateState] Auto-export failed:', exportErr);
                        }
                    }, 1000);
                }
                
                // Photo persistence logic: prioritize Ref or non-null server data
                const serverPhotoUrl = meta.profile_photo_url;
                if (serverPhotoUrl) {
                    capturedPhotoRef.current = serverPhotoUrl;
                    setProfilePhotoUrl(serverPhotoUrl);
                } else if (capturedPhotoRef.current) {
                    // Server hasn't committed yet or returned null — stick with the captured one
                    setProfilePhotoUrl(capturedPhotoRef.current);
                }
            }
        } catch {
            setIsHydrating(false);
        } finally {
            setIsHydrating(false);
        }
    }, [hireId, setCurrentHire]);

    useEffect(() => {
        hydrateState();
        const timer = setTimeout(() => setIsHydrating(false), 6000);

        // Kiosk mode: detect ?kiosk=1 URL param (for printed QR code on wall)
        if (window.location.search.includes('kiosk=1')) {
            setKioskMode(true);
            try { (screen.orientation as any)?.lock?.('portrait'); } catch { /* not supported */ }
        }

        return () => clearTimeout(timer);
    }, [hydrateState, setKioskMode]);

    useEffect(() => {
        if (hireId && completedSteps.length >= 5) { // Listen from step 6 onwards — catch countersign at any point
            const checkContractStatus = async () => {
                try {
                    const result = await westflow.getHireDetails(hireId);
                    if (result.success && result.data) {
                        setCurrentHire(result.data);
                        handleHireUpdate(result.data);
                    }
                } catch (err) {
                    console.warn('Failed to refresh contract status:', err);
                }
            };
            
            const handleHireUpdate = (hireData: any) => {
                const meta = hireData.metadata || {};
                // Auto-finalize: countersign detected — mark step done, fire export
                if (meta.contract_status === 'countersigned' && !meta.export_completed) {
                    console.log('[AutoFinalize] Countersign detected — auto-advancing');
                    // Advance to completion if not already there
                    setCompletedSteps(prev => {
                        const steps = [...prev];
                        if (!steps.includes('step7')) steps.push('step7');
                        if (!steps.includes('step8')) steps.push('step8');
                        return steps;
                    });
                    // Fire export after short delay to let state settle
                    setTimeout(() => exportOnboardingRecord(hireId), 1500);
                }
            };

            checkContractStatus();
            
            const unsubscribe = realtimeService.subscribeToHire(hireId, async () => {
                const result = await westflow.getHireDetails(hireId);
                if (result.success && result.data) {
                    setCurrentHire(result.data);
                    handleHireUpdate(result.data);
                }
            });
            
            return () => unsubscribe();
        }
    }, [completedSteps.length, hireId, setCurrentHire]);

    useEffect(() => {
        if (showFinalReview || showWelcome) {
            setShowPhotoCapture(false);
        }
    }, [showFinalReview, showWelcome]);

    const currentStepIndex = completedSteps.length;
    const progressPercent = Math.min(100, Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100));
    const currentStep = ONBOARDING_STEPS[currentStepIndex] || null;

    // ── Save form data flat into onboarding_telemetry.metadata ───────────────
    const saveFormDataToMetadata = useCallback(async (formData: Record<string, any>) => {
        if (!hireId || !UUID_REGEX.test(hireId)) {
            console.error('[FormSave] Cannot save — hireId missing or invalid:', hireId);
            addToast('Could not save form — session issue. Please refresh.', 'error');
            return;
        }
        try {
            // Get fresh metadata first to avoid clobbering other fields
            const getResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const rows = await getResp.json();
            const freshMeta = rows?.[0]?.metadata || {};

            // Merge form data flat into metadata
            const merged = { ...freshMeta, ...formData };

            await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ metadata: merged })
                }
            );

            // Update local state so CompletionPacket reflects new data immediately
            setCurrentHire((prev: any) => prev ? { ...prev, metadata: merged } : prev);
            console.log('[FormSave] Saved', Object.keys(formData).length, 'fields to metadata:', Object.keys(formData).join(', '));
        } catch (e) {
            console.error('[FormSave] Failed to save form data:', e);
        }
    }, [hireId, setCurrentHire, addToast]);

    // ── Offline queue: persist to localStorage, drain when back online ──────────
    useEffect(() => {
        try { localStorage.setItem('aiva_offline_queue', JSON.stringify(offlineQueue)); } catch { /* ignore */ }
    }, [offlineQueue]);

    useEffect(() => {
        if (!isOffline && offlineQueue.length > 0) {
            // Back online — drain queued steps in order, with a small delay between each
            const drain = async () => {
                const queue = [...offlineQueue];
                setOfflineQueue([]);
                for (const stepId of queue) {
                    await handleStepComplete(stepId);
                    await new Promise(r => setTimeout(r, 400));
                }
                addToast(`✅ ${queue.length} step${queue.length > 1 ? 's' : ''} synced after reconnecting`, 'success');
            };
            drain();
        }
    }, [isOffline]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStepComplete = useCallback(async (stepId: string) => {
        if (completedSteps.includes(stepId)) return;

        // ── Offline guard: queue step and show banner, drain when reconnected ──
        if (isOffline) {
            if (!offlineQueue.includes(stepId)) {
                const newQ = [...offlineQueue, stepId];
                setOfflineQueue(newQ);
                // Still advance UI optimistically so employee isn't blocked
                setCompletedSteps(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
                addToast('📶 You\'re offline — step saved and will sync when you reconnect', 'warning');
            }
            return;
        }

        const newCompleted = [...completedSteps, stepId];
        setCompletedSteps(newCompleted);
        setSyncStatus('SYNCING');

        try {
            if (stepId === 'step1' && !profilePhotoUrl) {
                setShowPhotoCapture(true);
            }
            
            if (hireId && UUID_REGEX.test(hireId)) {
                const stepNum = parseInt(stepId.replace('step', ''));

                // ─── PATCH: Step 7 (Contract Signing) ────────────────────────────
                // Write contract_status = 'signed' to metadata BEFORE advancing step.
                // This is what makes the countersign list populate on the manager side.
                if (stepNum === 7) {
                    try {
                        // Fetch fresh metadata to avoid overwriting other fields
                        const getR = await fetch(
                            `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                            { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
                        );
                        const rows = await getR.json();
                        const freshMeta = rows?.[0]?.metadata || {};

                        // Write signed status to metadata
                        await fetch(
                            `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                            {
                                method: 'PATCH',
                                headers: {
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify({
                                    metadata: {
                                        ...freshMeta,
                                        contract_status: 'signed',
                                        contract_signed_at: new Date().toISOString(),
                                        contract_signed_by: identifiedName || currentHire?.staff_name || 'Employee'
                                    }
                                })
                            }
                        );
                        console.log('[Step7] ✅ contract_status set to "signed" in metadata');

                        // Notify WhatsApp group — "ready to countersign"
                        const GROUP_JID = '120363423479055395@g.us';
                        const empName = (identifiedName || currentHire?.staff_name || 'Team Member').split(' ')[0];
                        await westflow.sendWhatsAppNotification(
                            GROUP_JID,
                            `✍️ ${empName} has signed their employment contract — ready for countersignature.`
                        );
                        console.log('[Step7] ✅ WhatsApp group notified');
                    } catch (contractErr) {
                        console.warn('[Step7] Contract status write or WhatsApp failed:', contractErr);
                        // Don't block the flow — the step can still advance
                    }
                }
                // ─── END PATCH ────────────────────────────────────────────────────

                await westflow.advanceOnboardingStep(hireId, stepNum + 1);
                
                // Send per-step WhatsApp to employee (skip step 7 — handled above via group)
                if (currentHire?.phone && stepNum !== 7) {
                    const cleanPhone = currentHire.phone.replace(/\D/g, '');
                    const name = (identifiedName || 'Team Member').split(' ')[0];
                    const stepMessages = [
                      `✅ ${name}, your employment offer has been accepted.`,
                      `✅ ${name}, your ID has been verified.`,
                      `✅ ${name}, your proof of address has been submitted.`,
                      `✅ ${name}, your banking details have been saved.`,
                      `✅ ${name}, your policy acknowledgments are complete.`,
                      `✅ ${name}, your benefits setup is complete.`,
                      `🎉 Welcome ${name}! You are now fully onboarded. Welcome to Nashua!`
                    ];
                    await westflow.sendWhatsAppNotification(cleanPhone, stepMessages[stepNum - 1]);
                }
            }
        } catch (e) {
            console.warn('[OnboardingJourney] Step sync error:', e);
            // Roll back optimistic update and flag for retry
            setCompletedSteps(completedSteps);
            setSyncFailed(true);
            setPendingStepId(stepId);
            setSyncStatus('IDLE');
            return;
        } finally {
            if (!syncFailed) {
                setSyncStatus('PERSISTENT');
                setTimeout(() => setSyncStatus('IDLE'), 2000);
            }
        }
        setSyncFailed(false);
        setPendingStepId(null);
        triggerSuccessFeedback("Progress saved.");

        // JD review now happens before Step 1 offer — no need to show again after step 6
    }, [triggerSuccessFeedback, hireId, completedSteps, currentHire, identifiedName, profilePhotoUrl, addToast, isOffline, offlineQueue, syncFailed]);

    const handlePhotoComplete = (url: string | null) => {
        setShowPhotoCapture(false);
        if (url) {
            console.log('[Photo] Setting profile URL:', url);
            capturedPhotoRef.current = url;
            setProfilePhotoUrl(url);
            if (!completedSteps.includes('step1')) {
                setCompletedSteps(prev => [...prev, 'step1']);
                // Start onboarding timer
                const startTs = Date.now();
                setOnboardingStartTime(startTs);
                timerRef.current = setInterval(() => {
                    setElapsedSeconds(Math.floor((Date.now() - startTs) / 1000));
                }, 1000);
            }
            // Don't hydrate immediately — the metadata PATCH might not be committed yet.
            setTimeout(() => hydrateState(), 2000);
        } else {
            hydrateState();
        }
    };

    const handlePacketComplete = async (metadataUpdate: any) => {
        setShowPolicyPacket(false);
        if (hireId) {
             await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        metadata: {
                            ...currentHire?.metadata,
                            ...metadataUpdate
                        }
                    })
                }
            );
        }
        await handleStepComplete('step6');
    };

    // ── Generate employee completion PDF ─────────────────────────────────────

    const generateOfferPDF = async (meta: Record<string, any>, hireName: string, hireId: string): Promise<string | null> => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const teal  = [13, 148, 136]  as [number, number, number];
            const dark  = [15, 23, 42]    as [number, number, number];
            const grey  = [100, 116, 139] as [number, number, number];
            const light = [248, 250, 252] as [number, number, number];
            const W = pdf.internal.pageSize.getWidth();
            const H = pdf.internal.pageSize.getHeight();
            const M = 20;
            let y = 0;

            // ── Header bar ──────────────────────────────────────────────
            pdf.setFillColor(...teal);
            pdf.rect(0, 0, W, 28, 'F');

            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('NASHUA PAARL & WEST COAST', M, 12);

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text('3 Gimnasium Street, Paarl 7646  |  Tel: +27 21 872 8252  |  info@nashuapwc.co.za', M, 20);

            pdf.setFontSize(7);
            pdf.setTextColor(...grey);
            pdf.text('PRIVATE & CONFIDENTIAL', W - M, 12, { align: 'right' });
            pdf.text(new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 20, { align: 'right' });

            y = 42;

            // ── Greeting ─────────────────────────────────────────────────
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...dark);
            pdf.text('OFFER OF EMPLOYMENT', M, y); y += 8;

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Dear ${hireName},`, M, y); y += 7;

            pdf.setFontSize(9);
            const intro = 'This letter constitutes a valid offer of employment from Paarl and West Coast Office Automation (Pty) Ltd t/a Nashua Paarl & West Coast. Please find detailed below our offer of employment, as per discussions today.';
            const introLines = pdf.splitTextToSize(intro, W - M * 2);
            pdf.text(introLines, M, y); y += introLines.length * 5 + 6;

            // ── Terms table ───────────────────────────────────────────────
            const position    = meta.job_description || meta.position || 'Sales Consultant';
            const branch      = meta.branch_name || (meta.branch === 'paarl' ? 'Nashua Paarl' : 'Nashua West Coast');
            const startDate   = meta.start_date || new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
            const reportingTo = meta.reporting_to || 'Deon Boshoff (MD)';

            const tableRows = [
                ['Position:', position],
                ['Commence Date:', startDate],
                ['Branch:', branch],
                ['Reporting to:', reportingTo],
            ];

            const colW = (W - M * 2) / 2;
            tableRows.forEach(([label, value]) => {
                pdf.setFillColor(...light);
                pdf.rect(M, y - 4, W - M * 2, 9, 'F');
                pdf.setDrawColor(226, 232, 240);
                pdf.rect(M, y - 4, W - M * 2, 9, 'S');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8.5);
                pdf.setTextColor(...dark);
                pdf.text(label, M + 3, y + 1);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...teal);
                pdf.text(value, M + colW + 3, y + 1);
                y += 10;
            });

            y += 6;

            // ── Remuneration section ─────────────────────────────────────
            pdf.setFillColor(...teal);
            pdf.rect(M, y - 4, W - M * 2, 8, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(255, 255, 255);
            pdf.text('REMUNERATION PACKAGE', M + 3, y + 0.5);
            y += 10;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...grey);
            const remuNote = 'Your specific remuneration package will be confirmed in your employment contract. This offer is subject to successful completion of the onboarding process and background verification.';
            const remuLines = pdf.splitTextToSize(remuNote, W - M * 2);
            pdf.text(remuLines, M, y); y += remuLines.length * 5 + 8;

            // ── Conditions ───────────────────────────────────────────────
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(...dark);
            pdf.text('CONDITIONS OF OFFER', M, y); y += 6;

            const conditions = [
                'This offer is subject to satisfactory reference checks and verification of qualifications.',
                'Employment is subject to a probationary period as per your employment contract.',
                'You will be required to comply with all company policies and procedures.',
                'This offer lapses if not accepted within 48 hours of receipt.',
            ];
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...grey);
            conditions.forEach(c => {
                pdf.text(`•  ${c}`, M + 3, y);
                y += 6;
            });

            y += 6;

            // ── Acceptance block ─────────────────────────────────────────
            pdf.setFillColor(...light);
            pdf.rect(M, y - 4, W - M * 2, 32, 'F');
            pdf.setDrawColor(...teal);
            pdf.rect(M, y - 4, W - M * 2, 32, 'S');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(...dark);
            pdf.text('ACCEPTANCE', M + 3, y + 2);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...grey);
            pdf.text('By accepting this offer through the AIVA onboarding system, you confirm that you have', M + 3, y + 8);
            pdf.text('read, understood, and accept the terms of this offer of employment.', M + 3, y + 13);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...teal);
            pdf.text(`Candidate: ${hireName}`, M + 3, y + 21);
            pdf.text(`Offered by: ${reportingTo}`, W - M - 3, y + 21, { align: 'right' });

            y += 38;

            // ── Footer ───────────────────────────────────────────────────
            pdf.setFillColor(...dark);
            pdf.rect(0, H - 14, W, 14, 'F');
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(148, 163, 184);
            pdf.text('This document is confidential and generated by AIVA — Nashua Workforce Central.', M, H - 7);
            pdf.text(`Ref: ${hireId.slice(0, 8).toUpperCase()} · Powered by Gemynd WestFlow`, W - M, H - 7, { align: 'right' });

            // ── Upload to storage ────────────────────────────────────────
            const blob = pdf.output('blob');
            const file = new File([blob], `offer_${hireId}_${Date.now()}.pdf`, { type: 'application/pdf' });
            const uploadResult = await storageService.uploadFile(file, file.name, 'contracts', { hire_id: hireId });
            return uploadResult?.publicUrl || null;
        } catch (e) {
            console.warn('[generateOfferPDF] Failed:', e);
            return null;
        }
    };

    const generateCompletionPDF = (meta: Record<string, any>, hireName: string, hireId: string): void => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const teal = [13, 148, 136] as [number, number, number];
            const dark = [15, 23, 42] as [number, number, number];
            const grey = [100, 116, 139] as [number, number, number];
            const W = pdf.internal.pageSize.getWidth();
            const M = 20;

            // Header bar
            pdf.setFillColor(...teal);
            pdf.rect(0, 0, W, 28, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text('NASHUA PAARL & WEST COAST', M, 12);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Employee Onboarding Record — Confidential', M, 19);
            pdf.text(new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 19, { align: 'right' });

            let y = 40;

            // Name & role badge
            pdf.setTextColor(...dark);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.text((hireName || 'Employee').toUpperCase(), M, y);
            y += 7;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(...grey);
            pdf.text(meta.job_description || 'Sales Executive', M, y);
            y += 4;
            pdf.setDrawColor(...teal);
            pdf.setLineWidth(0.5);
            pdf.line(M, y, W - M, y);
            y += 8;

            // Time-taken badge — the money shot
            const secs = meta.onboarding_duration_seconds;
            if (secs && secs > 0) {
                const mins = Math.floor(secs / 60);
                const rem = secs % 60;
                const timeStr = mins > 0 ? mins + 'm ' + rem + 's' : rem + 's';
                pdf.setFillColor(...teal);
                pdf.roundedRect(M, y, W - M * 2, 14, 3, 3, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.text('⏱  Onboarded in ' + timeStr, W / 2, y + 9, { align: 'center' });
                pdf.setTextColor(...dark);
                y += 20;
            }

            const section = (title: string) => {
                pdf.setFillColor(245, 247, 250);
                pdf.rect(M, y - 4, W - M * 2, 8, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.setTextColor(...teal);
                pdf.text(title.toUpperCase(), M + 2, y + 1);
                y += 8;
            };

            const row = (label: string, value: string) => {
                if (!value) return;
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.setTextColor(...grey);
                pdf.text(label, M, y);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...dark);
                pdf.text(value, M + 55, y);
                y += 6;
            };

            // Personal Details
            section('Personal Information');
            row('Surname', meta.surname || '');
            row('First Names', meta.first_names || '');
            row('ID Number', meta.identity_number || '');
            row('Date of Birth', meta.date_of_birth || '');
            row('Residency Status', meta.residency_status || '');
            row('Cell Number', meta.cell_number || '');
            row('Email', meta.email_address || '');
            y += 2;

            // Address
            section('Residential Address');
            row('Street', meta.home_address_line_1 || '');
            row('Suburb', meta.home_address_suburb || '');
            row('City', meta.home_address_city || '');
            row('Province', meta.home_address_province || '');
            row('Postal Code', meta.postal_code || '');
            y += 2;

            // Emergency Contact
            section('Emergency Contact');
            row('Name', meta.emergency_contact_name || '');
            row('Relationship', meta.emergency_contact_relationship || '');
            row('Phone', meta.emergency_contact_phone || '');
            y += 2;

            // Banking (masked)
            section('Banking Details');
            row('Bank', meta.bank_name || '');
            row('Account Type', meta.account_type || '');
            row('Branch Code', meta.branch_code || '');
            const accNum = meta.account_number || '';
            row('Account Number', accNum ? '****' + accNum.slice(-4) : '');
            y += 2;

            // Contract status
            section('Employment Status');
            row('Start Date', meta.start_date || '');
            row('Position', meta.job_description || 'Sales Executive');
            row('Contract Status', meta.contract_status || 'Signed');
            row('Tax Number', meta.income_tax_number || '');
            y += 2;

            // Documents uploaded
            section('Documents Captured');
            row('SA Identity Document', meta.identity_document_uploaded ? 'Uploaded ✓' : 'Pending');
            row('Proof of Residence', meta.proof_of_residence_uploaded ? 'Uploaded ✓' : 'Pending');
            row('Profile Photo', meta.profile_photo_url ? 'Captured ✓' : 'Pending');
            y += 2;

            // Footer
            const footerY = pdf.internal.pageSize.getHeight() - 18;
            pdf.setFillColor(...teal);
            pdf.rect(0, footerY, W, 18, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.text('This document is confidential and generated by AIVA — Nashua Workforce Central.', M, footerY + 7);
            pdf.text('Ref: ' + hireId.slice(0, 8).toUpperCase(), W - M, footerY + 7, { align: 'right' });
            pdf.text('Powered by Gemynd WestFlow', M, footerY + 13);

            const fileName = 'AIVA_Onboarding_' + (hireName || 'Employee').replace(/\s+/g, '_') + '.pdf';
            pdf.save(fileName);
            console.log('[PDF] Generated:', fileName);
        } catch (e) {
            console.error('[PDF] Generation failed:', e);
        }
    };

    const exportOnboardingRecord = async (hireId: string) => {
        try {
            // ── 1. Fetch fresh hire record ────────────────────────────────────
            const getResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const data = await getResp.json();
            if (!data || data.length === 0) throw new Error('Hire record not found');
            const hireRecord = data[0];
            const meta = hireRecord.metadata || {};

            // Guard: only export once countersigned
            if (meta.contract_status !== 'countersigned') {
                console.warn('[export] Skipping — contract not yet countersigned');
                return;
            }
            // Guard: don't double-export
            if (meta.export_completed) {
                console.log('[export] Already exported — skipping');
                return;
            }

            const empName      = hireRecord.staff_name || 'Employee';
            const employeeNum  = hireRecord.id.slice(0, 8).toUpperCase();

            // ── 2. Build single Sage HR CSV row ───────────────────────────────
            const sageRow = {
                Employee_Number:                    employeeNum,
                Surname:                            meta.surname || empName.split(' ').slice(1).join(' ') || '',
                First_Names:                        meta.first_names || empName.split(' ')[0] || '',
                ID_Number:                          meta.identity_number || '',
                Date_Of_Birth:                      meta.date_of_birth || '',
                Residency_Status:                   meta.residency_status || '',
                Race_EEA:                           meta.race || '',
                Drivers_Licence:                    meta.drivers_licence_number || '',
                Cell_Number:                        hireRecord.phone || meta.cell_number || '',
                Email:                              meta.email_address || '',
                Street_Address:                     meta.home_address_line_1 || '',
                Suburb:                             meta.home_address_suburb || '',
                City:                               meta.home_address_city || '',
                Province:                           meta.home_address_province || '',
                Postal_Code:                        meta.postal_code || '',
                Bank_Name:                          meta.bank_name || '',
                Branch_Name:                        meta.branch_name || '',
                Branch_Code:                        meta.branch_code || '',
                Account_Number:                     meta.account_number || '',
                Account_Type:                       meta.account_type || '',
                Account_Holder:                     meta.account_holder_name || empName,
                Emergency_Contact_Name:             meta.emergency_contact_name || '',
                Emergency_Contact_Phone:            meta.emergency_contact_phone || '',
                Emergency_Contact_Relationship:     meta.emergency_contact_relationship || '',
                Tax_Number:                         meta.income_tax_number || '',
                Start_Date:                         meta.start_date || new Date().toISOString().split('T')[0],
                Position:                           meta.job_description || 'Sales Executive',
                Department:                         'Sales',
                Branch:                             meta.branch || 'Nashua Paarl & West Coast',
                Employment_Status:                  'Active',
                Contract_Status:                    'Countersigned',
                Countersigned_By:                   meta.countersigner_name || 'Deon Boshoff',
                Countersigned_At:                   meta.countersigned_at || new Date().toISOString(),
                Onboarding_Completed_At:            new Date().toISOString(),
                AIVA_Hire_ID:                       hireRecord.id,
            };

            // Single file — fixed path so it upserts and never duplicates
            const csvContent = [
                Object.keys(sageRow).join(','),
                Object.values(sageRow).map(v => `"${String(v ?? '').replace(/"/g, '\'\'')}"`).join(','),
            ].join('\n');

            // ── 3. Upload single Sage CSV ──────────────────────────────────────
            const csvPath = `hr-exports/${hireId}/sage_export.csv`;
            await fetch(
                `${SUPABASE_URL}/storage/v1/object/project-aiva-afridroids/${csvPath}`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'text/csv',
                        'x-upsert': 'true',
                    },
                    body: new Blob([csvContent], { type: 'text/csv' }),
                }
            );

            // ── 4. Register countersigned PDF in uploaded_files vault ──────────
            const finalPdfUrl = meta.countersigned_pdf_url
                || (meta.countersigned_pdf_path
                    ? `${SUPABASE_URL}/storage/v1/object/public/project-aiva-afridroids/${meta.countersigned_pdf_path}`
                    : meta.signed_pdf_url || null);

            if (finalPdfUrl) {
                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/uploaded_files`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({
                            file_name:       `Employment_Contract_Countersigned_${empName.replace(/\s+/g, '_')}.pdf`,
                            file_path:       meta.countersigned_pdf_path || `contracts/${hireId}/final`,
                            file_type:       'application/pdf',
                            file_size:       0,
                            public_url:      finalPdfUrl,
                            hire_id:         hireId,
                            app_id:          'aiva',
                            document_type:   'countersigned_contract',
                            document_status: 'countersigned',
                            uploaded_by:     'aiva-export',
                            uploaded_at:     new Date().toISOString(),
                        }),
                    });
                    console.log('[export] ✅ Countersigned PDF registered in uploaded_files');
                } catch (vaultErr) {
                    console.warn('[export] uploaded_files registration failed (non-blocking):', vaultErr);
                }
            }

            // ── 5. Write export_completed to metadata ─────────────────────────
            const freshMetaResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const freshMetaData = await freshMetaResp.json();
            const existingMeta  = freshMetaData?.[0]?.metadata || {};

            await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    metadata: {
                        ...existingMeta,
                        sage_csv_path:       csvPath,
                        final_pdf_url:       finalPdfUrl,
                        export_completed:    true,
                        export_completed_at: new Date().toISOString(),
                    },
                    status: 'COMPLETED',
                }),
            });

            // ── 6. Log to hr_export_log ────────────────────────────────────────
            await fetch(`${SUPABASE_URL}/rest/v1/hr_export_log`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    hire_id:       hireId,
                    exported_at:   new Date().toISOString(),
                    target_system: 'sage_hr',
                    status:        'pending_sync',
                    payload:       sageRow,
                    csv_path:      csvPath,
                }),
            });

            // ── 7. WhatsApp to EMPLOYEE with final PDF download link ───────────
            const employeePhone = hireRecord.phone?.replace(/\D/g, '');
            const firstName     = empName.split(' ')[0];
            if (employeePhone) {
                const employeeMsg = [
                    `🎉 *Welcome to Nashua Paarl, ${firstName}!*`,
                    ``,
                    `Your employment contract has been countersigned by the Managing Director. You are officially onboard!`,
                    ``,
                    `📄 *Your signed contract:*`,
                    finalPdfUrl || `Log in to AIVA to download your documents.`,
                    ``,
                    `Your start date: *${sageRow.Start_Date}*`,
                    `Position: *${sageRow.Position}*`,
                    ``,
                    `Welcome to the team! 🚀`,
                ].join('\n');
                try {
                    await westflow.sendWhatsAppNotification(employeePhone, employeeMsg);
                    console.log('[export] ✅ Employee WhatsApp sent');
                } catch (waErr) {
                    console.warn('[export] Employee WhatsApp failed:', waErr);
                }
            }

            // ── 8. WhatsApp to manager group ───────────────────────────────────
            try {
                await westflow.sendWhatsAppNotification(
                    '120363423479055395@g.us',
                    [
                        `✅ *Onboarding Complete — ${empName}*`,
                        ``,
                        `📋 Role: ${sageRow.Position}`,
                        `🏢 Branch: ${sageRow.Branch}`,
                        `📄 Contract: Countersigned ✅`,
                        `👤 Ref: ${employeeNum}`,
                        ``,
                        `Sage HR import file is ready.`,
                    ].join('\n')
                );
            } catch (waErr) {
                console.warn('[export] Manager group WhatsApp failed:', waErr);
            }

            console.log('[export] ✅ Complete — 1 CSV, PDF vaulted, WhatsApp sent');

        } catch (error) {
            console.error('[exportOnboardingRecord] Error:', error);
        }
    };

    const handleFinalize = async () => {
        setSyncStatus('SYNCING');
        try {
            if (hireId && UUID_REGEX.test(hireId)) {
                // Advance step to 7 (completed) and mark status COMPLETED
                await westflow.advanceOnboardingStep(hireId, 7);
                await fetch(
                    `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            status: 'COMPLETED',
                            step_reached: 7
                        })
                    }
                );
            }
            // Stop timer and record duration
            if (timerRef.current) clearInterval(timerRef.current);
            const durationSecs = onboardingStartTime ? Math.floor((Date.now() - onboardingStartTime) / 1000) : elapsedSeconds;
            if (hireId && UUID_REGEX.test(hireId) && durationSecs > 0) {
                try {
                    const getR = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
                    const rows = await getR.json();
                    const freshMeta = rows?.[0]?.metadata || {};
                    await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                        method: 'PATCH',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                        body: JSON.stringify({ metadata: { ...freshMeta, onboarding_duration_seconds: durationSecs } })
                    });
                } catch (e) { console.warn('[timer] duration save failed', e); }
            }
            setCompletedSteps(prev => prev.includes('step7') ? prev : [...prev, 'step7']);
            setShowWelcome(true);
            triggerSuccessFeedback("Welcome to Nashua! 🎉");
            
            if (hireId && UUID_REGEX.test(hireId)) {
                const meta = currentHire?.metadata || {};
                if (!meta.export_completed) {
                    await exportOnboardingRecord(hireId);
                }
                // Generate employee PDF packet with duration
                setTimeout(() => {
                    const finalMeta = { ...meta, onboarding_duration_seconds: durationSecs };
                    generateCompletionPDF(finalMeta, identifiedName || 'Employee', hireId);
                }, 1500);
            }

            // Clear localStorage so stale hireId doesn't affect future sessions
            try { localStorage.removeItem('aiva-active-hire-id'); } catch { /* Ignore storage errors */ }
        } catch (e) {
            console.error('[OnboardingJourney] Finalize error:', e);
            addToast("Failed to finalize. Please try again.", "error");
        } finally {
            setSyncStatus('IDLE');
        }
    };

    useEffect(() => {
        (window as any).__AivaOnboarding = { 
            completeStep: (id: string) => handleStepComplete(id),
            refresh: () => hydrateState(),
            currentStepId: currentStep?.id 
        };
        return () => { delete (window as any).__AivaOnboarding; };
    }, [currentStep, handleStepComplete, hydrateState]);

    const handleStepExecution = async (mode: string) => {
        if (!currentStep) return;
        if (mode === 'upload') setShowUploadPanel(true);
        else if (mode === 'vision') setIsDocHubOpen(true);
        else if (mode === 'form') {
            // Use formKey from step definition if available, fall back to step id
            const formKey = (currentStep as any).formKey || currentStep.id;
            setActiveFormStep(formKey);
        }
        else if (mode === 'review') setShowFinalReview(true);
        else if (mode === 'packet') setShowPolicyPacket(true);
        else if (mode === 'execution') {
            // ── Step 1: Offer signing ───────────────────────────────────────────────
            if (currentStep.id === 'step1') {
                // Show JD first if not yet viewed
                if (currentHire?.metadata?.job_description_url && !currentHire.metadata?.jd_pre_offer_viewed) {
                    setShowJDPreOffer(true);
                    return;
                }
                // Generate personalised offer PDF if not yet done
                if (currentHire && !currentHire.metadata?.offer_pdf_url) {
                    const meta = currentHire.metadata || {};
                    const name = identifiedName || currentHire.staff_name || 'Employee';
                    addToast('Generating your personalised offer letter...', 'info');
                    generateOfferPDF(meta, name, currentHire.id).then(url => {
                        if (url) {
                            fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${currentHire.id}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify({ metadata: { ...meta, offer_pdf_url: url } })
                            }).then(() => {
                                if (currentHire) currentHire.metadata = { ...meta, offer_pdf_url: url };
                                setShowSignCapture(true);
                            });
                        } else {
                            setShowSignCapture(true);
                        }
                    });
                } else {
                    setShowSignCapture(true);
                }
            }
            // ── Step 7: Contract signing — reuse Step 1 signature automatically ────
            else if (currentStep.id === 'step7') {
                const meta = currentHire?.metadata || {};
                const savedSigUrl = meta.offer_signature_url || meta.contract_signature_url;
                const savedInitials = meta.offer_initials || meta.contract_initials;
                const savedMethod = meta.signature_method || 'styled';
                const signerName = identifiedName || currentHire?.staff_name || 'Employee';

                if (savedSigUrl) {
                    // ✅ Reuse Step 1 signature — no re-signing needed
                    // Use sig as initials fallback if initials weren't captured
                    const initialsUrl = savedInitials || savedSigUrl;
                    addToast('Signing your employment contract...', 'info');

                    // Persist contract sig fields
                    await saveFormDataToMetadata({
                        contract_signature_url: savedSigUrl,
                        contract_initials:      initialsUrl,
                        contract_signed_at:     new Date().toISOString(),
                        contract_signed_by:     signerName,
                        contract_status:        'signed',
                    });

                    // ── Stamp PDF FIRST, then mark step complete ─────────────
                    // This ensures signed_pdf_path is written before Deon's
                    // countersign panel can load the correct source document.
                    addToast('Stamping your signature onto the contract...', 'info');
                    const contractUrl = `${GCS_REGISTRY.BASE_URL}${currentStep.template}`;
                    try {
                        const result = await stampEmployeeSignature({
                            hireId,
                            sourcePdfUrl:      contractUrl,
                            signatureDataUrl:  savedSigUrl,
                            initialsDataUrl:   initialsUrl,
                            signerName,
                            signedAt:          new Date().toISOString(),
                            signatureMethod:   savedMethod,
                        });
                        if (result.success) {
                            console.log('[pdfStamper] Contract stamped →', result.pdfUrl);
                            await saveFormDataToMetadata({
                                signed_pdf_url:           result.pdfUrl,
                                signed_pdf_path:          result.storagePath,
                                contract_document_hash:   result.documentHash,
                                stamp_completed_at:       new Date().toISOString(),
                            });
                        } else {
                            console.warn('[pdfStamper] Contract stamp failed (non-blocking):', result.error);
                            await saveFormDataToMetadata({ stamp_error: result.error, stamp_failed_at: new Date().toISOString() });
                        }
                    } catch (stampErr) {
                        console.error('[pdfStamper] Contract stamp threw (non-blocking):', stampErr);
                        await saveFormDataToMetadata({ stamp_error: String(stampErr), stamp_failed_at: new Date().toISOString() });
                    }

                    // ── Now advance the step ──────────────────────────────────
                    handleStepComplete('step7');
                    addToast('Contract signed! Sending to Managing Director...', 'success');
                } else {
                    // Fallback: no step 1 sig saved — show capture (edge case)
                    console.warn('[Step7] No saved signature found — falling back to SignatureCapture');
                    setShowSignCapture(true);
                }
            }
            else {
                setShowSignCapture(true);
            }
        }
    };

    const handleAivaBriefing = () => {
        if (!currentStep) return;
        initiateContextualChat(`AIVA, please give me an overview of ${currentStep.title}. Explain why this is an important part of joining the Nashua team.`);
    };

    if (isHydrating) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fadeIn px-6 bg-white dark:bg-slate-900 transition-colors">
                <div className="w-12 h-12 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin"></div>
                <h3 className="mt-5 text-[10px] font-black uppercase italic tracking-[0.2em] text-slate-400 animate-pulse">Loading your onboarding...</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-transparent overflow-y-auto h-full pb-32">
            {showPhotoCapture && hireId && (
                <ProfilePhotoCapture 
                    hireId={hireId} 
                    hireName={identifiedName || 'New Hire'} 
                    onComplete={handlePhotoComplete} 
                />
            )}

            {showPolicyPacket && hireId && currentStep?.templates && (() => {
                // ── Sales-role detection ─────────────────────────────────────
                // Commission manual is only relevant for sales/consultant roles
                const jd = (currentHire?.metadata?.job_description || '').toLowerCase();
                const isSalesRole = [
                    'sales', 'tele sales', 'sales consultant', 'sales executive', 'business development'
                ].some(kw => jd.includes(kw));

                const filteredDocs = (currentStep.templates as any[]).filter((doc: any) => {
                    const name = (doc.name || doc.label || doc.title || '').toLowerCase();
                    const url  = (doc.url  || doc.template || '').toLowerCase();
                    const isCommission = name.includes('commission') || url.includes('commission');
                    return isCommission ? isSalesRole : true;
                });

                return (
                    <PolicyPacketFlow 
                        documents={filteredDocs}
                        hireName={identifiedName || 'New Hire'}
                        hireId={hireId}
                        onComplete={handlePacketComplete}
                        onClose={() => setShowPolicyPacket(false)}
                    />
                );
            })()}

            {showUploadPanel && hireId && currentStep && (
                <UploadStepPanel
                    step={currentStep}
                    hireId={hireId}
                    onComplete={() => {
                        setShowUploadPanel(false);
                        handleStepComplete(currentStep.id);
                    }}
                    onClose={() => setShowUploadPanel(false)}
                />
            )}
            {/* Offline status banner */}
            {isOffline && (
                <div className="mx-4 mt-3 p-3 bg-slate-800 dark:bg-slate-700 border border-slate-600 rounded-2xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-8 h-8 rounded-full bg-slate-700 dark:bg-slate-600 flex items-center justify-center shrink-0">
                        <span className="text-slate-300 text-sm">📶</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">You're offline</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                            {offlineQueue.length > 0
                                ? `${offlineQueue.length} step${offlineQueue.length > 1 ? 's' : ''} queued — will sync when you reconnect`
                                : 'Progress will save when your connection returns'}
                        </p>
                    </div>
                </div>
            )}
            {/* Sync failure retry banner */}
            {syncFailed && pendingStepId && (
                <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-amber-600 text-sm">⚠</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Connection issue</p>
                        <p className="text-[9px] text-amber-600 dark:text-amber-500 mt-0.5">Your progress wasn't saved. Tap to retry.</p>
                    </div>
                    <button
                        onClick={() => handleStepComplete(pendingStepId)}
                        className="px-3 py-1.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-600 transition-all shrink-0"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Thin progress bar only — no sub-header, EmployeePortal nav handles everything */}
            {currentHire && (
                <div className="w-full bg-slate-200 dark:bg-white/5 h-1 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0d9488] to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                </div>
            )}

            {/* Persistent profile avatar — visible throughout onboarding once photo is captured */}
            {/* 📱 Kiosk mode banner */}
            {kioskMode && !showWelcome && (
                <div className="fixed top-0 left-0 right-0 z-40 bg-[#0d9488] text-white text-center py-2 px-4 flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Nashua Paarl Self-Service Onboarding Kiosk</span>
                </div>
            )}

            {/* 🌐 Language picker — shown on first visit */}
            {showLanguagePicker && (
                <LanguageSwitcher
                    currentLang={language}
                    onSelect={(lang) => {
                        setLanguage(lang);
                        setShowLanguagePicker(false);
                    }}
                />
            )}

            {/* ✍️ Signature Capture — only shown for Step 1 (offer).
                 Step 7 (contract) reuses the Step 1 signature automatically. */}
            {showSignCapture && currentStep && (currentStep.id === 'step1' || currentStep.id === 'step7') && (
                <SignatureCapture
                    signerName={identifiedName || currentHire?.staff_name || 'Employee'}
                    documentTitle="Offer of Employment"
                    stepLabel="Step 1 of 8"
                    requireScroll={true}
                    scrollContentUrl={
                        currentHire?.metadata?.offer_pdf_url || `${GCS_REGISTRY.BASE_URL}${currentStep.template}`
                    }
                    showInitials={true}
                    onComplete={(sig: SignatureResult) => {
                        setShowSignCapture(false);

                        // ── Persist offer signature immediately ─────────────────────────
                        // These same values will be reused automatically at Step 7
                        saveFormDataToMetadata({
                            signature_method: sig.method || 'drawn',
                            offer_signature_url: sig.signatureDataUrl,
                            offer_initials: sig.initials,
                            offer_signed_at: sig.timestamp,
                            offer_signed_by: sig.signerName,
                            // Mirror to contract fields so Step 7 stamper can access them
                            contract_signature_url: sig.signatureDataUrl,
                            contract_initials: sig.initials,
                        });

                        handleStepComplete(currentStep.id);

                        // ── Stamp offer PDF with signature ──────────────────────────────
                        const offerSourceUrl = currentHire?.metadata?.offer_pdf_url
                            || `${GCS_REGISTRY.BASE_URL}${currentStep.template}`;
                        stampEmployeeSignature({
                            hireId,
                            sourcePdfUrl: offerSourceUrl,
                            signatureDataUrl: sig.signatureDataUrl,
                            initialsDataUrl: sig.initials,
                            signerName: sig.signerName,
                            signedAt: sig.timestamp,
                            signatureMethod: sig.method || 'drawn',
                        }).then(result => {
                            if (result.success) {
                                console.log('[pdfStamper] Offer stamped →', result.pdfUrl);
                                saveFormDataToMetadata({
                                    offer_signed_pdf_url: result.pdfUrl,
                                    offer_signed_pdf_path: result.storagePath,
                                    offer_document_hash: result.documentHash,
                                });
                            } else {
                                console.warn('[pdfStamper] Offer stamp failed:', result.error);
                                saveFormDataToMetadata({ offer_stamp_error: result.error });
                            }
                        }).catch(err => {
                            console.error('[pdfStamper] Offer stamp error:', err);
                            saveFormDataToMetadata({ offer_stamp_error: String(err) });
                        });
                    }}
                    onCancel={() => setShowSignCapture(false)}
                />
            )}

            {/* ⏱ Live onboarding timer */}
            {onboardingStartTime && !showWelcome && elapsedSeconds > 0 && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 dark:bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10 shadow-lg animate-fadeIn">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d9488]"></span>
                    </span>
                    <span className="text-[11px] font-black tabular-nums tracking-widest">
                        {String(Math.floor(elapsedSeconds / 60)).padStart(2,'0')}:{String(elapsedSeconds % 60).padStart(2,'0')}
                    </span>
                    <span className="text-[9px] text-white/50 uppercase tracking-wider hidden sm:inline">onboarding</span>
                </div>
            )}

            {/* 🌐 Language toggle (persistent small button) */}
            {!showWelcome && !showLanguagePicker && (
                <button
                    onClick={() => setShowLanguagePicker(true)}
                    className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg rounded-full px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-[#0d9488] hover:text-[#0d9488] transition-all"
                    title="Change language"
                >
                    🌐 {languageOptions.find(l => l.code === language)?.name || 'Language'}
                </button>
            )}

            {profilePhotoUrl && !showWelcome && (
                <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 animate-fadeIn">
                    <div className="relative shrink-0">
                        <img
                            src={profilePhotoUrl}
                            alt={identifiedName || 'Profile'}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#0d9488] shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
                            {identifiedName || 'Team Member'}
                        </span>
                        <span className="text-[9px] font-bold text-[#0d9488] uppercase tracking-widest mt-1">
                            {progressPercent}% Complete
                        </span>
                        <div className="mt-1.5 h-1 w-32 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#0d9488] to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-8 space-y-4 bg-slate-50/30 dark:bg-transparent">
                <div className="max-w-4xl mx-auto space-y-4">
                    {showWelcome ? (
                        <CompletionPacket
                            hireName={identifiedName || 'Team Member'}
                            profilePhotoUrl={profilePhotoUrl}
                            metadata={currentHire?.metadata || {}}
                            onGoHome={handleGoHome}
                            onDownloadPDF={() => generateCompletionPDF(currentHire?.metadata || {}, identifiedName || 'Employee', hireId || '')}
                        />
                    ) : progressPercent < 100 ? (
                        <>
                            {ONBOARDING_STEPS.map((step, idx) => (
                                <StepCard 
                                    key={step.id} 
                                    step={step} 
                                    index={idx} 
                                    isActive={currentStepIndex === idx} 
                                    isCompleted={completedSteps.includes(step.id)} 
                                    currentHire={currentHire}
                                    profilePhotoUrl={profilePhotoUrl}
                                    onExecute={handleStepExecution} 
                                    onSkip={() => handleStepComplete(step.id)}
                                    onFinalize={handleFinalize}
                                    onBriefing={handleAivaBriefing}
                                />
                            ))}
                        </>
                    ) : (
                        <div className="bg-[#0f172a] p-8 md:p-16 rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden animate-slide-up-fade border border-white/10">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><AiSparkIcon className="w-48 h-48 text-[#0d9488]" /></div>
                            <div className="w-16 h-16 bg-[#0d9488] rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                                <CheckCircleIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">Welcome to Nashua!</h2>
                                <p className="text-slate-400 font-medium text-sm md:text-base max-w-lg mx-auto leading-relaxed italic">"Onboarding complete. Your documents are filed. Welcome to the Nashua family!"</p>
                            </div>
                            <div className="pt-4 flex justify-center">
                                <button 
                                    onClick={handleGoHome}
                                    className="px-10 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg border-b-4 border-emerald-700"
                                >
                                    Complete Onboarding
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <DocumentHub isOpen={isDocHubOpen} onClose={() => setIsDocHubOpen(false)} onSuccess={(docType, extractedFields) => {
                // Merge OCR-extracted flat fields into currentHire metadata immediately
                // so FormEngine's initialData is pre-populated when the form opens next
                if (extractedFields && Object.keys(extractedFields).length > 0) {
                    setCurrentHire((prev: any) => prev ? {
                        ...prev,
                        metadata: { ...(prev.metadata || {}), ...extractedFields }
                    } : prev);
                }
                if (currentStep) handleStepComplete(currentStep.id);
            }} initialDocType={currentStep?.id === 'step2' ? "ID Document" : currentStep?.id === 'step3' ? "Proof of Residence" : "Bank Confirmation"} />

            {activeFormStep && HR_FORMS[activeFormStep] && (
                <FormEngine 
                    form={HR_FORMS[activeFormStep]} 
                    stepNumber={completedSteps.length + 1} 
                    onClose={() => setActiveFormStep(null)}
                    initialData={currentHire?.metadata || {}}
                    onSubmit={async (data) => { 
                        const stepId = activeFormStep;
                        const fieldCount = Object.keys(data).filter(k => data[k] !== '' && data[k] !== null && data[k] !== undefined).length;
                        console.log('[FormSubmit] Step:', stepId, 'Fields with data:', fieldCount, 'Data:', data);
                        // Allow save even with partial data — better to save something than nothing
                        setActiveFormStep(null);
                        await saveFormDataToMetadata(data);
                        handleStepComplete(stepId);
                    }} 
                />
            )}

            {/* JD Pre-Offer Review — shown before Step 1 offer signature */}
            {showJDPreOffer && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white dark:bg-[#1a1f2e] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 w-full max-w-2xl flex flex-col overflow-hidden" style={{maxHeight: '90vh'}}>
                        <div className="px-8 pt-8 pb-4 shrink-0">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-[#0d9488]/10">
                                    <FileSignature className="w-5 h-5 text-[#0d9488]" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-[#0d9488] uppercase tracking-widest">Before You Sign</p>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                        Your Job Description
                                    </h3>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1">
                                Please review your role and responsibilities before accepting the offer.
                            </p>
                            {currentHire?.metadata?.job_description && (
                                <div className="mt-3 px-4 py-2.5 bg-[#0d9488]/10 rounded-xl border border-[#0d9488]/20 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#0d9488] shrink-0" />
                                    <span className="text-xs font-black text-[#0d9488] uppercase tracking-wide">
                                        {currentHire.metadata.job_description}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 mx-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 min-h-0 relative" style={{height: '380px'}}>
                            {currentHire?.metadata?.job_description_url ? (
                                <>
                                    <iframe
                                        src={currentHire.metadata.job_description_url}
                                        className="w-full h-full"
                                        title="Job Description"
                                    />
                                    <button
                                        onClick={() => openMedia(currentHire.metadata.job_description_url)}
                                        className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-[#0d9488] transition-all hover:scale-105"
                                        title="View fullscreen"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                    No job description PDF available.
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-6 shrink-0 space-y-3">
                            <button
                                onClick={() => {
                                    setShowJDPreOffer(false);
                                    // Mark as viewed so we don't show again
                                    if (currentHire) {
                                        currentHire.metadata = { ...currentHire.metadata, jd_pre_offer_viewed: true };
                                        fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${currentHire.id}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'apikey': SUPABASE_KEY,
                                                'Authorization': `Bearer ${SUPABASE_KEY}`,
                                                'Content-Type': 'application/json',
                                                'Prefer': 'return=minimal'
                                            },
                                            body: JSON.stringify({
                                                metadata: { ...currentHire.metadata, jd_pre_offer_viewed: true }
                                            })
                                        }).catch(e => console.warn('JD pre-offer patch failed:', e));
                                    }
                                    // Now proceed to offer generation + signature
                                    setTimeout(() => {
                                        if (currentStep) handleStepExecution(currentStep.actionType);
                                    }, 300);
                                }}
                                className="w-full py-4 bg-[#0d9488] text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg border-b-4 border-[#0a7c72] active:border-b-0 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                I've Reviewed My Role — Proceed to Offer
                            </button>
                            <button
                                onClick={() => setShowJDPreOffer(false)}
                                className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* JD Review Modal */}
            {showJDReview && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white dark:bg-[#1a1f2e] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 w-full max-w-2xl flex flex-col overflow-hidden" style={{maxHeight: '90vh'}}>
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4 shrink-0">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-[#0d9488]/10">
                                    <FileSignature className="w-5 h-5 text-[#0d9488]" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-[#0d9488] uppercase tracking-widest">Step 6 Complete</p>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                        Review Your Job Description
                                    </h3>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1">
                                Please review your assigned role and responsibilities before completing onboarding.
                            </p>
                            {currentHire?.metadata?.job_description && (
                                <div className="mt-3 px-4 py-2.5 bg-[#0d9488]/10 rounded-xl border border-[#0d9488]/20 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#0d9488] shrink-0" />
                                    <span className="text-xs font-black text-[#0d9488] uppercase tracking-wide">
                                        {currentHire.metadata.job_description}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* PDF Viewer */}
                        <div className="flex-1 mx-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 min-h-0 relative" style={{height: '420px'}}>
                            {currentHire?.metadata?.job_description_url ? (
                                <>
                                    <iframe
                                        src={currentHire.metadata.job_description_url}
                                        className="w-full h-full"
                                        title="Job Description"
                                    />
                                    <button
                                        onClick={() => openMedia(currentHire.metadata.job_description_url)}
                                        className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-[#0d9488] transition-all hover:scale-105"
                                        title="View fullscreen"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                    No PDF available for this role.
                                </div>
                            )}
                        </div>

                        {/* Acknowledgement */}
                        <div className="px-8 py-6 shrink-0 space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${jdAcknowledged ? 'bg-[#0d9488] border-[#0d9488]' : 'border-slate-300 dark:border-white/20 group-hover:border-[#0d9488]'}`}
                                    onClick={() => setJdAcknowledged(a => !a)}>
                                    {jdAcknowledged && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    I confirm that I have read and understood my Job Description and accept the responsibilities outlined in this document.
                                </span>
                            </label>

                            <button
                                disabled={!jdAcknowledged}
                                onClick={() => {
                                    setShowJDReview(false);
                                    addToast("Job Description acknowledged — proceed to Employment Contract. ✅", "success");
                                    // Patch metadata with JD acknowledgement
                                    if (hireId) {
                                        fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'apikey': SUPABASE_KEY,
                                                'Authorization': `Bearer ${SUPABASE_KEY}`,
                                                'Content-Type': 'application/json',
                                                'Prefer': 'return=minimal'
                                            },
                                            body: JSON.stringify({
                                                metadata: {
                                                    ...currentHire?.metadata,
                                                    jd_acknowledged: true,
                                                    jd_acknowledged_at: new Date().toISOString()
                                                }
                                            })
                                        }).catch(e => console.warn('JD ack patch failed:', e));
                                    }
                                    // Force step6 into completedSteps if not already there
                                    if (!completedSteps.includes('step6')) {
                                        setCompletedSteps(prev => [...prev, 'step6']);
                                    }
                                }}
                                className={`w-full py-4 font-black rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${jdAcknowledged ? 'bg-[#0d9488] text-white hover:bg-[#0a7c72] shadow-lg border-b-4 border-[#0a7c72] active:border-b-0' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                I Acknowledge My Job Description
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingJourney;