
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { type Language } from '../types';
import { languageOptions } from '../constants';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { UserCheckIcon } from './icons';

const GREETINGS: Record<Language, string> = {
  'en-ZA': "Welcome to Aiva.",
  'af-ZA': "Welkom by Aiva.",
  'xh-ZA': "Wamkelekile ku-Aiva.",
  'zu-ZA': "Wamukelekile ku-Aiva.",
  'st-ZA': "Kamohelo ho Aiva.",
  'nr-ZA': "Wamukelekile ku-Aiva.",
  'nso-ZA': "Le amogetswe go Aiva.",
  'tn-ZA': "O amogetswe mo Aiva.",
  'ss-ZA': "Wamukelekile e-Aiva.",
  've-ZA': "Vho ṱanganedzwa kha Aiva.",
  'ts-ZA': "Mi amukeriwile eka Aiva.",
};

const LanguageSelector: React.FC = () => {
  const { 
    setLanguage, 
    setLanguageSelected, 
    setActiveView, 
    identifiedName,
    currentHire,
    handleGoHome
  } = useAppContext();
  
  const { speak } = useTextToSpeech();

  const handleSelectLanguage = (langCode: Language) => {
    const greeting = GREETINGS[langCode] || GREETINGS['en-ZA'];
    speak(greeting);
    setLanguage(langCode);
    setLanguageSelected(true);
    setActiveView('onboarding');
  };

  const displayName = identifiedName || currentHire?.staff_name || 'Candidate';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center overflow-y-auto copilot-scrollbar relative font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
      
      <div className="w-full max-w-3xl py-12 relative z-10">
        <div className="mb-12 animate-slide-up-fade">
            <video
                src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4"
                autoPlay loop muted playsInline
                className="w-40 h-40 rounded-full object-cover shadow-[0_0_80px_rgba(59,130,246,0.3)] border-4 border-white/10 mx-auto"
            />
        </div>
        
        <div className="space-y-12 animate-fadeIn">
          <div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-3 bg-green-500/20 rounded-2xl text-green-500 border border-green-500/30">
                <UserCheckIcon className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Hello, {displayName}!</h1>
            </div>
            <p className="text-slate-400 font-medium text-xl max-w-xl mx-auto leading-relaxed italic">Identity established. Select your native language node to begin the induction sequence.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {languageOptions.map((opt) => (
                <button
                    key={opt.code}
                    onClick={() => handleSelectLanguage(opt.code)}
                    className="group p-8 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/5 hover:border-brand-secondary hover:bg-brand-secondary/10 transition-all flex flex-col items-center gap-5 shadow-2xl"
                >
                    {opt.Icon ? <opt.Icon className="w-14 h-14 group-hover:scale-110 transition-transform duration-500" /> : <div className={`w-14 h-14 rounded-full ${opt.color}`} />}
                    <span className="font-black text-[11px] text-slate-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{opt.name}</span>
                </button>
            ))}
          </div>

          <button 
            onClick={handleGoHome}
            className="mt-8 text-slate-500 hover:text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:underline underline-offset-8 decoration-voltage decoration-2"
          >
            Wrong Identity? Reset Node
          </button>
        </div>
      </div>
      
      <footer className="mt-auto py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 opacity-40">twAIn Standard v3.2 • Node Paarl-HQ</p>
      </footer>
    </div>
  );
};

export default LanguageSelector;
