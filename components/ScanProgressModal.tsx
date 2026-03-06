import React, { useState, useEffect } from 'react';
import { CloseIcon, QrCodeIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import type { Job } from '../types';

interface ScanProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({ isOpen, onClose, jobId }) => {
    const { jobs } = useAppContext();
    const job = jobId ? jobs.find(j => j.job_id === jobId) || null : null;

    if (!isOpen || !job) return null;

    const isProcessing = job.status === 'processing';
    const isComplete = job.status === 'complete';
    const isFailed = job.status === 'failed';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <QrCodeIcon className="w-5 h-5 text-brand-primary"/>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Scan in Progress...</h2>
                    </div>
                    {!isProcessing && (
                         <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </header>
                <main className="p-8 text-center">
                    {isProcessing && (
                        <>
                            <div className="w-16 h-16 border-4 border-dashed border-brand-secondary rounded-full animate-spin mx-auto"></div>
                            <h3 className="text-xl font-bold mt-4">Scanning...</h3>
                            <p className="text-slate-500 mt-1">Please wait for the hardware to complete the scan.</p>
                        </>
                    )}
                    {isComplete && (
                        <>
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <QrCodeIcon className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold mt-4">Scan Complete!</h3>
                            <p className="text-slate-500 mt-1">{job.page_count || 0} page(s) successfully scanned.</p>
                            <button onClick={onClose} className="mt-6 w-full py-2 bg-brand-secondary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                                Close
                            </button>
                        </>
                    )}
                     {isFailed && (
                        <>
                             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                                <QrCodeIcon className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold mt-4 text-red-600">Scan Failed</h3>
                            <p className="text-slate-500 mt-1 bg-slate-100 dark:bg-slate-700 p-2 rounded-md text-xs">{job.error || 'An unknown error occurred.'}</p>
                             <button onClick={onClose} className="mt-6 w-full py-2 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors">
                                Close
                            </button>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};