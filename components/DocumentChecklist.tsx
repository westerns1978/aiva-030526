import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileText, 
    CheckCircle2, 
    Clock, 
    Eye, 
    Download, 
    ShieldCheck, 
    Smartphone, 
    Zap,
    AlertCircle,
    Loader2,
    Calendar,
    ChevronRight,
    Search,
    FileSignature,
    Award,
    /* Added missing icons to resolve compilation errors */
    Archive,
    User,
    MapPin,
    ListChecks
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface DocumentChecklistProps {
    hire: any;
    onCountersign: () => void;
}

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ hire, onCountersign }) => {
    const { openMedia, hubRefreshKey } = useAppContext();
    const [hireFiles, setHireFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const metadata = hire.metadata || {};
    const contractStatus = metadata.contract_status?.toLowerCase();
    const isSignedByEmp = contractStatus === 'signed';

    useEffect(() => {
        if (!hire?.id) return;
        
        const fetchFiles = async () => {
            setIsLoading(true);
            try {
                const resp = await fetch(
                    `${SUPABASE_URL}/rest/v1/uploaded_files?hire_id=eq.${hire.id}&order=created_at.desc`,
                    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
                );
                const files = await resp.json();
                setHireFiles(Array.isArray(files) ? files : []);
            } catch (e) {
                console.warn('[DocumentChecklist] File fetch failed:', e);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchFiles();
    }, [hire?.id, hubRefreshKey]);

    const groupedFiles = useMemo(() => {
        const groups: Record<string, any[]> = {
            'contracts': [],
            'certificates': [],
            'id-documents': [],
            'policies': [],
            'banking': [],
            'residence': [],
            'profile': [],
            'other': []
        };

        hireFiles.forEach(file => {
            const type = (file.document_type || 'other').toLowerCase();
            if (groups[type]) {
                groups[type].push(file);
            } else {
                groups['other'].push(file);
            }
        });

        return groups;
    }, [hireFiles]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const FileRow: React.FC<{ file: any }> = ({ file }) => (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-[#0d9488]/30 transition-all group shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    file.document_status === 'countersigned' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                    file.document_status === 'signed' ? 'bg-blue-50 text-blue-500 border-blue-100' :
                    'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                    <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-tight truncate text-slate-900 dark:text-white leading-none">
                        {file.file_name.replace(/\.[^.]+$/, '').replace(/_\d+$/, '')}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest ${
                            file.document_status === 'countersigned' ? 'bg-emerald-500 text-white' : 
                            file.document_status === 'signed' ? 'bg-[#0d9488] text-white' :
                            'bg-slate-200 text-slate-500'
                        }`}>
                            {file.document_status || 'Uploaded'}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-mono">{formatDate(file.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
                <button 
                    onClick={() => openMedia(file.public_url)}
                    className="p-2.5 text-slate-400 hover:text-[#0d9488] hover:bg-[#0d9488]/5 rounded-xl transition-all"
                    title="Preview"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <a 
                    href={file.public_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 rounded-xl transition-all"
                    title="Download"
                >
                    <Download className="w-4 h-4" />
                </a>
            </div>
        </div>
    );

    const Section: React.FC<{ title: string; files: any[]; icon: any }> = ({ title, files, icon: Icon }) => {
        if (files.length === 0) return null;
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h4>
                </div>
                <div className="space-y-2">
                    {files.map(f => <FileRow key={f.id} file={f} />)}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col h-full">
            <header className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-1">Onboarding Record</h3>
                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{hire.staff_name}</p>
                    </div>
                    {isLoading && <Loader2 className="w-5 h-5 text-[#0d9488] animate-spin" />}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 copilot-scrollbar">
                {hireFiles.length === 0 && !isLoading ? (
                    <div className="py-20 text-center space-y-4">
                        <Archive className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No documents uploaded yet.</p>
                    </div>
                ) : (
                    <>
                        <Section title="Employment Contracts" files={groupedFiles.contracts} icon={FileSignature} />
                        <Section title="ID Verification" files={groupedFiles['id-documents']} icon={User} />
                        <Section title="Proof of Residence" files={groupedFiles.residence} icon={MapPin} />
                        <Section title="Banking Setup" files={groupedFiles.banking} icon={Zap} />
                        <Section title="Policy Acknowledgments" files={groupedFiles.policies} icon={ListChecks} />
                        <Section title="Signature Certificates" files={groupedFiles.certificates} icon={Award} />
                        <Section title="Profile Media" files={groupedFiles.profile} icon={Smartphone} />
                        <Section title="Supplemental Records" files={groupedFiles.other} icon={FileText} />
                    </>
                )}
            </div>

            <footer className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                {isSignedByEmp && contractStatus !== 'countersigned' ? (
                    <button 
                        onClick={onCountersign}
                        className="w-full py-5 bg-[#0d9488] text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs border-b-4 border-[#0a7c72]"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Execute MD Countersign
                    </button>
                ) : contractStatus === 'countersigned' ? (
                    <div className="flex items-center justify-center gap-3 p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Contract Fully Executed</span>
                    </div>
                ) : (
                    <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/20">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 leading-relaxed uppercase tracking-tight">
                            Record incomplete. Candidate must execute their Employment Contract (Step 6) to enable MD countersign protocol.
                        </p>
                    </div>
                )}
            </footer>
        </div>
    );
};