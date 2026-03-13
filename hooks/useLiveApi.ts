import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { useAppContext } from '../context/AppContext';
import { encode, decode, decodeAudioData } from '../lib/audioUtils';
import { LIVE_AIVA_TOOLS, KIOSK_SYSTEM_INSTRUCTION } from '../constants/geminiConfig';
import type { FunctionCall } from '../types';

interface UseLiveApiProps {
  onToolCall?: (fc: FunctionCall) => Promise<any>;
  onTurnComplete?: (userInput: string | null, modelOutput: string | null) => void;
  systemInstructionOverride?: string;
}

const FRAME_RATE = 4;
const JPEG_QUALITY = 0.5;

export const useLiveApi = ({ onToolCall, onTurnComplete, systemInstructionOverride }: UseLiveApiProps = {}) => {
  const { addToast, setAivaSpeechTrigger, setIsAivaSpeaking, isAivaSpeaking, setIsAivaLiveActive } = useAppContext();
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveModelTranscript, setLiveModelTranscript] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const isSessionClosing = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  const audioContextRefs = useRef<{ 
    input: AudioContext | null, 
    output: AudioContext | null, 
    scriptProcessor: ScriptProcessorNode | null, 
    source: MediaStreamAudioSourceNode | null,
    analyser: AnalyserNode | null
  }>({ input: null, output: null, scriptProcessor: null, source: null, analyser: null });
  
  const audioPlayback = useRef({ nextStartTime: 0, sources: new Set<AudioBufferSourceNode>() });
  const transcriptionRefs = useRef({ currentInput: '', currentOutput: '' });

  const clearPlaybackQueue = useCallback(() => {
    audioPlayback.current.sources.forEach(source => {
      try { source.stop(); } catch(e) { /* Source already stopped */ }
    });
    audioPlayback.current.sources.clear();
    audioPlayback.current.nextStartTime = 0;
    setIsAivaSpeaking(false);
  }, [setIsAivaSpeaking]);

  const stopConversation = useCallback(() => {
    if (isSessionClosing.current) return '';
    isSessionClosing.current = true;

    if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }

    setIsRecording(false);
    setIsThinking(false);
    setIsAivaSpeaking(false);
    setIsVideoActive(false);
    setIsAivaLiveActive(false);
    setAudioVolume(0);

    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
            try { session.close(); } catch(e) { /* Session already closed */ }
        });
        sessionPromiseRef.current = null;
    }

    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (audioContextRefs.current.scriptProcessor) {
        audioContextRefs.current.scriptProcessor.disconnect();
        audioContextRefs.current.scriptProcessor = null;
    }
    if (audioContextRefs.current.input) {
        audioContextRefs.current.input.close().catch(() => {});
        audioContextRefs.current.input = null;
    }
    if (audioContextRefs.current.output) {
        clearPlaybackQueue();
        audioContextRefs.current.output.close().catch(() => {});
        audioContextRefs.current.output = null;
    }
    transcriptionRefs.current = { currentInput: '', currentOutput: '' };
    isSessionClosing.current = false;
    return '';
  }, [clearPlaybackQueue, setIsAivaLiveActive, setIsAivaSpeaking]);

  const triggerSpeech = useCallback((text: string) => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
            try { session.send({ text }); } catch (e) { console.warn('Failed to send speech trigger:', e); }
        });
    }
  }, []);

  useEffect(() => {
    setAivaSpeechTrigger(triggerSpeech);
    return () => { stopConversation(); };
  }, [triggerSpeech, setAivaSpeechTrigger, stopConversation]);

  const startConversation = useCallback(async (withVideo = false) => {
    if (isRecording && withVideo === isVideoActive) return;
    if (isRecording) stopConversation();

    // Request mic/camera — this IS the user gesture that unlocks AudioContext.
    // AudioContexts must be created inside onopen (below) to stay within the
    // activation window. Creating them here causes browsers (especially Safari/iOS)
    // to auto-suspend them before the first audio chunk arrives.
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: withVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false 
        });
        mediaStreamRef.current = stream;
        setIsRecording(true);
        setIsVideoActive(withVideo);
        setIsAivaLiveActive(true);
    } catch (error) {
        addToast("Microphone Blocked. Voice Link requires active hardware permissions.", "error");
        return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = systemInstructionOverride || KIOSK_SYSTEM_INSTRUCTION;

    try {
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: () => {
                  if (!mediaStreamRef.current) return;

                  // ── Audio Context Creation ─────────────────────────────────
                  // Created HERE (inside onopen) not in startConversation above.
                  // onopen fires synchronously on WebSocket open, still within
                  // the browser's user-gesture activation window from the
                  // getUserMedia call. This guarantees both contexts start in
                  // state === 'running' and audio plays immediately.
                  // The old code created these before ai.live.connect() which
                  // meant they were suspended by the time onmessage fired.
                  const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
                  const inputCtx = new AudioCtor({ sampleRate: 16000 });
                  const outputCtx = new AudioCtor({ sampleRate: 24000 });
                  const analyser = inputCtx.createAnalyser();
                  analyser.fftSize = 1024;

                  audioContextRefs.current.input = inputCtx;
                  audioContextRefs.current.output = outputCtx;
                  audioContextRefs.current.analyser = analyser;

                  // Belt-and-suspenders resume — safe to call even if already running
                  inputCtx.resume().catch(() => {});
                  outputCtx.resume().catch(() => {});

                  const source = inputCtx.createMediaStreamSource(mediaStreamRef.current);
                  const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
                  audioContextRefs.current.source = source;
                  audioContextRefs.current.scriptProcessor = scriptProcessor;
                  source.connect(analyser);

                  const dataArray = new Uint8Array(analyser.frequencyBinCount);
                  const checkVolume = () => {
                    if (isSessionClosing.current) return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setAudioVolume(avg * 1.5); 
                    requestAnimationFrame(checkVolume);
                  };
                  checkVolume();

                  if (withVideo) {
                      const video = document.createElement('video');
                      video.srcObject = mediaStreamRef.current;
                      video.play();
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      frameIntervalRef.current = window.setInterval(() => {
                          if (!ctx || !video.videoWidth) return;
                          canvas.width = 320; 
                          canvas.height = (video.videoHeight / video.videoWidth) * 320;
                          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                          const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
                          sessionPromise.then(session => {
                             session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                          });
                      }, 1000 / FRAME_RATE);
                  }

                  scriptProcessor.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const int16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                    }
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
                    });
                  };
                  source.connect(scriptProcessor);
                  scriptProcessor.connect(inputCtx.destination);
                },

                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.interrupted) clearPlaybackQueue();

                    if (message.toolCall && onToolCall && message.toolCall.functionCalls) {
                        for (const fc of message.toolCall.functionCalls) {
                            if (!fc.name) continue;
                            setThinkingStatus(`Processing: ${fc.name.replace(/_/g, ' ')}...`);
                            const result = await onToolCall(fc as FunctionCall);
                            sessionPromise.then(session => {
                                try {
                                    session.sendToolResponse({ functionResponses: [{ id: fc.id || '', name: fc.name || '', response: { result } }] });
                                } catch (e) { console.warn('Failed to send tool response:', e); }
                            });
                            setThinkingStatus(null);
                        }
                    }

                    if (message.serverContent?.modelTurn?.parts) {
                        const parts = message.serverContent.modelTurn.parts;
                        const base64Audio = parts.find((p: any) => p.inlineData)?.inlineData?.data;
                        if (base64Audio) {
                            setIsThinking(false);
                            setIsAivaSpeaking(true);

                            const outputCtx = audioContextRefs.current.output;
                            if (!outputCtx) return;

                            // ── Resume guard ───────────────────────────────────
                            // outputCtx can drift back to 'suspended' if the user
                            // switches tabs, locks their phone, or the browser
                            // decides to throttle background audio. Without this
                            // resume, sourceNode.start() fires without error but
                            // produces no sound — the most common "silent" symptom.
                            if (outputCtx.state === 'suspended') {
                                await outputCtx.resume();
                            }

                            audioPlayback.current.nextStartTime = Math.max(
                                audioPlayback.current.nextStartTime,
                                outputCtx.currentTime
                            );
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            if (audioBuffer) {
                                const sourceNode = outputCtx.createBufferSource();
                                sourceNode.buffer = audioBuffer;
                                sourceNode.connect(outputCtx.destination);
                                sourceNode.addEventListener('ended', () => {
                                    audioPlayback.current.sources.delete(sourceNode);
                                    if (audioPlayback.current.sources.size === 0) setIsAivaSpeaking(false);
                                });
                                sourceNode.start(audioPlayback.current.nextStartTime);
                                audioPlayback.current.nextStartTime += audioBuffer.duration;
                                audioPlayback.current.sources.add(sourceNode);
                            }
                        }
                    }

                    if (message.serverContent?.outputTranscription) {
                        transcriptionRefs.current.currentOutput += message.serverContent.outputTranscription.text;
                        setLiveModelTranscript(transcriptionRefs.current.currentOutput);
                    } else if (message.serverContent?.inputTranscription) {
                        transcriptionRefs.current.currentInput += message.serverContent.inputTranscription.text;
                        setLiveUserTranscript(transcriptionRefs.current.currentInput);
                    }

                    if (message.serverContent?.turnComplete) {
                        onTurnComplete?.(
                            transcriptionRefs.current.currentInput.trim() || null,
                            transcriptionRefs.current.currentOutput.trim() || null
                        );
                        transcriptionRefs.current = { currentInput: '', currentOutput: '' };
                        setIsThinking(false);
                        setLiveUserTranscript('');
                        setLiveModelTranscript('');
                    }
                },

                onerror: (e) => {
                    console.warn("Live Link Reset:", e);
                    stopConversation();
                },
                onclose: () => stopConversation(),
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                tools: LIVE_AIVA_TOOLS,
                systemInstruction,
            },
        });
        sessionPromiseRef.current = sessionPromise;
    } catch (e) {
        console.error("Protocol failure:", e);
        stopConversation();
    }
  }, [stopConversation, clearPlaybackQueue, onToolCall, onTurnComplete, isRecording, isVideoActive, addToast, systemInstructionOverride, setIsAivaLiveActive, setIsAivaSpeaking]);

  return { 
    isRecording, isThinking, thinkingStatus, 
    liveUserTranscript, liveModelTranscript, audioVolume, isVideoActive,
    isSpeaking: isAivaSpeaking,
    startConversation, stopConversation, triggerSpeech
  };
};
