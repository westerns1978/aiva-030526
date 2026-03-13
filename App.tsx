
import React, { useEffect, useCallback } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import WelcomeScreen from './components/WelcomeScreen';
import { DocumentHub } from './components/DocumentHub';
import { RolePlayTraining } from './components/RolePlayTraining';
import { InterviewCoachModal as OperationalReadinessModal } from './components/InterviewCoachModal';
import { EmployeePortal } from './components/EmployeePortal';
import LanguageSelector from './components/LanguageSelector';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer } from './components/Toast';
import { AivaVision } from './components/AivaVision';
import { LocationFinderModal } from './components/LocationFinderModal';
import { AivaUnifiedChat } from './components/AivaUnifiedChat';
import { FloatingCoPilotButton } from './components/FloatingCoPilotButton';
import { ScanProgressModal } from './components/ScanProgressModal';
import { CertProgressModal } from './components/CertProgressModal';
import { VisitorCheckIn } from './components/VisitorCheckIn';
import SeasonalWorkerOnboarding from './components/seasonal_onboarding/SeasonalWorkerOnboarding';
import TimeAttendanceKiosk from './components/TimeAttendanceKiosk';
import { ProcessMapModal } from './components/ProcessMapModal';
import { LoginScreen } from './components/LoginScreen';
import { MediaViewerModal } from './components/MediaViewerModal';
import { PhoneIdentificationStep } from './components/PhoneIdentificationStep';
import { PinConfirmationScreen } from './components/PinConfirmationScreen';
import { westflow } from './services/westflowClient';
import { UUID_REGEX_LOOSE as UUID_REGEX } from './constants';

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    state = { hasError: false, error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[AIVA] Uncaught error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen flex items-center justify-center bg-slate-900 text-white text-center p-8">
                    <div className="max-w-md space-y-6">
                        <div className="text-6xl">⚠</div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Something went wrong</h1>
                        <p className="text-slate-400 text-sm">{this.state.error?.message || 'An unexpected error occurred.'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-[#0d9488] text-white font-black rounded-xl uppercase tracking-widest text-xs hover:brightness-110 transition-all"
                        >
                            Reload AIVA
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const MainAppContent: React.FC = () => {
    const {
        activeModal, closeModal, openModal,
        languageSelected, setLanguage, language,
        persona, setPersona,
        isCopilotOpen, setIsCopilotOpen,
        handleGoHome,
        setLanguageSelected,
        setActiveView,
        activeView,
        setCurrentHire,
        setCurrentHireId,
        addToast,
        activeJobId,
        theme,
        isAuthenticated,
        kioskMode, setKioskMode,
        isIdentified, setIsIdentified,
        activeSessionId, setActiveSessionId,
        expectedPin, setExpectedPin
    } = useAppContext();

    // --- REGISTRY HANDSHAKE: Dynamic Hire Discovery ---
    const loadHireData = useCallback(async (hireId: string) => {
        // Guard against malformed or premature IDs
        if (!hireId || !UUID_REGEX.test(hireId)) return;

        try {
            console.log(`[AIVA] Loading hire record: ${hireId}`);
            const result = await westflow.getHireDetails(hireId);
            
            if (result.success && result.data) {
                console.log(`✅ Hire record loaded: ${result.data.staff_name}`);
                setCurrentHire(result.data);
                setCurrentHireId(hireId);
                
                // Automatically route to Onboarding for candidates
                setPersona('employee');
                setActiveView('onboarding');
                setLanguageSelected(true);
                setIsIdentified(true);
            } else {
                // STALE HASH FIX: Clear hash if lookup fails
                window.location.hash = '';
                addToast("Previous session expired. Please identify again.", "info");
            }
        } catch (e) {
            console.error("[AIVA] Failed to load hire:", e);
            window.location.hash = '';
            addToast("Could not load your record. Please enter your mobile number.", "error");
        }
    }, [setCurrentHire, setCurrentHireId, setPersona, setActiveView, setLanguageSelected, setIsIdentified, addToast]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            const match = hash.match(UUID_REGEX);
            
            if (match) {
                const hireId = match[1];
                loadHireData(hireId);
            }
        };

        // Initial deep link resolution logic
        if (window.location.hash) {
            handleHashChange();
        }
        
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [loadHireData]);

    // --- KIOSK SESSION DETECTION ---
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionHireId = urlParams.get('session');
        const sessionPin = urlParams.get('pin');

        if (sessionHireId && sessionPin) {
            setActiveSessionId(sessionHireId);
            setExpectedPin(sessionPin);
        }
    }, [setActiveSessionId, setExpectedPin]);

    // Sync theme state to document class
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleExecutiveLogin = (employeeNumber?: string) => {
        setKioskMode(false);
        setLanguage('en-ZA');
        setLanguageSelected(true);
        setIsIdentified(true);
        // Pass employeeNumber so AppContext sets the correct currentUser
        setPersona('manager', employeeNumber);
    };

    const handleKioskMode = () => {
        setKioskMode(true);
        setIsIdentified(false);
        setPersona(null); 
        setLanguageSelected(false);
    };

    const handleDemoBypass = (selectedRole: 'employee' | 'manager') => {
        if (selectedRole === 'manager') {
            handleExecutiveLogin();
            addToast("Executive Hub Activated", "success");
            return;
        }

        // Demo fallback - try to grab the first person in the active pipeline
        westflow.getOnboardingPipeline().then(resp => {
            if (resp.success && resp.pipeline && resp.pipeline.length > 0) {
                const hire = resp.pipeline[0];
                loadHireData(hire.id);
            } else {
                addToast("No active hires found.", "warning");
                handleGoHome();
            }
        });
    };

    const handlePhoneIdentify = async (input: string) => {
        // PIN-based lookup — format: "PIN:XXXXXX"
        if (input.startsWith('PIN:')) {
            const enteredPin = input.replace('PIN:', '');
            try {
                const result = await westflow.getOnboardingPipeline();
                if (result.success && result.pipeline) {
                    const hire = result.pipeline.find((h: any) => {
                        if (!h.id) return false;
                        const hirePin = String(parseInt(h.id.replace(/-/g,'').slice(-6), 16)).slice(-6).padStart(6,'0');
                        return hirePin === enteredPin;
                    });
                    if (hire) {
                        loadHireData(hire.id);
                    } else {
                        addToast('Invalid PIN — no matching record found.', 'warning');
                        throw new Error('Invalid PIN');
                    }
                }
            } catch (err: any) {
                if (err.message !== 'Invalid PIN') {
                    addToast('Connection error. Please try again.', 'error');
                }
                throw err;
            }
            return;
        }

        let cleanInput = input.replace(/\s/g, '').replace(/^\+/, '');
        if (cleanInput.startsWith('0')) cleanInput = '27' + cleanInput.substring(1);

        // Guard: require minimum input to prevent broad matches
        if (cleanInput.replace(/\D/g, '').length < 6 && input.trim().length < 3) {
            addToast("Please enter at least 6 digits or a full name.", "warning");
            return;
        }

        if (cleanInput === '27820000000') {
            handleDemoBypass('employee');
            return;
        }

        try {
            const result = await westflow.getOnboardingPipeline();
            if (result.success && result.pipeline) {
                const hire = result.pipeline.find((h: any) => {
                    const hirePhone = h.phone?.replace(/\D/g, '');
                    const hireName = h.staff_name?.toLowerCase();
                    return (hirePhone && (hirePhone.includes(cleanInput) || cleanInput.includes(hirePhone))) || 
                           (hireName && hireName.includes(input.toLowerCase()));
                });

                if (hire) {
                    loadHireData(hire.id);
                } else {
                    addToast("No matching employee found. Please check your details.", "warning");
                }
            }
        } catch (err) {
            console.error('[AIVA] Identification error:', err);
            addToast("Connection error. Please try again.", "error");
        }
    };

    // If a kiosk session is detected, show the PIN confirmation screen
    if (activeSessionId && expectedPin && !isIdentified) {
        return (
            <PinConfirmationScreen 
                hireId={activeSessionId} 
                expectedPin={expectedPin} 
                autoVerify={true}
                onSuccess={() => {
                    // Success is handled inside the component via context updates
                }} 
            />
        );
    }

    if (kioskMode) {
        if (!isIdentified) return <PhoneIdentificationStep onIdentify={handlePhoneIdentify} onBack={() => setKioskMode(false)} />;
        if (!languageSelected) return <LanguageSelector />;
    }

    if (!isAuthenticated && !kioskMode) return <LoginScreen onLogin={handleExecutiveLogin} onKioskMode={handleKioskMode} onDemoBypass={handleDemoBypass} />;
    
    const showPortal = isAuthenticated || (isIdentified && languageSelected && persona === 'employee');
    
    return (
        <div className="flex h-screen font-sans antialiased bg-white dark:bg-slate-950">
            <ToastContainer />
            
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <OfflineIndicator />

                <main className="flex-1 relative overflow-hidden">
                    {showPortal ? <EmployeePortal /> : <WelcomeScreen />}
                </main>
            </div>
            
            <MediaViewerModal />
            {activeModal === 'seasonalOnboarding' && <SeasonalWorkerOnboarding onComplete={handleGoHome} language={language} setLanguage={setLanguage} openModal={openModal} />}
            <VisitorCheckIn isOpen={activeModal === 'visitorCheckIn'} onClose={closeModal} />
            <TimeAttendanceKiosk isOpen={activeModal === 'timeAttendance'} onClose={closeModal} />
            {activeModal === 'documentHub' && activeView !== 'onboarding' && <DocumentHub isOpen={true} onClose={closeModal} />}
            {activeModal === 'rolePlay' && <RolePlayTraining isOpen={true} onClose={closeModal} />}
            {activeModal === 'readinessLab' && <OperationalReadinessModal isOpen={true} onClose={closeModal} />}
            {activeModal === 'aivaVision' && <AivaVision isOpen={true} onClose={closeModal} />}
            {activeModal === 'locationFinder' && <LocationFinderModal isOpen={true} onClose={closeModal} />}
            {activeModal === 'processMap' && <ProcessMapModal isOpen={true} onClose={closeModal} />}
            <ScanProgressModal isOpen={activeModal === 'scanProgress'} onClose={closeModal} jobId={activeJobId} />
            <CertProgressModal isOpen={activeModal === 'certProgress'} onClose={closeModal} jobId={activeJobId} />
            {showPortal && (
                <>
                    {!isCopilotOpen && <FloatingCoPilotButton onClick={() => setIsCopilotOpen(true)} />}
                    <AivaUnifiedChat isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
                </>
            )}
        </div>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <AppProvider>
                <MainAppContent />
            </AppProvider>
        </ErrorBoundary>
    );
}

export default App;
