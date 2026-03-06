import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, 
    FileText, 
    FileSignature, 
    Award, 
    User, 
    MapPin, 
    CreditCard, 
    ListChecks, 
    Camera, 
    Eye, 
    Download, 
    Loader2, 
    Inbox,
    Users,
    Layers,
    Clock,
    // Add missing CheckCircle2 import to fix error on line 384
    CheckCircle2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { DocumentPreviewPanel } from './DocumentPreviewPanel';

import { SUPABASE_CONFIG } from '../constants';
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_KEY = SUPABASE_CONFIG.anonKey;

// --- Helpers ---

const cleanFileName = (name: string): string => {
    return name
        .replace(/\.[^.]+$/, '')           // Remove extension
        .replace(/_\d{13,}$/g, '')         // Remove trailing timestamps
        .replace(/^\d+_/, '')              // Remove leading timestamps
        .replace(/_/g, ' ')               // Underscores to spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Title Case
};

const formatRelativeDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
};

// --- Sub-components ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        countersigned: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', label: 'Countersigned' },
        signed: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-700 dark:text-teal-400', label: 'Signed' },
        verified: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', label: 'Verified' },
        uploaded: { bg: 'bg-slate-100 dark:bg-white/5', text: 'text-slate-500 dark:text-slate-400', label: 'Uploaded' },
    };
    const c = config[status?.toLowerCase()] || config.uploaded;
    return (
        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${c.bg} ${c.text} border border-current opacity-70`}>
            {c.label}
        </span>
    );
};

// Use React.ReactNode to fix JSX namespace error on line 69
const typeIcons: Record<string, React.ReactNode> = {
    'contracts': <FileSignature className="w-5 h-5" />,
    'contract': <FileSignature className="w-5 h-5" />,
    'certificates': <Award className="w-5 h-5" />,
    'certificate': <Award className="w-5 h-5" />,
    'id-documents': <User className="w-5 h-5" />,
    'residence': <MapPin className="w-5 h-5" />,
    'banking': <CreditCard className="w-5 h-5" />,
    'policies': <ListChecks className="w-5 h-5" />,
    'profile': <Camera className="w-5 h-5" />,
};

const typeColors: Record<string, string> = {
    'contracts': 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    'contract': 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    'certificates': 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    'certificate': 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    'id-documents': 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    'residence': 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    'banking': 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    'policies': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    'profile': 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
};

export const DocumentVault: React.FC = () => {
    const { hubRefreshKey } = useAppContext();
    
    const [hires, setHires] = useState<any[]>([]);
    const [allFiles, setAllFiles] = useState<any[]>([]);
    const [selectedHireId, setSelectedHireId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Get all hires
                const hiresResp = await fetch(
                    `${SUPABASE_URL}/rest/v1/onboarding_telemetry?select=id,staff_name,status,step_reached,created_at&order=created_at.desc`,
                    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
                );
                const hiresData = await hiresResp.json();
                
                // Get all files (tagged for AIVA)
                const filesResp = await fetch(
                    `${SUPABASE_URL}/rest/v1/uploaded_files?app_id=eq.aiva&select=*&order=created_at.desc`,
                    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
                );
                const filesData = await filesResp.json();
                
                setHires(Array.isArray(hiresData) ? hiresData : []);
                setAllFiles(Array.isArray(filesData) ? filesData : []);
            } catch (e) {
                console.warn('[DocumentVault] Data fetch failed:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [hubRefreshKey]);

    const fileCountByHire = useMemo(() => {
        const counts: Record<string, number> = {};
        allFiles.forEach(f => {
            if (f.hire_id) counts[f.hire_id] = (counts[f.hire_id] || 0) + 1;
        });
        return counts;
    }, [allFiles]);

    const filteredHires = useMemo(() => {
        if (!searchQuery.trim()) return hires;
        const q = searchQuery.toLowerCase();
        
        // Match hire name OR matching docs
        const hiresWithMatchingDocs = new Set(
            allFiles
                .filter(f => 
                    f.file_name?.toLowerCase().includes(q) || 
                    f.document_type?.toLowerCase().includes(q)
                )
                .map(f => f.hire_id)
        );

        return hires.filter(h => 
            h.staff_name?.toLowerCase().includes(q) || 
            hiresWithMatchingDocs.has(h.id)
        );
    }, [hires, allFiles, searchQuery]);

    const selectedFiles = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let list = selectedHireId 
            ? allFiles.filter(f => f.hire_id === selectedHireId)
            : allFiles;
            
        if (q) {
            list = list.filter(f => 
                f.file_name?.toLowerCase().includes(q) || 
                f.document_type?.toLowerCase().includes(q) ||
                hires.find(h => h.id === f.hire_id)?.staff_name?.toLowerCase().includes(q)
            );
        }
        
        return list;
    }, [selectedHireId, allFiles, searchQuery, hires]);

    if (isLoading && hires.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center animate-pulse">
                <Loader2 className="w-10 h-10 text-[#0d9488] animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Loading documents...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col h-full animate-fadeIn relative">
            {/* Header / Search */}
            <header className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Nashua Digital Vault</h2>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-0.5">Secure Document Archive</p>
                    </div>
                </div>

                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search Candidates or Files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none focus:border-[#0d9488] transition-all shadow-inner"
                    />
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                
                {/* Mobile: horizontal candidate pills */}
                <div className="md:hidden flex gap-2 overflow-x-auto py-4 px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-transparent scrollbar-hide shrink-0">
                    <button
                        onClick={() => setSelectedHireId(null)}
                        className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border-2 ${!selectedHireId ? 'bg-[#0d9488] border-[#0d9488] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/5'}`}
                    >
                        All · {allFiles.length}
                    </button>
                    {filteredHires.map(hire => (
                        <button
                            key={hire.id}
                            onClick={() => setSelectedHireId(hire.id)}
                            className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border-2 ${selectedHireId === hire.id ? 'bg-[#0d9488] border-[#0d9488] text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/5'}`}
                        >
                            {hire.staff_name?.split(' ')[0]}
                            <span className="ml-2 opacity-60 text-[8px]">{fileCountByHire[hire.id] || 0}</span>
                        </button>
                    ))}
                </div>

                {/* Left: Candidate List (Desktop) */}
                <aside className="hidden md:flex flex-col w-72 border-r border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-transparent shrink-0">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Candidates</p>
                    </div>
                    <div className="flex-1 overflow-y-auto copilot-scrollbar p-3 space-y-1">
                        <button 
                            onClick={() => setSelectedHireId(null)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group ${!selectedHireId ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-white/10' : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!selectedHireId ? 'bg-[#0d9488] text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                    <Layers className="w-4 h-4" />
                                </div>
                                <span className={`text-[11px] font-black uppercase italic transition-colors ${!selectedHireId ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>All Files</span>
                            </div>
                            <span className={`text-[9px] font-black ${!selectedHireId ? 'text-[#0d9488]' : 'text-slate-300'}`}>{allFiles.length}</span>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />

                        {filteredHires.map(hire => {
                            const count = fileCountByHire[hire.id] || 0;
                            const isActive = selectedHireId === hire.id;
                            const isCompleted = hire.status?.toLowerCase() === 'completed' || hire.step_reached >= 7;

                            return (
                                <button 
                                    key={hire.id}
                                    onClick={() => setSelectedHireId(hire.id)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group ${isActive ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-white/10' : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative">
                                            <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/5 text-[10px] font-black transition-colors ${isActive ? 'text-[#0d9488]' : 'text-slate-400'}`}>
                                                {hire.staff_name?.charAt(0)}
                                            </div>
                                            <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${isCompleted ? 'bg-emerald-500' : count > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tight truncate transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {hire.staff_name}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] font-black shrink-0 ${isActive ? 'text-[#0d9488]' : 'text-slate-300'}`}>{count}</span>
                                </button>
                            );
                        })}

                        {filteredHires.length === 0 && (
                            <div className="py-10 text-center opacity-30">
                                <Users className="w-10 h-10 mx-auto mb-2" />
                                <p className="text-[8px] font-black uppercase">No Candidates Found</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right: Document List */}
                <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/10 dark:bg-transparent">
                    <div className="p-6 md:p-8 shrink-0 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">
                                {selectedHireId ? hires.find(h => h.id === selectedHireId)?.staff_name : 'Recent Activity'}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Inbox className="w-3 h-3" /> 
                                {selectedFiles.length} Secure Record{selectedFiles.length !== 1 ? 's' : ''} Identified
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 space-y-3 copilot-scrollbar pb-20">
                        {selectedFiles.map(file => (
                            <div 
                                key={file.id} 
                                className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-[#0d9488]/30 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
                                onClick={() => setPreviewFile(file)}
                            >
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-current opacity-70 ${typeColors[file.document_type] || 'bg-slate-100 text-slate-400'}`}>
                                        {typeIcons[file.document_type] || <FileText className="w-5 h-5" />}
                                    </div>
                                    
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase text-slate-800 dark:text-white truncate tracking-tight group-hover:text-[#0d9488] transition-colors">
                                            {cleanFileName(file.file_name)}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <StatusBadge status={file.document_status} />
                                            {!selectedHireId && (
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                                    {hires.find(h => h.id === file.hire_id)?.staff_name || 'Unlinked'}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1 text-slate-400 shrink-0">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">
                                                    {formatRelativeDate(file.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-[#0d9488] transition-all"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <a 
                                        href={file.public_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-500 transition-all"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}

                        {selectedFiles.length === 0 && (
                            <div className="py-24 text-center space-y-5 animate-fadeIn">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Inbox className="w-10 h-10 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase italic">No Documents</h3>
                                    <p className="text-[10px] text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                                        {searchQuery ? `No matches found for "${searchQuery}".` : 'No documents found for this candidate.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Footer Summary */}
            <footer className="px-8 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 shrink-0">
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> {allFiles.length} Records</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {hires.length} Candidates</span>
                </div>
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1.5 text-[#0d9488]">
                        <CheckCircle2 className="w-3 h-3" /> 
                        {allFiles.filter(f => f.document_status === 'signed' || f.document_status === 'countersigned').length} Completed
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-500">
                        <Clock className="w-3 h-3" /> 
                        {allFiles.filter(f => f.document_status === 'uploaded').length} Pending
                    </span>
                </div>
            </footer>

            {/* Document Preview Panel */}
            <DocumentPreviewPanel
                file={previewFile}
                hireName={hires.find(h => h.id === previewFile?.hire_id)?.staff_name}
                onClose={() => setPreviewFile(null)}
            />
        </div>
    );
};