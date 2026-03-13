import React, { lazy, Suspense, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import type { AppView } from '../types';
import { 
    HomeIcon, 
    BookOpenIcon, 
    ClipboardDocumentListIcon,
    AcademicCapIcon,
    UsersIcon,
    AivaLogo,
    MenuIcon,
    CloseIcon,
    SunIcon,
    MoonIcon
} from './icons';
import { TrainingCenter } from './TrainingCenter';
import { StaffDirectory } from './StaffDirectory';
import { TRAINING_MODULES } from '../constants/trainingModules';
import OnboardingJourney from './OnboardingJourney';
import { SkeletonDashboard } from './SkeletonLoader';
import { CommandPalette } from './CommandPalette';
import { DropZone } from './DropZone';
import { Settings, LogOut, HelpCircle, User, ChevronLeft, ChevronRight, ChevronDown, MessageCircle } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

const HrPortal = lazy(() => import('./HrPortal'));
const StaffDashboard = lazy(() => import('./StaffDashboard'));

const SidebarItem: React.FC<{ 
    label: string; 
    icon: any; 
    isActive: boolean; 
    onClick: () => void; 
    isExpanded: boolean;
}> = ({ label, icon: Icon, isActive, onClick, isExpanded }) => (
    <li>
        <button 
            onClick={onClick} 
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all relative group overflow-hidden ${
                isActive 
                ? 'bg-[#0d9488]/10 text-[#0d9488]' 
                : 'text-[#64748b] hover:text-[#0d9488] hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
        >
            <Icon className={`h-5 w-5 shrink-0 transition-all ${isActive ? 'text-[#0d9488]' : 'text-current'} ${!isExpanded ? 'mx-auto' : 'mr-3'}`} />
            <span className={`truncate font-bold uppercase text-[10px] tracking-widest transition-all duration-200 ${
                isExpanded ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 -ml-4'
            }`}>
                {label}
            </span>
            {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#0f172a] text-white text-[10px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap border border-white/10 shadow-2xl translate-x-2 group-hover:translate-x-0">
                    {label}
                </div>
            )}
        </button>
    </li>
);

export const EmployeePortal: React.FC = () => {
    const { activeView, setActiveView, isManager, isMenuOpen, setIsMenuOpen, currentUser, currentHire, handleGoHome, setIsCopilotOpen, theme, setTheme, setHomeActiveTab } = useAppContext();
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useClickOutside(userMenuRef as any, () => setIsUserMenuOpen(false));

    const isExpanded = isSidebarPinned || isSidebarHovered;
    const effectiveView = (!isManager && activeView === 'home') ? 'onboarding' : activeView;

    // Clear localStorage session data + any module-level signature store, then
    // delegate full auth/persona reset to AppContext's handleGoHome.
    const handleLogout = () => {
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
        // Wipe form drafts and session prefs
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('aiva_form_draft_') || k.startsWith('aiva-'))) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
        // Wipe the module-level signature store used by SignaturePicker.
        // Keyed as 'aiva_saved_signature' — adjust if your key differs.
        try { localStorage.removeItem('aiva_saved_signature'); } catch { /* ignore */ }
        // AppContext resets isAuthenticated, persona, currentHire, activeView
        handleGoHome();
    };

    const handleNavigation = (view: AppView, tab?: any) => {
        if (view === 'home' && tab) setHomeActiveTab(tab);
        setActiveView(view);
        setIsMenuOpen(false);
    };

    const renderContent = () => {
        switch (effectiveView) {
            case 'home':       return <Suspense fallback={<SkeletonDashboard />}><StaffDashboard /></Suspense>;
            case 'onboarding': return <OnboardingJourney />;
            case 'policies':   return <Suspense fallback={<SkeletonDashboard />}><HrPortal /></Suspense>;
            case 'training':   return <TrainingCenter allModules={TRAINING_MODULES} />;
            case 'directory':  return <StaffDirectory />;
            default: return isManager
                ? <Suspense fallback={<SkeletonDashboard />}><StaffDashboard /></Suspense>
                : <OnboardingJourney />;
        }
    };

    const menuItems: { label: string; icon: any; view: AppView; tab?: any }[] = [];
    if (isManager) menuItems.push({ label: "Dashboard", icon: HomeIcon, view: 'home' });
    menuItems.push({ label: "Onboarding", icon: ClipboardDocumentListIcon, view: 'onboarding' });
    menuItems.push({ label: "Policies",   icon: BookOpenIcon,              view: 'policies'   });
    menuItems.push({ label: "Training",   icon: AcademicCapIcon,           view: 'training'   });
    menuItems.push({ label: "Our Team",   icon: UsersIcon,                 view: 'directory'  });

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    return (
        <DropZone>
            <div className="flex h-full relative overflow-hidden bg-transparent transition-colors duration-300">
                <CommandPalette />
                
                {/* Desktop Sidebar */}
                <aside 
                    onMouseEnter={() => setIsSidebarHovered(true)}
                    onMouseLeave={() => setIsSidebarHovered(false)}
                    className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 transition-all duration-300 ease-in-out z-50 shadow-sm ${isExpanded ? 'w-64' : 'w-[72px]'}`}
                >
                    <div className="h-24 md:h-28 flex items-center justify-center border-b border-slate-100 dark:border-white/5 shrink-0 overflow-hidden">
                        {!isExpanded ? (
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                <AivaLogo className="h-10 w-auto !brightness-100" />
                            </div>
                        ) : (
                            <div className="px-6 w-full animate-fadeIn flex justify-center py-6">
                                <AivaLogo className="h-16 w-auto transition-transform duration-700 !brightness-100" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 py-8 space-y-8 custom-scrollbar overflow-x-hidden">
                        <div>
                            <p className={`px-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4 transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                                Menu
                            </p>
                            <ul className="space-y-1">
                                {menuItems.map((item) => (
                                    <SidebarItem 
                                        key={item.label}
                                        label={item.label} 
                                        icon={item.icon} 
                                        isActive={effectiveView === item.view} 
                                        onClick={() => handleNavigation(item.view, item.tab)} 
                                        isExpanded={isExpanded} 
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-white/5 shrink-0">
                        <button 
                            onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                            className="w-full py-3 flex items-center justify-center text-[#64748b] hover:text-[#0d9488] hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all overflow-hidden"
                        >
                            {isExpanded ? (
                                <div className="flex items-center gap-3 animate-fadeIn whitespace-nowrap">
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lock Sidebar</span>
                                </div>
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-transparent">
                    <header className="h-16 md:h-20 shrink-0 border-b border-slate-200 dark:border-white/5 glass-panel z-40 flex items-center px-4 md:px-8 justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-slate-500 md:hidden">
                                <MenuIcon className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-4">
                                <h2 className="hidden md:block text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                    {effectiveView === 'home' ? 'Dashboard' : 
                                     effectiveView === 'onboarding' ? 'Onboarding Journey' :
                                     effectiveView === 'training' ? 'Training' : 
                                     effectiveView === 'directory' ? 'Our Team' : 'HR Policies'}
                                </h2>
                                <div className="md:hidden flex items-center"><AivaLogo className="h-14 w-auto !brightness-100" /></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-6">
                            {isManager && currentHire && (
                                <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-brand-primary/5 rounded-full border border-brand-primary/10">
                                    <div className="w-1.5 h-1.5 bg-[#0d9488] rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        Viewing: <span className="text-brand-primary">{currentHire.staff_name}</span>
                                    </span>
                                </div>
                            )}

                            <button 
                                onClick={() => setIsCopilotOpen(true)}
                                className="p-2.5 bg-[#0d9488]/10 text-[#0d9488] hover:bg-[#0d9488]/20 rounded-xl transition-all flex items-center gap-2 border border-[#0d9488]/10"
                                title="Talk to AIVA"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">AIVA</span>
                            </button>

                            {isManager && (
                                <button 
                                    onClick={toggleTheme}
                                    className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all"
                                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                                >
                                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                </button>
                            )}

                            {isManager ? (
                                <div className="flex items-center gap-2 md:gap-4 relative" ref={userMenuRef}>
                                    <button 
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200 dark:border-white/5 group"
                                    >
                                        <div className="hidden sm:block text-right">
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none group-hover:text-[#0d9488] transition-colors">{currentUser?.name?.split(' ')[0] || 'ADMIN'}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manager Access</p>
                                        </div>
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#0d9488]/10 flex items-center justify-center text-[#0d9488] border border-[#0d9488]/20 shadow-sm group-hover:scale-105 transition-transform">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn py-2 z-50">
                                            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left">
                                                <Settings className="w-4 h-4" /> Profile Settings
                                            </button>
                                            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left">
                                                <HelpCircle className="w-4 h-4" /> Help & Support
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left uppercase tracking-widest"
                                            >
                                                <LogOut className="w-4 h-4" /> Log Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 md:gap-4 pl-4 border-l border-slate-200 dark:border-white/5">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{currentHire?.staff_name || currentUser?.name || 'New Hire'}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{currentHire ? 'Onboarding' : 'New Hire'}</p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                                        title="Log Out"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    <main className="flex-1 relative overflow-hidden">
                        <div className="absolute inset-0 overflow-y-auto copilot-scrollbar">
                            {renderContent()}
                        </div>
                    </main>
                </div>

                {/* Mobile slide-out menu */}
                <div className={`fixed inset-y-0 left-0 z-[150] w-72 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <AivaLogo className="h-12 w-auto !brightness-100" />
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-3xl mb-8 border border-slate-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-2xl bg-[#0d9488]/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-[#0d9488]" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">{currentHire?.staff_name || currentUser?.name || 'New Hire'}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{isManager ? 'Manager' : 'Staff Member'}</p>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-2">
                            {menuItems.map((item) => (
                                <button 
                                    key={item.label}
                                    onClick={() => handleNavigation(item.view, item.tab)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left font-bold text-sm ${
                                        effectiveView === item.view 
                                        ? 'bg-[#0d9488]/10 text-[#0d9488]' 
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                            <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />
                            {isManager && (
                                <button onClick={toggleTheme} className="w-full flex items-center gap-4 p-4 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all text-left">
                                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </button>
                            )}
                            <button className="w-full flex items-center gap-4 p-4 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all text-left">
                                <Settings className="w-5 h-5" /> Settings
                            </button>
                            <button className="w-full flex items-center gap-4 p-4 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all text-left">
                                <HelpCircle className="w-5 h-5" /> Help & Support
                            </button>
                        </nav>

                        <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-rose-500 font-black uppercase tracking-widest text-[10px] hover:bg-rose-500/10 rounded-2xl transition-all mt-auto border-t border-slate-100 dark:border-white/5 pt-6 text-left">
                            <LogOut className="w-5 h-5" /> Log Out
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="fixed inset-0 bg-black/60 z-[140] md:hidden backdrop-blur-sm animate-fadeIn" onClick={() => setIsMenuOpen(false)} />
                )}
            </div>
        </DropZone>
    );
};
