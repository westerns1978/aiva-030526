import React, { useState, useEffect, useRef } from 'react';
import { TRAINING_MODULES } from '../constants/trainingModules';
import type { RolePlayScenario } from '../types';
import { createAivaChat } from '../services/geminiService';
import { CloseIcon, AivaAvatar, MicrophoneIcon, StopIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { useLiveApi } from '../hooks/useLiveApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RolePlayTrainingProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- FIX: Updated comparison to use valid TrainingModuleType 'workflow-sandbox' to resolve type mismatch error ---
const rolePlayModule = TRAINING_MODULES.find(m => m.type === 'workflow-sandbox');

export const RolePlayTraining: React.FC<RolePlayTrainingProps> = ({ isOpen, onClose }) => {
  const { language, addToast } = useAppContext();
  const [activeScenario, setActiveScenario] = useState<RolePlayScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isRecording, isSpeaking, isThinking, thinkingStatus, 
    liveUserTranscript, liveModelTranscript,
    startConversation, stopConversation 
  } = useLiveApi({ 
    systemInstructionOverride: systemInstruction,
    onTurnComplete: (user, model) => {
        let turn = '';
        if (user) turn += `**You:** ${user}\n\n`;
        if (model) turn += `**Aiva:** ${model}\n\n`;
        setFullTranscript(prev => prev + turn);
    }
  });

  useEffect(() => {
    if (isOpen) {
      resetState();
    } else {
        stopConversation();
        setSystemInstruction('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetState = () => {
      setActiveScenario(null);
      setShowFeedback(false);
      setFeedback('');
      setFullTranscript('');
      stopConversation();
      setSystemInstruction('');
  };
  
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fullTranscript, liveUserTranscript, liveModelTranscript, feedback]);

  const startScenario = (scenario: RolePlayScenario) => {
    setActiveScenario(scenario);
    const instruction = `You are an AI role-playing partner. Adopt the following persona and interact with the user based on their responses. Your responses MUST be in the language with this code: ${language}. DO NOT break character. Wait for the user to speak first. Your opening line should be a simple greeting in character. Persona: "${scenario.systemPrompt}".`;
    setSystemInstruction(instruction);
  };
  
  useEffect(() => {
      if (systemInstruction) {
          startConversation();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemInstruction]);
  
  const handleStopAndGetFeedback = async () => {
      const finalPartialTranscript = stopConversation();
      setSystemInstruction('');

      const finalTranscript = fullTranscript + finalPartialTranscript;

      if (!finalTranscript.trim() || !activeScenario) {
          addToast("No conversation was recorded.", "info");
          setShowFeedback(true);
          setFeedback("No conversation to analyze.");
          return;
      }
      
      setIsLoading(true);
      setShowFeedback(true);
      setFeedback("Analyzing your performance...");
      
      try {
          // Aiva's main chat is good for this kind of meta-task
          const feedbackSystemInstruction = `You are an expert performance coach.`;
          const tempChat = createAivaChat(feedbackSystemInstruction);
          const feedbackPrompt = `Based on the following conversation, provide constructive feedback to the 'user'. Analyze their tone, choice of words, and effectiveness in handling the situation. Keep it concise, professional, and provide actionable tips for improvement in markdown format.\n\nSCENARIO: ${activeScenario.title}\n\nCONVERSATION:\n${finalTranscript}`;
          const response = await tempChat.sendMessage({ message: feedbackPrompt });
          setFeedback(response.text || "No feedback generated.");
      } catch (e) {
          console.error("Feedback generation error", e);
          setFeedback("Sorry, I couldn't generate feedback at this time.");
      } finally {
          setIsLoading(false);
      }
  }

  const orbStateClasses = isSpeaking ? 'bg-green-500' : 
                          isThinking ? 'bg-amber-500 animate-pulse' :
                          isRecording ? 'bg-brand-secondary' : 
                          'bg-slate-600';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl h-[90vh] max-h-[800px] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Interactive Role-Play</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><CloseIcon className="w-5 h-5" /></button>
        </header>
        
        {!activeScenario ? (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-center mb-4">Select a Scenario</h3>
            <div className="space-y-3">
              {rolePlayModule?.scenarios?.map(sc => (
                <button key={sc.id} onClick={() => startScenario(sc)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <p className="font-bold text-brand-secondary">{sc.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{sc.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 text-center bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold">{activeScenario.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your goal: {activeScenario.description}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 copilot-scrollbar">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullTranscript}</ReactMarkdown>
              </div>
              {liveUserTranscript && <p className="text-slate-700 dark:text-slate-200 italic">{`You: ${liveUserTranscript}`}</p>}
              {liveModelTranscript && <p className="text-slate-700 dark:text-slate-200 italic">{`Aiva: ${liveModelTranscript}`}</p>}
              
              {showFeedback && (
                 <div className="p-4 bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/50 dark:border-blue-400">
                    <h4 className="font-bold text-blue-800 dark:text-blue-300">Feedback from Aiva</h4>
                    <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 mt-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              {!showFeedback ? (
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4">
                        <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${orbStateClasses}`}>
                            <MicrophoneIcon className="w-8 h-8 text-white" />
                            {isRecording && !isSpeaking && !isThinking && <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-pulse"></div>}
                        </div>
                        <button
                            onClick={handleStopAndGetFeedback}
                            className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors transform hover:scale-105"
                            aria-label="Stop Conversation and get feedback"
                        >
                            <StopIcon className="w-8 h-8" />
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 h-5" aria-live="polite">
                        {thinkingStatus || (isThinking ? "Thinking..." : isSpeaking ? "Aiva is speaking..." : isRecording ? "Listening..." : "Session ended.")}
                    </p>
                </div>
              ) : (
                <div className="flex gap-4">
                    <button onClick={resetState} className="flex-1 py-3 bg-brand-secondary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                        Try Another Scenario
                    </button>
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                        Close
                    </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
