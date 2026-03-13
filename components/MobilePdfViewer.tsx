// src/components/MobilePdfViewer.tsx
//
// Drop-in PDF viewer that works on mobile.
// On desktop: renders iframe directly (fast, native).
// On mobile: uses Google Docs viewer embedded (avoids "Open" button on Android).
// Fallback: download link if both fail.

import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';

interface MobilePdfViewerProps {
    url: string;
    className?: string;
    title?: string;
}

function isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export const MobilePdfViewer: React.FC<MobilePdfViewerProps> = ({ url, className = '', title }) => {
    const [viewerFailed, setViewerFailed] = useState(false);
    const [mobile] = useState(() => typeof navigator !== 'undefined' ? isMobile() : false);

    // Google Docs viewer URL — works on Android Chrome without "Open" prompt
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    if (viewerFailed) {
        // Final fallback — just show open/download buttons
        return (
            <div className={`flex flex-col items-center justify-center gap-4 bg-slate-900 rounded-2xl p-8 ${className}`}>
                <FileText className="w-12 h-12 text-slate-400" />
                {title && <p className="text-sm font-bold text-slate-300 text-center">{title}</p>}
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Document
                </a>
                <a
                    href={url}
                    download
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-slate-200 font-black text-[10px] uppercase tracking-widest rounded-2xl"
                >
                    <Download className="w-4 h-4" />
                    Download PDF
                </a>
            </div>
        );
    }

    const iframeSrc = mobile ? googleDocsUrl : `${url}#toolbar=0`;

    return (
        <div className={`relative ${className}`}>
            <iframe
                key={iframeSrc}
                src={iframeSrc}
                className="w-full h-full rounded-2xl border-2 border-white/5"
                onError={() => setViewerFailed(true)}
                title={title || 'Document'}
                allow="fullscreen"
            />
            {/* Open externally button — always visible on mobile */}
            {mobile && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10"
                >
                    <ExternalLink className="w-3 h-3" />
                    Full Screen
                </a>
            )}
        </div>
    );
};
