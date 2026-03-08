import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CloseIcon, AiSparkIcon, EyeIcon, CheckCircleIcon, ClockIcon } from './icons';
import { Signature, Award, Fingerprint, ShieldAlert, Loader2, AlertTriangle, ShieldCheck, Hash, FileText, UserCheck, Smartphone, CheckCircle2, Lock, Sparkles, Zap, Download, Camera, Upload, Info, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { westflow } from '../services/westflowClient';
import { storageService } from '../services/storageService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import { SignatureStylePicker, renderToDataUrl, getInitials } from './SignatureStylePicker';

type SigningStatus = 'pending' | 'placing' | 'signing' | 'signed' | 'countersigned' | 'error';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

export const MediaViewerModal: React.FC = () => {
    const { 
        activeMediaUrl, 
        closeMedia, 
        addToast, 
        triggerSuccessFeedback, 
        currentHire, 
        currentHireId, 
        persona,
        triggerHubRefresh
    } = useAppContext();

    const [isLoaded, setIsLoaded] = useState(false);
    const [fileName, setFileName] = useState('');
    const [showSigningTools, setShowSigningTools] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [signName, setSignName] = useState('');
    const [acknowledged, setAcknowledged] = useState({ popia: false, accuracy: false });
    const [signingMode, setSigningMode] = useState<'digital' | 'scan'>('digital');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // New UX State
    const [scrollProgress, setScrollProgress] = useState(0);
    const [hasReadDocument, setHasReadDocument] = useState(false);
    const [showSigningPanel, setShowSigningPanel] = useState(false);
    const docContainerRef = useRef<HTMLDivElement>(null);
    
    const [signingStatus, setSigningStatus] = useState<SigningStatus>('pending');
    const [contractResult, setContractResult] = useState<any>(null);

    // ─── SIGNATURE STYLE PICKER STATE ───
    const [signatureImageData, setSignatureImageData] = useState<string | null>(null);
    const [initialsImageData, setInitialsImageData] = useState<string | null>(null);
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

    const personaRef = useRef(persona);
    personaRef.current = persona;

    const isInOnboardingFlow = window.location.hash.includes('onboard') || !!(window as any).__AivaOnboarding;
    const isManagerPersona = persona === 'manager' && !isInOnboardingFlow;

    const hireId = useMemo(() => {
        return currentHireId || currentHire?.id || null;
    }, [currentHireId, currentHire?.id]);

    const initializedUrlRef = useRef<string | null>(null);

    const checkExistingContract = useCallback(async (id: string) => {
        if (!id || !UUID_REGEX.test(id)) return;
        try {
            const result = await westflow.getHireDetails(id);
            if (result.success && result.data) {
                const hireData = result.data;
                const contractStatus = hireData.metadata?.contract_status?.toLowerCase();
                if (contractStatus === 'countersigned') {
                    setSigningStatus('countersigned');
                } else if (contractStatus === 'signed') {
                    setSigningStatus('signed');
                }
                setContractResult(hireData);
            }
        } catch (e) {
            console.warn("[MediaViewer] Status check complete.");
        }
    }, []);

    const isPdf = useMemo(() => activeMediaUrl?.toLowerCase().includes('.pdf') || false, [activeMediaUrl]);
    
    const fileNameLower = fileName.toLowerCase();
    const urlLower = (activeMediaUrl || '').toLowerCase();
    
    const isContractDoc = fileNameLower.includes('employment contract') || fileNameLower.includes('template_3') || urlLower.includes('employment%20contract') || urlLower.includes('template_3') || urlLower.includes('/contracts/') || fileNameLower.includes('_signed_') || fileNameLower.includes('_countersigned_');
    
    const isOfferDoc = fileNameLower.includes('offer to employ') || fileNameLower.includes('v2_1') || urlLower.includes('offer%20to%20employ') || urlLower.includes('v2_1');
    const isPolicyDoc = fileNameLower.includes('commission') || fileNameLower.includes('job description') || fileNameLower.includes('performance') || urlLower.includes('commission') || urlLower.includes('job_description') || urlLower.includes('performance');

    useEffect(() => {
        if (!activeMediaUrl || activeMediaUrl === initializedUrlRef.current) return;
        initializedUrlRef.current = activeMediaUrl;

        setIsLoaded(false);
        setHasReadDocument(false);
        setScrollProgress(0);
        setShowSigningPanel(false);
        
        const parts = activeMediaUrl.split('/');
        const name = decodeURIComponent(parts[parts.length - 1]).split('?')[0];
        setFileName(name);
        
        const inOnboarding = window.location.hash.includes('onboard') || !!(window as any).__AivaOnboarding;
        const isManager = personaRef.current === 'manager' && !inOnboarding;
        
        if (isOfferDoc) {
            setSignName(currentHire?.staff_name || '');
        } else if (isManager && isContractDoc) {
            setSignName('Deon Boshoff');
        } else {
            setSignName(currentHire?.staff_name || '');
        }
        
        setAcknowledged({ popia: false, accuracy: false });
        setSignatureImageData(null);
        setInitialsImageData(null);
        setSelectedStyleId(null);
        setSigningStatus('pending');
        setContractResult(null);
        setSigningMode('digital');
        
        const toolsAvailable = isContractDoc || isOfferDoc || isPolicyDoc;
        setShowSigningTools(toolsAvailable);

        if (isContractDoc && hireId && UUID_REGEX.test(hireId)) {
            checkExistingContract(hireId);
        }
    }, [activeMediaUrl, hireId, currentHire?.staff_name, checkExistingContract, isContractDoc, isOfferDoc, isPolicyDoc]);

    // PDF Auto-Unlock Logic
    useEffect(() => {
        if (!showSigningTools || !isLoaded || signingStatus === 'countersigned') return;
        
        if (isPdf) {
            const delay = isOfferDoc ? 8000 : isContractDoc ? 10000 : 5000;
            const timer = setTimeout(() => setHasReadDocument(true), delay);
            return () => clearTimeout(timer);
        }
    }, [showSigningTools, isLoaded, isPdf, isOfferDoc, isContractDoc, signingStatus]);

    const handleDocScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if (isPdf) return; // Cannot track iframe scroll
        const el = e.currentTarget;
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
        setScrollProgress(isNaN(progress) ? 0 : Math.min(progress, 1));
        if (progress > 0.85) setHasReadDocument(true);
    }, [isPdf]);

    const generateSignatureCertificate = async (name: string, title: string, hash: string): Promise<Blob> => {
        const doc = new jsPDF();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("DIGITAL SIGNATURE CERTIFICATE", 20, 25);
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.text(`AIVA Digital Signing v1.0 | Document: ${fileName}`, 20, 35);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text("SIGNING SUMMARY", 20, 60);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const summary = `This certificate confirms the digital signing of the contract: ${fileName}. Identity verified through AIVA Digital Signing.`;
        doc.text(doc.splitTextToSize(summary, 170), 20, 70);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, 100, 170, 80, 5, 5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.text("SIGNATORY DETAILS", 30, 115);
        doc.setFont('helvetica', 'normal');
        doc.text(`Legal Name: ${name}`, 30, 125);
        doc.text(`Designation: ${title}`, 30, 135);
        doc.text(`Company: Nashua Paarl & West Coast`, 30, 145);
        doc.text(`Timestamp: ${new Date().toLocaleString('en-ZA')}`, 30, 155);
        doc.text(`Reference: ${hash}`, 30, 165);

        doc.setFontSize(30);
        doc.setFont('courier', 'italic');
        doc.setTextColor(30, 58, 138);
        doc.text(name, 30, 220);
        
        doc.setDrawColor(30, 58, 138);
        doc.line(30, 225, 120, 225);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("OFFICIAL DIGITAL SIGNATURE", 30, 230);
        
        doc.setFontSize(7);
        doc.text("AIVA Digital Signing • Nashua Paarl", 105, 285, { align: 'center' });

        return doc.output('blob');
    };

    const embedSignatureOnPdf = async (
        sourcePdfUrl: string,
        signerName: string,
        signerRole: string,
        docHash: string,
        signatureImg?: string | null,
        initialsImg?: string | null
    ): Promise<Blob> => {
        const existingPdfBytes = await fetch(sourcePdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];
        const { width, height } = lastPage.getSize();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const courier = await pdfDoc.embedFont(StandardFonts.Courier);
        const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
        const isCountersign = signerRole === 'Managing Director';
        const sigX = isCountersign ? width / 2 + 40 : 50;
        const sigBaseY = 120;

        // ── Embed signature image or typed fallback ──────────────────────────
        if (signatureImg) {
            try {
                const base64 = signatureImg.replace(/^data:image\/png;base64,/, '');
                const sigBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                const sigImage = await pdfDoc.embedPng(sigBytes);
                const sigDims = sigImage.scale(0.45);
                lastPage.drawImage(sigImage, {
                    x: sigX,
                    y: sigBaseY + 55,
                    width: Math.min(sigDims.width, 220),
                    height: Math.min(sigDims.height, 65),
                });
            } catch {
                lastPage.drawText(signerName, { x: sigX + 10, y: sigBaseY + 68, size: 22, font: helveticaBold, color: rgb(0.05, 0.15, 0.45) });
            }
        } else {
            lastPage.drawText(signerName, { x: sigX + 10, y: sigBaseY + 68, size: 22, font: helveticaBold, color: rgb(0.05, 0.15, 0.45) });
        }

        lastPage.drawLine({ start: { x: sigX, y: sigBaseY + 52 }, end: { x: sigX + 200, y: sigBaseY + 52 }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
        lastPage.drawText(signerName,  { x: sigX, y: sigBaseY + 38, size: 8, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
        lastPage.drawText(signerRole,  { x: sigX, y: sigBaseY + 27, size: 8, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
        lastPage.drawText(`Date: ${timestamp}`, { x: sigX, y: sigBaseY + 16, size: 7, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
        lastPage.drawText(`Ref: ${docHash}`, { x: sigX, y: sigBaseY + 5, size: 6, font: courier, color: rgb(0.5, 0.5, 0.5) });

        const badgeY = sigBaseY - 10;
        lastPage.drawRectangle({ x: sigX, y: badgeY, width: 130, height: 14, color: rgb(0.05, 0.58, 0.53), borderColor: rgb(0.04, 0.49, 0.45), borderWidth: 0.5 });
        lastPage.drawText('✓ DIGITALLY SIGNED - AIVA', { x: sigX + 5, y: badgeY + 3, size: 7, font: helveticaBold, color: rgb(1, 1, 1) });

        if (!isCountersign) {
            lastPage.drawText('Nashua Paarl & West Coast | ECTA 2002 | POPIA 2013', { x: width / 2 - 110, y: 20, size: 6, font: helvetica, color: rgb(0.6, 0.6, 0.6) });
        }

        // ── Stamp initials on every page except last (multi-page docs) ───────
        if (initialsImg && pages.length > 1) {
            try {
                const base64Init = initialsImg.replace(/^data:image\/png;base64,/, '');
                const initBytes = Uint8Array.from(atob(base64Init), c => c.charCodeAt(0));
                const initImage = await pdfDoc.embedPng(initBytes);
                const initDims = initImage.scale(0.28);
                for (let i = 0; i < pages.length - 1; i++) {
                    const pg = pages[i];
                    const { width: pw } = pg.getSize();
                    pg.drawImage(initImage, { x: pw - initDims.width - 24, y: 18, width: initDims.width, height: initDims.height });
                    pg.drawText(new Date().toLocaleDateString('en-ZA'), { x: pw - initDims.width - 24, y: 13, size: 5, font: helvetica, color: rgb(0.6, 0.6, 0.6) });
                }
            } catch (e) { console.warn('[PDF] Initials embed failed:', e); }
        }

        if (isCountersign) {
            const firstPage = pages[0];
            firstPage.drawText('FULLY EXECUTED', { x: width / 2 - 80, y: height - 30, size: 12, font: helveticaBold, color: rgb(0.05, 0.58, 0.53) });
            firstPage.drawText(`${timestamp} — Both parties signed`, { x: width / 2 - 80, y: height - 42, size: 7, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes as any], { type: 'application/pdf' });
    };

    const handleDigitalExecute = async () => {
        if (!hireId || !UUID_REGEX.test(hireId)) {
            addToast("Invalid link. Please try again.", "error");
            return;
        }

        setIsExecuting(true);
        try {
            const docHash = `AIVA-SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const role = isManagerPersona ? 'Managing Director' : 'Employee';
            
            // Determine source PDF: template for employee, signed copy for manager
            const CONTRACT_TEMPLATE = 'https://storage.googleapis.com/gemynd-public/projects/aiva/Employment%20Contract%20Template_3.pdf';
            let sourcePdfUrl: string;
            if (isManagerPersona && isContractDoc) {
                // Use activeMediaUrl only if valid — reject paths containing /documents/ (stale bad data)
                sourcePdfUrl = (activeMediaUrl && !activeMediaUrl.includes('/documents/') && activeMediaUrl.includes('storage.googleapis.com')) 
                    ? activeMediaUrl 
                    : CONTRACT_TEMPLATE;
            } else if (isOfferDoc) {
                sourcePdfUrl = 'https://storage.googleapis.com/gemynd-public/projects/aiva/Offer%20to%20Employ%202019%20V2_1.pdf';
            } else if (isPolicyDoc) {
                sourcePdfUrl = activeMediaUrl!;
            } else {
                sourcePdfUrl = CONTRACT_TEMPLATE;
            }

            const pdfBlob = await embedSignatureOnPdf(sourcePdfUrl, signName, role, docHash, signatureImageData, initialsImageData);
            const sigFileName = `${isManagerPersona ? 'countersigned' : 'signed'}_${Date.now()}.pdf`;
            
            const uploadResult = await storageService.uploadFile(
                pdfBlob, 
                sigFileName, 
                'contracts',
                {
                    hire_id: hireId,
                    type: 'signed_contract',
                    hash: docHash,
                    signature_method: 'digital'
                },
                {
                    hireId: hireId,
                    documentType: 'contracts',
                    appId: 'aiva'
                }
            );

            // Also upload standalone signature certificate for audit trail
            try {
                const certBlob = await generateSignatureCertificate(signName, role, docHash);
                const certFileName = `${isManagerPersona ? 'countersign' : 'sign'}_certificate_${Date.now()}.pdf`;
                await storageService.uploadFile(
                    certBlob,
                    certFileName,
                    'certificates',
                    { hire_id: hireId, type: 'signature_certificate', hash: docHash },
                    { hireId: hireId, documentType: 'certificates', appId: 'aiva' }
                );
            } catch (certErr) {
                console.warn('[MediaViewer] Certificate upload skipped:', certErr);
            }

            const onboardingBridge = (window as any).__AivaOnboarding;

            if (isOfferDoc) {
                try {
                    const getResp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                    const currentData = await getResp.json();
                    const currentMeta = currentData?.[0]?.metadata || {};

                    await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                        method: 'PATCH',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            metadata: {
                                ...currentMeta,
                                documents: {
                                    ...(currentMeta.documents || {}),
                                    offer: {
                                        status: 'signed',
                                        signed_url: uploadResult.publicUrl,
                                        signature_method: 'digital',
                                        signed_at: new Date().toISOString()
                                    }
                                }
                            }
                        })
                    });
                } catch (e) {
                    console.warn('[MediaViewer] Metadata save skipped:', e);
                }

                const result = await westflow.advanceOnboardingStep(hireId, 2);
                if (result.success) {
                    setSigningStatus('signed');
                    triggerSuccessFeedback("Offer Accepted.");
                    if (onboardingBridge?.completeStep) onboardingBridge.completeStep('step1');
                    closeMedia();
                }
            } else if (isPolicyDoc) {
                let docKey = '';
                if (fileNameLower.includes('commission')) docKey = 'commission_manual';
                if (fileNameLower.includes('job description')) docKey = 'job_description';
                if (fileNameLower.includes('performance')) docKey = 'performance_policy';

                setSigningStatus('signed');
                triggerSuccessFeedback(`${fileName} Acknowledged.`);
                if (onboardingBridge?.completeStep) onboardingBridge.completeStep(`step5_${docKey}`);
                setTimeout(closeMedia, 1500);
            } else if (isManagerPersona && isContractDoc) {
                // Try orchestrator first, but don't gate on it
                let orchSuccess = false;
                try {
                    const result = await westflow.countersignContract(hireId, signName, uploadResult.publicUrl);
                    orchSuccess = !!result?.success;
                } catch (orchErr) {
                    console.warn('[MediaViewer] Orchestrator countersign failed, using direct patch:', orchErr);
                }

                // Always patch Supabase directly — this is the source of truth
                try {
                    const getResp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                    const currentData = await getResp.json();
                    const currentMeta = currentData?.[0]?.metadata || {};

                    const patchResp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                            method: 'PATCH',
                            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                            body: JSON.stringify({
                                metadata: {
                                    ...currentMeta,
                                    contract_status: 'countersigned',
                                    countersigned_pdf_path: uploadResult.publicUrl,
                                    countersigned_at: new Date().toISOString(),
                                    countersigned_by: signName
                                },
                                status: 'COMPLETED'
                            })
                        }
                    );
                    if (!patchResp.ok) throw new Error(`Patch failed: ${patchResp.status}`);
                } catch (metaErr) {
                    console.error('[MediaViewer] Countersign patch failed:', metaErr);
                }
                
                setSigningStatus('countersigned');
                triggerSuccessFeedback("Contract Countersigned.");
                triggerHubRefresh();

                // ── Send WhatsApp congratulations to employee ──────────────
                try {
                    const getResp2 = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata,staff_name`, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                    const hireRows = await getResp2.json();
                    const hireMeta = hireRows?.[0]?.metadata || {};
                    const empPhone = hireMeta?.phone_number || hireMeta?.cell_phone || hireMeta?.phone;
                    const empName = hireMeta?.first_names
                        ? `${hireMeta.first_names} ${hireMeta.surname || ''}`.trim()
                        : hireRows?.[0]?.staff_name || 'Employee';

                    if (empPhone) {
                        await fetch(`https://westflow-platform-608887102507.us-west1.run.app/api/westflow/aiva/send_whatsapp_notification`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                phone: empPhone,
                                message: `🎉 Welcome to the Nashua family, ${empName}!\n\nYour employment contract has been fully executed and countersigned by ${signName}.\n\nYou are officially a member of the Nashua Paarl & West Coast team. We look forward to great things ahead!\n\n— Nashua Paarl & West Coast`
                            })
                        });
                    }
                } catch (waErr) {
                    console.warn('[MediaViewer] Employee WhatsApp notification failed:', waErr);
                }

                // Close modal after short delay so Deon sees the success state
                setTimeout(() => {
                    setShowSigningPanel(false);
                    closeMedia();
                }, 2000);
            } else {
                const result = await westflow.signContractDigital(hireId, signName, uploadResult.publicUrl, 'digital');
                if (result.success) {
                    try {
                        const getResp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`, {
                            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                        });
                        const currentData = await getResp.json();
                        const currentMeta = currentData?.[0]?.metadata || {};

                        await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                                method: 'PATCH',
                                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    metadata: {
                                        ...currentMeta,
                                        contract_status: 'signed',
                                        signed_pdf_path: uploadResult.publicUrl,
                                        contract_signed_at: new Date().toISOString(),
                                        contract_signed_by: signName
                                    }
                                })
                            }
                        );
                        // Notify group — contract ready to countersign
                        try {
                            const hireName = currentMeta?.first_names
                                ? `${currentMeta.first_names} ${currentMeta.surname || ''}`.trim()
                                : signName;
                            const position = currentMeta?.job_description || currentMeta?.position || 'Staff Member';
                            await fetch(`https://westflow-platform-608887102507.us-west1.run.app/api/westflow/aiva/send_whatsapp_notification`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    phone: '120363423479055395@g.us',
                                    message: `✍️ Contract Ready to Countersign!\n\n*${hireName}* (${position}) has signed their employment contract.\n\nPlease log in to countersign:\n${window.location.origin}\n\nThis completes their onboarding.`
                                })
                            });
                        } catch (notifyErr) {
                            console.warn('[MediaViewer] Manager notify failed:', notifyErr);
                        }
                    } catch (metaErr) {
                        console.warn('[MediaViewer] Failed to save signed PDF path:', metaErr);
                    }
                    
                    setSigningStatus('signed');
                    triggerSuccessFeedback("Contract Signed.");
                    if (onboardingBridge?.completeStep) onboardingBridge.completeStep('step6');
                }
            }
            setShowSigningPanel(false);
        } catch (e: any) {
            addToast(`Signing failed: ${e.message}`, "error");
        } finally {
            setIsExecuting(false);
        }
    };

    const handleScannedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!hireId) return;

        setIsExecuting(true);
        try {
            const ext = file.name.split('.').pop();
            const fileNameStored = `${fileName.replace(/\s/g, '_')}_scanned_${Date.now()}.${ext}`;
            const uploadResult = await storageService.uploadFile(file, fileNameStored, 'scans', {
                hire_id: hireId,
                type: 'scanned_document',
            }, {
                hireId: hireId,
                documentType: 'scans',
                appId: 'aiva'
            });

            const onboardingBridge = (window as any).__AivaOnboarding;

            const result = await westflow.signContractDigital(hireId, 'Scanned Manual Signature', uploadResult.publicUrl, 'scanned');
            if (result.success) {
                try {
                    const getResp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`, {
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                    });
                    const currentData = await getResp.json();
                    const currentMeta = currentData?.[0]?.metadata || {};

                    await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                        method: 'PATCH',
                        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            metadata: {
                                ...currentMeta,
                                signed_pdf_path: uploadResult.publicUrl,
                                contract_signed_at: new Date().toISOString(),
                                signature_method: 'scanned'
                            }
                        })
                    });
                } catch (e) {
                    console.warn('[MediaViewer] Metadata save skipped:', e);
                }
                setSigningStatus('signed');
                triggerSuccessFeedback("Scanned Contract Uploaded.");
                if (onboardingBridge?.completeStep) onboardingBridge.completeStep('step6');
                setShowSigningPanel(false);
            }
        } catch (e: any) {
            addToast("Scanned upload failed.", "error");
        } finally {
            setIsExecuting(false);
        }
    };

    if (!activeMediaUrl) return null;

    const isActuallySaved = signingStatus === 'signed' || signingStatus === 'countersigned';
    const canPersonaSignCurrentDoc = isOfferDoc || isPolicyDoc
        ? !isActuallySaved
        : isManagerPersona
            ? (isContractDoc && signingStatus === 'signed')
            : isContractDoc && !isActuallySaved;

    const actionButtonText = isExecuting 
        ? 'Signing...' 
        : isOfferDoc
            ? 'ACCEPT OFFER'
            : isPolicyDoc
                ? 'ACKNOWLEDGE POLICY'
                : isManagerPersona 
                    ? 'COUNTERSIGN CONTRACT' 
                    : 'SIGN CONTRACT';

    const buttonColorClass = (isOfferDoc || isPolicyDoc)
        ? 'bg-[#0d9488] border-[#0a7c72] hover:brightness-110 shadow-[0_10px_30px_rgba(13,148,136,0.3)]'
        : isManagerPersona 
            ? 'bg-amber-500 border-amber-700 hover:brightness-110 shadow-[0_10px_30px_rgba(245,158,11,0.3)]'
            : 'bg-brand-primary border-blue-950 hover:brightness-110 shadow-[0_10px_30_rgba(15,23,42,0.3)]';

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[95vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 relative">
                
                <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight truncate max-w-md">{fileName}</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Document Preview</p>
                        </div>
                    </div>
                    <button onClick={closeMedia} className="p-3 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    
                    {showSigningTools && !isActuallySaved && (
                        <div className="h-1 bg-slate-200 dark:bg-slate-800 shrink-0">
                            <div 
                                className="h-full bg-[#0d9488] transition-all duration-300"
                                style={{ width: `${isPdf ? (hasReadDocument ? 100 : 0) : scrollProgress * 100}%` }}
                            />
                        </div>
                    )}

                    <div 
                        ref={docContainerRef}
                        className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-auto flex items-center justify-center p-4"
                        onScroll={handleDocScroll}
                    >
                        {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100 dark:bg-slate-950">
                                <div className="w-12 h-12 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        
                        {isPdf ? (
                            <iframe 
                                src={`${(() => {
                                    const CONTRACT_TEMPLATE_URL = 'https://storage.googleapis.com/gemynd-public/projects/aiva/Employment%20Contract%20Template_3.pdf';
                                    if (!isContractDoc) return activeMediaUrl;
                                    // For contracts: only use activeMediaUrl if it doesn't contain 'documents/' (bad path from old data)
                                    if (activeMediaUrl && !activeMediaUrl.includes('/documents/') && activeMediaUrl.includes('storage.googleapis.com')) return activeMediaUrl;
                                    return CONTRACT_TEMPLATE_URL;
                                })()}#toolbar=0`} 
                                className="w-full h-full rounded-2xl shadow-inner bg-white"
                                onLoad={() => setIsLoaded(true)}
                                title="Document Viewer"
                            />
                        ) : (
                            <img 
                                src={activeMediaUrl} 
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
                                onLoad={() => setIsLoaded(true)} 
                                alt="Document" 
                            />
                        )}
                    </div>

                    {showSigningTools && !showSigningPanel && canPersonaSignCurrentDoc && (
                        <div className="shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 z-30">
                            {hasReadDocument ? (
                                <button 
                                    onClick={() => setShowSigningPanel(true)}
                                    className={`w-full py-4 ${isManagerPersona && isContractDoc && signingStatus === 'signed' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-[#0d9488] shadow-[#0d9488]/20'} text-white font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg animate-slide-up-fade`}
                                >
                                    <Signature className="w-4 h-4" />
                                    {isOfferDoc ? 'READY TO ACCEPT OFFER' : isPolicyDoc ? 'READY TO ACKNOWLEDGE' : isManagerPersona ? 'READY TO COUNTERSIGN' : 'READY TO SIGN'}
                                </button>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <EyeIcon className="w-3.5 h-3.5" />
                                        {isPdf ? 'Please review the full document' : 'Scroll to review the full document'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {showSigningTools && isActuallySaved && !canPersonaSignCurrentDoc && !showSigningPanel && (
                        <div className="shrink-0 p-4 bg-emerald-50 dark:bg-emerald-500/10 border-t border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between z-30">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                    {signingStatus === 'countersigned' ? 'VERIFIED' : 'AWAITING SIGNATURE'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {contractResult?.metadata?.signed_pdf_path && (
                                    <a 
                                        href={contractResult.metadata.signed_pdf_path} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5 flex items-center gap-2"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download Signed Copy
                                    </a>
                                )}
                                <button onClick={closeMedia} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {showSigningPanel && (
                        <div className="absolute inset-0 z-[40] flex items-end">
                            <div 
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
                                onClick={() => setShowSigningPanel(false)} 
                            />
                            
                            <div className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.3)] animate-slide-up-fade overflow-y-auto z-50 border-t border-white/10">
                                <div className="flex justify-center pt-4 pb-2">
                                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                </div>

                                <div className="p-8 md:p-12 space-y-8 max-w-2xl mx-auto">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-[1.5rem] border ${
                                            isManagerPersona && signingStatus === 'signed' 
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                                : 'bg-[#0d9488]/10 text-[#0d9488] border-[#0d9488]/20'
                                        }`}>
                                            <Signature className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xl italic">
                                                {isManagerPersona && isContractDoc && signingStatus === 'signed' 
                                                    ? 'Countersign Contract' 
                                                    : isOfferDoc 
                                                        ? 'Accept Offer' 
                                                        : isPolicyDoc
                                                            ? 'Acknowledge Document'
                                                            : 'Sign Contract'}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">
                                                Digital Signing
                                            </p>
                                        </div>
                                    </div>

                                    {!isPolicyDoc && (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    {isManagerPersona ? 'Authorized Signatory' : 'Full Legal Name'}
                                                </label>
                                                <div className="relative">
                                                    <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    <input 
                                                        type="text"
                                                        value={signName}
                                                        onChange={(e) => {
                                                            setSignName(e.target.value);
                                                            setSignatureImageData(null);
                                                            setInitialsImageData(null);
                                                            setSelectedStyleId(null);
                                                        }}
                                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl font-black italic text-xl text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all shadow-inner"
                                                        placeholder="Type your full name"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            {/* ─── SIGNATURE STYLE PICKER ─── */}
                                            {signName.length > 2 && (
                                                <SignatureStylePicker
                                                    name={signName}
                                                    defaultStyleId={selectedStyleId || undefined}
                                                    onConfirm={({ signatureDataUrl, initialsDataUrl, styleId }) => {
                                                        setSignatureImageData(signatureDataUrl);
                                                        setInitialsImageData(initialsDataUrl);
                                                        setSelectedStyleId(styleId);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {isPolicyDoc && (
                                        <div className="p-6 bg-[#0d9488]/5 rounded-3xl border border-[#0d9488]/10 space-y-4">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                By acknowledging, you confirm that you have read and understood 
                                                this document and agree to comply with its terms.
                                            </p>
                                            <div className="flex items-center gap-3 pt-2 border-t border-[#0d9488]/10">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                    <UserCheck className="w-4 h-4 text-[#0d9488]" />
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    Signing as: <span className="text-[#0d9488]">{currentHire?.staff_name || 'Employee'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="flex items-start gap-4 cursor-pointer group p-2 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                            <input 
                                                type="checkbox" 
                                                checked={acknowledged.popia} 
                                                onChange={(e) => setAcknowledged({...acknowledged, popia: e.target.checked})} 
                                                className="mt-1 w-6 h-6 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]" 
                                            />
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-snug group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                I consent to secure digital processing per POPIA.
                                            </span>
                                        </label>
                                        <label className="flex items-start gap-4 cursor-pointer group p-2 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                                            <input 
                                                type="checkbox" 
                                                checked={acknowledged.accuracy} 
                                                onChange={(e) => setAcknowledged({...acknowledged, accuracy: e.target.checked})} 
                                                className="mt-1 w-6 h-6 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]" 
                                            />
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-snug group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                {isPolicyDoc 
                                                    ? 'I have read and understood this document.'
                                                    : 'I confirm these details match my legal record.'}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="space-y-6 pt-4">
                                        <button 
                                            onClick={handleDigitalExecute} 
                                            disabled={isExecuting || (!isPolicyDoc && signName.length < 3) || !acknowledged.popia || !acknowledged.accuracy || (!isPolicyDoc && !isManagerPersona && !signatureImageData)}
                                            className={`w-full py-6 text-white font-black rounded-[2rem] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm border-b-4 disabled:opacity-30 disabled:grayscale ${buttonColorClass}`}
                                        >
                                            {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Signature className="w-6 h-6" />}
                                            {isPolicyDoc ? 'ACKNOWLEDGE' : actionButtonText}
                                        </button>

                                        {!isPolicyDoc && !isManagerPersona && (
                                            <div className="text-center">
                                                <button 
                                                    onClick={() => { setSigningMode('scan'); setShowSigningPanel(true); }}
                                                    className="text-[11px] font-black text-slate-400 hover:text-[#0d9488] underline underline-offset-8 decoration-slate-300 hover:decoration-[#0d9488] transition-all uppercase tracking-widest"
                                                >
                                                    Already have a signed paper copy? Upload it
                                                </button>
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={() => setShowSigningPanel(false)}
                                            className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
                .font-handwriting { font-family: 'Caveat', cursive; }
                
                @keyframes slide-up-fade {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up-fade { animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};