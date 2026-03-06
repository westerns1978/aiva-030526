import { encode } from './live-utils';

// Define the Blob type locally to match the @google/genai SDK expectation
// and avoid module resolution errors with the top-level 'Blob' export.
interface GenAI_Blob {
  data: string; // base64 encoded string
  mimeType: string;
}

const audioWorkletProcessor = `
class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      const pcm16Data = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        let s = Math.max(-1, Math.min(1, channelData[i]));
        pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage(pcm16Data.buffer, [pcm16Data.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-16-processor', PCM16Processor);
`;

export class AudioRecorder {
  private listeners: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
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
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  async start() {
    if (this.audioContext) {
      console.log("Audio recorder already started.");
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      
      await this.audioContext.resume();

      const blob = new Blob([audioWorkletProcessor], { type: 'application/javascript' });
      const workletURL = URL.createObjectURL(blob);

      await this.audioContext.audioWorklet.addModule(workletURL);
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-16-processor');
      
      this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const int16 = new Int16Array(event.data);
        const pcmBlob: GenAI_Blob = {
          data: encode(new Uint8Array(int16.buffer)),
          mimeType: 'audio/pcm;rate=16000',
        };
        this.emit('audio_chunk', pcmBlob);
      };
      
      // Create a processing graph that terminates cleanly without reaching the output.
      // source -> worklet -> analyser
      // An AnalyserNode is a standard way to terminate a branch of an audio graph
      // for data processing, preventing it from being garbage-collected while
      // ensuring no audio is sent to the speakers. This is more robust than a muted GainNode.
      this.analyserNode = this.audioContext.createAnalyser();
      source.connect(this.workletNode);
      this.workletNode.connect(this.analyserNode);
      
    } catch (error) {
      console.error("Failed to start audio recorder:", error);
      this.emit('error', 'Could not start microphone. Please check permissions.');
    }
  }

  stop() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
    }
    this.audioContext = null;
    this.mediaStream = null;
    this.workletNode = null;
    this.analyserNode = null;
  }
}