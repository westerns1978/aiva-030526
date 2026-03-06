import React from 'react';

const AIVA_HERO_VIDEO_URL = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4';

export const WelcomeHero: React.FC = () => {
    return (
        <div className="relative w-full max-w-md mx-auto aspect-square rounded-full overflow-hidden shadow-2xl shadow-brand-primary/20">
            <video
                key={AIVA_HERO_VIDEO_URL} // Add key to force re-render on URL change if needed
                src={AIVA_HERO_VIDEO_URL}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                aria-label="Aiva animated hero video"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/0 to-slate-100/0 dark:from-brand-dark dark:via-brand-dark/0 dark:to-brand-dark/0" />
        </div>
    );
};