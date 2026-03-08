import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    AivaAvatar, 
    BookOpenIcon, 
    CheckCircleIcon, 
    CloseIcon, 
    DocumentPlusIcon, 
    IdCardIcon, 
    AiSparkIcon,
    DocumentTextIcon, 
    ClipboardDocumentListIcon
} from './icons';
import { BanknoteIcon } from './hr_icons/BanknoteIcon';
import { analyzeDocument } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { useAppContext } from '../context/AppContext';
import { AivaVisionCapture } from './AivaVisionCapture';
import { FileText, Loader2, Camera, Info, User, Landmark, Calendar, MapPin, Sparkles, Smartphone, Upload, ShieldCheck } from 'lucide-react';

// ─── Back Button Safety Hook ───
const useBackButtonClose = (isOpen: boolean, onClose: () => void) => {
    useEffect(() => {
        if (!isOpen) return;
        
        const stateKey = `hub-${Date.now()}`;
        window.history.pushState({ panel: stateKey }, '');
        
        const handlePopState = (e: PopStateEvent) => {
            onClose();
        };
        
        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, onClose]);
};

interface DocumentHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (docType: string, extractedFields?: Record<string, string>) => void;
  initialDocType?: string;
  initialMode?: 'capture' | 'import';
  workerId?: string;
}

type Step = 'select_type' | 'capture' | 'processing' | 'verify' | 'ingesting' | 'success';
type DocType = "ID / Passport" | "Proof of Residence" | "Bank Letter" | "Employment Contract" | "Company Policy" | "Other";

const DOC_TYPES: { type: DocType, icon: React.FC<any> }[] = [
    { type: "ID / Passport", icon: IdCardIcon },
    { type: "Proof of Residence", icon: BookOpenIcon },
    { type: "Bank Letter", icon: BanknoteIcon },
    { type: "Employment Contract", icon: DocumentPlusIcon },
    { type: "Company Policy", icon: ClipboardDocumentListIcon },
    { type: "Other", icon: FileText },
];

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // Note: Simplified regex for consistency

