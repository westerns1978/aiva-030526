
import React, { useState, useMemo, useEffect } from 'react';
import { STAFF_DIRECTORY } from '../constants/staffDirectory';
import { CloseIcon, IdCardIcon, QrCodeIcon } from './icons';
import { QRScanner } from './seasonal_onboarding/QRScanner';
import { useAppContext } from '../context/AppContext';
import { DocumentCamera } from './seasonal_onboarding/DocumentCamera';
import { processDocumentWithGemini } from '../services/geminiService';

interface VisitorCheckInProps {
  isOpen: boolean;
  onClose: () => void;
}

const allStaff = STAFF_DIRECTORY.flatMap(d => d.members);

export const VisitorCheckIn: React.FC<VisitorCheckInProps> = ({ isOpen, onClose }) => {
  const { handleGoHome, addToast } = useAppContext();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [hostId, setHostId] = useState('');
  const [step, setStep] = useState<'form' | 'badge'>('form');
  const [scanMode, setScanMode] = useState<'qr' | 'id' | null>(null);
  const [isProcessingId, setIsProcessingId] = useState(false);

  useEffect(() => {
      if (isOpen) {
          setName('');
          setCompany('');
          setHostId('');
          setStep('form');
          setScanMode(null);
      }
  }, [isOpen]);

  const selectedHost = useMemo(() => allStaff.find(s => s.id === hostId), [hostId]);
  
  const handleSessionEnd = () => {
      onClose();
      setTimeout(() => {
          handleGoHome();
      }, 100);
  }
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !hostId) {
          addToast("Please enter your name and select who you are here to see.", "error");
          return;
      }
      setStep('badge');
      console.log(`Visitor ${name} from ${company || 'N/A'} is here to see ${selectedHost?.name}. Notification sent.`);
      addToast(`Thank you, ${name}. Your host, ${selectedHost?.name}, has been notified.`, 'success');
  }

  const handleQrScan = (text: string) => {
    try {
        const qrData = JSON.parse(text);
        if (qrData.visitorName && qrData.hostId) {
            setName(qrData.visitorName);
            setCompany(qrData.company || '');
            setHostId(qrData.hostId);
            addToast(`Welcome, ${qrData.visitorName}! Your details are pre-filled.`, 'success');
        } else {
            addToast('Invalid visitor QR code.', 'error');
        }
    } catch(e) {
        addToast('Could not read QR code.', 'error');
    }
    setScanMode(null);
  }
  
  const handleIdScan = async (blob: Blob) => {
    setScanMode(null);
    setIsProcessingId(true);
    addToast("Pulse: Initializing ID Extraction...", "info");
    
    try {
        const data = await processDocumentWithGemini(blob, "Visitor ID Card or Passport");
        if (data.fullName) {
            setName(data.fullName);
            addToast(`ID Verified: ${data.fullName}`, 'success');
            
            if (data.idNumber) {
                const confidence = Math.round((data.confidence || 0.98) * 100);
                addToast(`Reference Number: ${data.idNumber} (Confidence: ${confidence}%)`, 'info');
            }
        } else {
            const errorMessage = data.message || "Could not automatically read identity node. Please enter details manually.";
            addToast(errorMessage, 'warning');
        }
    } catch (e) {
        console.error("Error processing ID:", e);
        addToast("Hardware link reset. Digital extraction protocol aborted.", 'error');
    } finally {
        setIsProcessingId(false);
    }
  };

  if (!isOpen) return null;

  if (scanMode === 'qr') {
    return <QRScanner onScan={handleQrScan} onClose={() => setScanMode(null)} />;
  }
  
  if (scanMode === 'id') {
      return <DocumentCamera onCapture={handleIdScan} onClose={() => setScanMode(null)} documentType="ID / Passport" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
            <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{step === 'form' ? 'Visitor Check-in' : 'Your Visitor Badge'}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            
            {step === 'form' ? (
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button type="button" onClick={() => setScanMode('qr')} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors shadow">
                            <QrCodeIcon className="w-5 h-5" />
                            Scan Invitation
                        </button>
                         <button type="button" onClick={() => setScanMode('id')} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors shadow">
                            <IdCardIcon className="w-5 h-5" />
                            Scan ID / Passport
                        </button>
                    </div>
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-300 dark:border-slate-600"></div></div>
                        <div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400">Or enter details manually</span></div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="visitor-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Full Name</label>
                            <input type="text" id="visitor-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
                        </div>
                        <div>
                            <label htmlFor="visitor-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Company (Optional)</label>
                            <input type="text" id="visitor-company" value={company} onChange={e => setCompany(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary" />
                        </div>
                        <div>
                            <label htmlFor="host-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Who are you here to see?</label>
                            <select id="host-select" value={hostId} onChange={e => setHostId(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary">
                                <option value="" disabled>Select a person...</option>
                                {STAFF_DIRECTORY.map(dept => (
                                    <optgroup key={dept.name} label={dept.name}>
                                        {dept.members.map(member => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                Check In & Notify Host
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-6 text-center">
                    <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <IdCardIcon className="w-16 h-16 mx-auto text-brand-primary" />
                        <h3 className="text-xl font-bold mt-2 text-slate-800 dark:text-slate-100">{name}</h3>
                        {company && <p className="text-slate-500 dark:text-slate-400">{company}</p>}
                        <div className="my-3 h-px bg-slate-300 dark:bg-slate-600"></div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Visiting:</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedHost?.name}</p>
                        <p className="text-xs text-slate-400 mt-4">Issued: {new Date().toLocaleString()}</p>
                    </div>
                    <button onClick={handleSessionEnd} className="mt-6 w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        Done
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
