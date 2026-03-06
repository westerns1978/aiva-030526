
import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const GREETINGS = [
    { lang: 'English', text: "Hello, and a very warm welcome to all the attendees of the TWAIN 2025 Converge Conference!" },
    { lang: 'Afrikaans', text: "Goeie dag, en 'n hartlike welkom aan al die afgevaardigdes van die TWAIN 2025 Converge Konferensie!" },
    { lang: 'Swahili', text: "Jambo, na karibu sana kwa wote waliohudhuria Mkutano wa TWAIN 2025 Converge!" },
];

const AIVA_VIDEO_URL = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4';

export const ConferenceGreeting: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { speak } = useTextToSpeech();
    const [currentGreetingIndex, setCurrentGreetingIndex] = useState(-1);

    useEffect(() => {
        const playGreetings = async () => {
            // A small delay to allow the modal to animate in
            await new Promise(resolve => setTimeout(resolve, 500));
            
            for (let i = 0; i < GREETINGS.length; i++) {
                setCurrentGreetingIndex(i);
                await speak(GREETINGS[i].text);
                if (i < GREETINGS.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            onComplete();
        };

        playGreetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const currentGreeting = currentGreetingIndex >= 0 ? GREETINGS[currentGreetingIndex] : null;

    return (
        <div className="fixed inset-0 z-[100] bg-brand-dark flex flex-col items-center justify-center p-8 animate-fadeIn text-center text-white">
            <video
                src={AIVA_VIDEO_URL}
                autoPlay loop muted playsInline
                className="w-48 h-48 rounded-full object-cover shadow-2xl shadow-brand-secondary/40 border-4 border-slate-700 mb-8"
                aria-label="Aiva animated avatar"
            />
            {currentGreeting ? (
                <div key={currentGreeting.lang} className="animate-fadeIn">
                    <p className="text-lg font-semibold text-brand-secondary">{currentGreeting.lang}</p>
                    <h1 className="text-3xl md:text-5xl font-bold mt-2 max-w-4xl">
                        {currentGreeting.text}
                    </h1>
                </div>
            ) : (
                 <h1 className="text-3xl md:text-5xl font-bold mt-2 max-w-4xl">
                    Preparing a special greeting...
                </h1>
            )}
        </div>
    );
};