export const DocumentHub: React.FC<DocumentHubProps> = ({ isOpen, onClose, onSuccess, initialDocType, initialMode = 'capture', workerId }) => {
    const { addToast, triggerSuccessFeedback, currentUser, currentHireId, identifiedName, currentHire } = useAppContext();
    const [step, setStep] = useState<Step>('select_type');
    const [docType, setDocType] = useState<DocType | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showVisionCapture, setShowVisionCapture] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Back button safety
    useBackButtonClose(isOpen, onClose);

    const targetWorkerId = workerId || currentHireId || currentUser?.employeeNumber || 'NP-GUEST';
    const employeeNameDisplay = identifiedName || currentHire?.staff_name || currentUser?.name || 'New Hire';

    const extractionType: 'id' | 'residence' | 'banking' | 'general' = useMemo(() => {
        const typeStr = (initialDocType || docType || '').toLowerCase();
        if (typeStr.includes('id') || typeStr.includes('passport')) return 'id';
        if (typeStr.includes('residence') || typeStr.includes('utility') || typeStr.includes('address')) return 'residence';
        if (typeStr.includes('bank')) return 'banking';
        return 'general';
    }, [initialDocType, docType]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setIsAnalyzing(false);
                setExtractedData(null);
                if (initialDocType) {
                    let mappedType: DocType = "Other";
                    const low = initialDocType.toLowerCase();
                    if (low.includes('id') || low.includes('passport')) mappedType = "ID / Passport";
                    else if (low.includes('residence') || low.includes('utility')) mappedType = "Proof of Residence";
                    else if (low.includes('bank')) mappedType = "Bank Letter";
                    else if (low.includes('contract')) mappedType = "Employment Contract";
                    else if (low.includes('policy')) mappedType = "Company Policy";

                    setDocType(mappedType);
                    setShowVisionCapture(true);
                } else {
                    setShowVisionCapture(false);
                    setStep('select_type');
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialDocType]);

    const handleConfirmFiling = async () => {
        if (!currentBlob || (!docType && !initialDocType)) return;
        setStep('ingesting');
        
        try {
            const label = docType || initialDocType || 'Other';
            const name = extractedData?.full_name || extractedData?.account_holder || employeeNameDisplay;
            const date = new Date().toLocaleDateString('en-ZA').replace(/\//g, '.');
            const fileExt = currentBlob.type === 'application/pdf' ? 'pdf' : 'jpg';
            const fileName = `${name} ${label} ${date}.${fileExt}`;
            
            const docTypeFolder = extractionType === 'id' ? 'id-documents' :
                        extractionType === 'residence' ? 'residence' :
                        extractionType === 'banking' ? 'banking' : 'documents';

            const uploadResult = await storageService.uploadFile(currentBlob, fileName, docTypeFolder, {
                employee: name,
                category: label,
                worker_id: targetWorkerId,
                ingested_at: new Date().toISOString(),
                metadata: {
                    extracted: extractedData,
                    tags: ['#official', `#${label.toLowerCase().replace(/ \/ /g, '-').replace(/\s/g, '-')}`]
                }
            }, {
                hireId: targetWorkerId,
                documentType: docTypeFolder,
                appId: 'aiva'
            });

            if (targetWorkerId && UUID_REGEX.test(targetWorkerId)) {
                try {
                    const getResp = await fetch(
                        `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${targetWorkerId}&select=metadata`,
                        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
                    );
                    const currentData = await getResp.json();
                    const currentMeta = currentData?.[0]?.metadata || {};

                    await fetch(
                        `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${targetWorkerId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'apikey': SUPABASE_KEY,
                                'Authorization': `Bearer ${SUPABASE_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                metadata: {
                                    ...currentMeta,
                                    documents: {
                                        ...(currentMeta.documents || {}),
                                        [extractionType]: {
                                            status: 'uploaded',
                                            file_url: uploadResult.publicUrl,
                                            extraction: extractedData,
                                            uploaded_at: new Date().toISOString(),
                                            confidence: extractedData?.confidence || 0.9
                                        }
                                    }
                                }
                            })
                        }
                    );
                } catch (metaErr) {
                    console.warn('[DocumentHub] Metadata sync skipped:', metaErr);
                }
            }
            
            setStep('success');
            triggerSuccessFeedback(`${label} saved.`);
            setTimeout(handleSuccessClose, 1500);
        } catch (e) {
            console.error("Save failure:", e);
            addToast("Failed to save document. Please try again.", "error");
            setStep('verify');
        }
    };

    const handleSuccessClose = () => {
        if (onSuccess && (docType || initialDocType)) onSuccess(docType || initialDocType || "Document");
        onClose();
    };

    const updateField = (field: string, val: string) => {
        setExtractedData((prev: any) => ({ ...prev, [field]: val }));
    };

    if (!isOpen) return null;

    if (showVisionCapture) {
        return (
            <div className="fixed inset-0 z-[200] bg-black">
                <AivaVisionCapture
                    expectedDocType={extractionType}
                    employeeName={employeeNameDisplay}
                    hireId={targetWorkerId}
                    onCaptureComplete={async ({ imageBlob, imageUrl, extraction }) => {
                        const docTypeFolder = extractionType === 'id' ? 'id-documents' :
                            extractionType === 'residence' ? 'residence' :
                            extractionType === 'banking' ? 'banking' : 'documents';
                        
                        const fileName = extraction?.suggested_filename 
                            ? `${extraction.suggested_filename}_${Date.now()}.jpg`
                            : `${extractionType}_${Date.now()}.jpg`;

                        // ── Flatten entities so ExtractionField UI and FormEngine both work ──
                        const entities = extraction?.entities || {};
                        const flatFields: Record<string, string> = {};

                        if (extractionType === 'id') {
                            if (entities.full_name)    flatFields.full_name    = entities.full_name;
                            if (entities.surname)      flatFields.surname      = entities.surname;
                            if (entities.first_names)  flatFields.first_names  = entities.first_names;
                            if (entities.id_number)    flatFields.id_number    = entities.id_number;
                            if (entities.date_of_birth) flatFields.date_of_birth = entities.date_of_birth;
                            if (entities.gender)       flatFields.gender       = entities.gender;
                            if (entities.nationality)  flatFields.nationality  = entities.nationality;
                        } else if (extractionType === 'residence') {
                            if (entities.account_holder)  flatFields.full_name        = entities.account_holder;
                            if (entities.address_line_1)  flatFields.home_address_line_1 = entities.address_line_1;
                            if (entities.address_line_2)  flatFields.home_address_line_2 = entities.address_line_2;
                            if (entities.city)            flatFields.home_address_city  = entities.city;
                            if (entities.postal_code)     flatFields.postal_code        = entities.postal_code;
                            if (entities.province)        flatFields.home_address_province = entities.province;
                            if (entities.provider)        flatFields.provider           = entities.provider;
                        } else if (extractionType === 'banking') {
                            if (entities.account_holder)  flatFields.full_name      = entities.account_holder;
                            if (entities.bank_name)       flatFields.bank_name      = entities.bank_name;
                            if (entities.branch_code)     flatFields.branch_code    = entities.branch_code;
                            if (entities.branch_name)     flatFields.branch_name    = entities.branch_name;
                            if (entities.account_number)  flatFields.account_number = entities.account_number;
                            if (entities.account_type)    flatFields.account_type   = entities.account_type;
                        }

                        // Set extractedData so ExtractionField UI renders the values
                        setExtractedData(flatFields);
                        
                        try {
                            setStep('ingesting');
                            const uploadResult = await storageService.uploadFile(
                                imageBlob, 
                                fileName, 
                                docTypeFolder,
                                {
                                    app: 'aiva',
                                    category: initialDocType || docType,
                                    employee: employeeNameDisplay,
                                    analysis: extraction,
                                    filed_at: new Date().toISOString()
                                },
                                {
                                    hireId: targetWorkerId,
                                    documentType: docTypeFolder,
                                    appId: 'aiva'
                                }
                            );
                            
                            if (targetWorkerId && UUID_REGEX.test(targetWorkerId)) {
                                try {
                                    const getResp = await fetch(
                                        `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${targetWorkerId}&select=metadata`,
                                        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
                                    );
                                    const currentData = await getResp.json();
                                    const currentMeta = currentData?.[0]?.metadata || {};
                                    
                                    await fetch(
                                        `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${targetWorkerId}`,
                                        {
                                            method: 'PATCH',
                                            headers: {
                                                'apikey': SUPABASE_KEY,
                                                'Authorization': `Bearer ${SUPABASE_KEY}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                metadata: {
                                                    ...currentMeta,
                                                    // ── Flat fields for FormEngine initialData ──
                                                    ...flatFields,
                                                    // ── Nested doc record for audit trail ──
                                                    documents: {
                                                        ...(currentMeta.documents || {}),
                                                        [extractionType]: {
                                                            status: 'uploaded',
                                                            file_url: uploadResult.publicUrl,
                                                            extraction: extraction,
                                                            uploaded_at: new Date().toISOString(),
                                                            confidence: extraction?.classification_confidence === 'high' ? 0.95 : 0.7
                                                        }
                                                    }
                                                }
                                            })
                                        }
                                    );
                                } catch (metaErr) {
                                    console.warn('[DocumentHub] Metadata save skipped:', metaErr);
                                }
                            }
                            
                            triggerSuccessFeedback(`${initialDocType || docType} saved.`);
                            if (onSuccess) onSuccess(initialDocType || docType || "Document", flatFields);
                            // Close everything immediately — no middleman screen
                            setTimeout(() => {
                                setShowVisionCapture(false);
                                onClose();
                            }, 800);
                        } catch (uploadErr) {
                            console.error('[DocumentHub] Upload failed:', uploadErr);
                            addToast("Upload failed. Please try again.", "error");
                            setShowVisionCapture(false);
                        }
                    }}
                    onClose={() => {
                        setShowVisionCapture(false);
                        onClose();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-fadeIn p-4 md:p-10">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90dvh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/10">
                
                <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <AivaAvatar />
                            <div className="absolute -bottom-1 -right-1 bg-[#0d9488] rounded-full p-1 border-2 border-white dark:border-slate-900">
                                <ShieldCheck className="w-2.5 h-2.5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Employee Documents</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Employee: {employeeNameDisplay}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-10 overflow-y-auto copilot-scrollbar bg-slate-50/20 dark:bg-slate-950/20">
                    {step === 'select_type' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Select Document Type</h3>
                                <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Choose the type of document you're uploading</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {DOC_TYPES.map(({ type, icon: Icon }) => (
                                    <button 
                                        key={type} 
                                        onClick={() => { setDocType(type); setShowVisionCapture(true); }} 
                                        className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 hover:border-[#0d9488] transition-all flex flex-col items-center gap-4 group text-center shadow-sm"
                                    >
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl group-hover:bg-[#0d9488] transition-all shadow-sm">
                                            <Icon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                                        </div>
                                        <span className="font-black text-[10px] text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-tight">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'capture' && docType && (
                        <div className="animate-fadeIn h-full flex flex-col items-center justify-center space-y-10 py-10">
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Upload Document</h3>
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document:</span>
                                    <span className="text-sm font-black text-[#0d9488] uppercase italic">{docType}</span>
                                    {!initialDocType && (
                                        <button onClick={() => setStep('select_type')} className="ml-2 text-[9px] font-bold text-slate-400 hover:text-[#0d9488] underline uppercase">Change</button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                                <button 
                                    onClick={() => setShowVisionCapture(true)}
                                    className="flex-1 group p-10 bg-[#0f172a] text-white rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center gap-6 border border-white/5"
                                >
                                    <div className="p-5 bg-white/10 rounded-[1.5rem] border border-white/20"><Camera className="w-10 h-10" /></div>
                                    <div className="text-center">
                                        <p className="text-xl font-black uppercase italic tracking-tighter">Take Photo</p>
                                        <p className="text-[9px] font-bold text-blue-100/60 uppercase tracking-widest mt-1">Use your camera with AIVA guiding</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setShowVisionCapture(true)}
                                    className="flex-1 group p-10 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-md hover:border-[#0d9488] transition-all flex flex-col items-center gap-6"
                                >
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] group-hover:bg-[#0d9488]/10 transition-colors"><Upload className="w-10 h-10 text-slate-400 group-hover:text-[#0d9488]" /></div>
                                    <div className="text-center">
                                        <p className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Upload File</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Import for AIVA analysis</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'verify' && (
                        <div className="animate-fadeIn max-w-5xl mx-auto w-full space-y-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="md:w-1/2 space-y-3 w-full">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Visual Preview</p>
                                    <div className="aspect-[3/4] bg-slate-900 rounded-[2.5rem] overflow-hidden border-2 border-slate-100 dark:border-white/10 shadow-xl relative">
                                        {previewUrl ? (
                                            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-[#0d9488] animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="md:w-1/2 space-y-6 w-full">
                                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 space-y-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-[#0d9488]/10 rounded-xl text-[#0d9488] shadow-inner"><Sparkles className="w-5 h-5" /></div>
                                                <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-tight italic">Extracted Details</h4>
                                            </div>
                                            {isAnalyzing && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d9488]/10 text-[#0d9488] rounded-full animate-pulse border border-[#0d9488]/20">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Reading...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-5">
                                            <ExtractionField 
                                                label="Name / Subject" 
                                                value={extractedData?.full_name || extractedData?.account_holder || employeeNameDisplay} 
                                                onChange={v => updateField('full_name', v)} 
                                                loading={isAnalyzing} 
                                                icon={User} 
                                            />

                                            {extractionType === 'id' && (
                                                <>
                                                    <ExtractionField label="ID Number" value={extractedData?.id_number || ''} onChange={v => updateField('id_number', v)} loading={isAnalyzing} icon={Landmark} />
                                                    <ExtractionField label="Date of Birth" value={extractedData?.date_of_birth || ''} onChange={v => updateField('date_of_birth', v)} loading={isAnalyzing} icon={Calendar} />
                                                </>
                                            )}

                                            {extractionType === 'residence' && (
                                                <>
                                                    <ExtractionField label="Address" value={extractedData?.address_line_1 || extractedData?.address || ''} onChange={v => updateField('address', v)} loading={isAnalyzing} icon={MapPin} isTextArea />
                                                    <ExtractionField label="Provider" value={extractedData?.provider || ''} onChange={v => updateField('provider', v)} loading={isAnalyzing} icon={Landmark} />
                                                </>
                                            )}

                                            {extractionType === 'banking' && (
                                                <>
                                                    <ExtractionField label="Account Number" value={extractedData?.account_number || ''} onChange={v => updateField('account_number', v)} loading={isAnalyzing} icon={Smartphone} />
                                                    <ExtractionField label="Bank" value={extractedData?.bank_name || ''} onChange={v => updateField('bank_name', v)} loading={isAnalyzing} icon={Landmark} />
                                                </>
                                            )}
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-white/5">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Node</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setShowVisionCapture(true)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Retake</button>
                                        <button 
                                            onClick={handleConfirmFiling} 
                                            disabled={isAnalyzing} 
                                            className="flex-[2] py-4 bg-[#0d9488] text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] border-b-4 border-[#0a7c72] active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-50"
                                        >
                                            Commit Record
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'ingesting' && (
                        <div className="text-center flex flex-col items-center justify-center animate-fadeIn space-y-8 py-20 h-full">
                            <div className="w-20 h-20 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter animate-pulse">Syncing to Nashua Registry...</h3>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center flex flex-col items-center justify-center animate-fadeIn space-y-8 py-20 h-full">
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce border-4 border-white">
                                <CheckCircleIcon className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Filing Successful ✓</h3>
                            <p className="text-slate-500 font-medium">Your record has been indexed and archived in the secure vault.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const ExtractionField: React.FC<{ label: string; value: string; onChange: (v: string) => void; loading: boolean; icon: any; isTextArea?: boolean }> = ({ label, value, onChange, loading, icon: Icon, isTextArea }) => (
    <div className="space-y-1.5 group">
        <label className="text-[9px] font-black text-slate-400 group-focus-within:text-[#0d9488] transition-colors uppercase tracking-widest ml-1 flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" /> {label}
        </label>
        <div className="relative">
            {isTextArea ? (
                <textarea 
                    value={loading ? "Analyzing..." : (value || '')}
                    onChange={e => onChange(e.target.value)}
                    disabled={loading}
                    rows={2}
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-[#0d9488] transition-all shadow-inner resize-none ${loading ? 'animate-pulse text-slate-300' : ''}`}
                />
            ) : (
                <input 
                    type="text" 
                    value={loading ? "Analyzing..." : (value || '')}
                    onChange={e => onChange(e.target.value)}
                    disabled={loading}
                    className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-[#0d9488] transition-all shadow-inner ${loading ? 'animate-pulse text-slate-300' : ''}`}
                />
            )}
        </div>
    </div>
);