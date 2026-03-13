import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { SignatureStylePicker } from './SignatureStylePicker';
import { MobilePdfViewer } from './MobilePdfViewer';

// ═══════════════════════════════════════════════════════════════════════════════
// SignatureCapture v2 — styled signature picker for AIVA onboarding
//
// Drop-in replacement for the old drawn-only SignatureCapture.
// Uses SignatureStylePicker (Google Fonts) — no draw canvas.
// Returns signatureDataUrl + initials (as PNG data URL) for pdf-lib stamping.
//
// Scroll gate: PDF shown in iframe — can't track scroll cross-origin.
// Uses a 10-second minimum read timer instead.
// ═══════════════════════════════════════════════════════════════════════════════

interface SignatureCaptureProps {
    signerName: string;
    documentTitle: string;
    stepLabel?: string;
    requireScroll?: boolean;
    scrollContentUrl?: string;
    showInitials?: boolean;
    onComplete: (result: SignatureResult) => void;
    onCancel: () => void;
}

export interface SignatureResult {
    signatureDataUrl: string;   // PNG base64 — styled signature
    initials: string;           // PNG base64 data URL — for pdf-lib stamping
    signerName: string;
    timestamp: string;
    method: 'styled';
}

const READ_TIMER_SECONDS = 10;
const teal = '#0d9488';

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
    const showReadPhase = requireScroll && !!scrollContentUrl;
    const [phase, setPhase] = useState<'read' | 'sign'>(showReadPhase ? 'read' : 'sign');

    // ── Read timer ───────────────────────────────────────────────────────────
    const [secondsLeft, setSecondsLeft] = useState(READ_TIMER_SECONDS);
    const [readReady, setReadReady] = useState(!showReadPhase);

    useEffect(() => {
        if (phase !== 'read') return;
        const interval = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) { clearInterval(interval); setReadReady(true); return 0; }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    // ── Signature picker state ───────────────────────────────────────────────
    const [signName, setSignName] = useState(signerName);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [initialsDataUrl, setInitialsDataUrl] = useState<string | null>(null);
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [ackPopia, setAckPopia] = useState(false);
    const [ackAccuracy, setAckAccuracy] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canConfirm = !!(signatureDataUrl && initialsDataUrl && ackPopia && ackAccuracy);

    const handleConfirm = async () => {
        if (!signatureDataUrl || !initialsDataUrl) return;
        setIsSubmitting(true);
        try {
            onComplete({
                signatureDataUrl,
                initials: initialsDataUrl,
                signerName: signName || signerName,
                timestamp: new Date().toISOString(),
                method: 'styled',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    // PHASE: READ
    // ════════════════════════════════════════════════════════════════════════
    if (phase === 'read') {
        const pct = ((READ_TIMER_SECONDS - secondsLeft) / READ_TIMER_SECONDS) * 100;
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900 shrink-0">
                    <div>
                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{stepLabel}</p>
                        <h2 className="text-base font-black text-white leading-tight">{documentTitle}</h2>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                        Cancel
                    </button>
                </div>

                <div className="h-1 bg-slate-800 shrink-0">
                    <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex-1 overflow-hidden">
                    <MobilePdfViewer url={scrollContentUrl || ''} className="w-full h-full" title={documentTitle} />
                </div>

                <div className="px-5 py-4 border-t border-white/10 bg-slate-900 shrink-0">
                    {!readReady ? (
                        <div className="flex items-center justify-center gap-3 py-2 text-slate-400">
                            <Clock className="w-4 h-4 text-teal-400" />
                            <span className="text-sm font-bold">
                                Please review the document — <span className="text-teal-400 font-black tabular-nums">{secondsLeft}s</span>
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => setPhase('sign')}
                            className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95"
                            style={{ background: teal }}
                        >
                            I've Reviewed It — Proceed to Sign ✍️
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // PHASE: SIGN
    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: teal }}>{stepLabel}</p>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">{documentTitle}</h2>
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                    Cancel
                </button>
            </div>

            <div className="flex-1 px-5 py-6 space-y-6 max-w-lg mx-auto w-full">

                {/* Signing as */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: teal }}>
                        {signerName.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">Signing as</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{signerName}</p>
                    </div>
                </div>

                {/* Name input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Type your full name to generate your signature
                    </label>
                    <input
                        type="text"
                        value={signName}
                        onChange={e => {
                            setSignName(e.target.value);
                            setSignatureDataUrl(null);
                            setInitialsDataUrl(null);
                            setSelectedStyleId(null);
                        }}
                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-black italic text-xl text-slate-900 dark:text-white outline-none transition-all"
                        style={{ borderColor: signName.length > 2 ? teal : undefined }}
                        placeholder="Type your full name"
                        autoFocus
                    />
                </div>

                {/* Style picker */}
                {signName.length > 2 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Choose your signature style
                        </label>
                        <SignatureStylePicker
                            name={signName}
                            defaultStyleId={selectedStyleId || undefined}
                            onConfirm={({ signatureDataUrl: sigUrl, initialsDataUrl: initUrl, styleId }) => {
                                setSignatureDataUrl(sigUrl);
                                setInitialsDataUrl(initUrl);
                                setSelectedStyleId(styleId);
                            }}
                        />
                    </div>
                )}

                {/* Preview */}
                {signatureDataUrl && (
                    <div className="p-4 rounded-2xl border-2 bg-teal-50/50 dark:bg-teal-900/10 space-y-3" style={{ borderColor: `${teal}40` }}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Signature Preview
                        </p>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-white/10">
                            <img src={signatureDataUrl} alt="Your signature" className="max-h-16 object-contain" />
                        </div>
                        {showInitials && initialsDataUrl && (
                            <div className="flex items-center gap-3">
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-white/10 inline-flex">
                                    <img src={initialsDataUrl} alt="Your initials" className="max-h-8 object-contain" />
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                    Initials stamped on every page
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Acknowledgements */}
                {signatureDataUrl && (
                    <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <input type="checkbox" checked={ackPopia} onChange={e => setAckPopia(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-slate-300 accent-teal-500" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">
                                I consent to secure digital processing per POPIA.
                            </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <input type="checkbox" checked={ackAccuracy} onChange={e => setAckAccuracy(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-slate-300 accent-teal-500" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-snug">
                                I confirm this is my legal signature and I accept the terms of this document.
                            </span>
                        </label>
                    </div>
                )}

                {/* ECTA notice */}
                <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        This electronic signature is legally binding under ECTA 25 of 2002 and carries the same legal weight as a handwritten signature.
                    </p>
                </div>

                {/* Submit */}
                <button
                    onClick={handleConfirm}
                    disabled={!canConfirm || isSubmitting}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: canConfirm ? teal : '#94a3b8' }}
                >
                    {isSubmitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying Signature...</>
                        : <><CheckCircle2 className="w-4 h-4" /> Sign &amp; Submit</>
                    }
                </button>

                <div className="pb-10" />
            </div>
        </div>
    );
};
