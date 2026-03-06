// realtimeService.ts
// Supabase Realtime WebSocket subscriptions
// DO NOT add any import statements — inline constants only (AI Studios build cache issue)

const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

type UnsubscribeFn = () => void;

class RealtimeService {
    private channels: Map<string, WebSocket> = new Map();

    // Subscribe to any change in the onboarding_telemetry table
    subscribeToPipeline(onUpdate: () => void): UnsubscribeFn {
        return this.subscribe('pipeline-changes', 'onboarding_telemetry', onUpdate);
    }

    // Subscribe to agent_conversation_logs changes
    subscribeToActivity(onUpdate: () => void): UnsubscribeFn {
        return this.subscribe('activity-changes', 'agent_conversation_logs', onUpdate);
    }

    // Subscribe to a specific hire record by ID
    subscribeToHire(hireId: string, onUpdate: (payload: any) => void): UnsubscribeFn {
        return this.subscribe(
            `hire-${hireId}`,
            'onboarding_telemetry',
            onUpdate,
            `id=eq.${hireId}`
        );
    }

    private subscribe(
        channelName: string,
        table: string,
        onUpdate: (payload?: any) => void,
        filter?: string
    ): UnsubscribeFn {
        // Close existing channel with same name
        this.unsubscribeChannel(channelName);

        try {
            // Build Supabase Realtime WebSocket URL
            const wsUrl = `${SUPABASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`;
            const ws = new WebSocket(wsUrl);
            const ref = Date.now();

            ws.onopen = () => {
                console.log(`[RealtimeService] Connected: ${channelName}`);
                const joinMsg = {
                    topic: `realtime:${channelName}`,
                    event: 'phx_join',
                    payload: {
                        config: {
                            broadcast: { self: false },
                            presence: { key: '' },
                            postgres_changes: [{
                                event: '*',
                                schema: 'public',
                                table,
                                ...(filter ? { filter } : {})
                            }]
                        }
                    },
                    ref: String(ref)
                };
                ws.send(JSON.stringify(joinMsg));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.event === 'phx_reply' && msg.payload?.status === 'ok') return;
                    if (msg.event === 'postgres_changes' || msg.payload?.data) {
                        onUpdate(msg.payload?.data);
                    }
                } catch { /* ignore parse errors */ }
            };

            ws.onerror = (err) => {
                console.warn(`[RealtimeService] WebSocket error on ${channelName}:`, err);
            };

            ws.onclose = () => {
                this.channels.delete(channelName);
            };

            // Heartbeat every 30s
            const heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        topic: 'phoenix',
                        event: 'heartbeat',
                        payload: {},
                        ref: String(Date.now())
                    }));
                }
            }, 30000);

            this.channels.set(channelName, ws);

            return () => {
                clearInterval(heartbeatInterval);
                this.unsubscribeChannel(channelName);
            };

        } catch (err) {
            console.warn(`[RealtimeService] Failed to create subscription for ${channelName}:`, err);
            return () => {};
        }
    }

    private unsubscribeChannel(channelName: string) {
        const existing = this.channels.get(channelName);
        if (existing) {
            try {
                if (existing.readyState === WebSocket.OPEN) {
                    existing.send(JSON.stringify({
                        topic: `realtime:${channelName}`,
                        event: 'phx_leave',
                        payload: {},
                        ref: String(Date.now())
                    }));
                }
                existing.close();
            } catch { /* ignore */ }
            this.channels.delete(channelName);
        }
    }

    unsubscribeAll() {
        this.channels.forEach((_, name) => this.unsubscribeChannel(name));
    }
}

export const realtimeService = new RealtimeService();
