
import React, { useState } from 'react';
import type { TrainingModule } from '../../types';
import { CheckCircleIcon, CloseIcon, AiSparkIcon } from '../icons';
import { ShieldCheck, Zap, AlertTriangle, ChevronRight, FileText } from 'lucide-react';

interface QuizModuleProps {
  module: TrainingModule;
  onComplete: (moduleId: string, passed: boolean) => void;
}

export const QuizModule: React.FC<QuizModuleProps> = ({ module, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!module.quizData) return <div>Quiz data not found.</div>;

  const currentQuestion = module.quizData[currentQuestionIndex];
  const totalQuestions = module.quizData.length;

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResults(newAnswers);
      setShowResults(true);
    }
  };

  const calculateResults = (finalAnswers: string[]) => {
    let score = 0;
    module.quizData?.forEach((q, index) => {
      if (q.correctAnswer === finalAnswers[index]) {
        score++;
      }
    });
    const passThreshold = module.passThreshold ?? 0.8;
    const passed = (score / totalQuestions) >= passThreshold;
    onComplete(module.id, passed);
  };

  if (showResults) {
    let score = 0;
    module.quizData?.forEach((q, index) => {
      if (q.correctAnswer === answers[index]) {
        score++;
      }
    });
    const passThreshold = module.passThreshold ?? 0.8;
    const passed = (score / totalQuestions) >= passThreshold;

    return (
      <div className="space-y-10 animate-fadeIn max-w-3xl mx-auto pb-20">
        {/* Results Overview Card */}
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><AiSparkIcon className="w-64 h-64" /></div>
            
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Neural Audit Result</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Strategic calibration for: **{module.title}**</p>
            
            <div className="my-10 relative inline-block">
                <div className={`text-8xl font-black italic tracking-tighter ${passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {score} / {totalQuestions}
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mt-2">Precision Fidelity Score</div>
            </div>

            {passed ? (
              <div className="flex flex-col items-center gap-4 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50 shadow-inner">
                <ShieldCheck className="w-12 h-12" />
                <div>
                  <p className="text-2xl font-black uppercase italic tracking-tight">Clinical Conformance Met</p>
                  <p className="text-sm opacity-70 mt-1 font-medium italic">Compliance Verified — you've demonstrated safety awareness.</p>
                </div>
              </div>
            ) : (
               <div className="flex flex-col items-center gap-4 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 p-8 rounded-[2rem] border border-rose-100 dark:border-rose-800/50 shadow-inner">
                <AlertTriangle className="w-12 h-12" />
                <div>
                  <p className="text-2xl font-black uppercase italic tracking-tight">Recalibration Required</p>
                  <p className="text-sm opacity-70 mt-1 font-medium italic">You need {Math.round(passThreshold * 100)}% to pass. Review the safety protocols and try again.</p>
                </div>
              </div>
            )}
        </div>

        {/* Detailed Node Analysis breakdown */}
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-voltage/10 rounded-lg text-voltage"><Zap className="w-5 h-5" /></div>
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-[0.3em]">Knowledge Node Breakdown</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">twAIn 3.2 Audit Trail</span>
            </div>

            {module.quizData.map((q, idx) => {
                const isCorrect = q.correctAnswer === answers[idx];
                return (
                    <div key={idx} className={`group p-8 rounded-[2.5rem] border-2 transition-all duration-500 bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl ${isCorrect ? 'border-emerald-500/10 hover:border-emerald-500/30' : 'border-rose-500/20 hover:border-rose-500/40'}`}>
                        <div className="flex justify-between items-start gap-6 mb-6">
                            <div className="flex items-start gap-5">
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black italic ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                    {idx + 1}
                                </div>
                                <p className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">{q.question}</p>
                            </div>
                            <div className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {isCorrect ? (
                                    <CheckCircleIcon className="w-5 h-5" />
                                ) : (
                                    <CloseIcon className="w-5 h-5" />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <div className={`p-5 rounded-2xl border transition-colors ${isCorrect ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-50/30 dark:bg-rose-500/5 border-rose-500/10'}`}>
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Candidate Input</p>
                                <p className={`text-sm font-black italic ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {answers[idx]}
                                </p>
                            </div>
                            {!isCorrect && (
                                <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nashua Standard</p>
                                    <p className="text-sm font-black italic text-brand-primary dark:text-brand-secondary">
                                        {q.correctAnswer}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="pt-10">
            <button
              onClick={() => onComplete(module.id, passed)}
              className="w-full py-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-[2rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-sm border-b-4 border-slate-800 dark:border-slate-300"
            >
              {passed ? "Pulse Proficiency to Profile" : "Acknowledge Audit & Exit"}
            </button>
            {!passed && (
                <p className="text-center mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                    Clinical Retake Protocol Suggested
                </p>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-brand-primary/20">
                <FileText className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{module.title}</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Calibration: Node 0{currentQuestionIndex + 1}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Session Velocity</p>
            <p className="text-base font-black text-brand-secondary italic">{currentQuestionIndex + 1} / {totalQuestions}</p>
        </div>
      </div>
      
      <div className="relative mb-14">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div 
                className="h-full bg-brand-primary transition-all duration-700 ease-out shadow-[0_0_10px_#1e3a8a]" 
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
      </div>

      <div className="mt-6 p-10 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-[3rem] shadow-inner mb-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><AiSparkIcon className="w-32 h-32" /></div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white leading-relaxed italic tracking-tight relative z-10">"{currentQuestion.question}"</p>
      </div>

      <div className="space-y-4">
        {currentQuestion.options.map((option) => (
          <label 
            key={option} 
            className={`group flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === option 
                    ? 'bg-brand-primary text-white border-brand-primary shadow-2xl scale-[1.03]' 
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-brand-primary/30 shadow-sm'
            }`}
          >
            <input
              type="radio"
              name="quiz-option"
              value={option}
              checked={selectedOption === option}
              onChange={() => setSelectedOption(option)}
              className="sr-only"
            />
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center mr-5 transition-all duration-300 ${
                selectedOption === option 
                    ? 'border-white bg-white text-brand-primary scale-110' 
                    : 'border-slate-300 dark:border-slate-600 group-hover:border-brand-primary'
            }`}>
                {selectedOption === option && <div className="w-3 h-3 rounded-full bg-current" />}
            </div>
            <span className="font-black text-sm uppercase tracking-tight italic">{option}</span>
          </label>
        ))}
      </div>

      <div className="mt-16">
        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="w-full flex items-center justify-center gap-4 py-6 bg-brand-primary text-white font-black rounded-3xl hover:brightness-110 shadow-[0_20px_50px_rgba(30,58,138,0.3)] transition-all disabled:opacity-30 disabled:grayscale uppercase tracking-[0.3em] text-sm border-b-4 border-blue-950 active:translate-y-1 active:border-b-0"
        >
          {currentQuestionIndex < totalQuestions - 1 ? (
              <>Deploy Next Calibration <ChevronRight className="w-5 h-5" /></>
          ) : (
              <>Initiate Strategic Audit <AiSparkIcon className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};
