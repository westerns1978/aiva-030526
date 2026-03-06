import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, RotateCcw, Loader2, ChevronDown, AlertCircle, Type } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SignatureCapture — Drawn signature + typed initials for AIVA onboarding
//
// Usage:
//   <SignatureCapture
//     signerName="Kobus Dlamini"
//     documentTitle="Employment Contract"
//     stepLabel="Step 7 of 8"
//     requireScroll={true}           // Gate signing behind scroll-to-bottom
//     showInitials={true}            // Show initials field (for policy docs)
//     onComplete={(sig) => { ... }}  // Returns { signatureDataUrl, initials, signerName, timestamp }
//     onCancel={() => { ... }}
//   />
//
// The signatureDataUrl is a PNG base64 string that can be stamped onto PDFs
// using pdf-lib's embedPng() method.
// ═══════════════════════════════════════════════════════════════════════════════

interface SignatureCaptureProps {
    signerName: string;
    documentTitle: string;
    stepLabel?: string;
    requireScroll?: boolean;
    scrollContentUrl?: string;       // PDF URL to embed in iframe for scroll tracking
    showInitials?: boolean;
    onComplete: (result: SignatureResult) => void;
    onCancel: () => void;
}

export interface SignatureResult {
    signatureDataUrl: string;        // PNG base64 of drawn signature
    initials: string;                // Typed initials
    signerName: string;
    timestamp: string;
    method: 'drawn';
}

