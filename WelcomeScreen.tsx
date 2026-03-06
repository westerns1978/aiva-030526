





import React from 'react';
import type { PersonaKey } from './constants/personas';
import { BriefcaseIcon, ClipboardDocumentCheckIcon, UserCheckIcon } from './components/icons';
import { useAppContext } from './context/AppContext';

const RoleSelectionButton: React.FC<{ title: string; subtitle: string; Icon: React.FC<any>, onClick: () => void }> = ({ title, subtitle, Icon, onClick }) => (
    <button
        onClick={onClick}
        className="group w-full max-w-sm text-left p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border-2 border-white/80 dark:border-slate-700/80 shadow-lg hover:shadow-2xl hover:border-brand-secondary dark:hover:border-brand-secondary hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-secondary/50"
    >
        <div className="flex items-center gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-brand-light dark:bg-brand-dark text-brand-primary dark:text-brand-secondary flex items-center justify-center">
                <Icon className="w-9 h-9" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
            </div>
        </div>
    </button>
);


const WelcomeScreen: React.FC = () => {
    const { setPersona, openModal } = useAppContext();
    
    const handleRoleSelect = (selectedPersona: PersonaKey) => {
        setPersona(selectedPersona);
        if (selectedPersona === 'farm_worker') {
            openModal('seasonalOnboarding');
        } else if (selectedPersona === 'visitor') {
            openModal('visitorCheckIn');
        }
    };
    
    return (
        <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fadeIn">
            <main className="flex-1 w-full flex flex-col items-center justify-center h-full text-center">
                <video
                    src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4"
                    autoPlay loop muted playsInline
                    className="w-48 h-48 rounded-full object-cover shadow-2xl shadow-brand-secondary/20 border-4 border-white dark:border-slate-700 mb-6"
                    aria-label="Aiva animated avatar"
                />
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark dark:text-white leading-tight max-w-2xl">
                    Hello, I'm Aiva.
                </h2>
                <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg">
                    Your virtual assistant for HR and training. Please tell me who you are to get started.
                </p>
                <div className="mt-10 flex flex-col items-center gap-6">
                    <RoleSelectionButton title="Seasonal Worker" subtitle="Start your onboarding journey" Icon={ClipboardDocumentCheckIcon} onClick={() => handleRoleSelect('farm_worker')} />
                    <RoleSelectionButton title="Employee / Manager" subtitle="Access dashboard, policies, and more" Icon={BriefcaseIcon} onClick={() => handleRoleSelect('employee')} />
                    <RoleSelectionButton title="Visitor" subtitle="Check in and meet your host" Icon={UserCheckIcon} onClick={() => handleRoleSelect('visitor')} />
                </div>
            </main>
        </div>
    );
};

export default WelcomeScreen;