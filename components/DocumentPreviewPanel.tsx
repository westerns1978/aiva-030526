import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2, FileText, ExternalLink } from 'lucide-react';

interface DocumentPreviewPanelProps {
    file: any | null;          // The file object from uploaded_files
    onClose: () => void;       // Close handler
    hireName?: string;         // Optional: candidate name for header
}

export const DocumentPreviewPanel: React.FC<DocumentPreviewPanelProps> = ({ 
    file, 
    onClose, 
    hireName 
}) => {
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Close on Escape key
    const [lastId, setLastId] = useState(file?.id);
    if (file?.id !== lastId) {
        setLastId(file?.id);
        setZoom(100);
        setIsFullscreen(false);
    }
    
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);
    
    if (!file) return null;
    
    const isPdf = file.file_type?.includes('pdf') || 
                  file.public_url?.toLowerCase().endsWith('.pdf') ||
                  file.file_name?.toLowerCase().endsWith('.pdf');
    const isImage = file.file_type?.startsWith('image/') ||
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.public_url || '');
    
    // Clean filename for display
    const displayName = (file.file_name || 'Document')
        .replace(/\.[^.]+$/, '')
        .replace(/_\d{13,}$/g, '')
        .replace(/^\d+_/, '')
        .replace(/_/g, ' ');
    
    // Status badge
    const statusConfig: Record<string, { bg: string; label: string }> = {
        countersigned: { bg: 'bg-emerald-500', label: 'Countersigned' },
        signed: { bg: 'bg-teal-500', label: 'Signed' },
        verified: { bg: 'bg-blue-500', label: 'Verified' },
        uploaded: { bg: 'bg-slate-400', label: 'Uploaded' },
    };
    const status = statusConfig[file.document_status?.toLowerCase()] || statusConfig.uploaded;
    
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Panel width: normal or fullscreen with responsive override
    const panelWidth = isFullscreen 
        ? 'w-full' 
        : 'w-full md:w-[50vw] md:max-w-[800px] md:min-w-[400px]';

    return (
        <>
            {/* Backdrop — click to close */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150] transition-opacity duration-300 animate-fadeIn"
                onClick={onClose}
            />
            
            {/* Slide-over panel */}
            <div className={`fixed top-0 right-0 h-full ${panelWidth} bg-white dark:bg-slate-900 shadow-2xl z-[151] flex flex-col transform transition-transform duration-300 ease-out animate-slide-in-right`}>
                
                {/* ─── TOOLBAR ─── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                    {/* Left: file info */}
                    <div className="min-w-0 flex-1 mr-4">
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white truncate">
                            {displayName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {hireName && (
                                <span className="text-[9px] text-slate-400 uppercase tracking-wide">
                                    {hireName}
                                </span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider text-white ${status.bg}`}>
                                {status.label}
                            </span>
                            {file.created_at && (
                                <span className="text-[8px] text-slate-400">
                                    {formatDate(file.created_at)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Right: actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Zoom controls (for images) */}
                        {isImage && (
                            <>
                                <button 
                                    onClick={() => setZoom(z => Math.max(25, z - 25))}
                                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                                    title="Zoom out"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-[9px] font-mono text-slate-400 w-8 text-center">
                                    {zoom}%
                                </span>
                                <button 
                                    onClick={() => setZoom(z => Math.min(300, z + 25))}
                                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                                    title="Zoom in"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        
                        {/* Fullscreen toggle */}
                        <button 
                            onClick={() => setIsFullscreen(f => !f)}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        
                        {/* Open in new tab */}
                        <a 
                            href={file.public_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                            title="Open in new tab"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        {/* Download */}
                        <a 
                            href={file.public_url} 
                            download={file.file_name}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                        
                        {/* Divider */}
                        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />
                        
                        {/* Close */}
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                            title="Close (Esc)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* ─── CONTENT AREA ─── */}
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
                    {isPdf ? (
                        /* PDF: Google Docs viewer bypasses GCS CORS/content-disposition blocking */
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.public_url)}&embedded=true`}
                            className="w-full h-full border-0"
                            title={displayName}
                        />
                    ) : isImage ? (
                        /* Image: centered with zoom */
                        <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                            <img 
                                src={file.public_url} 
                                alt={displayName}
                                className="max-w-none shadow-lg rounded-lg transition-transform duration-200"
                                style={{ 
                                    width: `${zoom}%`,
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    ) : (
                        /* Unknown type: show download prompt */
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                            <FileText className="w-16 h-16 text-slate-300" />
                            <p className="text-sm text-slate-500 font-medium">
                                Preview not available for this file type
                            </p>
                            <a 
                                href={file.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-teal-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-colors"
                            >
                                Open File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};