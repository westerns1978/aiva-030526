
import React, { useRef, useEffect, useState } from 'react';
import type { TrainingModule } from '../../types';

interface VideoPlayerProps {
  module: TrainingModule;
  onProgressUpdate: (moduleId: string, progress: number) => void;
  currentProgress: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ module, onProgressUpdate, currentProgress }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [lastUrl, setLastUrl] = useState(module.videoUrl);

  if (module.videoUrl !== lastUrl) {
    setLastUrl(module.videoUrl);
    setVideoError(false);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        const progress = Math.round((video.currentTime / video.duration) * 100);
        onProgressUpdate(module.id, progress);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [module.id, onProgressUpdate]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{module.title}</h2>
      <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-slate-400">{module.description}</p>
      
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg relative">
        {videoError ? (
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <video src="https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4" autoPlay loop muted playsInline className="w-full h-full rounded-full object-cover opacity-50" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aiva Character Video Coming Soon</p>
                <p className="text-slate-300 text-sm mt-2 max-w-md">{module.description}</p>
            </div>
        ) : (
            <video 
                ref={videoRef} 
                src={module.videoUrl} 
                controls 
                className="w-full h-full" 
                onError={() => setVideoError(true)}
            />
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Progress</span>
            <span className="text-sm font-bold text-brand-secondary">{currentProgress}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
          <div className="bg-brand-secondary h-2.5 rounded-full" style={{ width: `${currentProgress}%` }}></div>
        </div>
      </div>
    </div>
  );
};
