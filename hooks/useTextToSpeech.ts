
import { useRef, useCallback, useEffect, useState } from 'react';
import { AudioStreamer } from '../lib/audio-streamer';
import { generateSpeech } from '../services/geminiService';

export function useTextToSpeech() {
  const streamerRef = useRef<AudioStreamer | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    streamerRef.current = new AudioStreamer();
    
    // Subscribe to playback events to manage the busy state
    streamerRef.current.on('playback_started', () => {
        setIsSpeaking(true);
        busyRef.current = true;
    });
    
    streamerRef.current.on('playback_ended', () => {
        setIsSpeaking(false);
        busyRef.current = false;
    });

    return () => {
      streamerRef.current?.stop();
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    // SINGLE VOICE LOCK: Prevent overlapping calls
    if (busyRef.current) {
        console.warn("[Aiva Voice] Channel Busy. Queueing suppressed for stability.");
        return;
    }

    if (!streamerRef.current) return;

    try {
        busyRef.current = true;
        await streamerRef.current.init();

        const base64Audio = await generateSpeech(text);
        if (base64Audio) {
            await streamerRef.current.playBase64Chunk(base64Audio);
        }
    } catch (e) {
        console.error("[Aiva Voice] Synthesis failed", e);
        busyRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    streamerRef.current?.stop();
    setIsSpeaking(false);
    busyRef.current = false;
  }, []);

  return { speak, stop, isSpeaking };
}
