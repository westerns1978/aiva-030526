import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

const SLIDES = [
    {
        img: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/storyboard_panel_1_final.png',
        title: 'Seamless Onboarding',
        subtitle: 'A personalized, multilingual welcome for every employee.',
    },
    {
        img: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/storyboard_panel_2_final.png',
        title: 'Intelligent Document Capture',
        subtitle: 'Scan and submit required documents using our guided camera.',
    },
    {
        img: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/storyboard_panel_3_final.png',
        title: 'Real-Time AI Verification',
        subtitle: 'Aiva reads and verifies information instantly, reducing errors.',
    },
    {
        img: 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/Aiva-HR-Robot-Process-Map.png',
        title: 'Powerful Analytics',
        subtitle: 'Managers get live insights into workforce compliance and progress.',
    }
];

const SCRIPT = "Beyond a simple welcome, I can guide new hires through a seamless onboarding, using AI to intelligently capture and verify documents in real-time. I also provide powerful analytics for managers. Now, let's get started.";
const SLIDE_DURATION = 3000; // 3 seconds per slide

export const FeatureShowcase: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { speak } = useTextToSpeech();

    useEffect(() => {
        speak(SCRIPT);
        const totalDuration = SLIDES.length * SLIDE_DURATION;

        const interval = setInterval(() => {
            setCurrentIndex(prev => prev + 1);
        }, SLIDE_DURATION);

        const completeTimer = setTimeout(() => {
            clearInterval(interval);
            onComplete();
        }, totalDuration);

        return () => {
            clearInterval(interval);
            clearTimeout(completeTimer);
        };
    }, [onComplete, speak]);

    const currentSlide = SLIDES[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 animate-fadeIn text-center text-white">
             <video
                src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4"
                autoPlay loop muted playsInline
                className="w-32 h-32 rounded-full object-cover shadow-2xl shadow-brand-secondary/20 border-4 border-slate-700 mb-8"
                aria-label="Aiva animated avatar"
            />
            
            {currentSlide && (
                 <div key={currentIndex} className="w-full max-w-2xl animate-fadeIn">
                     <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700">
                        <img src={currentSlide.img} alt={currentSlide.title} className="w-full h-full object-contain"/>
                     </div>
                     <h2 className="text-3xl font-bold mt-6">{currentSlide.title}</h2>
                     <p className="text-lg text-slate-300 mt-1">{currentSlide.subtitle}</p>
                 </div>
            )}

             <div className="absolute bottom-10 left-10 right-10">
                <div className="w-full bg-slate-700/50 rounded-full h-1">
                    <div 
                        className="bg-brand-secondary h-1 rounded-full" 
                        style={{ 
                            animation: `progress ${SLIDES.length * SLIDE_DURATION}ms linear forwards`
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
};