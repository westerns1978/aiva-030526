import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    RefreshIcon,
    AiSparkIcon,
    ChartBarIcon,
    TrendingUpIcon,
    ShieldCheckIcon,
    CloseIcon,
} from './icons';
import { westflow } from '../services/westflowClient';
import { stampCountersignature } from '../utils/pdfStamper';
import { useAppContext } from '../context/AppContext';

const GROUP_JID = '120363423479055395@g.us'; // Aiva Testing Crew — Dan, Deon, Derek
const MANAGER_PHONES: Record<string, string> = {
    'PW293':  GROUP_JID,
    'GEM001': GROUP_JID,
    'GEM002': GROUP_JID,
    'default': GROUP_JID,
};
import { Activity, Zap, Clock, Loader2, MessageSquare, LayoutDashboard, Archive, Send, FileText, CheckCircle2, ChevronRight, Info, AlertTriangle, ArrowUpRight, DollarSign, UserCheck, Smartphone, AlertCircle, Sparkles, User, BadgeAlert, Users, TrendingUp, ArrowRight, Bell, Eye, ShieldCheck } from 'lucide-react';
import { OnboardingPipeline } from './OnboardingPipeline';
import { QrCodeGenerator } from './QrCodeGenerator';
import { FileManager } from './FileManager';
import { DocumentChecklist } from './DocumentChecklist';

import { realtimeService } from '../services/realtimeService';
import { telemetryService } from '../services/telemetryService';

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

type HubTab = 'matrix' | 'induction' | 'dispatch' | 'vault';

const STEP_LABELS = ['Offer Acceptance', 'ID Verification', 'Proof of Residence', 'Banking Details', 'Policy Packets', 'Employment Contract', 'Final Review'];
const STEP_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1', '#10b981'];

const LiveMetric: React.FC<{ 
    value: number | string; 
    label: string; 
    accent: string; 
    icon: any;
    sublabel?: string;
    pulse?: boolean;
    onClick?: () => void;
}> = ({ value, label, accent, icon: Icon, sublabel, pulse, onClick }) => (
    <button onClick={onClick} className="relative group text-left w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-white/5 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
                    <Icon className="w-5 h-5" />
                </div>
                {pulse && (
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75" style={{ backgroundColor: accent }}></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: accent }}></span>
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFeatureSettings: '"tnum"' }}>{value}</p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                {sublabel && <p className="text-[10px] text-slate-400">{sublabel}</p>}
            </div>
        </div>
    </button>
);