type CapturePhase = 'scroll' | 'sign' | 'review';

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
    signerName,
    documentTitle,
    stepLabel,
    requireScroll = false,
    scrollContentUrl,
    showInitials = false,
    onComplete,
    onCancel,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const [phase, setPhase] = useState<CapturePhase>(requireScroll ? 'scroll' : 'sign');
    const [hasScrolled, setHasScrolled] = useState(!requireScroll);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [initials, setInitials] = useState(() => {
        // Auto-generate initials from name
        return signerName
            .split(' ')
            .map(w => w.charAt(0).toUpperCase())
            .join('');
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

    // ── Canvas setup ────────────────────────────────────────────────────────
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High-DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Signature style
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Light guide line
        ctx.save();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const guideY = rect.height * 0.75;
        ctx.beginPath();
        ctx.moveTo(20, guideY);
        ctx.lineTo(rect.width - 20, guideY);
        ctx.stroke();
        ctx.restore();

        // Reset drawing style after guide
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    useEffect(() => {
        if (phase === 'sign') {
            // Small delay to ensure canvas is rendered
            const timer = setTimeout(setupCanvas, 100);
            return () => clearTimeout(timer);
        }
    }, [phase, setupCanvas]);

    // ── Drawing handlers ────────────────────────────────────────────────────
    const getPoint = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            const touch = e.touches[0] || e.changedTouches[0];
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        lastPoint.current = getPoint(e);
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawing.current || !lastPoint.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const point = getPoint(e);
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPoint.current = point;
        if (!hasDrawn) setHasDrawn(true);
    };

    const endDraw = () => {
        isDrawing.current = false;
        lastPoint.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        setHasDrawn(false);

        // Redraw guide line
        const rect = canvas.getBoundingClientRect();
        ctx.save();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const guideY = rect.height * 0.75;
        ctx.beginPath();
        ctx.moveTo(20, guideY);
        ctx.lineTo(rect.width - 20, guideY);
        ctx.stroke();
        ctx.restore();

        // Reset drawing style
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
    };

    // ── Scroll tracking ─────────────────────────────────────────────────────
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || hasScrolled) return;
        const scrollBottom = el.scrollTop + el.clientHeight;
        const threshold = el.scrollHeight - 40; // Within 40px of bottom
        if (scrollBottom >= threshold) {
            setHasScrolled(true);
        }
    }, [hasScrolled]);

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;

        setIsSubmitting(true);

        // Export signature as PNG
        const dataUrl = canvas.toDataURL('image/png');
        setSignatureDataUrl(dataUrl);

        // Small delay for visual feedback
        await new Promise(r => setTimeout(r, 400));

        onComplete({
            signatureDataUrl: dataUrl,
            initials: initials.trim() || signerName.split(' ').map(w => w[0]).join(''),
            signerName,
            timestamp: new Date().toISOString(),
            method: 'drawn',
        });

        setIsSubmitting(false);
    };

    // ── Scroll phase ────────────────────────────────────────────────────────
    if (phase === 'scroll') {
        return (
            <div className="fixed inset-0 z-[260] flex flex-col bg-white dark:bg-slate-900 animate-fadeIn">
                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                        <p className="text-[8px] font-black text-[#0d9488] uppercase tracking-widest">{stepLabel || 'Document Review'}</p>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{documentTitle}</h3>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">✕</button>
                </div>

                {/* Scrollable document area */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto"
                >
                    {scrollContentUrl ? (
                        <iframe
                            src={scrollContentUrl}
                            className="w-full border-0"
                            style={{ minHeight: '200vh' }}
                            title={documentTitle}
                        />
                    ) : (
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 text-center py-20">Document content loads here</p>
                            {/* Spacer to ensure scroll is needed */}
                            <div style={{ height: '120vh' }} />
                        </div>
                    )}
                </div>

                {/* Bottom bar — scroll indicator + proceed button */}
                <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 safe-area-bottom">
                    {!hasScrolled ? (
                        <div className="flex items-center justify-center gap-2 text-slate-400 animate-bounce">
                            <ChevronDown className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Scroll to review entire document</span>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    ) : (
                        <button
                            onClick={() => setPhase('sign')}
                            className="w-full py-4 bg-[#0d9488] hover:bg-[#0a7c72] text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg border-b-4 border-[#0a7c72] active:border-b-0 flex items-center justify-center gap-2 transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            I've Read This Document — Proceed to Sign
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Sign phase ──────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[260] flex items-end md:items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#0d9488] rounded-2xl text-white shadow-lg shrink-0">
                            <Type className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight leading-tight">
                                {documentTitle}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                {stepLabel || 'Electronic Signature'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Signer identity */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                        <div className="w-8 h-8 rounded-full bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488] text-[10px] font-black">
                            {signerName.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white">{signerName}</p>
                            <p className="text-[9px] text-slate-400">Signing as above</p>
                        </div>
                    </div>

                    {/* Signature canvas */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Draw Your Signature</p>
                            {hasDrawn && (
                                <button
                                    onClick={clearCanvas}
                                    className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <RotateCcw className="w-3 h-3" /> Clear
                                </button>
                            )}
                        </div>
                        <div className="relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden"
                             style={{ touchAction: 'none' }}>
                            <canvas
                                ref={canvasRef}
                                className="w-full cursor-crosshair"
                                style={{ height: '140px', touchAction: 'none' }}
                                onMouseDown={startDraw}
                                onMouseMove={draw}
                                onMouseUp={endDraw}
                                onMouseLeave={endDraw}
                                onTouchStart={startDraw}
                                onTouchMove={draw}
                                onTouchEnd={endDraw}
                            />
                            {!hasDrawn && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <p className="text-slate-300 dark:text-slate-600 text-xs font-bold italic">Sign here with your finger</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Initials field */}
                    {showInitials && (
                        <div className="space-y-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Your Initials</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 focus-within:border-[#0d9488] transition-all overflow-hidden">
                                    <div className="px-3 py-3 text-slate-400">
                                        <Type className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={initials}
                                        onChange={e => setInitials(e.target.value.toUpperCase().slice(0, 4))}
                                        placeholder="e.g. KD"
                                        maxLength={4}
                                        className="flex-1 bg-transparent py-3 pr-4 text-slate-900 dark:text-white text-lg font-black tracking-widest outline-none placeholder:text-slate-300 uppercase"
                                    />
                                </div>
                                {/* Preview of initials as they'd appear on doc */}
                                <div className="w-14 h-14 rounded-xl border-2 border-[#0d9488]/30 bg-[#0d9488]/5 flex items-center justify-center shrink-0">
                                    <span className="text-lg font-black text-[#0d9488] italic tracking-tight">
                                        {initials || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Legal text */}
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            By signing below, I confirm that I have read and understood the <strong className="text-slate-700 dark:text-slate-300">{documentTitle}</strong> and 
                            agree to its terms. This electronic signature is legally binding under the South African Electronic Communications and Transactions Act (ECTA), 2002. Your personal information is processed in accordance with the Protection of Personal Information Act (POPIA), 2013.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-1">
                        <button
                            onClick={handleSubmit}
                            disabled={!hasDrawn || isSubmitting || (showInitials && !initials.trim())}
                            className={`w-full py-4 font-black rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                                hasDrawn && (!showInitials || initials.trim())
                                    ? 'bg-[#0d9488] hover:bg-[#0a7c72] text-white shadow-lg border-b-4 border-[#0a7c72] active:border-b-0'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Applying Signature...</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4" /> {showInitials ? 'Sign & Initial' : 'Apply Signature'}</>
                            )}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureCapture;
