export type McpStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type McpEvents = {
  statusChange: (status: McpStatus) => void;
  message: (data: any) => void;
};

export class McpService {
  private ws: WebSocket | null = null;
  private url: string;
  private status: McpStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private listeners: { [K in keyof McpEvents]?: McpEvents[K][] } = {};
  private isSimulationMode = false;

  constructor(url: string) {
    this.url = url;
  }

  on<K extends keyof McpEvents>(event: K, callback: McpEvents[K]) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(callback);
  }

  off<K extends keyof McpEvents>(event: K, callback: McpEvents[K]) {
    if (this.listeners[event]) this.listeners[event] = this.listeners[event]!.filter(cb => cb !== callback);
  }

  private emit<K extends keyof McpEvents>(event: K, ...args: Parameters<McpEvents[K]>) {
    this.listeners[event]?.forEach(callback => {
      // @ts-expect-error - callback is McpEvents[K] and args are Parameters<McpEvents[K]>
      callback(...args);
    });
  }

  private setStatus(newStatus: McpStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit('statusChange', this.status);
    }
  }

  connect() {
    // CRICKETS WEBSOCKET KILL SWITCH
    // Kills noise from failing WebSocket if not explicitly enabled
    if (localStorage.getItem('crickets_enabled') !== 'true') {
        this.setStatus('disconnected');
        return;
    }

    if (this.isSimulationMode) {
        this.setStatus('connected');
        return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    
    this.setStatus('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return;
        this.emit('message', data);
      } catch (e) {
        console.error('MCP: Failed to parse message', event.data);
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      if (this.reconnectAttempts > 1) {
          this.isSimulationMode = true;
          this.setStatus('connected');
          return;
      }
      this.setStatus('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      // Silently log hardware connection attempts to avoid console clutter
      console.debug('MCP Hardware node not detected, entering simulation mode.', error);
      this.setStatus('error');
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopPing();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.isSimulationMode = false;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= 3) {
      this.isSimulationMode = true;
      this.setStatus('connected');
      return;
    }
    this.reconnectAttempts++;
    this.reconnectTimeout = window.setTimeout(() => this.connect(), 2000);
  }
  
  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.sendCommand({ type: 'ping' });
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  sendCommand(command: object) {
    if (this.isSimulationMode) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(command));
  }
}

// PRODUCTION ENDPOINT: Nashua Paarl Universal Mesh
const MCP_URL = 'wss://crickets-c2-dca-286939318734.us-west1.run.app/ws/twaina/nashua-paarl-mcp';
export const mcpService = new McpService(MCP_URL);