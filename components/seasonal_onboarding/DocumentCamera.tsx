import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CloseIcon, ExclamationTriangleIcon } from '../icons';

interface DocumentCameraProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  documentType: string;
}

export const DocumentCamera: React.FC<DocumentCameraProps> = ({ onCapture, onClose, documentType }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Camera access failed. Ensure you are using HTTPS and granted permissions.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    setIsCapturing(true);
    try {
        const shutter = document.getElementById('shutter-sound') as HTMLAudioElement;
        if (shutter) {
            shutter.play().catch(() => {
                // Silently fail if asset missing or blocked
            });
        }
    } catch (e) {
        // Audio playback safety wrapper
    }
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => blob && onCapture(blob), 'image/jpeg', 0.9);
  };

  const handleSimulate = async () => {
      setIsCapturing(true);
      // Create a small colored blob to simulate a photo
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = 'white';
          ctx.font = '24px sans-serif';
          ctx.fillText(`SIMULATED: ${documentType}`, 50, 240);
      }
      canvas.toBlob(blob => blob && onCapture(blob), 'image/jpeg', 0.9);
  }

  return (
    <div className="fixed inset-0 z-[230] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6 px-4">
            <div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight italic uppercase">Aiva Vision Link</h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2.5 h-2.5 bg-voltage rounded-full animate-ping shadow-[0_0_8px_#FFB800]"></div>
                    <p className="text-sm font-mono text-voltage uppercase tracking-[0.2em] font-bold">DNA Extraction Mode: {documentType}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                <CloseIcon className="w-7 h-7" />
            </button>
        </div>
        
        <div className="relative aspect-video w-full rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl bg-black group">
          {!error && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />}
          
          {/* AR Neural Grid & Visual DNA Overlays */}
          {!error && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="ar-scan-line absolute w-full top-0"></div>
                {isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-dna-pulse space-y-2">
                            <div className="h-1 w-48 bg-voltage shadow-[0_0_20px_#FFB800] rounded-full animate-dna-float"></div>
                            <div className="h-1 w-64 bg-white/50 shadow-[0_0_10px_white] rounded-full animate-dna-float-delayed"></div>
                            <div className="text-[10px] font-mono text-voltage text-center font-black tracking-widest uppercase">Extracting Visual DNA...</div>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[85%] h-[80%] border border-white/5 rounded-[2rem]">
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-voltage rounded-tl-[2rem] shadow-[0_0_20px_#FFB800]"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-voltage rounded-tr-[2rem] shadow-[0_0_20px_#FFB800]"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-voltage rounded-bl-[2rem] shadow-[0_0_20px_#FFB800]"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-voltage rounded-br-[2rem] shadow-[0_0_20px_#FFB800]"></div>
                    </div>
                </div>
              </div>
          )}
          
          {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
                  <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-6" />
                  <p className="text-white font-bold text-2xl mb-6 max-w-md">{error}</p>
                  <button onClick={startCamera} className="px-10 py-4 bg-brand-secondary text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all">Restart Hardware Driver</button>
              </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-16 mt-10">
          <button onClick={onClose} className="px-12 py-5 bg-slate-800 text-white font-black rounded-[2rem] hover:bg-slate-700 transition-all border border-white/5 shadow-xl">Abort Protocol</button>
          {!error && (
              <button onClick={handleCapture} disabled={isCapturing} className="group relative w-28 h-28 rounded-full bg-white flex items-center justify-center ring-[12px] ring-white/10 hover:ring-white/20 transition-all shadow-2xl transform hover:scale-110 active:scale-95 disabled:opacity-50">
                <div className="w-20 h-20 rounded-full bg-white ring-4 ring-brand-primary flex items-center justify-center">
                     <div className="w-5 h-5 bg-brand-primary rounded-sm animate-pulse"></div>
                </div>
              </button>
          )}
          <button onClick={handleSimulate} className="px-8 py-3 bg-white/5 text-white/30 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-white transition-all">Simulate Hardware</button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        @keyframes dna-float {
            0% { transform: translateY(0) scaleX(1); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-200px) scaleX(0.5); opacity: 0; }
        }
        .animate-dna-float { animation: dna-float 1s ease-out infinite; }
        .animate-dna-float-delayed { animation: dna-float 1s ease-out infinite 0.3s; }
      `}</style>
    </div>
  );
};
