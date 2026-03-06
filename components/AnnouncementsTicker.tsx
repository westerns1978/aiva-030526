import React from 'react';
import { ANNOUNCEMENTS } from '../constants/announcements';

const AnnouncementsTicker: React.FC = () => {
    // A simple way to create a long string for continuous scrolling effect
    const tickerText = ANNOUNCEMENTS.map(a => a.title).join(' ••• ');

    return (
        <div className="relative flex overflow-hidden bg-brand-primary/50 dark:bg-slate-900/50 group text-white">
            <div className="animate-marquee whitespace-nowrap py-1.5 text-xs font-semibold">
                <span className="mx-4">{tickerText}</span>
                <span className="mx-4">{tickerText}</span>
            </div>
             <div className="absolute top-0 animate-marquee2 whitespace-nowrap py-1.5 text-xs font-semibold">
                <span className="mx-4">{tickerText}</span>
                <span className="mx-4">{tickerText}</span>
            </div>
             <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
                .group:hover .animate-marquee {
                    animation-play-state: paused;
                }
                @keyframes marquee2 {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(0%); }
                }
                .animate-marquee2 {
                    animation: marquee2 60s linear infinite;
                }
                .group:hover .animate-marquee2 {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default AnnouncementsTicker;
