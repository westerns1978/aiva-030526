import { decode } from './live-utils';

async function decodePcmAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class AudioStreamer {
  private listeners: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    if (this.listeners[event]) this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private isPlaying = false;
  private nextStartTime = 0;
  private audioQueue: string[] = [];
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    try {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtor({ sampleRate: 24000 });
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        this.isInitialized = true;
    } catch (e) {
        console.error("Audio Context Init Error:", e);
    }
  }

  async playBase64Chunk(base64Audio: string) {
    if (!this.isInitialized) {
      this.audioQueue.push(base64Audio);
      return;
    }
    const rawAudioBytes = decode(base64Audio);
    if (rawAudioBytes.byteLength === 0 || !this.audioContext || !this.gainNode) return;

    try {
        const audioBuffer = await decodePcmAudioData(rawAudioBytes, this.audioContext, 24000, 1);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.gainNode);

        const currentTime = this.audioContext.currentTime;
        if (!this.isPlaying || currentTime > this.nextStartTime) {
            this.nextStartTime = currentTime;
            if (!this.isPlaying) {
                this.isPlaying = true;
                this.emit('playback_started');
            }
        }
        
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
        
        source.onended = () => {
            this.sources.delete(source);
            if (this.sources.size === 0) {
                this.isPlaying = false;
                this.emit('playback_ended');
            }
        };
    } catch(e) {
        console.error("PCM Decode Error:", e);
    }
  }

  stop() {
    this.audioQueue = [];
    this.sources.forEach(source => {
        try { source.stop(); } catch (e) { /* Source already stopped */ }
    });
    this.sources.clear();
    this.isPlaying = false;
    this.nextStartTime = 0;
    this.emit('playback_ended');
  }
}