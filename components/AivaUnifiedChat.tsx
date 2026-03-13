import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useAppContext } from '../context/AppContext';
import { 
    SendIcon, 
    AiSparkIcon, 
    KeyboardIcon,
    MicrophoneIcon,
    GlobeAltIcon
} from './icons';
import { StopCircle, Camera, Maximize2, Minimize2, Eye, X, ChevronDown, Activity, Settings, Bell, Search, ExternalLink, Terminal } from 'lucide-react';
import { LIVE_AIVA_TOOLS, SEARCH_GROUNDING_TOOL } from '../constants/geminiConfig';
import { searchAfridroidsKnowledgeBase } from '../services/ragService';
import { useLiveApi } from '../hooks/useLiveApi';
import { VoiceVisualizer } from './VoiceVisualizer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAivaSystemInstruction } from '../constants';
import { westflow } from '../services/westflowClient';
import { generateSearchGroundedContent } from '../services/geminiService';

export const AivaUnifiedChat: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { 
        language, isManager, setActiveView, addToast, 
        currentUser, isAivaSpeaking, isAivaLiveActive, setIsCopilotOpen,
        openModal, closeModal, triggerSuccessFeedback, currentHireId, currentHire, homeActiveTab
    } = useAppContext();
    
    const [messages, setMessages] = useState<any[]>([
        { id: 'welcome', role: 'model', text: "Hello! I'm Aiva, your Nashua HR Assistant. I can help you with your Onboarding Journey, insurance forms, or policy questions. How can I help you today?" }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [mode, setMode] = useState<'text' | 'voice'>('voice');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSearchEnabled, setIsSearchEnabled] = useState(false);
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [pipeline, setPipeline] = useState<any[]>([]);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<any>(null);
    // Guard: prevents the auto-connect useEffect from firing more than once
    // per open session. Without this, any re-render while isOpen && !isAivaLiveActive
    // (e.g. during connection setup) causes startConversation to be called repeatedly,
    // which tears down the audio session before it can establish.
    const autoConnectFiredRef = useRef(false);

    // Fetch pipeline stats if manager to provide better context awareness
    useEffect(() => {
        if (isOpen && isManager) {
            westflow.getOnboardingPipeline().then(resp => {
                if (resp?.success) setPipeline(resp.pipeline || []);
            }).catch(e => console.warn('[AIVA] Pipeline context fetch failed', e));
        }
    }, [isOpen, isManager]);

    const buildAivaContext = useCallback(() => {
        const contextLines: string[] = [];
        
        if (isManager) {
            contextLines.push(`You are speaking with the HR Manager (${currentUser?.name || 'Deon Boshoff'}) on the Manager Dashboard.`);
            if (homeActiveTab) contextLines.push(`The manager is currently viewing the "${homeActiveTab}" tab.`);
            
            if (pipeline && pipeline.length > 0) {
                const active = pipeline.filter(h => h?.status?.toLowerCase() === 'in_progress' || !h?.status || h?.status?.toLowerCase() === 'pending').length;
                const completed = pipeline.filter(h => h?.status?.toLowerCase() === 'completed' || (h?.step_reached || 0) >= 7).length;
                const stalled = pipeline.filter(h => {
                    if (h?.status?.toLowerCase() === 'completed' || (h?.step_reached || 0) >= 7) return false;
                    const updatedTime = h?.updated_at || h?.created_at;
                    if (!updatedTime) return false;
                    const diff = Date.now() - new Date(updatedTime).getTime();
                    return diff > 24 * 60 * 60 * 1000;
                }).length;
                
                contextLines.push(`Hiring stats: ${active} active hires, ${completed} completed, ${stalled} stalled.`);
                
                const currentActive = pipeline.filter(h => h?.status?.toLowerCase() === 'in_progress' || !h?.status).slice(0, 5);
                if (currentActive.length > 0) {
                    contextLines.push("Currently active candidates:");
                    currentActive.forEach(h => {
                        contextLines.push(`- ${h?.staff_name || 'Unknown'}: Step ${h?.step_reached || 1}, Status: ${h?.status || 'Pending'}`);
                    });
                }
            }
        } else if (currentHire) {
            contextLines.push(`You are speaking with ${currentHire?.staff_name || 'a candidate'}, who is currently in their Onboarding Journey.`);
            contextLines.push(`They are on Step ${currentHire?.step_reached || 1} of 7.`);
            contextLines.push(`Current onboarding status is: ${currentHire?.status || 'In Progress'}.`);
        } else {
            contextLines.push(`You are speaking with a new staff member.`);
        }
        
        return contextLines.join('\n');
    }, [isManager, currentUser, homeActiveTab, pipeline, currentHire]);

    const executeFunctionCall = useCallback(async (fc: any) => {
        const name = fc?.name;
        const args = fc?.args;
        if (!name) return { error: "INVALID_CALL" };
        
        setLastAction(name.replace(/_/g, ' '));
        
        try {
            switch (name) {
                case 'navigate_app_view':
                    if (args?.view) {
                        setActiveView(args.view);
                        triggerSuccessFeedback();
                        return { status: "OK", current_view: args.view };
                    }
                    return { error: "MISSING_ARGS" };

                case 'open_tool_modal':
                    if (args?.modal_name) {
                        openModal(args.modal_name);
                        triggerSuccessFeedback();
                        return { status: "OK", modal_launched: args.modal_name };
                    }
                    return { error: "MISSING_ARGS" };

                case 'advance_onboarding_sequence': {
                    const onboardingBridge = (window as any).__AivaOnboarding;
                    if (onboardingBridge?.completeStep && args?.step_id) {
                        onboardingBridge.completeStep(args.step_id);
                        return { status: "SUCCESS", message: `Updated hiring roadmap for ${args.step_id}.` };
                    }
                    return { error: "ONBOARDING_NOT_ACTIVE" };
                }

                case 'send_whatsapp_dispatch':
                    if (args?.phone && args?.message) {
                        const cleanPhone = args.phone.replace(/\D/g, '');
                        await westflow.sendWhatsAppNotification(cleanPhone, args.message);
                        return { status: "SENT", recipient: cleanPhone };
                    }
                    return { error: "MISSING_ARGS" };

                case 'search_hr_knowledge_base':
                    if (args?.query) {
                        const context = await searchAfridroidsKnowledgeBase(args.query);
                        return { context };
                    }
                    return { error: "MISSING_QUERY" };

                default:
                    return { error: "ACTION_NOT_DEFINED" };
            }
        } catch (e) {
            return { error: "SYSTEM_HANDSHAKE_FAILURE", details: String(e) };
        } finally {
            setTimeout(() => setLastAction(null), 3000);
        }
    }, [setActiveView, triggerSuccessFeedback, openModal]);

    const memoizedSystemInstruction = useMemo(() => {
        return `${getAivaSystemInstruction(language, isManager)}\n\n### LIVE CONTEXT AWARENESS\n${buildAivaContext()}`;
    }, [language, isManager, buildAivaContext]);

    const { 
        isRecording, isThinking: isLiveThinking, 
        thinkingStatus, liveUserTranscript, liveModelTranscript, audioVolume,
        isVideoActive,
        startConversation, stopConversation
    } = useLiveApi({
        onToolCall: executeFunctionCall,
        systemInstructionOverride: memoizedSystemInstruction,
        onTurnComplete: (user, model) => {
            if (user || model) {
                setMessages(p => [
                    ...p, 
                    { id: Date.now(), role: 'user', text: user || '...' }, 
                    { id: Date.now()+1, role: 'model', text: model || "I've noted that for your record." }
                ]);
            }
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, liveModelTranscript, liveUserTranscript]);

    const handleConnectVoice = useCallback(async (withVideo = false) => {
        setMode('voice');
        autoConnectFiredRef.current = true; // mark fired so effect doesn't double-trigger
        await startConversation(withVideo);
    }, [startConversation]);

    const handleSwitchToText = () => {
        stopConversation();
        autoConnectFiredRef.current = false; // allow reconnect if user switches back to voice
        setMode('text');
    };

    useEffect(() => {
        if (!isOpen) {
            // Reset guard when panel closes so next open reconnects cleanly
            autoConnectFiredRef.current = false;
            return;
        }
        if (mode === 'voice' && !isAivaLiveActive && !autoConnectFiredRef.current) {
            autoConnectFiredRef.current = true;
            handleConnectVoice();
        }
    }, [isOpen, mode, isAivaLiveActive, handleConnectVoice]);

    const handleSendText = async (msgText?: string) => {
        const text = msgText || inputText;
        if (!text.trim() || isThinking) return;
        
        setMessages(p => [...p, { id: Date.now(), role: 'user', text }]);
        setInputText('');
        setIsThinking(true);
        
        try {
            let responseText = '';
            let sources: any[] = [];

            if (isSearchEnabled) {
                const response = await generateSearchGroundedContent(text);
                responseText = response?.text || "Searching our policy database...";
                sources = response?.candidates?.[0]?.groundingMetadata?.groundingChunks
                    ?.filter((c: any) => c?.web)
                    .map((c: any) => ({ uri: c.web.uri, title: c.web.title })) || [];
            } else {
                if (!chatRef.current) {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    chatRef.current = ai.chats.create({ 
                        model: 'gemini-3-flash-preview', 
                        config: { 
                            systemInstruction: memoizedSystemInstruction,
                            tools: LIVE_AIVA_TOOLS 
                        }
                    });
                }
                
                const contextBlock = buildAivaContext();
                const enhancedMessage = `[SYSTEM CONTEXT - Do not repeat this to the user]\n${contextBlock}\n\n[USER MESSAGE]\n${text}`;
                const response = await chatRef.current.sendMessage({ message: enhancedMessage });
                
                if (response?.functionCalls && response.functionCalls.length > 0) {
                    for (const fc of response.functionCalls) {
                        await executeFunctionCall(fc);
                    }
                    responseText = response?.text || "Okay, I've updated that for you.";
                } else {
                    responseText = response?.text || "I'm sorry, I couldn't process that response.";
                }
            }
            
            setMessages(p => [...p, { id: Date.now()+1, role: 'model', text: responseText, sources }]);
        } catch (e) {
            console.error('[AIVA] Text send failure:', e);
            addToast("Support link interrupted.", "warning");
        } finally {
            setIsThinking(false);
        }
    };

    const visualizerMode = isAivaSpeaking ? 'speaking' : isLiveThinking ? 'thinking' : isRecording ? 'listening' : 'idle';

    if (!isOpen && isAivaLiveActive) {
        return (
            <div 
                onClick={() => setIsCopilotOpen(true)}
                className="fixed bottom-6 right-6 md:bottom-24 md:right-8 z-[999] flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl px-5 py-3 rounded-full border border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.2)] cursor-pointer hover:scale-105 transition-all animate-fadeIn group"
            >
                <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${isAivaSpeaking ? 'bg-cyan-400 animate-pulse shadow-[0_0_12px_#22d3ee]' : 'bg-brand-secondary'}`}></div>
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping"></div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Aiva Helper</span>
                    <p className="text-[10px] text-cyan-400/70 font-bold mt-0.5 uppercase tracking-tighter">Hands-Free Help</p>
                </div>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <div className={`fixed z-[999] flex flex-col bg-slate-950 dark:bg-slate-950 shadow-[0_32px_128px_rgba(0,0,0,0.8)] transition-all duration-500 ease-in-out overflow-hidden border border-white/10 ${
            isMinimized 
                ? 'bottom-4 right-4 w-72 h-16 rounded-2xl' 
                : 'bottom-0 right-0 left-0 top-0 w-full h-full md:bottom-4 md:right-4 md:left-auto md:top-auto md:w-[460px] md:h-[820px] md:max-h-[90vh] md:rounded-[3rem]'
        }`}>
            <header className="px-6 py-5 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl shrink-0 flex items-center justify-between z-30">
                <div className="flex items-center gap-3">
                    <div className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${isAivaSpeaking ? 'border-cyan-400 ring-4 ring-cyan-400/10 scale-105' : 'border-white/10'}`}>
                        <video src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    </div>
                    {!isMinimized && (
                        <div>
                            <h3 className="font-black text-white text-base tracking-tighter uppercase italic leading-none">HR Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isAivaLiveActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`}></div>
                                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                                    {lastAction ? `Update: ${lastAction}` : 'Support Active'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isMinimized && (
                        <>
                            <button 
                                onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                                className={`p-2.5 rounded-xl transition-all ${isSearchEnabled ? 'bg-voltage text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                                title="Policy Search"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                            <button onClick={() => mode === 'voice' ? handleSwitchToText() : handleConnectVoice()} className={`p-2.5 rounded-xl transition-all ${mode === 'voice' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:bg-white/5'}`}><MicrophoneIcon className="w-5 h-5" /></button>
                        </>
                    )}
                    <button onClick={() => setIsMinimized(!isMinimized)} className="hidden md:block p-2.5 text-slate-400 hover:bg-white/5 rounded-xl transition-colors">{isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}</button>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                </div>
            </header>

            {!isMinimized && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 copilot-scrollbar bg-slate-900/20 relative">
                    {mode === 'voice' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-fadeIn relative pb-12">
                             <VoiceVisualizer mode={visualizerMode} volume={audioVolume} />
                             
                            <div className="max-w-[340px] space-y-6">
                                <div className="min-h-[140px] flex flex-col justify-center">
                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tight leading-tight">
                                        {liveUserTranscript || thinkingStatus || (isAivaSpeaking ? "Responding..." : "I'm listening...")}
                                    </h2>
                                </div>
                                {liveModelTranscript && (
                                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-sm italic font-medium text-base text-slate-300">
                                        "{liveModelTranscript}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-4">
                            {messages.map((m: any) => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-6 rounded-[2rem] shadow-sm max-w-[85%] ${m.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5'}`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-base leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!isMinimized && (
                <footer className="px-8 py-6 border-t border-white/5 bg-slate-900 shrink-0">
                    {mode === 'text' ? (
                        <div className="flex gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-brand-primary transition-all shadow-inner">
                            <input 
                                type="text" 
                                value={inputText} 
                                onChange={e => setInputText(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleSendText()} 
                                placeholder={isSearchEnabled ? "Search policies..." : "Ask Aiva a question..."} 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-base px-3 py-2 font-medium text-white" 
                            />
                            <button 
                                onClick={() => handleSendText()} 
                                disabled={!inputText.trim() || isThinking}
                                className={`p-3.5 rounded-xl text-white shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 ${isSearchEnabled ? 'bg-voltage text-slate-900' : 'bg-brand-primary'}`}
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {lastAction && (
                                <div className="flex items-center justify-center gap-2 text-cyan-400 animate-pulse mb-2">
                                    <Terminal className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Processing {lastAction}...</span>
                                </div>
                            )}
                            <button 
                                onClick={handleSwitchToText} 
                                className="w-full py-6 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-3xl shadow-xl hover:scale-[1.02] flex items-center justify-center gap-4 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs border-b-4 border-slate-950"
                            >
                                <Activity className="w-6 h-6 text-cyan-400" /> 
                                Switch to Keyboard Input
                            </button>
                        </div>
                    )}
                </footer>
            )}
        </div>
    );
};