import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, Loader2, AlertTriangle, Zap, X, FileText, Sun, SunDim } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// ─── Types ───────────────────────────────────────────────────
export interface ExtractionResult {
    document_type: string;
    classification_confidence: 'high' | 'medium' | 'low';
    image_quality: 'sharp' | 'acceptable' | 'blurry' | 'too_dark' | 'too_bright' | 'skewed';
    quality_feedback: string | null;
    entities: Record<string, string | null>;
    suggested_filename: string;
    summary: string;
    flags: string[];
}

interface AivaVisionCaptureProps {
    expectedDocType: 'id' | 'residence' | 'banking' | 'general';
    employeeName: string;
    hireId: string;
    onCaptureComplete: (result: {
        imageBlob: Blob;
        imageUrl: string;
        extraction: ExtractionResult | null;
    }) => void;
    onClose: () => void;
}

// ─── Gemini Prompts (HR-specific for South Africa) ───────────
const EXTRACTION_PROMPTS: Record<string, string> = {
    id: `You are AIVA Vision, an HR document analysis assistant for Nashua Paarl & West Coast in South Africa.
Analyze this South African ID document, passport, or ID card image.
EXTRACT and return ONLY valid JSON:
{
  "document_type": "SA Green ID Book" or "SA Smart ID Card" or "Passport" or "Other ID",
  "classification_confidence": "high" or "medium" or "low",
  "image_quality": "sharp" or "acceptable" or "blurry" or "too_dark" or "too_bright" or "skewed",
  "quality_feedback": "string with tip if quality is not sharp/acceptable, null otherwise",
  "entities": {
    "full_name": "...",
    "surname": "...",
    "first_names": "...",
    "id_number": "13-digit SA ID number or passport number",
    "date_of_birth": "DD/MM/YYYY",
    "gender": "Male or Female",
    "nationality": "...",
    "country_of_issue": "..."
  },
  "suggested_filename": "ID_Surname_Firstname",
  "summary": "2 sentence summary of what was extracted",
  "flags": ["list any concerns: expired, damaged, obscured, etc"]
}`,
    residence: `You are AIVA Vision, an HR document analysis assistant for Nashua Paarl & West Coast in South Africa.
Analyze this proof of residence document (utility bill, bank statement, municipal account, or similar).
EXTRACT and return ONLY valid JSON:
{
  "document_type": "Utility Bill" or "Bank Statement" or "Municipal Account" or "Lease Agreement" or "Other",
  "classification_confidence": "high" or "medium" or "low",
  "image_quality": "sharp" or "acceptable" or "blurry" or "too_dark" or "too_bright" or "skewed",
  "quality_feedback": "string with tip if quality is not sharp/acceptable, null otherwise",
  "entities": {
    "account_holder": "...",
    "address_line_1": "...",
    "address_line_2": "...",
    "city": "...",
    "postal_code": "...",
    "province": "...",
    "provider": "Eskom, City of Cape Town, etc.",
    "account_number": "...",
    "date_issued": "DD/MM/YYYY",
    "amount_due": "R amount if visible"
  },
  "suggested_filename": "Address_Surname_Provider",
  "summary": "2 sentence summary",
  "flags": ["older than 3 months", "name mismatch", "address unclear"]
}`,
    banking: `You are AIVA Vision, an HR document analysis assistant for Nashua Paarl & West Coast in South Africa.
Analyze this banking confirmation letter or bank statement.
EXTRACT and return ONLY valid JSON:
{
  "document_type": "Bank Confirmation Letter" or "Bank Statement" or "Other Banking",
  "classification_confidence": "high" or "medium" or "low",
  "image_quality": "sharp" or "acceptable" or "blurry" or "too_dark" or "too_bright" or "skewed",
  "quality_feedback": "string with tip if quality is not sharp/acceptable, null otherwise",
  "entities": {
    "account_holder": "...",
    "bank_name": "FNB, ABSA, Standard Bank, Nedbank, Capitec, etc.",
    "branch_name": "...",
    "branch_code": "...",
    "account_number": "...",
    "account_type": "Savings, Current/Cheque, Transmission, etc.",
    "date_issued": "DD/MM/YYYY"
  },
  "suggested_filename": "Banking_Surname_BankName",
  "summary": "2 sentence summary",
  "flags": ["list any concerns"]
}`,
    general: `Analyze this document image. Identify the type and extract key information.
EXTRACT and return ONLY valid JSON:
{
  "document_type": "...",
  "classification_confidence": "high" or "medium" or "low",
  "image_quality": "sharp" or "acceptable" or "blurry" or "too_dark" or "too_bright" or "skewed",
  "quality_feedback": "string with tip if quality is not sharp/acceptable, null otherwise",
  "entities": { },
  "suggested_filename": "Type_Entity_Date",
  "summary": "2 sentence summary",
  "flags": []
}`
};

