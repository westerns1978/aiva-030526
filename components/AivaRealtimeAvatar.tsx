
import React, { useRef, useEffect } from 'react';

interface AivaRealtimeAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
}

const AIVA_VIDEO_URL = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4';

export const AivaRealtimeAvatar: React.FC<AivaRealtimeAvatarProps> = ({ isSpeaking, isListening, isThinking }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video keeps looping and playing
    if (videoRef.current) {
        videoRef.current.play().catch(() => {
            // Autoplay policies might block this without user interaction first,
            // but in the context of an active voice chat, it should be allowed.
        });
    }
  }, []);

  // Determine the glow color and intensity based on state
  let glowColor = 'transparent';
  let animationClass = '';
  let scale = 'scale-100';

  if (isThinking) {
      glowColor = 'rgba(245, 158, 11, 0.6)'; // Amber
      animationClass = 'animate-pulse';
      scale = 'scale-105';
  } else if (isSpeaking) {
      glowColor = 'rgba(34, 197, 94, 0.6)'; // Green
      animationClass = 'animate-pulse-fast'; // Custom fast pulse if defined, or just pulse
      scale = 'scale-110';
  } else if (isListening) {
      glowColor = 'rgba(59, 130, 246, 0.6)'; // Blue
      scale = 'scale-100';
  }

  return (
    <div className="relative flex items-center justify-center w-48 h-48 transition-all duration-500">
      {/* Dynamic Glow Layer */}
      <div 
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${animationClass}`}
        style={{ backgroundColor: glowColor, transform: isSpeaking ? 'scale(1.2)' : 'scale(1)' }}
      />
      
      {/* Video Container */}
      <div className={`relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl transition-transform duration-500 ${scale}`}>
        <video
            ref={videoRef}
            src={AIVA_VIDEO_URL}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            aria-label="Aiva AI Avatar"
        />
        
        {/* Subtle overlay to unify tint */}
        <div className="absolute inset-0 bg-brand-primary/10 mix-blend-overlay"></div>
      </div>

      {/* State Badge (Optional, good for accessibility/clarity) */}
      <div className="absolute -bottom-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest transition-opacity duration-300">
          {isThinking ? 'Thinking' : isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
      </div>
    </div>
  );
};
