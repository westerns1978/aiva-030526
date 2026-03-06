
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CloudIcon, DocumentPlusIcon } from './icons';

export const DropZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { processDroppedFile } = useAppContext();
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await processDroppedFile(files[0]);
        }
    };

    return (
        <div 
            onDragEnter={handleDrag} 
            onDragOver={handleDrag} 
            onDragLeave={handleDrag} 
            onDrop={handleDrop}
            className="relative h-full"
        >
            {isDragging && (
                <div className="fixed inset-0 z-[110] bg-brand-primary/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-white animate-fadeIn border-8 border-dashed border-white/40 m-4 rounded-3xl pointer-events-none">
                    <CloudIcon className="w-32 h-32 mb-6 animate-bounce" />
                    <h2 className="text-4xl font-extrabold">Drop for Aiva Vision</h2>
                    <p className="mt-4 text-xl text-blue-100">Drop any document, photo, or brief for instant AI extraction.</p>
                    <div className="mt-8 flex gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20 text-sm font-mono">PDF Analysis</div>
                        <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20 text-sm font-mono">OCR Extraction</div>
                        <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20 text-sm font-mono">Safety Audit</div>
                    </div>
                </div>
            )}
            {children}
        </div>
    );
};
