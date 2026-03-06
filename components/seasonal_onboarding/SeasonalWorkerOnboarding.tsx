
import React, { useState, useEffect } from 'react';
import type { ExtractedDocumentData, Language, ModalType } from '../../types';
import { processDocumentWithGemini, extractDocumentDna } from '../../services/geminiService';
import { QRScanner } from './QRScanner';
import { StepIndicator, type OnboardingStepId } from './StepIndicator';
import { DocumentCamera } from './DocumentCamera';
import { CheckCircleIcon, CloseIcon, DocumentTextIcon, IdCardIcon, QrCodeIcon, UsersIcon, AiSparkIcon, WhatsAppIcon, CloudIcon } from '../icons';
import { BanknoteIcon } from '../hr_icons/BanknoteIcon';
import { useAppContext } from '../../context/AppContext';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { storageService } from '../../services/storageService';
import { logCirrusAudit } from '../../services/cirrusService';
import { Tag } from 'lucide-react';

interface SeasonalWorkerOnboardingProps {
  onComplete: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  openModal: (modal: ModalType) => void;
}

type OnboardingView = 'aiva_intro' | 'qr_scan' | 'manual_entry' | 'checklist' | 'capturing' | 'processing' | 'verifying' | 'complete';
type DocumentStatus = 'pending' | 'verified' | 'error';
type DocumentType = 'id' | 'address' | 'bank';

const documentConfig: Record<DocumentType, { label: string; geminiName: string; Icon: React.FC<any> }> = {
    id: { label: 'ID Document', geminiName: 'South African ID Card', Icon: IdCardIcon },
    address: { label: 'Proof of Address', geminiName: 'Proof of Address', Icon: DocumentTextIcon },
    bank: { label: 'Bank Statement', geminiName: 'Bank Statement', Icon: BanknoteIcon },
};

const GREETINGS: Record<string, string> = {
    'en-ZA': "Welcome, {name}! Let's get you started with the Nashua onboarding protocol.",
    'xh-ZA': "Wamkelekile, {name}! Masiqale inkqubo yokungena eNashua.",
    'zu-ZA': "Wamukelekile, {name}! Asiqale inqubo yokungena eNashua.",
    'af-ZA': "Welkom, {name}! Kom ons begin met die Nashua-onboarding-protokol.",
    'st-ZA': "Kamohelo, {name}! Ha re qaleng lenaneo la Nashua.",
};

