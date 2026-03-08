import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

// ─── FONT DEFINITIONS ───────────────────────────────────────────────────────
const SIGNATURE_STYLES = [
  { id: 'dancing',   label: 'Classic',    font: 'Dancing Script',  weight: 700, size: 42, initialsSize: 52 },
  { id: 'great',     label: 'Elegant',    font: 'Great Vibes',     weight: 400, size: 38, initialsSize: 48 },
  { id: 'pinyon',    label: 'Formal',     font: 'Pinyon Script',   weight: 400, size: 36, initialsSize: 46 },
  { id: 'allura',    label: 'Flowing',    font: 'Allura',          weight: 400, size: 40, initialsSize: 50 },
  { id: 'parisienne',label: 'Ornate',     font: 'Parisienne',      weight: 400, size: 34, initialsSize: 44 },
];

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pinyon+Script&family=Allura&family=Parisienne&display=swap';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('');
}

async function waitForFont(fontFamily: string, weight: number, text: string): Promise<void> {
  try {
    await (document as any).fonts.load(`${weight} 48px '${fontFamily}'`, text);
  } catch {
    await new Promise(r => setTimeout(r, 300));
  }
}

/**
 * Renders name (or initials) in the given font onto an offscreen canvas
 * and returns a PNG data URL. Transparent background, ink-blue text.
 */
async function renderToDataUrl(
  text: string,
  font: string,
  weight: number,
  fontSize: number,
  color = '#1e3a8a'
): Promise<string> {
  await waitForFont(font, weight, text);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const fontStr = `${weight} ${fontSize}px '${font}'`;
  ctx.font = fontStr;
  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width) + 20;
  const textHeight = fontSize + 20;

  canvas.width = textWidth;
  canvas.height = textHeight;

  ctx.font = fontStr;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 10, textHeight / 2 + 4);

  return canvas.toDataURL('image/png');
}

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface SignatureStylePickerProps {
  /** Full legal name to render */
  name: string;
  /** Called when user confirms a style — returns { signatureDataUrl, initialsDataUrl, styleId } */
  onConfirm: (result: {
    signatureDataUrl: string;
    initialsDataUrl: string;
    styleId: string;
  }) => void;
  /** Optional: already-confirmed styleId to show as pre-selected */
  defaultStyleId?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const SignatureStylePicker: React.FC<SignatureStylePickerProps> = ({
  name,
  onConfirm,
  defaultStyleId,
}) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(
    defaultStyleId || SIGNATURE_STYLES[0].id
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const linkRef = useRef<HTMLLinkElement | null>(null);

  // Inject Google Fonts once
  useEffect(() => {
    if (document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
      setFontsLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);
    linkRef.current = link;
  }, []);

  // Reset confirmed state when name changes
  useEffect(() => {
    setConfirmed(false);
  }, [name]);

  const handleConfirm = useCallback(async () => {
    if (!name.trim() || confirming || confirmed) return;
    setConfirming(true);
    try {
      const style = SIGNATURE_STYLES.find(s => s.id === selectedId)!;
      const initials = getInitials(name);

      const [signatureDataUrl, initialsDataUrl] = await Promise.all([
        renderToDataUrl(name, style.font, style.weight, style.size),
        renderToDataUrl(initials, style.font, style.weight, style.initialsSize),
      ]);

      setConfirmed(true);
      onConfirm({ signatureDataUrl, initialsDataUrl, styleId: selectedId });
    } catch (err) {
      console.error('[SignaturePicker] Render failed:', err);
    } finally {
      setConfirming(false);
    }
  }, [name, selectedId, confirming, confirmed, onConfirm]);

  if (!fontsLoaded || !name.trim()) return null;

  const initials = getInitials(name);

  return (
    <>
      <style>{`
        @import url('${GOOGLE_FONTS_URL}');

        .sig-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          border: 2px solid transparent;
        }
        .sig-card:hover {
          border-color: #0d9488;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(13,148,136,0.15);
        }
        .sig-card.selected {
          border-color: #0d9488;
          background: rgba(13,148,136,0.06);
          box-shadow: 0 8px 24px rgba(13,148,136,0.2);
        }
        .sig-confirm-btn {
          transition: all 0.2s ease;
        }
        .sig-confirm-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(13,148,136,0.35);
        }
        @keyframes sig-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .sig-picker { animation: sig-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="sig-picker space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Choose Your Signature Style
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Initials <span className="font-mono font-bold text-[#0d9488]">{initials}</span> will be used on multi-page documents
            </p>
          </div>
        </div>

        {/* Style Cards */}
        <div className="space-y-2">
          {SIGNATURE_STYLES.map(style => (
            <div
              key={style.id}
              className={`sig-card rounded-2xl px-5 py-3 bg-white dark:bg-slate-800/60 ${
                selectedId === style.id ? 'selected' : ''
              }`}
              onClick={() => { setSelectedId(style.id); setConfirmed(false); }}
            >
              <div className="flex items-center justify-between">
                {/* Signature preview */}
                <div className="flex-1 overflow-hidden">
                  <span
                    style={{
                      fontFamily: `'${style.font}', cursive`,
                      fontWeight: style.weight,
                      fontSize: `${style.size * 0.72}px`,
                      color: '#1e3a8a',
                      lineHeight: 1.3,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {name}
                  </span>
                </div>

                {/* Initials + label */}
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <div className="text-right">
                    <span
                      style={{
                        fontFamily: `'${style.font}', cursive`,
                        fontWeight: style.weight,
                        fontSize: `${style.initialsSize * 0.55}px`,
                        color: '#64748b',
                        display: 'block',
                      }}
                    >
                      {initials}
                    </span>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                      {style.label}
                    </span>
                  </div>

                  {/* Selection indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedId === style.id
                      ? 'bg-[#0d9488] border-[#0d9488]'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedId === style.id && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={confirming || confirmed || !name.trim()}
          className={`sig-confirm-btn w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border-b-4 transition-all disabled:opacity-40 disabled:grayscale ${
            confirmed
              ? 'bg-emerald-500 border-emerald-700 text-white'
              : 'bg-[#0d9488] border-[#0a7c72] text-white shadow-[0_8px_24px_rgba(13,148,136,0.25)]'
          }`}
        >
          {confirming ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Preparing Signature...</>
          ) : confirmed ? (
            <><CheckCircle2 className="w-4 h-4" /> Signature Selected ✓</>
          ) : (
            <>Use This Signature</>
          )}
        </button>
      </div>
    </>
  );
};

export { getInitials, renderToDataUrl, SIGNATURE_STYLES };
export type { SignatureStylePickerProps };