const PipelineBar: React.FC<{ steps: number[]; total: number }> = ({ steps, total }) => {
    if (total === 0) return null;
    return (
        <div className="space-y-3">
            <div className="flex rounded-full overflow-hidden h-3 bg-slate-100 dark:bg-white/5">
                {steps.map((count, i) => {
                    const pct = (count / Math.max(total, 1)) * 100;
                    if (pct === 0) return null;
                    return (
                        <div key={i} className="transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: STEP_COLORS[i] }} title={`${STEP_LABELS[i]}: ${count}`} />
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {steps.map((count, i) => count > 0 && (
                    <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STEP_COLORS[i] }} />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{STEP_LABELS[i]}: {count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HireRow: React.FC<{ 
    hire: any; 
    formatTime: (t: string) => string;
    onAction: () => void;
    actionLabel: string;
    variant?: 'default' | 'warning' | 'success';
}> = ({ hire, formatTime, onAction, actionLabel, variant = 'default' }) => {
    const stepLabel = STEP_LABELS[(hire.step_reached || 1) - 1] || 'Unknown';
    const borderColor = variant === 'warning' ? 'border-l-amber-500' : variant === 'success' ? 'border-l-emerald-500' : 'border-l-transparent';
    const method = hire.metadata?.signature_method;
    
    return (
        <div className={`flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-l-[3px] ${borderColor} group`}>
            <div className="flex items-center gap-3 min-w-0">
                {hire.metadata?.profile_photo_url ? (
                    <img src={hire.metadata.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0 border border-slate-200 dark:border-white/5">
                        {hire.staff_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{hire.staff_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Step {hire.step_reached}: {stepLabel}</span>
                        {method && (
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest ${method === 'scanned' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {method}
                            </span>
                        )}
                        <span className="text-[10px] text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(hire.updated_at || hire.created_at)}</span>
                    </div>
                </div>
            </div>
            <button onClick={onAction} className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all opacity-0 group-hover:opacity-100 shrink-0 ${variant === 'warning' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-900 dark:bg-brand-primary text-white hover:bg-slate-800'}`}>
                {actionLabel}
            </button>
        </div>
    );
};

const ActivityItem: React.FC<{ item: any; formatTime: (t: string) => string }> = ({ item, formatTime }) => {
    const isContract = item.content?.toLowerCase().includes('contract');
    const isOutbound = item.direction === 'outbound';
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-50 dark:border-white/5 last:border-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isContract ? 'bg-purple-50 text-purple-500 dark:bg-purple-500/10' : isOutbound ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-blue-50 text-blue-500 dark:bg-blue-500/10'}`}>
                {isContract ? <FileText className="w-3.5 h-3.5" /> : isOutbound ? <Send className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.user_identifier || 'System'}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatTime(item.created_at)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.content || 'Session synced'}</p>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void; badge?: number }> = ({ icon: Icon, label, active, onClick, badge }) => (
    <button onClick={onClick} className={`px-5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all text-[11px] font-semibold tracking-wide relative ${active ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'}`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#0d9488] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1">{badge}</span>
        )}
    </button>
);

export const ManagerHub: React.FC = () => {
    const { addToast, triggerSuccessFeedback, hubActiveTab, setHubActiveTab, hubFilter, setHubFilter, focusedHireId, setFocusedHireId, hubRefreshKey, openMedia, triggerHubRefresh, setCurrentHireId, currentUser } = useAppContext();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    
    const fetchDashboardData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [pipelineRes, activityRes] = await Promise.all([
                westflow.getOnboardingPipeline(),
                telemetryService.getConversationLogs('AIVA', 15)
            ]);
            if (pipelineRes.success) setPipeline((pipelineRes.pipeline || []).filter((h: any) => h.status !== 'demo_archived'));
            setActivity(activityRes || []);
            setLastUpdated(0);
        } catch (e) { 
            addToast("Sync unstable.", "warning"); 
        } finally { 
            setIsRefreshing(false); 
        }
    }, [addToast]);

    useEffect(() => { 
        fetchDashboardData(); 
        
        // Real-time subscriptions
        const unsubscribePipeline = realtimeService.subscribeToPipeline(() => {
            fetchDashboardData();
        });
        
        const unsubscribeActivity = realtimeService.subscribeToActivity(() => {
            fetchDashboardData();
        });

        const timer = setInterval(() => setLastUpdated(prev => prev + 1), 1000);
        return () => { 
            unsubscribePipeline();
            unsubscribeActivity();
            clearInterval(timer); 
        };
    }, [fetchDashboardData]);

    useEffect(() => {
        if (hubRefreshKey > 0) fetchDashboardData();
    }, [hubRefreshKey, fetchDashboardData]);

    const countersignList = useMemo(() => {
        return pipeline.filter((h: any) => {
            if (h.status === 'demo_archived') return false;
            const contractStatus = h.metadata?.contract_status?.toLowerCase();
            const countersignedAt = h.metadata?.countersigned_at;
            return contractStatus === 'signed' && !countersignedAt;
        });
    }, [pipeline]);

    const focusedHire = useMemo(() => {
        return pipeline.find(h => h.id === focusedHireId);
    }, [pipeline, focusedHireId]);

    const metrics = useMemo(() => {
        const now = new Date();
        // A hire is only "Fully Onboarded" when the manager has countersigned.
        // Checking countersigned_at prevents the "Attention Needed + Fully Onboarded
        // simultaneously" bug where employee-signed contracts were counted as complete.
        const isCompleted = (h: any) => {
            const contractStatus = h.metadata?.contract_status?.toLowerCase();
            const countersignedAt = h.metadata?.countersigned_at;
            return contractStatus === 'countersigned' && !!countersignedAt;
        };
        const inProgress = pipeline.filter(h => !isCompleted(h)).length;
        const completedCount = pipeline.filter(h => isCompleted(h)).length;
        const stalledList = pipeline.filter(h => {
            if (isCompleted(h)) return false;
            // FIX: Ensure 'updated' is handled as a timestamp number correctly on the next line
            const updated = new Date(h.updated_at || h.created_at).getTime();
            // FIX: Removed unnecessary .getTime() call on 'updated' which is already a number
            const diffHours = (now.getTime() - updated) / (1000 * 60 * 60);
            return diffHours > 24;
        });
        const pipelineSteps = [0, 0, 0, 0, 0, 0, 0];
        pipeline.forEach(h => {
            const step = h.step_reached;
            if (step > 0 && step <= 7) pipelineSteps[step - 1]++;
        });
        const completionRate = pipeline.length > 0 ? Math.round((completedCount / pipeline.length) * 100) : 0;
        return { inProgress, stalledList, stalledCount: stalledList.length, completedCount, pipelineSteps, completionRate, total: pipeline.length };
    }, [pipeline]);

    const formatTimeAgo = (t: string) => {
        if (!t) return '';
        const s = Math.floor((new Date().getTime() - new Date(t).getTime()) / 1000);
        if (s < 60) return 'now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    const handleTabSwitch = (tab: HubTab) => {
        setHubFilter('all');
        setFocusedHireId(null);
        setHubActiveTab(tab);
    }

    const handleResendLink = async (hire: any) => {
        try {
            const phone = hire.phone?.replace(/\D/g, '');
            if (!phone) { addToast('No phone number on file for this hire', 'error'); return; }
            // Re-derive the same deterministic PIN used in QrCodeGenerator
            const hirePin = String(parseInt(hire.id.replace(/-/g, '').slice(-6), 16)).slice(-6).padStart(6, '0');
            const baseUrl = window.location.origin;
            const onboardLink = `${baseUrl}/?session=${hire.id}&pin=${hirePin}`;
            const name = (hire.staff_name || 'Team Member').split(' ')[0];
            const message = `Hi ${name}! 👋 Here's your Nashua Paarl onboarding link:\n\n🔑 PIN: ${hirePin}\n🔗 ${onboardLink}\n\nPick up where you left off — you're on Step ${hire.step_reached} of 8!`;
            await westflow.sendWhatsAppNotification(phone, message);
            triggerSuccessFeedback(`Onboarding link resent to ${hire.staff_name}`);
        } catch (e) {
            addToast('Failed to resend link', 'error');
        }
    };

    // ── Export function — lifted from OnboardingJourney so it runs server-side
    // from ManagerHub immediately after countersign. No employee browser needed.
    const exportOnboardingRecord = async (hireId: string) => {
        try {
            const getResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const data = await getResp.json();
            if (!data || data.length === 0) throw new Error('Hire record not found');
            const hireRecord = data[0];
            const meta = hireRecord.metadata || {};

            if (meta.contract_status !== 'countersigned') {
                console.warn('[export] Skipping — contract not yet countersigned'); return;
            }
            if (meta.export_completed) {
                console.log('[export] Already exported — skipping'); return;
            }

            const empName     = hireRecord.staff_name || 'Employee';
            const employeeNum = hireRecord.id.slice(0, 8).toUpperCase();

            const sageRow = {
                Employee_Number:                employeeNum,
                Surname:                        meta.surname || empName.split(' ').slice(1).join(' ') || '',
                First_Names:                    meta.first_names || empName.split(' ')[0] || '',
                ID_Number:                      meta.identity_number || '',
                Date_Of_Birth:                  meta.date_of_birth || '',
                Residency_Status:               meta.residency_status || '',
                Race_EEA:                       meta.race || '',
                Drivers_Licence:                meta.drivers_licence_number || '',
                Cell_Number:                    hireRecord.phone || meta.cell_number || '',
                Email:                          meta.email_address || '',
                Street_Address:                 meta.home_address_line_1 || '',
                Suburb:                         meta.home_address_suburb || '',
                City:                           meta.home_address_city || '',
                Province:                       meta.home_address_province || '',
                Postal_Code:                    meta.postal_code || '',
                Bank_Name:                      meta.bank_name || '',
                Branch_Name:                    meta.branch_name || '',
                Branch_Code:                    meta.branch_code || '',
                Account_Number:                 meta.account_number || '',
                Account_Type:                   meta.account_type || '',
                Account_Holder:                 meta.account_holder_name || empName,
                Emergency_Contact_Name:         meta.emergency_contact_name || '',
                Emergency_Contact_Phone:        meta.emergency_contact_phone || '',
                Emergency_Contact_Relationship: meta.emergency_contact_relationship || '',
                Tax_Number:                     meta.income_tax_number || '',
                Start_Date:                     meta.start_date || new Date().toISOString().split('T')[0],
                Position:                       meta.job_description || 'Sales Executive',
                Department:                     'Sales',
                Branch:                         meta.branch || 'Nashua Paarl & West Coast',
                Employment_Status:              'Active',
                Contract_Status:                'Countersigned',
                Countersigned_By:               meta.countersigner_name || 'Deon Boshoff',
                Countersigned_At:               meta.countersigned_at || new Date().toISOString(),
                Onboarding_Completed_At:        new Date().toISOString(),
                AIVA_Hire_ID:                   hireRecord.id,
            };

            const csvContent = [
                Object.keys(sageRow).join(','),
                Object.values(sageRow).map(v => `"${String(v ?? '').replace(/"/g, '\'\'')}"`).join(','),
            ].join('\n');

            const csvPath = `hr-exports/${hireId}/sage_export.csv`;
            await fetch(
                `${SUPABASE_URL}/storage/v1/object/project-aiva-afridroids/${csvPath}`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'text/csv',
                        'x-upsert': 'true',
                    },
                    body: new Blob([csvContent], { type: 'text/csv' }),
                }
            );

            const finalPdfUrl = meta.countersigned_pdf_url
                || (meta.countersigned_pdf_path
                    ? `${SUPABASE_URL}/storage/v1/object/public/project-aiva-afridroids/${meta.countersigned_pdf_path}`
                    : meta.signed_pdf_url || null);

            if (finalPdfUrl) {
                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/uploaded_files`, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({
                            file_name:       `Employment_Contract_Countersigned_${empName.replace(/\s+/g, '_')}.pdf`,
                            file_path:       meta.countersigned_pdf_path || `contracts/${hireId}/final`,
                            file_type:       'application/pdf',
                            file_size:       0,
                            public_url:      finalPdfUrl,
                            hire_id:         hireId,
                            app_id:          'aiva',
                            document_type:   'countersigned_contract',
                            document_status: 'countersigned',
                            uploaded_by:     'aiva-export',
                            uploaded_at:     new Date().toISOString(),
                        }),
                    });
                } catch (vaultErr) {
                    console.warn('[export] uploaded_files registration failed (non-blocking):', vaultErr);
                }
            }

            const freshMetaResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=metadata`,
                { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
            );
            const freshMetaData = await freshMetaResp.json();
            const existingMeta  = freshMetaData?.[0]?.metadata || {};

            await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    metadata: {
                        ...existingMeta,
                        sage_csv_path:       csvPath,
                        final_pdf_url:       finalPdfUrl,
                        export_completed:    true,
                        export_completed_at: new Date().toISOString(),
                    },
                    status: 'COMPLETED',
                }),
            });

            await fetch(`${SUPABASE_URL}/rest/v1/hr_export_log`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    hire_id:       hireId,
                    exported_at:   new Date().toISOString(),
                    target_system: 'sage_hr',
                    status:        'pending_sync',
                    payload:       sageRow,
                    csv_path:      csvPath,
                }),
            });

            const employeePhone = hireRecord.phone?.replace(/\D/g, '');
            const firstName     = empName.split(' ')[0];
            if (employeePhone) {
                try {
                    await westflow.sendWhatsAppNotification(employeePhone, [
                        `🎉 *Welcome to Nashua Paarl, ${firstName}!*`,
                        ``,
                        `Your employment contract has been countersigned by the Managing Director. You are officially onboard!`,
                        ``,
                        `📄 *Your signed contract:*`,
                        finalPdfUrl || `Log in to AIVA to download your documents.`,
                        ``,
                        `Your start date: *${sageRow.Start_Date}*`,
                        `Position: *${sageRow.Position}*`,
                        ``,
                        `Welcome to the team! 🚀`,
                    ].join('\n'));
                } catch (waErr) {
                    console.warn('[export] Employee WhatsApp failed:', waErr);
                }
            }

            try {
                await westflow.sendWhatsAppNotification('120363423479055395@g.us', [
                    `✅ *Onboarding Complete — ${empName}*`,
                    ``,
                    `📋 Role: ${sageRow.Position}`,
                    `🏢 Branch: ${sageRow.Branch}`,
                    `📄 Contract: Countersigned ✅`,
                    `👤 Ref: ${employeeNum}`,
                    ``,
                    `Sage HR import file is ready.`,
                ].join('\n'));
            } catch (waErr) {
                console.warn('[export] Manager group WhatsApp failed:', waErr);
            }

            console.log('[export] ✅ Complete — CSV uploaded, PDF vaulted, WhatsApp sent');
        } catch (error) {
            console.error('[exportOnboardingRecord] Error:', error);
        }
    };

    const handleCountersign = async (hire: any) => {
        setIsRefreshing(true);
        try {
            const signerName = currentUser?.name || 'Deon Boshoff';
            const meta = hire.metadata || {};
            const employeeName = hire.staff_name || 'Employee';
            const signedAt = meta.contract_signed_at || new Date().toISOString();
            const signatureMethod = meta.signature_method || 'styled';
            const countersignedAt = new Date().toISOString();

            // ── Step 1: Stamp the countersignature onto the employee-signed PDF ────
            let countersignedPdfPath: string | null = null;
            let countersignedPdfUrl: string | null = null;

            const sourcePdfUrl = meta.signed_pdf_url
                || (meta.signed_pdf_path
                    ? `${SUPABASE_URL}/storage/v1/object/public/project-aiva-afridroids/${meta.signed_pdf_path}`
                    : null)
                || 'https://storage.googleapis.com/gemynd-public/projects/aiva/Employment%20Contract%20Template_3.pdf';

            try {
                const stampResult = await stampCountersignature({
                    hireId: hire.id,
                    sourcePdfUrl,
                    countersignerName: signerName,
                    countersignedAt,
                    employeeName,
                    signedAt,
                    signatureMethod,
                });
                if (stampResult.success) {
                    countersignedPdfPath = stampResult.storagePath;
                    countersignedPdfUrl  = stampResult.pdfUrl;
                    console.log('[Countersign] ✅ PDF stamped →', countersignedPdfUrl);
                } else {
                    console.warn('[Countersign] Stamp failed (non-blocking):', stampResult.error);
                }
            } catch (stampErr) {
                console.warn('[Countersign] stampCountersignature threw (non-blocking):', stampErr);
            }

            // ── Step 2: Persist countersign status — single atomic PATCH ────────
            // Orchestrator removed: it was overwriting stamped PDF paths with
            // stale data, causing countersigned_pdf_url = null downstream.
            const updatedMeta = {
                ...meta,
                contract_status:       'countersigned',
                countersigned_at:      countersignedAt,
                countersigned_by:      signerName,
                countersigner_name:    signerName,
                final_pdf_url:         countersignedPdfUrl || meta.signed_pdf_url || null,
                ...(countersignedPdfPath && { countersigned_pdf_path: countersignedPdfPath }),
                ...(countersignedPdfUrl  && { countersigned_pdf_url:  countersignedPdfUrl  }),
            };

            const patchResp = await fetch(
                `${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hire.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({ metadata: updatedMeta, status: 'COMPLETED' }),
                }
            );
            const success = patchResp.ok;
            if (!success) throw new Error(`Direct patch failed: ${patchResp.status}`);

            if (success) {
                triggerSuccessFeedback('Contract Countersigned.');

                // ── Step 3: Fire export immediately — no browser dependency ──────
                // exportOnboardingRecord used to rely on the employee's realtime
                // listener in OnboardingJourney. Moved here so it always fires
                // from ManagerHub right after countersign, regardless of whether
                // the employee's session is open.
                try {
                    await exportOnboardingRecord(hire.id);
                } catch (exportErr) {
                    console.warn('[Countersign] Export failed (non-blocking):', exportErr);
                }

                // Notify dispatching manager if different from who countersigned
                try {
                    const dispatcherPhone = meta.manager_phone;
                    const myPhone = MANAGER_PHONES[currentUser?.employeeNumber || ''];
                    if (dispatcherPhone && dispatcherPhone !== myPhone) {
                        await westflow.sendWhatsAppNotification(
                            dispatcherPhone,
                            `✅ ${hire.staff_name} onboarding complete!\n\nCountersigned by ${signerName}.\n\nSage HR export ready.`
                        );
                    }
                } catch (waErr) {
                    console.warn('[Countersign] Manager notify failed:', waErr);
                }

                fetchDashboardData();
            } else {
                addToast('Countersign failed — please try again.', 'error');
            }
        } catch (e: any) {
            console.error('[Countersign] Error:', e);
            addToast(`Countersign failed: ${e?.message || 'Unknown error'}`, 'error');
        } finally {
            setIsRefreshing(false);
        }
    }

    return (
        <div className="bg-[#f8f9fb] dark:bg-transparent min-h-full transition-colors duration-300">
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#0d9488] rounded-xl flex items-center justify-center shadow-sm">
                            <AiSparkIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">AIVA Manager</h1>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Nashua Paarl · HR Onboarding</p>
                        </div>
                    </div>
                    <nav className="hidden lg:flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        <TabButton icon={LayoutDashboard} label="Overview" active={hubActiveTab === 'matrix'} onClick={() => handleTabSwitch('matrix')} />
                        <TabButton icon={Users} label="Pipeline" active={hubActiveTab === 'induction'} onClick={() => handleTabSwitch('induction')} badge={metrics.inProgress} />
                        <TabButton icon={Send} label="Dispatch" active={hubActiveTab === 'dispatch'} onClick={() => handleTabSwitch('dispatch')} />
                        <TabButton icon={Archive} label="Documents" active={hubActiveTab === 'vault'} onClick={() => handleTabSwitch('vault')} />
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    {countersignList.length > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg">
                            <Bell className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">{countersignList.length} contract{countersignList.length > 1 ? 's' : ''} to sign</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-[10px] font-medium">{lastUpdated}s ago</span>
                        <button onClick={fetchDashboardData} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Refresh">
                            <RefreshIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto">
                    {hubActiveTab === 'matrix' && (
                        <div className="space-y-6 animate-fadeIn pb-20">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <LiveMetric value={metrics.inProgress} label="Active Hires" sublabel="Currently onboarding" accent="#0d9488" icon={Activity} pulse={metrics.inProgress > 0} onClick={() => { setHubFilter('all'); setHubActiveTab('induction'); }} />
                                <LiveMetric value={metrics.stalledCount} label="Need Follow-up" sublabel="Stalled > 24 hours" accent={metrics.stalledCount > 0 ? '#f59e0b' : '#94a3b8'} icon={AlertTriangle} pulse={metrics.stalledCount > 0} onClick={() => { setHubFilter('stalled'); setHubActiveTab('induction'); }} />
                                <LiveMetric value={metrics.completedCount} label="Onboarded" sublabel="Fully completed" accent="#10b981" icon={UserCheck} onClick={() => { setHubFilter('completed'); setHubActiveTab('induction'); }} />
                                <LiveMetric value={`${metrics.completionRate}%`} label="Completion Rate" sublabel={`${metrics.total} total records`} accent="#6366f1" icon={TrendingUp} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-white/5 p-6">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Onboarding Pipeline</h3>
                                            <button onClick={() => { setHubFilter('all'); setHubActiveTab('induction'); }} className="text-[11px] text-[#0d9488] font-semibold hover:underline flex items-center gap-1">
                                                View all <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {metrics.total > 0 ? (
                                            <PipelineBar steps={metrics.pipelineSteps} total={metrics.total} />
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-sm text-slate-400">No hires in pipeline yet</p>
                                                <button onClick={() => setHubActiveTab('dispatch')} className="mt-2 text-[11px] text-[#0d9488] font-semibold hover:underline">Start a new hire →</button>
                                            </div>
                                        )}
                                    </div>

                                    {countersignList.length > 0 && (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-500/40 p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Contracts Awaiting Your Signature</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {countersignList.map(hire => (
                                                    <div key={hire.id} className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/10">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">{hire.staff_name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                                Step {hire.step_reached || 7} · Signed {hire.metadata?.contract_signed_at ? new Date(hire.metadata.contract_signed_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-4">
                                                            <button
                                                                onClick={() => {
                                                                    const CONTRACT_TEMPLATE = 'https://storage.googleapis.com/gemynd-public/projects/aiva/Employment%20Contract%20Template_3.pdf';
                                                                    const signedUrl = hire.metadata?.signed_pdf_url;
                                                                    openMedia(signedUrl || CONTRACT_TEMPLATE);
                                                                }}
                                                                className="px-3 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCountersign(hire)}
                                                                disabled={isRefreshing}
                                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border-b-2 border-amber-700 active:border-b-0 disabled:opacity-50"
                                                            >
                                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                                Countersign
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {metrics.stalledList.length > 0 && (
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-white/5 p-6">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Stalled — No activity in 24h+
                                            </h3>
                                            <div className="space-y-1">
                                                {metrics.stalledList.map((hire: any) => (
                                                    <div key={hire.id} className="flex items-center gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <HireRow hire={hire} formatTime={formatTimeAgo} actionLabel="Nudge" variant="warning"
                                                                onAction={async () => {
                                                                    try { await westflow.nudgeHire(hire.id); triggerSuccessFeedback(`Reminder sent to ${hire.staff_name}`); }
                                                                    catch(e) { addToast("Send failed", "error"); }
                                                                }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleResendLink(hire)}
                                                            title="Resend onboarding link via WhatsApp"
                                                            className="shrink-0 px-3 py-1.5 bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]/20 hover:bg-[#0d9488] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            Resend
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-white/5 p-6 h-fit lg:sticky lg:top-24">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
                                        <div className="w-2 h-2 rounded-full bg-[#0d9488] animate-pulse" />
                                    </div>
                                    <div className="space-y-0 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                        {activity.length > 0 ? activity.map((item, idx) => (
                                            <ActivityItem key={idx} item={item} formatTime={formatTimeAgo} />
                                        )) : (
                                            <div className="py-12 text-center text-slate-400">
                                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-xs">Monitoring...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {hubActiveTab === 'induction' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className={`${focusedHireId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                                {/* Countersign queue — always visible at top of Pipeline tab.
                                    Previously unreachable: required clicking a hire row to set
                                    focusedHireId before DocumentChecklist would appear. Now Deon
                                    can action contracts directly without any extra navigation. */}
                                {countersignList.length > 0 && (
                                    <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-500/40 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                                                {countersignList.length} Contract{countersignList.length > 1 ? 's' : ''} Awaiting Your Signature
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {countersignList.map(hire => (
                                                <div key={hire.id} className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/10">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {hire.metadata?.profile_photo_url ? (
                                                            <img src={hire.metadata.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-amber-200 shrink-0" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 text-sm font-bold shrink-0">
                                                                {hire.staff_name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">{hire.staff_name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                                Signed {hire.metadata?.contract_signed_at
                                                                    ? new Date(hire.metadata.contract_signed_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                                                                    : formatTimeAgo(hire.updated_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                                        <button
                                                            onClick={() => {
                                                                const signedUrl = hire.metadata?.signed_pdf_url;
                                                                const CONTRACT_TEMPLATE = 'https://storage.googleapis.com/gemynd-public/projects/aiva/Employment%20Contract%20Template_3.pdf';
                                                                openMedia(signedUrl || CONTRACT_TEMPLATE);
                                                            }}
                                                            className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700 rounded-lg transition-all"
                                                            title="Preview contract"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCountersign(hire)}
                                                            disabled={isRefreshing}
                                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border-b-2 border-amber-700 active:border-b-0 disabled:opacity-50"
                                                        >
                                                            <ShieldCheck className="w-3.5 h-3.5" />
                                                            Countersign
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <OnboardingPipeline />
                            </div>
                            {focusedHireId && focusedHire && (
                                <div className="lg:col-span-5 animate-slide-in-right sticky top-24">
                                    <DocumentChecklist
                                        hire={focusedHire}
                                        onCountersign={() => {
                                            setCurrentHireId(focusedHire.id);
                                            handleCountersign(focusedHire);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {hubActiveTab === 'dispatch' && <QrCodeGenerator />}
                    {hubActiveTab === 'vault' && <FileManager bucketName="gemynd-files" appName="HR Records" />}
                </div>
            </main>
        </div>
    );
};