
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    CloseIcon, 
    MaximizeIcon, 
    MinimizeIcon, 
    PlayIcon, 
    StopIcon, 
    AiSparkIcon, 
    EyeIcon,
    RefreshIcon,
    ExclamationTriangleIcon
} from './icons';

interface VisualAuditPanelProps {
    agentName: string;
    onCapture: (blob: Blob) => void;
    onClose: () => void;
    status: 'LINK_ACTIVE' | 'RECORDING' | 'ANALYZING' | 'IDLE';
}

export const VisualAuditPanel: React.FC<VisualAuditPanelProps> = ({ 
    agentName, 
    onCapture, 
    onClose, 
    status 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const startCamera = useCallback(async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (err) {
            console.error("Audit Hardware Link Error:", err);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            startCamera();
        }, 0);
        return () => {
            clearTimeout(timer);
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [startCamera, stream]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(blob => blob && onCapture(blob), 'image/jpeg', 0.95);
        
        // Shutter effect
        const shutter = document.getElementById('shutter-sound') as HTMLAudioElement;
        if (shutter) shutter.play().catch(() => {});
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const statusColors = {
        LINK_ACTIVE: 'bg-green-500',
        RECORDING: 'bg-red-500 animate-pulse',
        ANALYZING: 'bg-voltage animate-ping',
        IDLE: 'bg-slate-500'
    };

    return (
        <div 
            className={`fixed z-[150] shadow-2xl transition-all duration-300 overflow-hidden border-2 border-white/20 rounded-[2rem] bg-[#0F172A] ${isMinimized ? 'w-64 h-16' : 'w-80 md:w-96 h-[32rem]'}`}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Header / Drag Bar */}
            <header 
                onMouseDown={handleMouseDown}
                className="flex items-center justify-between p-4 bg-[#0F172A] border-b border-white/5 select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`}></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{agentName} AUDIT</span>
                    </div>
                    {status === 'ANALYZING' && (
                        <span className="text-[9px] font-mono text-voltage animate-pulse">EXTRACTING_DNA...</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400">
                        {isMinimized ? <MaximizeIcon className="w-4 h-4" /> : <MinimizeIcon className="w-4 h-4" />}
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {!isMinimized && (
                <>
                    <div className="relative aspect-video bg-black overflow-hidden group">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
                        
                        {/* Audit Overlays */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-4 border border-white/10 rounded-2xl">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-voltage rounded-tl-2xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-voltage rounded-tr-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-voltage rounded-bl-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-voltage rounded-br-2xl"></div>
                            </div>
                            <div className="ar-scan-line absolute w-full top-0 opacity-40"></div>
                        </div>

                        {/* Control Overlay */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleCapture} className="p-4 bg-voltage text-[#0F172A] rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
                                <EyeIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Protocol</p>
                            <h4 className="text-sm font-bold text-white uppercase italic tracking-tighter">Clinical Conformance Monitor</h4>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                                System is scanning for deterministic behavior and structural liabilities. 10x Field Repair penalty enforced.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Integrity Score</p>
                                <p className="text-lg font-black text-voltage">98.4%</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Support Debt</p>
                                <p className="text-lg font-black text-green-500">LOW</p>
                            </div>
                        </div>

                        <button 
                            onClick={handleCapture}
                            className="w-full py-4 bg-voltage hover:brightness-110 text-[#0F172A] font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg transition-all"
                        >
                            Commit Audit Snapshot
                        </button>
                    </div>
                </>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
