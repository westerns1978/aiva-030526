import React, { useState } from 'react';
import { FileText, ExternalLink, ChevronDown, ChevronUp, Wrench, Calculator } from 'lucide-react';

interface JobDescription {
  id: string;
  title: string;
  file_url: string;
  branch: string;
}

interface JobDescriptionSelectorProps {
  jobDescriptions: JobDescription[];
  selectedId: string;
  onSelect: (id: string) => void;
  isUploadingJD?: boolean;
  onUploadClick?: () => void;
}

const DEPT_CONFIG: Record<string, { label: string; icon: React.FC<any>; color: string; bg: string; border: string }> = {
  'Engineering': {
    label: 'Engineering',
    icon: Wrench,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  'Admin & Finance': {
    label: 'Admin & Finance',
    icon: Calculator,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  'Other': {
    label: 'Other Roles',
    icon: FileText,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
};

const ENGINEERING_TITLES = ['Workshop Engineer', 'Service Controller', 'Senior Field Engineer', 'Field Engineer'];
const ADMIN_TITLES = ['Purchasing Administrator', 'Credit Controller', 'Accounts Payable & Purchasing', 'Contracts Administrator'];

function getDept(title: string): string {
  if (ENGINEERING_TITLES.some(t => title.includes(t.split(' ')[0]) || title === t)) return 'Engineering';
  if (ADMIN_TITLES.some(t => title.includes(t.split(' ')[0]) || title === t)) return 'Admin & Finance';
  return 'Other';
}

export const JobDescriptionSelector: React.FC<JobDescriptionSelectorProps> = ({
  jobDescriptions,
  selectedId,
  onSelect,
  isUploadingJD,
  onUploadClick,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(['Engineering', 'Admin & Finance', 'Other']));

  const selectedJD = jobDescriptions.find(j => j.id === selectedId);

  // Group by department
  const grouped: Record<string, JobDescription[]> = {};
  jobDescriptions.forEach(jd => {
    const dept = getDept(jd.title);
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(jd);
  });

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Label Row */}
      <div className="flex justify-between items-center ml-1">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Job Description
        </label>
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            disabled={isUploadingJD}
            className="text-[9px] font-black text-[#0d9488] hover:text-[#0a7c72] uppercase tracking-widest flex items-center gap-1 transition-colors"
          >
            + Upload New JD
          </button>
        )}
      </div>

      {/* Selected Preview Banner */}
      {selectedJD && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d9488]/10 border border-[#0d9488]/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-[#0d9488] shrink-0" />
            <div>
              <p className="text-[10px] font-black text-[#0d9488] uppercase tracking-wide leading-none">{selectedJD.title}</p>
              <p className="text-[8px] text-slate-400 font-bold mt-0.5">{selectedJD.branch}</p>
            </div>
          </div>
          {selectedJD.file_url && (
            <button
              onClick={() => setPreviewUrl(previewUrl === selectedJD.file_url ? null : selectedJD.file_url)}
              className="text-[8px] font-black text-[#0d9488] uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <ExternalLink className="w-3 h-3" />
              {previewUrl ? 'Hide' : 'Preview'}
            </button>
          )}
        </div>
      )}

      {/* PDF Preview */}
      {previewUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 shadow-inner" style={{ height: '220px' }}>
          <iframe
            src={previewUrl}
            className="w-full h-full"
            title="JD Preview"
          />
        </div>
      )}

      {/* Grouped Card Selector */}
      <div className="space-y-2 max-h-64 overflow-y-auto copilot-scrollbar pr-1">
        {Object.entries(grouped).map(([dept, cards]) => {
          const cfg = DEPT_CONFIG[dept] || DEPT_CONFIG['Other'];
          const Icon = cfg.icon;
          const isExpanded = expandedDepts.has(dept);

          return (
            <div key={dept} className="rounded-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
              {/* Dept Header */}
              <button
                onClick={() => toggleDept(dept)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded-lg ${cfg.bg}`}>
                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[8px] text-slate-400 font-bold">({cards.length})</span>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                }
              </button>

              {/* Cards */}
              {isExpanded && (
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {cards.map(jd => {
                    const isSelected = jd.id === selectedId;
                    return (
                      <button
                        key={jd.id}
                        onClick={() => {
                          onSelect(jd.id);
                          setPreviewUrl(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-all text-left ${
                          isSelected
                            ? 'bg-[#0d9488]/5 dark:bg-[#0d9488]/10'
                            : 'bg-white dark:bg-[#1a1f2e] hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${isSelected ? 'bg-[#0d9488]' : 'bg-slate-200 dark:bg-white/10'}`} />
                          <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-[#0d9488]' : 'text-slate-700 dark:text-slate-300'}`}>
                            {jd.title}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[7px] font-black text-[#0d9488] uppercase tracking-widest bg-[#0d9488]/10 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {jobDescriptions.length === 0 && (
          <div className="text-center py-6 text-[9px] text-slate-400 font-black uppercase tracking-widest">
            No job descriptions found
          </div>
        )}
      </div>
    </div>
  );
};
