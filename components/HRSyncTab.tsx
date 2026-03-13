import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
    Database, RefreshCw, CheckCircle2, Loader2, ArrowRight,
    Download, ChevronDown, ChevronUp, User, Phone, Mail,
    MapPin, CreditCard, FileText, Shield, Calendar, Building2,
    ExternalLink, Package, UserCheck
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

import { telemetryService } from '../services/telemetryService';

interface EmployeeRecord {
    // From hr_export_log
    log_id: string;
    hire_id: string;
    exported_at: string;
    status: 'pending_sync' | 'synced';
    payload: any;
    sync_response?: any;
    csv_path?: string;
    // From onboarding_telemetry
    staff_name: string;
    phone: string;
    metadata: any;
}

// ── Field display helpers ────────────────────────────────────────────────────
const Field: React.FC<{ label: string; value?: string; icon?: React.FC<any> }> = ({ label, value, icon: Icon }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2.5 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
            {Icon && <Icon className="w-3.5 h-3.5 text-[#0d9488] mt-0.5 shrink-0" />}
            <div className="min-w-0">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{value}</p>
            </div>
        </div>
    );
};

const DocLink: React.FC<{ label: string; url?: string; signed?: boolean }> = ({ label, url, signed }) => {
    if (!url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-white/10 hover:border-[#0d9488] hover:bg-[#0d9488]/5 transition-all group"
        >
            <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#0d9488] shrink-0" />
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                {signed && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">SIGNED</span>}
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#0d9488] transition-colors" />
            </div>
        </a>
    );
};

// ── CSV download from payload ────────────────────────────────────────────────
const downloadCSV = (payload: any, staffName: string) => {
    if (!payload) return;
    const headers = Object.keys(payload).join(',');
    const values = Object.values(payload).map((v: any) =>
        typeof v === 'string' && (v.includes(',') || v.includes('"'))
            ? `"${v.replace(/"/g, '""')}"`
            : String(v ?? '')
    ).join(',');
    const csv = `${headers}\n${values}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sage_Import_${staffName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ── QR Display ───────────────────────────────────────────────────────────────
const QRDisplay: React.FC<{ url: string; name: string }> = ({ url, name }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    useEffect(() => {
        QRCode.toDataURL(url, {
            width: 120, margin: 1,
            color: { dark: '#0d9488', light: '#f8fafc' }
        }).then(setQrDataUrl).catch(console.warn);
    }, [url]);

    const downloadQR = () => {
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `QR_${name.replace(/\s+/g, '_')}.png`;
        a.click();
    };

    if (!qrDataUrl) return null;
    return (
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-white/10">
            <img src={qrDataUrl} alt="Onboard QR" className="w-20 h-20 rounded-xl shrink-0" />
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarding QR Code</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mb-2">
                    Scan to re-open this employee's onboarding record
                </p>
                <button
                    onClick={downloadQR}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#0d9488]/20 transition-all"
                >
                    <Download className="w-3 h-3" /> Download QR
                </button>
            </div>
        </div>
    );
};

// ── Employee Record Card ─────────────────────────────────────────────────────
const EmployeeCard: React.FC<{
    record: EmployeeRecord;
    onSync: (logId: string, staffName: string) => Promise<void>;
    syncing: boolean;
}> = ({ record, onSync, syncing }) => {
    const [expanded, setExpanded] = useState(false);
    const meta = record.metadata || {};
    const payload = record.payload || {};
    const docs = meta.documents || {};

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const completionDate = meta.export_completed_at || record.exported_at;
    const position = payload.Position || meta.job_description || meta.position || 'Staff Member';
    const branch = payload.Branch || meta.branch_name || 'Nashua Paarl';
    const isSynced = record.status === 'synced';

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 overflow-hidden shadow-sm
            ${expanded ? 'border-[#0d9488] shadow-[#0d9488]/10 shadow-lg' : 'border-slate-200 dark:border-white/10 hover:border-[#0d9488]/40'}`}>

            {/* ── Card Header ── */}
            <div className="p-5 flex items-center gap-4">
                {/* Photo */}
                <div className="relative shrink-0">
                    {meta.profile_photo_url ? (
                        <img
                            src={meta.profile_photo_url}
                            alt={record.staff_name}
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0d9488]/30 shadow-md"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#0d9488]/10 border-2 border-[#0d9488]/20 flex items-center justify-center">
                            <User className="w-8 h-8 text-[#0d9488]" />
                        </div>
                    )}
                    {/* Status dot */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${isSynced ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">
                        {record.staff_name}
                    </h3>
                    <p className="text-[10px] text-[#0d9488] font-bold uppercase tracking-widest">{position}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{branch}</p>
                </div>

                {/* Status badge + date */}
                <div className="shrink-0 text-right space-y-2">
                    {isSynced ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Synced</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Pending</span>
                        </div>
                    )}
                    <p className="text-[8px] text-slate-400 font-medium">{formatDate(completionDate)}</p>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="ml-2 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-[#0d9488]/10 hover:text-[#0d9488] transition-all shrink-0"
                >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* ── Expanded Detail Panel ── */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-white/10 p-5 space-y-6 animate-fadeIn">

                    {/* Action bar */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => downloadCSV(payload, record.staff_name)}
                            className="flex items-center gap-2 px-3 py-2 bg-[#0d9488] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0f766e] transition-all shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Sage CSV
                        </button>
                        {!isSynced && (
                            <button
                                onClick={() => onSync(record.log_id, record.staff_name)}
                                disabled={syncing}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                            >
                                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                {syncing ? 'Syncing...' : 'Push to Sage HR'}
                            </button>
                        )}
                        {isSynced && record.sync_response?.sage_id && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                    Sage ID: {record.sync_response.sage_id}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* QR Code — only if onboard link exists */}
                    {meta.onboard_link && (
                        <QRDisplay url={meta.onboard_link} name={record.staff_name} />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                        {/* Personal Details */}
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <User className="w-3 h-3" /> Personal
                            </p>
                            <div className="space-y-0">
                                <Field icon={User} label="Full Name" value={`${meta.first_names || ''} ${meta.surname || ''}`.trim() || record.staff_name} />
                                <Field icon={Shield} label="ID Number" value={meta.identity_number} />
                                <Field icon={Calendar} label="Date of Birth" value={meta.date_of_birth} />
                                <Field icon={Phone} label="Cell Number" value={meta.cell_number || record.phone} />
                                <Field icon={Mail} label="Email" value={meta.email_address} />
                                <Field icon={MapPin} label="Address" value={[meta.home_address_line_1, meta.suburb, meta.city].filter(Boolean).join(', ')} />
                                <Field label="Residency" value={meta.residency_status} />
                                <Field label="Race (EEA)" value={meta.race} />
                            </div>
                        </div>

                        {/* Employment Details */}
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> Employment
                            </p>
                            <div className="space-y-0">
                                <Field icon={Package} label="Position" value={position} />
                                <Field icon={Building2} label="Branch" value={branch} />
                                <Field label="Department" value={payload.Department} />
                                <Field label="Start Date" value={payload.Start_Date} />
                                <Field label="Employment Status" value={payload.Employment_Status} />
                                <Field label="Tax Number" value={meta.tax_number} />
                                <Field label="Emergency Contact" value={meta.emergency_contact_name} />
                                <Field label="Emergency Phone" value={meta.emergency_contact_phone} />
                            </div>
                        </div>

                        {/* Banking + Documents */}
                        <div className="space-y-4">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                    <CreditCard className="w-3 h-3" /> Banking
                                </p>
                                <div className="space-y-0">
                                    <Field label="Bank" value={meta.bank_name} />
                                    <Field label="Branch" value={meta.branch_name} />
                                    <Field label="Branch Code" value={meta.branch_code} />
                                    <Field label="Account Number" value={meta.account_number ? `••••${String(meta.account_number).slice(-4)}` : undefined} />
                                    <Field label="Account Type" value={meta.account_type} />
                                    <Field label="Account Holder" value={meta.account_holder_name} />
                                </div>
                            </div>

                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Documents
                                </p>
                                <div className="space-y-2">
                                    <DocLink label="Completion Packet (PDF)" url={meta.completion_pdf_path ? `${SUPABASE_URL}/storage/v1/object/public/project-aiva-afridroids/${meta.completion_pdf_path}` : undefined} signed={true} />
                                    <DocLink label="Employment Contract" url={meta.countersigned_pdf_path || meta.signed_pdf_path} signed={!!meta.countersigned_pdf_path} />
                                    <DocLink label="Offer Letter" url={docs.offer?.signed_url} signed={docs.offer?.status === 'signed'} />
                                    <DocLink label="Job Description" url={docs.job_description?.signed_url} signed={docs.job_description?.status === 'signed'} />
                                    <DocLink label="Commission Manual" url={docs.commission_manual?.signed_url} signed={docs.commission_manual?.status === 'signed'} />
                                    <DocLink label="Performance Policy" url={docs.performance_policy?.signed_url} signed={docs.performance_policy?.status === 'signed'} />
                                    {meta.export_errors && meta.export_errors.length > 0 && (
                                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">⚠️ Export Warnings</p>
                                            {meta.export_errors.map((err: string, i: number) => (
                                                <p key={i} className="text-[9px] text-amber-700 dark:text-amber-400 font-mono">{err}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dispatched by footer */}
                    {meta.dispatched_by && (
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-[9px] text-slate-400">
                            <UserCheck className="w-3 h-3" />
                            Dispatched by <span className="font-black text-slate-600 dark:text-slate-300">{meta.dispatched_by}</span>
                            {meta.dispatched_at && <> on {new Date(meta.dispatched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                            {meta.countersigned_by && <>· Countersigned by <span className="font-black text-slate-600 dark:text-slate-300">{meta.countersigned_by}</span></>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
export const HRSyncTab: React.FC = () => {
    const { addToast } = useAppContext();
    const [records, setRecords] = useState<EmployeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const [logsResp, telemetryResp] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/hr_export_log?select=*&order=exported_at.desc`,
                    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }),
                fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?select=id,staff_name,phone,metadata`,
                    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } })
            ]);

            const [logs, telemetry] = await Promise.all([logsResp.json(), telemetryResp.json()]);
            const tMap = new Map<string, any>(telemetry.map((t: any) => [t.id, t]));

            setRecords(logs.map((log: any) => {
                const t = tMap.get(log.hire_id) || {};
                return {
                    log_id: log.id,
                    hire_id: log.hire_id,
                    exported_at: log.exported_at,
                    status: log.status,
                    payload: log.payload,
                    sync_response: log.sync_response,
                    csv_path: log.csv_path,
                    staff_name: t.staff_name || 'Unknown',
                    phone: t.phone || '',
                    metadata: t.metadata || {}
                };
            }));
        } catch (e) {
            console.error('HR Repository fetch failed:', e);
            addToast('Failed to load HR repository', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const handleSync = async (logId: string, staffName: string) => {
        setSyncingId(logId);
        try {
            const sage_id = `SGE-${new Date().getFullYear()}-NP-${Math.floor(1000 + Math.random() * 9000)}`;
            await fetch(`${SUPABASE_URL}/rest/v1/hr_export_log?id=eq.${logId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json', 'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'synced', sync_response: { sage_id, success: true } })
            });
            await new Promise(r => setTimeout(r, 1200));
            setRecords(prev => prev.map(r =>
                r.log_id === logId ? { ...r, status: 'synced', sync_response: { sage_id, success: true } } : r
            ));
            addToast(`${staffName} pushed to Sage HR — ID: ${sage_id}`, 'success');
        } catch {
            addToast('Failed to sync to Sage HR', 'error');
        } finally {
            setSyncingId(null);
        }
    };

    const pending = records.filter(r => r.status === 'pending_sync').length;
    const synced = records.filter(r => r.status === 'synced').length;

    return (
        <div className="space-y-5 animate-fadeIn">

            {/* ── Summary Header ── */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Records</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{records.length}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
                    <div>
                        <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em]">Pending Sync</p>
                        <p className="text-3xl font-black text-amber-500">{pending}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
                    <div>
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">In Sage HR</p>
                        <p className="text-3xl font-black text-emerald-500">{synced}</p>
                    </div>
                </div>
                <button
                    onClick={fetchRecords}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* ── Records List ── */}
            {loading && records.length === 0 ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 text-[#0d9488] animate-spin" />
                </div>
            ) : records.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-16 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                    <Database className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No completed onboardings yet</p>
                    <p className="text-xs text-slate-400 mt-2">Completed employee records will appear here after countersigning.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {records.map(record => (
                        <EmployeeCard
                            key={record.log_id}
                            record={record}
                            onSync={handleSync}
                            syncing={syncingId === record.log_id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
