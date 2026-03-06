
import React, { useState } from 'react';
import { HR_POLICY_SECTIONS, HrSectionId } from '../../constants/hrConstants';
import { GeminiButton } from './GeminiButton';
import { ZapIcon } from '../hr_icons/ZapIcon';
import { MailIcon } from '../hr_icons/MailIcon';
import { AiSparkIcon, SpeakerWaveIcon, CalendarOffIcon } from '../icons';
import { useAppContext } from '../../context/AppContext';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { LeaveRequestForm } from './LeaveRequestForm';

interface HrContentProps {
    activeSectionId: HrSectionId;
}

const PolicyCard: React.FC<{ children: React.ReactNode, sectionId: HrSectionId, content: string, onAction?: () => void }> = ({ children, sectionId, content, onAction }) => {
    const { initiateContextualChat, language } = useAppContext();
    const { speak } = useTextToSpeech();
    const [isReading, setIsReading] = useState(false);
    
    const sectionTitle = HR_POLICY_SECTIONS.find(s => s.id === sectionId)?.title || 'this section';
    
    const handleAnalyzeClick = () => {
        initiateContextualChat(`Please summarize the key points of the "${sectionTitle}" section for me.`);
    }
    
    const handleSimplifyClick = () => {
        initiateContextualChat(`Explain the "${sectionTitle}" content to me like I'm 5 years old. Use simple language and examples.`);
    }

    const handleReadClick = async () => {
        setIsReading(true);
        await speak(`I will now translate and read the ${sectionTitle} content to you in your selected language.`);
        await speak(content);
        setIsReading(false);
    }

    const handleDraftRequestClick = () => {
        if (onAction) {
            onAction();
            return;
        }

        let prompt = "";
        if (sectionId === 'leave') {
            prompt = "Draft a professional email to my manager to request annual leave, including placeholders for dates.";
        } else if (sectionId === 'development') {
            prompt = "Draft a professional email to my manager requesting approval for educational assistance for a course.";
        } else if (sectionId === 'roles') {
            prompt = "Draft a professional email to my manager requesting a role KPA review meeting based on the Sales Executive (PWC P1) job description.";
        }
        if (prompt) initiateContextualChat(prompt);
    }

    return (
         <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-xl group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                <AiSparkIcon className="w-48 h-48" />
            </div>
            <div className="hr-prose max-w-none text-slate-600 dark:text-slate-400 relative z-10 leading-relaxed">
                {children}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-700 not-prose flex gap-3 flex-wrap relative z-10">
                <button 
                    onClick={handleAnalyzeClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-secondary/5 text-brand-secondary rounded-xl text-[11px] font-black uppercase tracking-widest border border-brand-secondary/10 hover:bg-brand-secondary/10 transition-all"
                >
                    <ZapIcon className="w-4 h-4" />
                    Summarize
                </button>
                <button 
                    onClick={handleSimplifyClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/5 text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-widest border border-amber-500/10 hover:bg-amber-500/10 transition-all"
                >
                    <AiSparkIcon className="w-4 h-4" />
                    Explain Simply
                </button>
                <button 
                    onClick={handleReadClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-600 hover:bg-slate-100 transition-all"
                >
                    <SpeakerWaveIcon className={`w-4 h-4 ${isReading ? 'animate-pulse text-voltage' : ''}`} />
                    Aiva Read Aloud
                </button>
                {(sectionId === 'leave' || sectionId === 'development' || sectionId === 'roles') && (
                     <button 
                        onClick={handleDraftRequestClick}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-voltage text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                     >
                        {sectionId === 'leave' ? <CalendarOffIcon className="w-4 h-4" /> : <MailIcon className="w-4 h-4" />}
                        {sectionId === 'leave' ? 'Submit Request' : 'Draft Request'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const HrContent: React.FC<HrContentProps> = ({ activeSectionId }) => {
    const [isRequestingLeave, setIsRequestingLeave] = useState(false);

    const renderContent = () => {
        switch(activeSectionId) {
            case 'home':
                return (
                    <div className="hr-prose max-w-none">
                        <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><AiSparkIcon className="w-64 h-64" /></div>
                            <h2 className="!mt-0 text-3xl font-black uppercase tracking-tighter italic">Welcome to the Nashua Strategic Fabric</h2>
                            <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">At Nashua Paarl & West Coast, we recognise that our employees are the primary force multiplier of our success. Nothing can be achieved without your strategic engagement.</p>
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 group hover:border-voltage/40 transition-colors">
                                    <h3 className="!mt-0 !text-xl font-black text-brand-secondary uppercase tracking-widest mb-4">Our Vision</h3>
                                    <p className="text-base text-slate-600 dark:text-slate-400 font-medium">To be the leading provider of Total Workspace Solutions, transitioning customers from paper-focus to symbiotic AI-focus.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 group hover:border-voltage/40 transition-colors">
                                    <h3 className="!mt-0 !text-xl font-black text-amber-500 uppercase tracking-widest mb-4">Our Mission</h3>
                                    <p className="text-base text-slate-600 dark:text-slate-400 font-medium">To ensure that customers are at the core of innovative hardware and software ideas that drive measurable ROI.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'roles': {
                const rolesContent = "The Sales Executive (PWC P1) role focuses on relationship-based sales, daily iNForm CRM logging, and monthly My-Ricoh training attainment.";
                return (
                    <PolicyCard sectionId={activeSectionId} content={rolesContent}>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Career & Role Specifications</h2>
                        <p className="text-lg font-medium text-slate-500 mt-2">Below is the master blueprint for the **Sales Executive (PWC P1)** role at Nashua Paarl.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <h4 className="font-black text-voltage uppercase text-xs tracking-[0.2em] mb-6">Key Performance Areas (KPAs)</h4>
                                <ul className="text-sm space-y-4 font-bold text-slate-700 dark:text-slate-300">
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-voltage mt-1.5 shrink-0 shadow-[0_0_8px_#FFB800]"></div>
                                        <span>Relationship-based sales for existing/prospective orders.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-voltage mt-1.5 shrink-0 shadow-[0_0_8px_#FFB800]"></div>
                                        <span>Daily usage of <strong>iNForm CRM</strong> for all logging.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-voltage mt-1.5 shrink-0 shadow-[0_0_8px_#FFB800]"></div>
                                        <span>Achievement of monthly published targets.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <h4 className="font-black text-brand-secondary uppercase text-xs tracking-[0.2em] mb-6">Operational Standards</h4>
                                <ul className="text-sm space-y-4 font-bold text-slate-700 dark:text-slate-300">
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-secondary mt-1.5 shrink-0 shadow-[0_0_8px_#3b82f6]"></div>
                                        <span>Maintain active vertical market lists.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-secondary mt-1.5 shrink-0 shadow-[0_0_8px_#3b82f6]"></div>
                                        <span>Attain monthly **highest level on My-Ricoh training**.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </PolicyCard>
                );
            }
            case 'employment': {
                const empContent = "Afridroids defines several types of employment contracts, including Full-time/Permanent and Temporary/Limited duration contracts. New employees undergo a 3 to 6 month probation period.";
                return (
                    <PolicyCard sectionId={activeSectionId} content={empContent}>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Employment Framework</h2>
                        <p className="text-base font-medium mt-4">{empContent} Our policy ensures resourcing is informed by sound human capital processes and fair labour practices in the Western Cape region.</p>
                    </PolicyCard>
                );
            }
            case 'remuneration': {
                const remContent = "Afridroids manages fixed remuneration using Total Cost to Company (TCTC), reviewed annually in October. It excludes variable pay like commissions and bonuses.";
                return <PolicyCard sectionId={activeSectionId} content={remContent}><h2 className="text-2xl font-black uppercase tracking-tighter">Remuneration (TCTC)</h2><p className="text-base font-medium mt-4">{remContent} Employees receiving commission are subject to the rules of the specific scheme. Commissions are not part of the TCTC guaranteed package.</p></PolicyCard>;
            }
            case 'leave': {
                const leaveContent = "Employees get 15 annual leave days per year, and 30 days of paid sick leave in a 36-month cycle. Medical certificates are needed for absences over 2 days.";
                if (isRequestingLeave) {
                    return <LeaveRequestForm onCancel={() => setIsRequestingLeave(false)} />;
                }
                return (
                    <PolicyCard sectionId={activeSectionId} content={leaveContent} onAction={() => setIsRequestingLeave(true)}>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Leave Protocols</h2>
                        <p className="text-base font-medium mt-4">{leaveContent} 3 days of family responsibility leave are granted per year. Maternity and parental leave are granted in accordance with the BCEA.</p>
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                             <p className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                <AiSparkIcon className="w-4 h-4" /> Strategic Tip
                             </p>
                             <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">You can submit your formal leave request directly via the form below or using voice commands in the Aiva Co-Pilot.</p>
                        </div>
                    </PolicyCard>
                );
            }
            case 'development': {
                const devContent = "Afridroids offers financial assistance for studies related to an employee's role, typically as an interest-free loan waived upon completion.";
                return <PolicyCard sectionId={activeSectionId} content={devContent}><h2 className="text-2xl font-black uppercase tracking-tighter">Skills Development</h2><p className="text-base font-medium mt-4">{devContent} Learning is core to the Nashua culture. We provide ongoing training for technical certifications in Print, IT, and Solar solutions.</p></PolicyCard>;
            }
            case 'performance': {
                const perfContent = "Performance management is ongoing with quarterly reviews in December, March, June, and August. It aligns individual actions with strategic objectives.";
                return <PolicyCard sectionId={activeSectionId} content={perfContent}><h2 className="text-2xl font-black uppercase tracking-tighter">Performance Management</h2><p className="text-base font-medium mt-4">{perfContent} A high-performance culture is key. This process facilitates communication and provides a basis for strategic remuneration decisions.</p></PolicyCard>;
            }
            case 'wellness': {
                const wellContent = "The Afridroids Employee Wellness Programme focuses on improving business effectiveness by supporting all aspects of employee health.";
                return <PolicyCard sectionId={activeSectionId} content={wellContent}><h2 className="text-2xl font-black uppercase tracking-tighter">Employee Wellness</h2><p className="text-base font-medium mt-4">{wellContent} Our success depends on the well-being of our employees. Wellness initiatives are developed and communicated annually.</p></PolicyCard>;
            }
            default:
                return null;
        }
    };
    
    return <div key={activeSectionId} className="animate-fadeIn">{renderContent()}</div>;
};
