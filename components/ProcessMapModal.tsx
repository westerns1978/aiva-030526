
import React from 'react';
import { CloseIcon } from './icons';

const processMapUrl = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/Aiva-HR-Robot-Process-Map.png';

interface ProcessMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessMapModal: React.FC<ProcessMapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aiva HR Automation Process Map</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="p-4">
          <img src={processMapUrl} alt="Aiva HR Process Map" className="w-full h-auto rounded-lg" />
        </main>
      </div>
    </div>
  );
};
