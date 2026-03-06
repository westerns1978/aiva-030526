
import React from 'react';
import type { PersonaKey } from '../constants/personas';
import { BriefcaseIcon, ClipboardDocumentCheckIcon, UserCheckIcon, MicrophoneIcon } from './icons';
import { useAppContext } from '../context/AppContext';

const RoleSelectionButton: React.FC<{ title: string; subtitle: string; Icon: React.FC<any>, onClick: () => void, variant?: 'primary' | 'secondary' }> = ({ title, subtitle, Icon, onClick, variant = 'secondary' }) => (
    <button
        onClick={onClick}
        className={`group w-full max-w-sm text-left p-6 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-secondary/50 shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
            variant === 'primary' 
            ? 'bg-brand-primary text-white border-brand-primary hover:brightness-110' 
            : 'bg-white/60 dark:bg-slate-800/60 border-white/80 dark:border-slate-700/80 hover:border-brand-secondary'
        }`}
    >
        <div className="flex items-center gap-5">
            <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                variant === 'primary' ? 'bg-white/10' : 'bg-brand-light dark:bg-brand-dark'
            }`}>
                <Icon className={`w-9 h-9 ${variant === 'primary' ? 'text-white' : 'text-brand-primary dark:text-brand-secondary'}`} />
            </div>
            <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className={`mt-1 text-sm ${variant === 'primary' ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>{subtitle}</p>
            </div>
        </div>
    </button>
);


const WelcomeScreen: React.FC = () => {
    const { setPersona, openModal, setIsCopilotOpen, setInitialPrompt } = useAppContext();
    
    const handleRoleSelect = (selectedPersona: PersonaKey) => {
        setPersona(selectedPersona);
        if (selectedPersona === 'farm_worker') {
            openModal('seasonalOnboarding');
        } else if (selectedPersona === 'visitor') {
            openModal('visitorCheckIn');
        }
    };

    const handleVoiceStart = () => {
        setPersona('employee');
        setInitialPrompt("Hello Aiva. I'm here for my first day. Please guide me through the induction protocol using your voice.");
        setIsCopilotOpen(true);
    };
    
    return (
        <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fadeIn relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
            
            <main className="flex-1 w-full flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-brand-secondary/20 rounded-full blur-2xl animate-pulse"></div>
                    <video
                        src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4"
                        autoPlay loop muted playsInline
                        className="w-44 h-44 rounded-full object-cover shadow-2xl border-4 border-white dark:border-slate-700 relative z-10"
                        aria-label="Aiva animated avatar"
                    />
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight max-w-2xl uppercase italic tracking-tighter">
                    I am Aiva 2.0
                </h2>
                <p className="mt-4 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-lg font-medium leading-relaxed">
                    Your strategic guardian for Nashua Paarl. <br/>Choose a node to synchronize.
                </p>

                <div className="mt-12 flex flex-col items-center gap-4 w-full">
                    <RoleSelectionButton 
                        title="Voice Briefing" 
                        subtitle="Start hands-free induction" 
                        Icon={MicrophoneIcon} 
                        onClick={handleVoiceStart}
                        variant="primary"
                    />
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl justify-center">
                        <RoleSelectionButton title="Seasonal Worker" subtitle="Quick Onboarding" Icon={ClipboardDocumentCheckIcon} onClick={() => handleRoleSelect('farm_worker')} />
                        <RoleSelectionButton title="Employee / MD" subtitle="Strategic Dashboard" Icon={BriefcaseIcon} onClick={() => handleRoleSelect('employee')} />
                        <RoleSelectionButton title="Visitor" subtitle="Host Check-in" Icon={UserCheckIcon} onClick={() => handleRoleSelect('visitor')} />
                    </div>
                </div>
            </main>
            
            <footer className="py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-40">
                twAIn Universal Mesh • Node Paarl-HQ
            </footer>
        </div>
    );
};

export default WelcomeScreen;
