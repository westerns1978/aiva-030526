import React, { useState, useRef, useEffect } from 'react';
import { 
    X, 
    CheckCircle2, 
    FileText, 
    ChevronLeft, 
    Loader2, 
    Signature, 
    Fingerprint, 
    Download,
    Camera,
    Lock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { storageService } from '../services/storageService';
import { westflow } from '../services/westflowClient';
import { useAppContext } from '../context/AppContext';
import { SignatureCapture, type SignatureResult } from './SignatureCapture';

interface PolicyDoc {
    key: string;
    name: string;
    template: string;
    requiresSignature: boolean;
}

interface PolicyPacketFlowProps {
    documents: PolicyDoc[];
    hireName: string;
    hireId: string;
    onComplete: (metadataUpdate: any) => void;
    onClose: () => void;
}

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

export const PolicyPacketFlow: React.FC<PolicyPacketFlowProps> = ({ documents, hireName, hireId, onComplete, onClose }) => {
    const { addToast, triggerSuccessFeedback, currentHire } = useAppContext();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExecuting, setIsExecuting] = useState(false);
    const [signingMode, setSigningMode] = useState<'digital' | 'scan'>('digital');
    const [showSignatureCapture, setShowSignatureCapture] = useState(false);
    const [docStatuses, setDocStatuses] = useState<Record<string, any>>({});
    const [popiaConsent, setPopiaConsent] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentDoc = documents[currentIndex];
    const progress = ((currentIndex + 1) / documents.length) * 100;
    // For the JD doc, use the hire-specific job_description_url if available (correct role JD),
    // otherwise fall back to the generic Sales JD template in GCS.
    const pdfUrl = (currentDoc.key === 'job_description' && currentHire?.metadata?.job_description_url)
        ? currentHire.metadata.job_description_url
        : `https://storage.googleapis.com/gemynd-public/projects/aiva/${currentDoc.template}`;

    // Reset signing mode when switching docs
    useEffect(() => {
        setSigningMode('digital');
        setPopiaConsent(false);
    }, [currentIndex]);

    const generateSignatureArtifact = async (name: string, docName: string, signatureDataUrl?: string, initials?: string): Promise<Blob> => {
        const doc = new jsPDF();
        const hash = `AIVA-POLICY-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
        
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("POLICY ACKNOWLEDGMENT", 20, 25);
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.text(`AIVA Digital Signing v2.0 | Document: ${docName}`, 20, 35);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text("SIGNATORY DETAILS", 20, 60);
        
        doc.setFontSize(11);
        doc.text(`Legal Name: ${name}`, 20, 75);
        doc.text(`Initials: ${initials || name.split(' ').map(w => w[0]).join('')}`, 20, 85);
        doc.text(`Hire ID: ${hireId}`, 20, 95);
        doc.text(`Signed At: ${new Date().toLocaleString('en-ZA')}`, 20, 105);
        doc.text(`Digital Fingerprint: ${hash}`, 20, 115);

        // If we have a drawn signature, embed it
        if (signatureDataUrl) {
            try {
                doc.addImage(signatureDataUrl, 'PNG', 20, 125, 80, 30);
            } catch (imgErr) {
                console.warn('[PolicySign] Could not embed signature image:', imgErr);
                // Fall back to typed signature
                doc.setFontSize(30);
                doc.setFont('courier', 'italic');
                doc.setTextColor(30, 58, 138);
                doc.text(name, 20, 145);
            }
        } else {
            doc.setFontSize(30);
            doc.setFont('courier', 'italic');
            doc.setTextColor(30, 58, 138);
            doc.text(name, 20, 145);
        }
        doc.line(20, 158, 120, 158);

        // Initials box
        if (initials) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Initials:', 140, 140);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(13, 148, 136);
            doc.text(initials, 140, 155);
            doc.setDrawColor(13, 148, 136);
            doc.rect(135, 130, 40, 30, 'S');
        }

        return doc.output('blob');
    };

    const handleSignatureComplete = async (sig: SignatureResult) => {
        setShowSignatureCapture(false);
        setIsExecuting(true);

        try {
            // Generate signed PDF artifact with drawn signature embedded
            const blob = await generateSignatureArtifact(sig.signerName, currentDoc.name, sig.signatureDataUrl, sig.initials);
            const upload = await storageService.uploadFile(blob, `${currentDoc.key}_signed_${Date.now()}.pdf`, `policies/${hireId}`, {
                hire_id: hireId,
                type: 'policy_digital_sign'
            });

            const newStatuses = {
                ...docStatuses,
                [currentDoc.key]: {
                    status: 'signed',
                    signed_url: upload.publicUrl,
                    signature_method: 'drawn',
                    signature_data_url: sig.signatureDataUrl,
                    initials: sig.initials,
                    signed_at: sig.timestamp,
                    signed_by: sig.signerName
                }
            };
            setDocStatuses(newStatuses);

            if (currentIndex < documents.length - 1) {
                setCurrentIndex(currentIndex + 1);
                triggerSuccessFeedback(`${currentDoc.name} Signed`);
            } else {
                // All policies done — finalize packet
                const metadataUpdate = {
                    documents: {
                        ...(currentHire?.metadata?.documents || {}),
                        ...newStatuses
                    }
                };
                onComplete(metadataUpdate);
            }
        } catch (e) {
            addToast("Signing failed. Please retry.", "error");
        } finally {
            setIsExecuting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExecuting(true);
        try {
            const ext = file.name.split('.').pop();
            const upload = await storageService.uploadFile(file, `${currentDoc.key}_scanned_${Date.now()}.${ext}`, `scans/${hireId}`, {
                hire_id: hireId,
                type: 'policy_scan_upload'
            });
            
            const newStatuses = {
                ...docStatuses,
                [currentDoc.key]: {
                    status: 'signed',
                    signed_url: upload.publicUrl,
                    signature_method: 'scanned',
                    signed_at: new Date().toISOString()
                }
            };
            setDocStatuses(newStatuses);

            if (currentIndex < documents.length - 1) {
                setCurrentIndex(currentIndex + 1);
                triggerSuccessFeedback(`${currentDoc.name} Uploaded`);
            } else {
                onComplete({
                    documents: {
                        ...(currentHire?.metadata?.documents || {}),
                        ...newStatuses
                    }
                });
            }
        } catch (e) {
            addToast("Upload failed.", "error");
        } finally {
            setIsExecuting(false);
        }
    };

    // ── SignatureCapture overlay ─────────────────────────────────────────────
    if (showSignatureCapture) {
        return (
            <SignatureCapture
                signerName={hireName}
                documentTitle={currentDoc.name}
                stepLabel={`Policy ${currentIndex + 1} of ${documents.length}`}
                requireScroll={true}
                scrollContentUrl={`${pdfUrl}#toolbar=0`}
                showInitials={false}
                onComplete={handleSignatureComplete}
                onCancel={() => setShowSignatureCapture(false)}
            />
        );
    }

    // ── Main policy view ────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[250] bg-slate-900 flex flex-col animate-fadeIn overflow-hidden">
            {/* Header */}
            <header className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0d9488]/20 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-[#0d9488]" />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase italic tracking-tighter text-sm">{currentDoc.name}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Policy {currentIndex + 1} of {documents.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                        {[...Array(documents.length)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= currentIndex ? 'bg-[#0d9488]' : 'bg-slate-700'}`} />
                        ))}
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Document preview area */}
            <main className="flex-1 relative bg-slate-900 flex flex-col">
                <div className="flex-1 p-2 md:p-4 relative flex flex-col gap-2">
                    <div className="flex-1 relative">
                        <iframe 
                            src={`${pdfUrl}#toolbar=0`} 
                            className="w-full h-full rounded-[2rem] border-4 border-white/5"
                        />
                    </div>
                </div>

                {/* Bottom action bar */}
                <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 p-6 md:p-8 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {/* Mode toggle */}
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
                            <button 
                                onClick={() => setSigningMode('digital')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signingMode === 'digital' ? 'bg-white dark:bg-slate-800 text-[#0d9488] shadow-sm' : 'text-slate-400'}`}
                            >
                                Sign Digitally
                            </button>
                            <button 
                                onClick={() => setSigningMode('scan')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signingMode === 'scan' ? 'bg-white dark:bg-slate-800 text-[#0d9488] shadow-sm' : 'text-slate-400'}`}
                            >
                                Upload Signed Copy
                            </button>
                        </div>

                        {signingMode === 'digital' ? (
                            <div className="space-y-4">
                                {/* Signer identity */}
                                <div className="flex items-center gap-3 p-4 bg-[#0d9488]/5 border border-[#0d9488]/20 rounded-2xl">
                                    <Fingerprint className="w-5 h-5 text-[#0d9488] shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signing as</p>
                                        <p className="text-lg font-black italic text-[#0d9488] truncate">{hireName}</p>
                                    </div>
                                </div>

                                {/* POPIA Consent */}
                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                                    <input 
                                        type="checkbox" 
                                        checked={popiaConsent} 
                                        onChange={e => setPopiaConsent(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-[#0d9488] accent-[#0d9488]" 
                                    />
                                    <div>
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">I consent to secure digital processing per POPIA.</span>
                                        <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">In terms of the Protection of Personal Information Act (POPIA), I consent to the collection, processing, and storage of my personal information for employment purposes.</p>
                                    </div>
                                </label>

                                {/* Sign button — opens SignatureCapture with scroll gate */}
                                <button 
                                    onClick={() => setShowSignatureCapture(true)}
                                    disabled={isExecuting || !popiaConsent}
                                    className="w-full py-5 bg-[#0d9488] text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs border-b-4 border-[#0a7c72] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-30"
                                >
                                    {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Signature className="w-5 h-5" />}
                                    READ, SIGN & INITIAL
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic">"Print, sign, then take a photo of each page."</p>
                                    <a 
                                        href={pdfUrl}
                                        target="_blank" rel="noopener noreferrer"
                                        className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-3 h-3" /> Download Template PDF
                                    </a>
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isExecuting}
                                    className="w-full py-5 bg-[#0d9488] text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs border-b-4 border-[#0a7c72] active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                    UPLOAD SIGNED PHOTO/SCAN
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                            </div>
                        )}

                        <div className="flex justify-between items-center px-2">
                             <button 
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-0 flex items-center gap-1"
                             >
                                <ChevronLeft className="w-3 h-3" /> Previous
                             </button>
                             <button onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#0d9488]">Cancel</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
