
import React from 'react';
import { Mic, Zap, MessageSquare, Loader2, Activity } from 'lucide-react';

interface VoiceVisualizerProps {
  mode: 'listening' | 'thinking' | 'speaking' | 'idle';
  volume?: number; // 0 - 100
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ mode, volume = 0 }) => {
  // Ultra-responsive scaling
  const pulseScale = 1 + (Math.pow(volume, 1.2) / 100);
  const glowOpacity = 0.4 + (volume / 80);
  const innerScale = 1 + (volume / 200);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Dynamic Neural Field - Organic Background Glow (All Blue/Cyan now) */}
      <div 
        className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-75 ${
          mode === 'listening' ? 'bg-cyan-500/50' :
          mode === 'thinking' ? 'bg-blue-400/50' :
          mode === 'speaking' ? 'bg-cyan-300/60' : 'bg-transparent'
        }`}
        style={{ transform: `scale(${pulseScale})`, opacity: glowOpacity }}
      />

      {/* Main Core Container */}
      <div className={`relative w-48 h-48 rounded-full transition-all duration-300 flex items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.6)] border-4 ${
        mode === 'idle' ? 'bg-slate-800 border-white/5' :
        mode === 'listening' ? 'bg-brand-primary border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.4)]' :
        mode === 'thinking' ? 'bg-slate-950 border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.4)]' :
        'bg-slate-950 border-cyan-300/60 shadow-[0_0_50px_rgba(34,211,238,0.5)]'
      }`}>
          
          {/* Reactive Outer Command Ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-cyan-400/20 transition-transform duration-75"
            style={{ transform: `scale(${1 + volume / 60})` }}
          />

          {/* Particle Layer - Pulse Rings */}
          {(mode === 'speaking' || mode === 'listening') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full rounded-full border-2 border-cyan-400/40 animate-ping opacity-30" />
                  <div className="absolute w-44 h-44 rounded-full border border-white/20 animate-pulse opacity-20" />
              </div>
          )}
          
          {mode === 'thinking' && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-32 h-32 text-blue-400 animate-spin opacity-60" />
                  <div className="absolute inset-10 rounded-full border-2 border-blue-400/30 animate-spin-slow" />
              </div>
          )}

          {/* Core Visual Anchor */}
          <div className="relative z-10 transition-transform duration-75" style={{ transform: `scale(${innerScale})` }}>
              {mode === 'thinking' ? (
                  <Activity className="w-24 h-24 text-blue-400 animate-pulse" />
              ) : mode === 'speaking' ? (
                  <div className="flex gap-2.5 items-center justify-center h-20">
                       {[...Array(8)].map((_, i) => (
                           <div 
                                key={i} 
                                className="w-2.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_15px_#22d3ee]" 
                                style={{ 
                                    height: `${28 + (((i * 13) % 20) * volume / 30)}px`, 
                                    animationDelay: `${i*0.08}s`,
                                    transition: 'height 0.05s ease-out'
                                }} 
                           />
                       ))}
                  </div>
              ) : (
                  <Mic className={`w-24 h-24 text-white transition-all duration-300 ${mode === 'idle' ? 'opacity-30 scale-90' : 'opacity-100 scale-100'}`} />
              )}
          </div>

          {/* Spectrum Ribbon - Bottom visualizer */}
          {(mode === 'speaking' || mode === 'listening') && (
              <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-2 px-6">
                  {[...Array(18)].map((_, i) => (
                      <div 
                          key={i} 
                          className={`w-1 rounded-full ${mode === 'speaking' ? 'bg-cyan-400' : 'bg-cyan-500/60'}`}
                          style={{ 
                              height: `${12 + (volume * ((i * 7) % 15)) / 20}px`, 
                              transition: 'height 0.08s ease-out',
                          }} 
                      />
                  ))}
              </div>
          )}
      </div>

      <style>{`
        .animate-spin-slow {
            animation: spin 6s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
