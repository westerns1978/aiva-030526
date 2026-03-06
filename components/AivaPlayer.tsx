import React from 'react';
import { ThinkingIndicator } from './ThinkingIndicator';

interface AivaPlayerProps {
  isThinking: boolean;
}

const AIVA_COMPANION_VIDEO_URL = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4';

export const AivaPlayer: React.FC<AivaPlayerProps> = ({ isThinking }) => {
  return (
    <div className="relative w-12 h-12 shrink-0">
      <video
        src={AIVA_COMPANION_VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full rounded-full object-cover transition-all duration-300 ring-2 ${isThinking ? 'ring-brand-secondary ring-opacity-75' : 'ring-slate-400'}`}
        aria-label="Aiva animated avatar"
      />
      {isThinking && <ThinkingIndicator />}
    </div>
  );
};
