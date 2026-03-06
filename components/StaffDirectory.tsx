
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { STAFF_DIRECTORY, type StaffStatus } from '../constants/staffDirectory';
import { LEADERSHIP_TEAM } from '../constants/team';
import type { TeamMember } from '../constants/team';
import { CloseIcon, PlayIcon } from './icons';
import { LayoutGrid, Network } from 'lucide-react';

const statusClasses: Record<StaffStatus, { dot: string, text: string, bg: string }> = {
    'Available': { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' },
    'Busy': { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    'Away': { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/50' },
};

const VideoModal: React.FC<{ videoUrl: string; onClose: () => void }> = ({ videoUrl, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (videoRef.current) {
                videoRef.current.pause();
            }
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="relative bg-black rounded-lg shadow-xl w-full max-w-3xl aspect-video" onClick={(e) => e.stopPropagation()}>
                <video ref={videoRef} src={videoUrl} controls autoPlay className="w-full h-full rounded-lg" />
                <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 text-black shadow-lg hover:scale-110 transition-transform">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const TeamProfileCard: React.FC<{ member: TeamMember; isPlaying: boolean; onPlay: () => void; onStop: () => void; onLaunchVideo: () => void; }> = ({ member, isPlaying, onPlay, onStop, onLaunchVideo }) => {
    return (
        <div 
            className="relative rounded-xl overflow-hidden shadow-lg group aspect-[3/4] cursor-pointer"
            onMouseEnter={onPlay}
            onMouseLeave={onStop}
            onClick={onLaunchVideo}
        >
            {isPlaying ? (
                 <video src={member.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <PlayIcon className="w-8 h-8 text-white" />
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-sm text-slate-300">{member.title}</p>
            </div>
        </div>
    );
};

const OrgNode: React.FC<{ name: string; title: string; imageUrl?: string; isTop?: boolean; isHead?: boolean; isLeaf?: boolean }> = ({ name, title, imageUrl, isTop, isHead, isLeaf }) => (
    <div className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all hover:shadow-lg ${
        isTop ? 'bg-brand-primary text-white border-brand-primary shadow-xl px-10 py-8 min-w-[240px]' :
        isHead ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md min-w-[200px]' :
        'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 min-w-[180px]'
    }`}>
        {imageUrl && (
            <img src={imageUrl} alt={name} className="w-14 h-14 rounded-full object-cover mb-3 border-4 border-white dark:border-slate-700 shadow-sm" />
        )}
        <p className={`font-black uppercase tracking-tight text-xs italic ${isTop ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{name}</p>
        <p className={`text-[9px] uppercase tracking-[0.2em] font-bold mt-1.5 ${isTop ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
    </div>
);

const OrgChart: React.FC = () => {
    const md = LEADERSHIP_TEAM.find(m => m.title.toLowerCase().includes('managing') || m.title.toLowerCase().includes('director'));
    const totalDepts = STAFF_DIRECTORY.length;
    
    return (
        <div className="overflow-x-auto pb-12 pt-8 scrollbar-hide">
            <div className="flex flex-col items-center min-w-[1200px] px-8">
                {/* MD at top */}
                <div className="animate-slide-up-fade">
                    <OrgNode name={md?.name || 'Managing Director'} title={md?.title || 'MD'} imageUrl={md?.imageUrl} isTop />
                </div>
                
                {/* Connector line down to split */}
                <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-700"></div>
                
                {/* Horizontal connector bar */}
                <div className="relative w-full flex justify-center">
                    <div className="absolute top-0 h-0.5 bg-slate-200 dark:bg-slate-700" 
                         style={{ 
                             width: `calc(100% - (100% / ${totalDepts}))`,
                             left: `calc(50% / ${totalDepts})` 
                         }}>
                    </div>
                </div>
                
                {/* Department columns */}
                <div className="flex items-start justify-center w-full">
                    {STAFF_DIRECTORY.map((dept, i) => (
                        <div key={dept.name} className="flex flex-col items-center flex-1 px-2">
                            {/* Vertical line up to horizontal bar */}
                            <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700"></div>
                            
                            {/* Department head */}
                            <div className="animate-slide-up-fade transition-all" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                                <OrgNode 
                                    name={dept.members[0]?.name || dept.name} 
                                    title={dept.name}
                                    isHead 
                                />
                            </div>
                            
                            {/* Team members below */}
                            <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="flex flex-col gap-3">
                                {dept.members.slice(1).map((member, idx) => (
                                    <div key={member.id} className="animate-slide-up-fade" style={{ animationDelay: `${0.2 + (i + idx) * 0.05}s` }}>
                                        <OrgNode name={member.name} title={member.role} isLeaf />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const StaffDirectory: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'directory' | 'orgchart'>('directory');
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

    const filteredDirectory = useMemo(() => {
        if (!searchTerm) return STAFF_DIRECTORY;
        const lowercasedTerm = searchTerm.toLowerCase();
        return STAFF_DIRECTORY.map(dept => ({
            ...dept,
            members: dept.members.filter(member => member.name.toLowerCase().includes(lowercasedTerm))
        })).filter(dept => dept.members.length > 0);
    }, [searchTerm]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto h-full animate-fadeIn bg-slate-50/50 dark:bg-transparent">
            <div className="max-w-7xl mx-auto pb-20">
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Nashua Command Structure</h1>
                            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Explore the nodes and hierarchies powering our workspace excellence.</p>
                        </div>
                        
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner shrink-0">
                            <button 
                                onClick={() => setViewMode('directory')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'directory' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                Directory
                            </button>
                            <button 
                                onClick={() => setViewMode('orgchart')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'orgchart' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Network className="w-3.5 h-3.5" />
                                Org Chart
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'directory' ? (
                    <div className="animate-fadeIn space-y-12">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-4">
                            {LEADERSHIP_TEAM.map(member => (
                                <TeamProfileCard 
                                    key={member.id}
                                    member={member}
                                    isPlaying={playingVideoId === member.id}
                                    onPlay={() => setPlayingVideoId(member.id)}
                                    onStop={() => setPlayingVideoId(null)}
                                    onLaunchVideo={() => setModalVideoUrl(member.videoUrl)}
                                />
                            ))}
                        </div>
                        
                        <div className="space-y-10">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Node Directory</h2>
                                <div className="relative max-w-md w-full">
                                    <input
                                        type="text"
                                        placeholder="Locate staff member..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full px-6 py-3 text-[11px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary transition-all"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-12">
                                {filteredDirectory.map(dept => (
                                    <div key={dept.name} className="animate-slide-up-fade">
                                        <h3 className="text-[10px] font-black text-[#0d9488] uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                            {dept.name}
                                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {dept.members.map(member => (
                                                <div key={member.id} className="p-6 bg-white dark:bg-slate-800/80 rounded-[2rem] flex justify-between items-center shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-xl hover:scale-[1.02] transition-all group">
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-[#0d9488] transition-colors">{member.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{member.role}</p>
                                                    </div>
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusClasses[member.status].bg} ${statusClasses[member.status].text} border border-current opacity-70`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${statusClasses[member.status].dot}`} />
                                                        {member.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800/40 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm min-h-[600px] animate-fadeIn">
                        <OrgChart />
                    </div>
                )}
                
                {modalVideoUrl && <VideoModal videoUrl={modalVideoUrl} onClose={() => setModalVideoUrl(null)} />}
            </div>
        </div>
    );
}
