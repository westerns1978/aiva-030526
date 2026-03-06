import React, { useState } from 'react';
import type { TrainingModule } from '../../types';
import { AivaLogo, CheckCircleIcon } from '../icons';

interface CertificateViewProps {
  module: TrainingModule;
  userName: string;
  isCertified: boolean;
  onSign: (moduleId: string, signature: string) => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({ module, userName, isCertified, onSign }) => {
  const [signature, setSignature] = useState(isCertified ? userName : '');
  
  const handleSign = () => {
    if (signature.trim()) {
      onSign(module.id, signature.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="border-4 border-brand-primary dark:border-brand-secondary p-6 rounded-md text-center">
        <div className="flex justify-center items-center gap-3">
          <AivaLogo className="w-12 h-12" />
          <h1 className="text-xl font-bold text-slate-600 dark:text-slate-300">Afridroids Training</h1>
        </div>
        <h2 className="text-3xl font-bold text-brand-dark dark:text-white mt-8">Certificate of Completion</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-4">This certifies that</p>
        <p className="text-4xl font-handwriting font-bold text-brand-secondary my-4">{userName}</p>
        <p className="text-slate-600 dark:text-slate-400">has successfully completed the course</p>
        <p className="text-2xl font-semibold text-brand-dark dark:text-white mt-2">{module.title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-8">Issued on: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="mt-8">
        {isCertified ? (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
            <CheckCircleIcon className="w-6 h-6" />
            <p className="font-semibold">Digitally Signed & Certified</p>
          </div>
        ) : (
          <div>
            <label htmlFor="signature" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Digital Signature
            </label>
            <input
              type="text"
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your full name to sign"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-brand-secondary focus:border-brand-secondary font-handwriting text-lg"
            />
            <button
              onClick={handleSign}
              disabled={!signature.trim()}
              className="w-full mt-4 px-6 py-3 bg-brand-secondary text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              Acknowledge & Sign Certificate
            </button>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
        .font-handwriting {
          font-family: 'Caveat', cursive;
        }
      `}</style>
    </div>
  );
};