
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import type { Language, AppView, ModalType, ChatMessage, Bridge, Scanner, Job } from '../types';
import type { PersonaKey } from '../constants/personas';
import { PermanentStaff } from '../types';
import { TRAINING_MODULES } from '../constants/trainingModules';
import { MOCK_PERMANENT_STAFF } from '../constants/permanentStaff';
import { ANNOUNCEMENTS, type Announcement } from '../constants/announcements';
import { westflow } from '../services/westflowClient';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { mcpService, type McpStatus } from '../services/mcpService';
import { storageService } from '../services/storageService';
import { usePersistentSession } from '../hooks/usePersistentSession';

export type Theme = 'light' | 'dark' | 'system';
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastMessage { id: number; message: string; type: ToastType; }

export type HubFilter = 'all' | 'stalled' | 'completed';
export type HomeTab = 'overview' | 'pipeline' | 'dispatch' | 'documents' | 'registration' | 'hr_sync';

interface AppContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    languageSelected: boolean;
    setLanguageSelected: (selected: boolean) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    persona: PersonaKey | null;
    setPersona: (persona: PersonaKey | null, employeeNumber?: string) => void;
    currentUser: PermanentStaff | null;
    isManager: boolean;
    activeView: AppView;
    setActiveView: (view: AppView) => void;
    homeActiveTab: HomeTab;
    setHomeActiveTab: (tab: HomeTab) => void;
    hubActiveTab: 'matrix' | 'induction' | 'dispatch' | 'vault';
    setHubActiveTab: (tab: 'matrix' | 'induction' | 'dispatch' | 'vault') => void;
    hubFilter: HubFilter;
    setHubFilter: (filter: HubFilter) => void;
    focusedHireId: string | null;
    setFocusedHireId: (id: string | null) => void;
    initiateContextualChat: (prompt: string) => void;
    initialPrompt: string | null;
    setInitialPrompt: React.Dispatch<React.SetStateAction<string | null>>;
    handleGoHome: () => void;
    activeModal: ModalType | null;
    openModal: (modal: ModalType) => void;
    closeModal: () => void;
    trainingStatus: any;
    updateTrainingProgress: (moduleId: string, progress: number) => void;
    completeQuiz: (moduleId: string, passed: boolean) => void;
    signCertificate: (moduleId: string, signature: string) => void;
    isMenuOpen: boolean;
    setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCopilotOpen: boolean;
    setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
    toasts: ToastMessage[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: number) => void;
    triggerSuccessFeedback: (message?: string) => void;
    announcements: Announcement[];
    isCommandPaletteOpen: boolean;
    setIsCommandPaletteOpen: (open: boolean) => void;
    activeJobId: string | null;
    activeMediaUrl: string | null;
    openMedia: (url: string) => void;
    closeMedia: () => void;
    
    // Routing States
    isAuthenticated: boolean;
    kioskMode: boolean;
    setKioskMode: (val: boolean) => void;
    isIdentified: boolean;
    setIsIdentified: (val: boolean) => void;

    // Neural Bridge for Single Voice Authority
    triggerAivaSpeech: (text: string) => void;
    setAivaSpeechTrigger: (fn: (text: string) => void) => void;
    isAivaSpeaking: boolean;
    setIsAivaSpeaking: (speaking: boolean) => void;
    isAivaLiveActive: boolean;
    setIsAivaLiveActive: (active: boolean) => void;

    // Identified Hire context
    identifiedName: string | null;
    workerId: string | null;
    currentHire: any | null;
    currentHireId: string | null; 
    setCurrentHire: (hire: any) => void;
    setCurrentHireId: (id: string | null) => void;

    // Session-based onboarding states
    activeSessionId: string | null;
    setActiveSessionId: (id: string | null) => void;
    expectedPin: string | null;
    setExpectedPin: (pin: string | null) => void;

    // Refresh synchronization
    hubRefreshKey: number;
    triggerHubRefresh: () => void;

    mcpStatus: McpStatus;
    jobs: Job[];
    processDroppedFile: (file: File) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { 
        isAuthenticated, 
        user: sessionUser, 
        login: sessionLogin, 
        logout: sessionLogout,
        saveView,
        getSavedView 
    } = usePersistentSession();

    const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('aiva-language-preference') as Language) || 'en-ZA');
    const [languageSelected, setLanguageSelected] = useState(false);
    const [activeView, setActiveViewState] = useState<AppView>('home');
    const [homeActiveTab, setHomeActiveTab] = useState<HomeTab>('overview');
    const [hubActiveTab, setHubActiveTab] = useState<'matrix' | 'induction' | 'dispatch' | 'vault'>('matrix');
    const [hubFilter, setHubFilter] = useState<HubFilter>('all');
    const [focusedHireId, setFocusedHireId] = useState<string | null>(null);
    const [persona, setPersona] = useState<PersonaKey | null>(null);
    const [currentUser, setCurrentUser] = useState<PermanentStaff | null>(null);
    const [isManager, setIsManager] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
    const [announcements] = useState<Announcement[]>(ANNOUNCEMENTS);
    const [activeJobId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType | null>(null);
    const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
    const [trainingStatus, setTrainingStatus] = useState<any>(() => {
        const status: any = {};
        TRAINING_MODULES.forEach(m => status[m.id] = { progress: 0, completed: false, certified: false });
        return status;
    });

    const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('aiva-theme-preference') as Theme) || 'light');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [mcpStatus, setMcpStatus] = useState<McpStatus>('disconnected');
    const [jobs] = useState<Job[]>([]);

    // Routing States
    const [kioskMode, setKioskMode] = useState(false);
    const [isIdentified, setIsIdentified] = useState(false);

    const [identifiedName, setIdentifiedName] = useState<string | null>(null);
    const [workerId, setWorkerId] = useState<string | null>(null);
    const [currentHire, setCurrentHireState] = useState<any | null>(null);
    const [currentHireId, setCurrentHireId] = useState<string | null>(null);
    
    // In-person session states
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [expectedPin, setExpectedPin] = useState<string | null>(null);
    
    const [hubRefreshKey, setHubRefreshKey] = useState(0);

    const [isAivaSpeaking, setIsAivaSpeaking] = useState(false);
    const [isAivaLiveActive, setIsAivaLiveActive] = useState(false);
    const speechTriggerRef = useRef<(text: string) => void>(() => {});

    const triggerHubRefresh = useCallback(() => {
        setHubRefreshKey(k => k + 1);
    }, []);

    const setActiveView = useCallback((view: AppView) => {
        setActiveViewState(view);
        saveView(view);
    }, [saveView]);

    const setCurrentHire = useCallback((hire: any) => {
        setCurrentHireState(hire);
        if (hire) {
            setWorkerId(hire.id);
            setCurrentHireId(hire.id); 
            setIdentifiedName(hire.staff_name);
        } else {
            setWorkerId(null);
            setCurrentHireId(null);
            setIdentifiedName(null);
        }
    }, []);

    const triggerAivaSpeech = useCallback((text: string) => {
        speechTriggerRef.current(text);
    }, []);

    const setAivaSpeechTrigger = useCallback((fn: (text: string) => void) => {
        speechTriggerRef.current = fn;
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(current => current.filter(t => t.id !== id)), 5000);
    }, []);

    const triggerSuccessFeedback = useCallback((message?: string) => {
        try {
            const chime = document.getElementById('neural-handshake') as HTMLAudioElement;
            if (chime) {
                chime.currentTime = 0;
                chime.play().catch(() => {
                    // Silently fail if blocked or 404
                });
            }
        } catch (e) {
            // Audio error safety wrapper
        }
        if (message) addToast(message, 'success');
    }, [addToast]);

    const openMedia = (url: string) => setActiveMediaUrl(url);
    const closeMedia = () => setActiveMediaUrl(null);

    const processDroppedFile = useCallback(async (file: File) => {
        addToast(`Ingesting ${file.name}...`, 'info');
        try {
            await storageService.uploadFile(file, file.name, 'vault', {
                source: 'drop-zone',
                ingested_at: new Date().toISOString()
            });
            triggerSuccessFeedback(`${file.name} synced to mesh.`);
        } catch (e) {
            addToast("Ingestion failure.", "error");
        }
    }, [addToast, triggerSuccessFeedback]);

    useEffect(() => {
        const handleStatusChange = (s: McpStatus) => setMcpStatus(s);
        mcpService.on('statusChange', handleStatusChange);
        mcpService.connect();
        return () => {
            mcpService.off('statusChange', handleStatusChange);
            mcpService.disconnect();
        };
    }, []);

    useKeyboardShortcuts({
        'ctrl+k': () => setIsCommandPaletteOpen(true),
        'ctrl+h': () => setActiveView('home'),
        'ctrl+space': () => setIsCopilotOpen(prev => !prev),
        'Escape': () => { setActiveModal(null); setActiveMediaUrl(null); setIsCommandPaletteOpen(false); },
    });

    const handleSetPersona = useCallback((p: PersonaKey | null, employeeNumber?: string) => {
        setPersona(p);
        if (p === 'manager') { 
            // Use provided employeeNumber (from login), default to Deon
            const empNum = employeeNumber || 'PW293';
            const user = MOCK_PERMANENT_STAFF.find(s => s.employeeNumber === empNum) || null;
            setCurrentUser(user);
            setIsManager(true);
            sessionLogin({ 
                name: user?.name || 'Deon Boshoff', 
                role: 'manager', 
                persona: 'manager' 
            });
        } else if (p === 'employee') {
            const user = MOCK_PERMANENT_STAFF.find(s => s.employeeNumber === 'S507') || null;
            setCurrentUser(user);
            setIsManager(false);
            sessionLogin({ 
                name: user?.name || 'Employee', 
                role: 'employee', 
                persona: 'employee' 
            });
        } else {
            setCurrentUser(null);
            setIsManager(false);
        }
        setActiveView('home');
    }, [sessionLogin, setActiveView]);

    useEffect(() => {
        if (sessionUser && !persona) {
            // Restore persona from session
            const timer = setTimeout(() => {
                handleSetPersona(sessionUser.persona as PersonaKey);
                const savedView = getSavedView();
                // Don't restore onboarding view without a hire selected - go home instead
                if (savedView && savedView !== 'onboarding') {
                    setActiveView(savedView as AppView);
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sessionUser, persona, handleSetPersona, getSavedView, setActiveView]);

    const handleGoHome = useCallback(() => {
        sessionLogout(); // Clears sessionStorage
        setKioskMode(false);
        setIsIdentified(false);
        setPersona(null);
        setLanguageSelected(false);
        setIsCopilotOpen(false);
        setActiveViewState('home');
        setHomeActiveTab('overview');
        setWorkerId(null);
        setIdentifiedName(null);
        setCurrentHireState(null);
        setCurrentHireId(null);
        setActiveModal(null);
        setIsManager(false);
        setCurrentUser(null);
        setActiveSessionId(null);
        setExpectedPin(null);
        window.location.hash = '';
        // Clear query params
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
    }, [sessionLogout]);

    const value: AppContextType = {
        language, setLanguage: (l) => { setLanguageState(l); localStorage.setItem('aiva-language-preference', l); },
        languageSelected, setLanguageSelected,
        theme, setTheme: (t) => { setThemeState(t); localStorage.setItem('aiva-theme-preference', t); },
        persona, setPersona: handleSetPersona,
        currentUser, isManager,
        activeView, setActiveView,
        homeActiveTab, setHomeActiveTab,
        hubActiveTab, setHubActiveTab,
        hubFilter, setHubFilter,
        focusedHireId, setFocusedHireId,
        initiateContextualChat: (p) => { setInitialPrompt(p); setIsCopilotOpen(true); },
        initialPrompt, setInitialPrompt,
        handleGoHome,
        activeModal, openModal: setActiveModal, closeModal: () => setActiveModal(null),
        trainingStatus,
        updateTrainingProgress: (id, p) => setTrainingStatus((s: any) => ({
            ...s,
            [id]: { ...s[id], progress: p, completed: p >= 100 }
        })),
        completeQuiz: (id, p) => setTrainingStatus((s: any) => ({
            ...s,
            [id]: { ...s[id], progress: 100, completed: p }
        })),
        signCertificate: (id, sig) => setTrainingStatus((s: any) => ({
            ...s,
            [id]: { ...s[id], certified: !!sig }
        })),
        isMenuOpen, setIsMenuOpen,
        isCopilotOpen, setIsCopilotOpen,
        toasts, addToast, removeToast: (id) => setToasts(s => s.filter(t => t.id !== id)),
        triggerSuccessFeedback,
        announcements,
        isCommandPaletteOpen, setIsCommandPaletteOpen,
        activeJobId,
        activeMediaUrl, openMedia, closeMedia,
        isAuthenticated,
        kioskMode, setKioskMode,
        isIdentified, setIsIdentified,
        triggerAivaSpeech, setAivaSpeechTrigger, isAivaSpeaking, setIsAivaSpeaking, isAivaLiveActive, setIsAivaLiveActive,
        identifiedName, workerId, currentHire, currentHireId, setCurrentHire, setCurrentHireId,
        activeSessionId, setActiveSessionId, expectedPin, setExpectedPin,
        hubRefreshKey, triggerHubRefresh,
        mcpStatus,
        jobs,
        processDroppedFile
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};
