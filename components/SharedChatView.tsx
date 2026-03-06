import React, { useState } from 'react';
import { deserializeChatHistory } from '../services/sharingService';
import Message from './Message';
import { AivaLogo, ExclamationTriangleIcon } from './icons';

const SharedChatView: React.FC = () => {
    const [{ messages, error }] = useState(() => {
        const hash = window.location.hash.substring(1);
        if (!hash) return { messages: null, error: "No shared conversation found in the link." };
        const deserialized = deserializeChatHistory(hash);
        if (!deserialized) return { messages: null, error: "Could not load the shared conversation. The link may be invalid or corrupted." };
        return { messages: deserialized, error: null };
    });

    const handleBackToApp = () => {
        window.location.hash = '';
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-brand-dark font-sans flex flex-col items-center p-4">
            <div className="w-full max-w-2xl mx-auto">
                <header className="flex flex-col items-center text-center py-6">
                     <div className="flex items-center space-x-3">
                        <AivaLogo className="h-12 w-12 text-brand-primary dark:text-brand-secondary" />
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark dark:text-white">Aiva Co-Pilot</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Shared Conversation Transcript</p>
                        </div>
                    </div>
                </header>
                
                <main className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                    {error && (
                        <div className="text-center p-8 text-red-600">
                             <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}
                    {messages && messages.map((msg) => (
                        <Message key={msg.id} message={msg} />
                    ))}
                    {!messages && !error && (
                        <div className="text-center p-8 text-slate-500">
                           <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
                           <p>Loading shared conversation...</p>
                        </div>
                    )}
                </main>

                <footer className="mt-6 text-center">
                    <button
                        onClick={handleBackToApp}
                        className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-full hover:bg-brand-secondary transition-colors"
                    >
                        Back to Aiva
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SharedChatView;