export const AivaVisionCapture: React.FC<AivaVisionCaptureProps> = ({
    expectedDocType,
    employeeName,
    hireId,
    onCaptureComplete,
    onClose
}) => {
    const [mode, setMode] = useState<'camera' | 'review' | 'analyzing' | 'results'>('camera');
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
    const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [torchAvailable, setTorchAvailable] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.() as any;
            if (capabilities?.torch) {
                setTorchAvailable(true);
            }

            setCameraReady(true);
        } catch (err: any) {
            console.error('[AivaVision] Camera error:', err);
            setError(err.name === 'NotAllowedError'
                ? 'Camera access needed to scan documents. Please allow camera access and try again.'
                : 'Could not access camera. Try uploading a file instead.'
            );
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            startCamera();
        }, 0);
        return () => {
            clearTimeout(timer);
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    const toggleTorch = async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        try {
            await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
            setTorchOn(!torchOn);
        } catch (err) {
            console.warn('[AivaVision] Torch not available');
        }
    };

    const captureFromCamera = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.readyState < 2) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        if ('vibrate' in navigator) navigator.vibrate(50);

        canvas.toBlob(blob => {
            if (blob) {
                stopCamera();
                setCapturedBlob(blob);
                setCapturedUrl(URL.createObjectURL(blob));
                setMode('review');
            }
        }, 'image/jpeg', 0.92);
    };

    const captureFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        stopCamera();
        setCapturedBlob(file);
        setCapturedUrl(URL.createObjectURL(file));
        setMode('review');
    };

    const analyzeWithGemini = async () => {
        if (!capturedBlob) return;

        setMode('analyzing');
        setError(null);

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(capturedBlob);
            });

            const prompt = EXTRACTION_PROMPTS[expectedDocType] || EXTRACTION_PROMPTS.general;
            
            const apiKey = process.env.API_KEY || '';
            
            if (!apiKey) {
                console.warn('[AivaVision] No Gemini API key found. Skipping extraction.');
                // Proceed without extraction — still save the document
                setExtraction(null);
                setMode('results');
                return;
            }
            
            const ai = new GoogleGenAI({ apiKey });
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: capturedBlob.type || 'image/jpeg', data: base64 } }
                    ]
                },
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text || '{}';
            const clean = text.replace(/```json\n?|```\n?/g, '').trim();

            const result: ExtractionResult = JSON.parse(clean);
            setExtraction(result);

            if (['blurry', 'too_dark', 'too_bright'].includes(result.image_quality)) {
                setError(result.quality_feedback || 'Image quality is poor. Try capturing again with better lighting.');
                setMode('review');
                return;
            }

            setMode('results');
        } catch (err: any) {
            console.error('[AivaVision] Gemini analysis error:', err);
            // Gracefully proceed — user can still save the document without AI extraction
            setExtraction(null);
            setError('AI extraction unavailable. You can still save this document manually.');
            setMode('results');
        }
    };

    const handleRetake = () => {
        setCapturedBlob(null);
        setCapturedUrl(null);
        setExtraction(null);
        setError(null);
        setMode('camera');
        startCamera();
    };

    const handleConfirm = () => {
        if (!capturedBlob || !capturedUrl) return;
        onCaptureComplete({
            imageBlob: capturedBlob,
            imageUrl: capturedUrl,
            extraction
        });
    };

    const docTypeLabel = {
        id: 'ID Document / Passport',
        residence: 'Proof of Residence',
        banking: 'Banking Confirmation',
        general: 'Document'
    }[expectedDocType];

    const hiddenElements = (
        <>
            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={captureFromFile}
            />
        </>
    );

    if (mode === 'camera') {
        return (
            <div className="fixed inset-0 z-[300] bg-black flex flex-col animate-fadeIn">
                {hiddenElements}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                    <div>
                        <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest">AIVA Vision</p>
                        <p className="text-xs text-white/70 mt-0.5">{docTypeLabel}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                        onCanPlay={() => setCameraReady(true)}
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[88%] h-[70%] relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#0d9488] rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#0d9488] rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#0d9488] rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0d9488] rounded-br-lg" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest bg-black/30 px-3 py-1.5 rounded-full">
                                    Align document within frame
                                </p>
                            </div>
                        </div>
                    </div>

                    {!cameraReady && !error && (
                        <div className="absolute inset-0 bg-black flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-[#0d9488] animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 gap-6">
                            <AlertTriangle className="w-12 h-12 text-amber-500" />
                            <div className="text-center space-y-2">
                                <p className="text-white font-black text-sm uppercase tracking-widest">Camera Unavailable</p>
                                <p className="text-white/60 text-xs leading-relaxed max-w-xs">{error}</p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-4 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-[#0d9488]/30 flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" /> Upload File Instead
                            </button>
                            <button
                                onClick={onClose}
                                className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white/70 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-black/90 backdrop-blur-md p-6 flex items-center justify-center gap-6 pb-safe">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                    <button
                        onClick={captureFromCamera}
                        disabled={!cameraReady}
                        className="w-[72px] h-[72px] rounded-full border-4 border-white/20 flex items-center justify-center group disabled:opacity-30"
                    >
                        <div className="w-14 h-14 rounded-full bg-white group-active:scale-90 transition-transform flex items-center justify-center">
                            <Camera className="w-6 h-6 text-slate-900" />
                        </div>
                    </button>
                    {torchAvailable ? (
                        <button
                            onClick={toggleTorch}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                torchOn ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            {torchOn ? <Sun className="w-5 h-5" /> : <SunDim className="w-5 h-5" />}
                        </button>
                    ) : (
                        <div className="w-12 h-12" />
                    )}
                </div>
            </div>
        );
    }

    if (mode === 'review') {
        return (
            <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-fadeIn">
                {hiddenElements}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={capturedUrl!} className="w-full object-contain max-h-[50vh]" alt="Preview" />
                    </div>
                    {error && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-400 text-sm font-bold">Image Quality Issue</p>
                                <p className="text-amber-400/70 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                    <p className="text-white/50 text-xs text-center">
                        Looks good? Tap Analyze to let AIVA read the document.
                    </p>
                </div>
                <div className="p-6 bg-slate-900 border-t border-white/5 flex gap-3">
                    <button
                        onClick={handleRetake}
                        className="flex-1 py-4 bg-white/5 text-white/70 font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Retake
                    </button>
                    <button
                        onClick={analyzeWithGemini}
                        className="flex-[2] py-4 bg-[#0d9488] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#0d9488]/20"
                    >
                        <Zap className="w-4 h-4" /> Analyze with AIVA
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'analyzing') {
        return (
            <div className="fixed inset-0 z-[300] bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-6 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-[#0d9488]/10 border-2 border-[#0d9488]/30 flex items-center justify-center mx-auto">
                        <Zap className="w-8 h-8 text-[#0d9488] animate-bounce" />
                    </div>
                    <div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">AIVA Vision</p>
                        <p className="text-white/50 text-xs mt-2">Reading your document...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col animate-fadeIn">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest">AIVA Vision</p>
                        <p className="text-white font-black text-lg tracking-tight mt-0.5">
                            {extraction?.document_type || docTypeLabel}
                        </p>
                    </div>
                    {extraction?.classification_confidence && (
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            extraction.classification_confidence === 'high' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                            {extraction.classification_confidence} confidence
                        </span>
                    )}
                </div>

                <div className="rounded-xl overflow-hidden border border-white/10 h-40">
                    <img src={capturedUrl!} className="w-full h-full object-cover" alt="Captured" />
                </div>

                {extraction?.entities && Object.keys(extraction.entities).length > 0 && (
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-[#0d9488]" />
                            <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-widest">
                                Extracted Information
                            </p>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(extraction.entities)
                                .filter(([_, value]) => value !== null)
                                .map(([key, value]) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                            {key.replace(/_/g, ' ')}
                                        </label>
                                        <div className="px-3 py-2.5 bg-white/5 rounded-lg border border-white/10 text-white text-sm font-medium">
                                            {value}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {extraction?.summary && (
                    <div className="bg-[#0d9488]/5 rounded-xl border border-[#0d9488]/20 p-4">
                        <p className="text-[#0d9488]/80 text-xs italic leading-relaxed">{extraction.summary}</p>
                    </div>
                )}

                {extraction?.flags && extraction.flags.length > 0 && (
                    <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4 space-y-2">
                        <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> Attention
                        </p>
                        {extraction.flags.map((flag, i) => (
                            <p key={i} className="text-amber-400/70 text-xs">• {flag}</p>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 bg-slate-900 border-t border-white/5 flex gap-3">
                <button
                    onClick={handleRetake}
                    className="flex-1 py-4 bg-white/5 text-white/70 font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Retake
                </button>
                <button
                    onClick={handleConfirm}
                    className="flex-[2] py-4 bg-[#0d9488] text-white font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#0d9488]/20"
                >
                    <Check className="w-4 h-4" /> Save Document
                </button>
            </div>
        </div>
    );
};