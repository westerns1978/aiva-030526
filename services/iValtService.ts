
/**
 * SIMPLE iVALT Service - Just Works™
 */

export interface IValtAuthStatus {
  status: 'pending' | 'success' | 'failed';
  message: string;
  step?: number;
}

export class IValtService {
  private pollingTimer: any = null;
  private requestId: string | null = null;
  private phoneNumber: string = '';

  // CRITICAL: Your actual credentials
  private readonly SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
  private readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';

  async initiateHandshake(phoneNumber: string): Promise<void> {
    this.phoneNumber = phoneNumber;
    
    // Ensure the phone number starts with +
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ivalt-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'start-auth',
        mobile: formattedPhone,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[iVALT] Error:', error);
      throw new Error(`Failed: ${response.status}`);
    }

    const data = await response.json();
    this.requestId = data.request_id || data.id;
    console.log('[iVALT] Started:', this.requestId);
  }

  startPolling(
    onUpdate: (status: IValtAuthStatus) => void,
    onSuccess: () => void,
    onFail: (err: string) => void
  ): void {
    const poll = async () => {
      try {
        const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ivalt-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'validate',
            mobile: this.phoneNumber,
            request_id: this.requestId,
          }),
        });

        const data = await response.json();

        // Success!
        if (response.status === 200 && data.status === 'success') {
          this.cleanup();
          onUpdate({ status: 'success', message: 'Access Granted' });
          setTimeout(onSuccess, 200);
          return;
        }

        // Failed
        if (data.status === 'error' && response.status !== 403) {
          this.cleanup();
          onFail(data.message || 'Authentication failed');
          return;
        }

        // Still waiting or 403 (Pending)
        onUpdate({
          status: 'pending',
          message: data.message || 'Awaiting approval...',
          step: data.step,
        });

        this.pollingTimer = setTimeout(poll, 2000);
      } catch (error) {
        console.error('[iVALT] Poll error:', error);
        this.pollingTimer = setTimeout(poll, 3000);
      }
    };

    setTimeout(poll, 500);
  }

  cleanup(): void {
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
  }

  cancel(): void {
    this.cleanup();
  }
}
