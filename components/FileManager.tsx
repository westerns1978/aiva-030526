import React, { useState, useRef, useEffect, useCallback } from 'react';
import { storageService, type UploadedFileRecord } from '../services/storageService';
import { extractDocumentDna } from '../services/geminiService';
import { 
    CloudIcon, 
    DocumentTextIcon, 
    CloseIcon, 
    RefreshIcon, 
    PlusIcon, 
    AiSparkIcon, 
    MagnifyingGlassIcon,
    DownloadIcon,
    EyeIcon
} from './icons';
import { ChevronRight, FileText, Trash2, Tag, ExternalLink, Calendar, User, LayoutGrid, List, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface FileManagerProps {
    bucketName: string;
    appName: string;
    onInjestSuccess?: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ bucketName, appName, onInjestSuccess }) => {
    const { openMedia, identifiedName } = useAppContext();
    const [files, setFiles] = useState<UploadedFileRecord[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inspectingFile, setInspectingFile] = useState<UploadedFileRecord | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadFiles();
    }, [bucketName]);

    async function loadFiles() {
        setIsSyncing(true);
        try {
            const data = await storageService.getFiles();
            setFiles(data);
        } catch (e) {
            console.error("Record retrieval error:", e);
        } finally {
            setIsSyncing(false);
        }
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;
        const fileList = Array.from(e.target.files) as File[];
        setUploading(true);

        for (const file of fileList) {
            try {
                const analysis = await extractDocumentDna(file);
                await storageService.uploadFile(file, file.name, 'hr-vault', {
                    app: appName,
                    employee: identifiedName || 'Employee',
                    analysis: analysis,
                    filed_at: new Date().toISOString()
                });
            } catch (err) {
                console.error("Upload failed for:", file.name, err);
            }
        }

        setUploading(false);
        loadFiles();
        if (onInjestSuccess) onInjestSuccess();
    }

    const handleDelete = async (file: UploadedFileRecord, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm(`Delete record ${file.file_name} from profile?`)) return;
        try {
            await storageService.deleteFile(file.id, file.file_path);
            if (inspectingFile?.id === file.id) setInspectingFile(null);
            loadFiles();
        } catch (e) {
            alert("Deletion failed.");
        }
    };

    const humanizeFileName = (rawName: string): string => {
        const name = rawName
            .replace(/\.[^.]+$/, '')           // Remove extension
            .replace(/_\d{10,}.*$/, '')        // Remove timestamps
            .replace(/_signed.*$/i, '')        // Remove _signed suffix
            .replace(/_/g, ' ')               // Underscores to spaces
            .replace(/\b\w/g, c => c.toUpperCase()); // Title case
        
        const nameMap: Record<string, string> = {
            'commission manual': 'Commission Manual',
            'job description': 'Job Description',
            'performance policy': 'Performance Requirements',
            'profile photo': 'Profile Photo',
            'signed contract': 'Signed Contract',
            'countersigned': 'Countersigned Contract',
            'id passport': 'ID / Passport',
            'residence': 'Proof of Residence'
        };
        
        const lower = name.toLowerCase();
        for (const [key, value] of Object.entries(nameMap)) {
            if (lower.includes(key)) return value;
        }
        return name;
    };

    const getCategoryBadge = (file: UploadedFileRecord) => {
        const category = file.metadata?.category || (file.file_name.toLowerCase().includes('profile') ? 'PROFILE_PHOTO' : 'COMPANY_POLICY');
        
        const map: Record<string, { label: string; color: string }> = {
            'SIGNED_DOCUMENT': { label: 'Signed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
            'PROFILE_PHOTO': { label: 'Photo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
            'ID / Passport': { label: 'ID', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
            'ID_DOCUMENT': { label: 'ID', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
            'Proof of Residence': { label: 'Address', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
            'PROOF_OF_RESIDENCE': { label: 'Address', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
            'Bank Letter': { label: 'Banking', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
            'BANK_CONFIRMATION': { label: 'Banking', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
            'Employment Contract': { label: 'Contract', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
            'Company Policy': { label: 'Policy', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
            'COMPANY_POLICY': { label: 'Policy', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' },
        };
        return map[category] || { label: 'Doc', color: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' };
    };

    const filteredFiles = files.filter(f => 
        f.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.metadata?.employee?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full relative overflow-hidden bg-transparent">
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${inspectingFile ? 'mr-0 lg:mr-[400px]' : ''}`}>
                <div className="p-2 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative flex-1 max-w-md w-full">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search records..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-900 dark:text-white outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-white/5 flex gap-1 mr-2">
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#0d9488] text-white' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#0d9488] text-white' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
                            </div>
                            <button onClick={loadFiles} className="p-2.5 bg-white dark:bg-white/5 rounded-xl text-slate-500 border border-slate-200 dark:border-white/5 shadow-sm">
                                <RefreshIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#0d9488] text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg border-b-2 border-[#0a7c72] transition-all"
                            >
                                <PlusIcon className="w-3.5 h-3.5" /> New File
                            </button>
                            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                        </div>
                    </div>

                    {uploading && (
                        <div className="animate-pulse flex items-center gap-3 p-4 bg-[#0d9488]/10 border border-[#0d9488]/20 rounded-2xl">
                            <Loader2 className="w-4 h-4 text-[#0d9488] animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0d9488]">Synchronizing Specimen...</p>
                        </div>
                    )}

                    {viewMode === 'table' ? (
                        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-slate-200 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">DOCUMENT NAME</th>
                                            <th className="px-6 py-4">Subject</th>
                                            <th className="px-6 py-4 text-center">Type</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 text-right">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {filteredFiles.map(file => {
                                            const badge = getCategoryBadge(file);
                                            const employeeName = file.metadata?.employee || identifiedName || 'Employee';
                                            return (
                                                <tr 
                                                    key={file.id} 
                                                    onClick={() => setInspectingFile(file)}
                                                    className={`group cursor-pointer transition-all hover:bg-[#0d9488]/5 ${inspectingFile?.id === file.id ? 'bg-[#0d9488]/10' : ''}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/5 group-hover:border-[#0d9488]/30 transition-all">
                                                                <FileText className={`w-4 h-4 text-slate-400`} />
                                                            </div>
                                                            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate max-w-[200px]">
                                                                {humanizeFileName(file.file_name)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{employeeName}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${badge.color}`}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[9px] font-mono text-slate-500 uppercase font-black">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); openMedia(file.public_url); }} className="p-2 text-slate-400 hover:text-[#0d9488] transition-colors"><EyeIcon className="w-4 h-4" /></button>
                                                            <button onClick={(e) => handleDelete(file, e)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredFiles.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Registry is empty.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredFiles.map(file => {
                                const badge = getCategoryBadge(file);
                                const isPdf = file.file_type === 'application/pdf' || file.file_name?.toLowerCase().endsWith('.pdf');
                                return (
                                    <div 
                                        key={file.id} 
                                        onClick={() => setInspectingFile(file)}
                                        className={`group bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer relative ${inspectingFile?.id === file.id ? 'ring-2 ring-[#0d9488]' : ''}`}
                                    >
                                        <div className="aspect-square bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                                            {isPdf ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                    <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">PDF Record</span>
                                                </div>
                                            ) : (
                                                <img src={file.public_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all group-hover:scale-110" loading="lazy" />
                                            )}
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest border block truncate text-center ${badge.color} backdrop-blur-md`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 border-t border-slate-100 dark:border-white/5">
                                            <p className="text-[9px] font-black text-slate-800 dark:text-white truncate tracking-tighter uppercase">{humanizeFileName(file.file_name)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {inspectingFile && (
                <aside 
                    className="fixed lg:absolute top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl z-[60] transition-all duration-500 animate-slide-in-right"
                >
                    <div className="h-full flex flex-col">
                        <header className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{humanizeFileName(inspectingFile.file_name)}</h3>
                                <p className="text-[8px] font-black text-[#0d9488] uppercase tracking-[0.3em] mt-2">Upload Summary</p>
                            </div>
                            <button onClick={() => setInspectingFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><CloseIcon className="w-5 h-5" /></button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 copilot-scrollbar pr-4">
                            <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-lg relative group">
                                {inspectingFile.file_type === 'application/pdf' || inspectingFile.file_name?.toLowerCase().endsWith('.pdf') ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                        <FileText className="w-16 h-16 opacity-20" />
                                        <span className="text-[10px] font-black uppercase opacity-20">PDF Specimen</span>
                                    </div>
                                ) : (
                                    <img src={inspectingFile.public_url} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => openMedia(inspectingFile.public_url)} className="px-6 py-2.5 bg-[#0d9488] text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-xl flex items-center gap-2 hover:scale-105 transition-all"><EyeIcon className="w-3.5 h-3.5" /> View Full Document</button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Analysis Detail</label>
                                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 italic text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                                        "{inspectingFile.metadata?.analysis?.summary || inspectingFile.metadata?.extracted?.summary || 'No summary available.'}"
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2"><User className="w-3 h-3" /><span className="text-[8px] font-black uppercase">Uploaded By</span></div>
                                        <p className="text-[10px] font-black text-slate-800 dark:text-white truncate">{inspectingFile.metadata?.employee || identifiedName || 'Employee'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2"><Calendar className="w-3 h-3" /><span className="text-[8px] font-black uppercase">Uploaded</span></div>
                                        <p className="text-[10px] font-black text-slate-800 dark:text-white">{new Date(inspectingFile.uploaded_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {inspectingFile.metadata?.tags && inspectingFile.metadata.tags.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Tag className="w-2.5 h-2.5" /> Document Tags</label>
                                        <div className="flex flex-wrap gap-2">
                                            {inspectingFile.metadata.tags.map((tag: string) => (
                                                <span key={tag} className="px-3 py-1 bg-[#0d9488]/10 text-[#0d9488] rounded-lg text-[8px] font-black uppercase tracking-widest border border-[#0d9488]/20">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3 shrink-0">
                            <a 
                                href={inspectingFile.public_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-full py-4 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5 transition-all shadow-sm"
                            >
                                <ExternalLink className="w-4 h-4 text-blue-500" />
                                Download Asset
                            </a>
                            <button 
                                onClick={(e) => handleDelete(inspectingFile, e)}
                                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/20 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                Purge Asset
                            </button>
                        </footer>
                    </div>
                </aside>
            )}
        </div>
    );
};