const SeasonalWorkerOnboarding: React.FC<SeasonalWorkerOnboardingProps> = ({ onComplete, language, setLanguage, openModal }) => {
  const { addToast } = useAppContext();
  const { speak } = useTextToSpeech();
  const [view, setView] = useState<OnboardingView>('aiva_intro');
  const [workerData, setWorkerData] = useState<Partial<ExtractedDocumentData>>({});
  const [workerName, setWorkerName] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualId, setManualId] = useState('');
  const [documentStatuses, setDocumentStatuses] = useState<Record<DocumentType, DocumentStatus>>({ id: 'pending', address: 'pending', bank: 'pending' });
  const [docBeingCaptured, setDocBeingCaptured] = useState<DocumentType | null>(null);
  const [lastExtractedData, setLastExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Initializing analysis...');
  const [customTags, setCustomTags] = useState<string[]>(['#seasonal']);
  
  useEffect(() => {
    if (workerId && workerName && view !== 'aiva_intro') {
        storageService.syncOnboardingProgress(workerId, view, { documentStatuses, workerData, language, last_sync: new Date().toISOString() });
    }
  }, [workerId, workerName, view, documentStatuses, workerData, language]);

  const handleQrScan = async (text: string) => {
    try {
      const qrData = JSON.parse(text);
      if (qrData.fullName && qrData.workerId) {
        setWorkerName(qrData.fullName);
        setWorkerId(qrData.workerId.toString());
        setLanguage((qrData.language as Language) || 'en-ZA');
        const template = GREETINGS[qrData.language as Language] || GREETINGS['en-ZA'];
        await speak(template.replace('{name}', qrData.fullName));
        setView('checklist');
      }
    } catch (error) {
      addToast('Scan failed.', 'error');
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualName || !manualId) return;
      setWorkerName(manualName);
      setWorkerId(manualId);
      await storageService.trackWorkerInvite(manualId, manualName);
      setView('checklist');
  };

  const handleDocumentCapture = async (blob: Blob) => {
      if (!docBeingCaptured) return;
      setView('processing');
      setProcessingMessage('Extracting Digital DNA...');
      setLastBlob(blob);
      
      try {
          const processedPromise = processDocumentWithGemini(blob, documentConfig[docBeingCaptured].geminiName);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
          const processed = await Promise.race([processedPromise, timeoutPromise]) as ExtractedDocumentData;
          
          if (processed.fullName) {
              addToast(`ID Verified: ${processed.fullName}`, "success");
              if (processed.idNumber) {
                  const conf = Math.round((processed.confidence || 0.98) * 100);
                  addToast(`Reference Number: ${processed.idNumber} (Confidence: ${conf}%)`, "info");
              }
              setLastExtractedData(processed);
              setWorkerData(prev => ({ ...prev, ...processed }));
              setView('verifying');
          } else {
              setDocumentStatuses(prev => ({...prev, [docBeingCaptured]: 'error'}));
              const errorMessage = processed.message || "Neural capture failed. Using manual verification mode.";
              addToast(errorMessage, "warning");
              setLastExtractedData({ message: "Verification Required", fullName: workerName || "" });
              setView('verifying');
          }
      } catch (e) {
          console.error("Capture Error:", e);
          addToast("Hardware link reset. Manual verification node active.", "info");
          setLastExtractedData({ message: "Manual Review Active", fullName: workerName || "" });
          setView('verifying');
      }
  };

  const handleVerificationConfirm = async () => {
    if (!docBeingCaptured || !lastBlob) return;
    setDocumentStatuses(prev => ({ ...prev, [docBeingCaptured]: 'verified' }));
    const capturedType = docBeingCaptured;
    const currentDocLabel = documentConfig[capturedType].label;
    
    const dateStr = new Date().toLocaleDateString('en-ZA').replace(/\//g, '.');
    const fileName = `${workerName || 'Worker'} ${currentDocLabel} ${dateStr}`;

    setView('checklist');
    try {
        const dna = await extractDocumentDna(lastBlob);
        await storageService.uploadFile(lastBlob, `${fileName}.jpg`, 'onboarding-ingestion', {
            worker_id: workerId, 
            worker_name: workerName, 
            classification: currentDocLabel, 
            extracted: lastExtractedData, 
            dna: {
                ...dna,
                tags: [...(dna.tags || []), ...customTags]
            }
        });
        await logCirrusAudit({
            actor: workerName || 'SEASONAL_WORKER', action: `DOC_VERIFIED_${capturedType.toUpperCase()}`, resource: 'AIVA_INGESTION_PAARL', timestamp: new Date().toISOString(), outcome: 'success', details: `Specimen verified & tagged: ${fileName}`
        });
        setDocBeingCaptured(null);
    } catch (e) {
        console.warn('Audit logging failed:', e);
    }
  };

  const handleDataChange = (key: string, value: string) => {
      setLastExtractedData(prev => prev ? ({ ...prev, [key]: value }) : null);
  }

  const toggleTag = (tag: string) => {
      setCustomTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  const handleComplete = async () => {
      if (workerId) {
          await storageService.syncOnboardingProgress(workerId, 'completed', { completed_at: new Date().toISOString() });
          await speak("Onboarding complete. Your credentials have been pulsed to your mobile device. Welcome to the Nashua Paarl team.");
          addToast("Mesh Status: COMPLETED. Credentials Pulsed.", "success");
      }
      onComplete();
  }

  const renderContent = () => {
    switch (view) {
      case 'aiva_intro':
        return (
             <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-center animate-fadeIn border border-white/10">
                 <div className="relative mb-8 mx-auto w-36 md:w-44">
                    <div className="absolute inset-0 bg-brand-secondary/20 rounded-full blur-xl animate-pulse"></div>
                    <video src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4" autoPlay loop muted playsInline className="w-full h-full rounded-full object-cover shadow-2xl border-4 border-white dark:border-slate-700 relative z-10" />
                 </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Induction Node</h2>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">Identify yourself to begin the 1-6 Numerical Induction Sequence.</p>
                 <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <button onClick={() => setView('qr_scan')} className="group flex flex-col items-center justify-center p-6 md:p-8 bg-brand-primary rounded-3xl hover:brightness-110 transition-all shadow-xl">
                        <QrCodeIcon className="w-10 h-10 md:w-12 md:h-12 text-white mb-3" />
                        <span className="font-black text-white uppercase tracking-widest text-[10px] md:text-xs">Scan Invite</span>
                    </button>
                    <button onClick={() => setView('manual_entry')} className="flex flex-col items-center justify-center p-6 md:p-8 bg-slate-100 dark:bg-slate-700 rounded-3xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all shadow-lg border border-slate-200 dark:border-slate-600">
                        <UsersIcon className="w-10 h-10 md:w-12 md:h-12 text-slate-600 dark:text-slate-300 mb-3" />
                        <span className="font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest text-[10px] md:text-xs">Manual Link</span>
                    </button>
                </div>
            </div>
        );
      case 'qr_scan':
        return <QRScanner onScan={handleQrScan} onClose={() => setView('aiva_intro')} />;
      case 'manual_entry':
          return (
              <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-10 animate-fadeIn border border-white/10">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight text-center mb-8 italic underline decoration-voltage decoration-4 underline-offset-8">Manual Identification</h2>
                  <form onSubmit={handleManualEntry} className="space-y-6">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Full Legal Name</label>
                          <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Enter name..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold focus:border-brand-primary outline-none transition-all shadow-inner" required />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mobile / Mesh ID</label>
                          <input type="text" value={manualId} onChange={e => setManualId(e.target.value)} placeholder="082..." className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold focus:border-brand-primary outline-none transition-all shadow-inner" required />
                      </div>
                      <button type="submit" className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl uppercase tracking-widest text-xs border-b-4 border-brand-dark/40 active:border-b-0 active:translate-y-1">Synchronize Session</button>
                      <button type="button" onClick={() => setView('aiva_intro')} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Back</button>
                  </form>
              </div>
          );
      case 'checklist': {
        const allDocumentsReady = Object.values(documentStatuses).every(s => s === 'verified');
        return (
             <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 md:p-10 text-center animate-fadeIn border border-white/10 max-h-[85dvh] overflow-y-auto copilot-scrollbar">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Uplink Confirmed</h2>
                <p className="text-slate-500 font-medium mt-3 mb-8">Verification protocol active for **{workerName}**.</p>
                <div className="space-y-3">
                    {(Object.keys(documentConfig) as DocumentType[]).map((docType) => {
                        const config = documentConfig[docType];
                        const status = documentStatuses[docType];
                        return (
                             <div key={docType} className={`p-4 md:p-5 rounded-2xl flex items-center justify-between border-2 transition-all ${status === 'verified' ? 'bg-green-500/5 border-green-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                        <config.Icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <span className={`font-black uppercase tracking-widest text-[10px] md:text-[11px] ${status === 'verified' ? 'text-green-600' : 'text-slate-400'}`}>{config.label}</span>
                                </div>
                                {status === 'verified' ? (
                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                ) : (
                                    <button onClick={() => { setDocBeingCaptured(docType); setView('capturing'); }} className="px-5 py-2 bg-brand-secondary text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-all">Capture</button>
                                )}
                            </div>
                        );
                    })}
                </div>
                 <button onClick={() => setView('complete')} disabled={!allDocumentsReady} className="mt-8 w-full py-5 bg-brand-primary text-white font-black rounded-2xl hover:brightness-110 shadow-2xl transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-sm border-b-4 border-brand-dark/40">Finalize Induction</button>
            </div>
        );
      }
      case 'processing':
          return (
              <div className="flex flex-col items-center justify-center text-center p-20 animate-fadeIn">
                  <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-4 border-voltage border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-voltage/10 rounded-full flex items-center justify-center">
                        <AiSparkIcon className="w-12 h-12 text-voltage animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-white text-2xl font-black uppercase tracking-widest italic">{processingMessage}</h3>
                  <p className="text-slate-500 mt-2 font-mono uppercase text-[10px] tracking-[0.3em]">Lex Node Sync Active</p>
              </div>
          );
      case 'verifying':
          return (
              <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-fadeIn border border-white/10 max-h-[85dvh] flex flex-col">
                   <div className="flex items-center gap-3 mb-6 shrink-0">
                        <div className="p-3 bg-voltage/10 rounded-2xl text-voltage"><AiSparkIcon className="w-6 h-6" /></div>
                        <div className="text-left">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm italic">Metadata Alignment</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">DNA Calibration Protocol</p>
                        </div>
                   </div>

                   <div className="flex-1 space-y-5 bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-inner overflow-y-auto copilot-scrollbar">
                        <div className="pb-4 border-b border-white/5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated Title</p>
                            <p className="text-xs font-black text-brand-secondary italic">
                                {workerName} {docBeingCaptured ? documentConfig[docBeingCaptured].label : 'Asset'} {new Date().toLocaleDateString('en-ZA').replace(/\//g, '.')}
                            </p>
                        </div>

                        {lastExtractedData && Object.entries(lastExtractedData)
                            .filter(([k,v]) => k !== 'confidence' && k !== 'error' && k !== 'message' && typeof v !== 'object')
                            .map(([k, v]) => (
                            <div key={k} className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{k.replace(/([A-Z])/g, ' $1')}</label>
                                <input 
                                    type="text" 
                                    value={String(v)}
                                    onChange={(e) => handleDataChange(k, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-brand-primary outline-none"
                                />
                            </div>
                        ))}

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Tag className="w-3 h-3" /> strategic tagging
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['#onboarding', '#compliance', '#seasonal', '#verified-id', '#bank-sync'].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${customTags.includes(tag) ? 'bg-brand-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                   </div>

                   <div className="mt-8 grid grid-cols-2 gap-4 shrink-0">
                        <button onClick={() => setView('checklist')} className="py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px]">Reject Specimen</button>
                        <button onClick={handleVerificationConfirm} className="py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px] border-b-4 border-brand-dark/40 active:border-b-0 active:translate-y-1">Commit to Mesh</button>
                   </div>
              </div>
          );
      case 'complete':
        return (
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 text-center animate-fadeIn border border-white/20">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_#22c55e] mx-auto mb-8 border-4 border-white"><CheckCircleIcon className="w-12 h-12 text-white" /></div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Mesh Established</h2>
                <p className="text-slate-500 font-medium mt-2 mb-8 leading-relaxed">Identity confirmed. Workforce node **{workerId}** is now strategically persistent.</p>
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white text-left relative overflow-hidden shadow-2xl border border-white/10 mb-8">
                     <div className="absolute top-0 right-0 p-8 opacity-5"><AiSparkIcon className="w-48 h-48" /></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em] mb-6">Digital Credentials Dispatched</p>
                        <div className="flex gap-4 items-center mb-6">
                            <WhatsAppIcon className="w-8 h-8 text-[#25D366]" />
                            <div><p className="text-sm font-bold">Link Pulsed to Phone</p><p className="text-[10px] text-slate-400 uppercase tracking-widest">Aiva Secure Tunnel Active</p></div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-mono text-[10px] text-brand-secondary">ACCESS_CODE: NP-{workerId}-AUTH</div>
                     </div>
                </div>
                <button onClick={handleComplete} className="w-full py-5 bg-slate-800 text-white font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-xs shadow-xl">Close Secure Terminal</button>
            </div>
        );
      case 'capturing':
          return <DocumentCamera onCapture={handleDocumentCapture} onClose={() => setView('checklist')} documentType={docBeingCaptured ? documentConfig[docBeingCaptured].label : "Specimen"} />;
      default: return null;
    }
  };
  
  const mapVwToStepId = (): OnboardingStepId => {
      if (['aiva_intro', 'qr_scan', 'manual_entry'].includes(view)) return 'identification';
      if (['checklist', 'capturing', 'processing', 'verifying'].includes(view)) return 'document_checklist';
      return 'complete';
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fadeIn overflow-y-auto copilot-scrollbar">
      <div className="absolute top-10 w-full max-w-4xl px-4"><StepIndicator currentStep={mapVwToStepId()} /></div>
      <main className="flex-1 flex items-center justify-center w-full mt-20">{renderContent()}</main>
    </div>
  );
};

export default SeasonalWorkerOnboarding;
