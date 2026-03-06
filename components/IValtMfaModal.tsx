
import React, { useState, useRef, useEffect } from 'react';
import { IValtService, type IValtAuthStatus } from '../services/iValtService';
import { FaceSmileIcon, CheckCircleIcon, ExclamationTriangleIcon, CloseIcon, AiSparkIcon } from './icons';

interface IValtMfaModalProps {
  phoneNumber: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function IValtMfaModal({ phoneNumber, onSuccess, onClose }: IValtMfaModalProps) {
  const [status, setStatus] = useState<IValtAuthStatus>({
    status: 'pending',
    message: 'Ready to authenticate',
  });
  const [started, setStarted] = useState(false);
  const locked = useRef(false);
  const service = useRef(new IValtService());

  const start = async () => {
    if (started) return;
    setStarted(true);

    try {
      await service.current.initiateHandshake(phoneNumber);
      setStatus({ status: 'pending', message: 'Uplink Dispatched. Verify on mobile device.' });

      service.current.startPolling(
        (s) => {
          if (locked.current) return;
          if (s.status === 'success') {
            locked.current = true;
          }
          setStatus(s);
        },
        onSuccess,
        (err) => setStatus({ status: 'failed', message: err })
      );
    } catch (err) {
      setStatus({
        status: 'failed',
        message: err instanceof Error ? err.message : 'Failed to start',
      });
      setStarted(false);
    }
  };

  useEffect(() => {
    // --- NEURAL AUTO-START PROTOCOL ---
    // Automatically trigger the handshake on component mount
    const currentService = service.current;
    if (!started) {
        const timer = setTimeout(() => {
            start();
        }, 0);
        return () => {
            clearTimeout(timer);
            currentService.cancel();
        };
    }
    return () => currentService.cancel();
  }, [phoneNumber, onSuccess, started, start]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative">
        <header className="p-8 text-center border-b border-slate-100 dark:border-slate-700">
           <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight underline decoration-voltage decoration-2 underline-offset-4">iVALT Biometric</h2>
           <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest">Protocol Sync v9.0</p>
        </header>

        <main className="p-10 flex flex-col items-center">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 mb-6 w-full flex flex-col items-center gap-6 shadow-inner border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                {status.status === 'pending' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/10 overflow-hidden">
                        <div className="h-full bg-voltage animate-voltage-flow w-1/2"></div>
                    </div>
                )}
                
                <div className="relative">
                  {status.status === 'pending' && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping"></div>
                        <FaceSmileIcon className="w-16 h-16 text-brand-primary animate-pulse" />
                    </div>
                  )}
                  {status.status === 'success' && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                        <CheckCircleIcon className="w-16 h-16 text-green-500 animate-fadeIn" />
                    </div>
                  )}
                  {status.status === 'failed' && (
                    <ExclamationTriangleIcon className="w-16 h-16 text-red-500 animate-fadeIn" />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-slate-800 dark:text-white font-bold uppercase tracking-tight mb-1">{status.message}</p>
                  {status.step && (
                    <p className="text-[10px] text-slate-500 font-mono uppercase font-black">Link Stage: {status.step}</p>
                  )}
                </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900/30 rounded-xl p-3 mb-8 w-full border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Target Node</p>
                <p className="text-slate-800 dark:text-white font-mono text-xs font-bold">{phoneNumber}</p>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                 <AiSparkIcon className="w-4 h-4 text-voltage" />
              </div>
            </div>

            <div className="flex gap-3 w-full">
              {status.status !== 'success' && (
                <button
                  onClick={onClose}
                  className="w-full bg-slate-800 text-white font-black py-4 px-4 rounded-2xl transition-all hover:bg-slate-900 uppercase tracking-widest text-[10px] border-b-4 border-slate-600 active:border-b-0 active:translate-y-1"
                >
                  {status.status === 'failed' ? 'Return to Login' : 'Abort Protocol'}
                </button>
              )}
            </div>
        </main>
      </div>
    </div>
  );
}
