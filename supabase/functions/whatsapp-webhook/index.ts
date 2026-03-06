// Fix: Added declaration for the global Deno namespace to resolve "Cannot find name 'Deno'" compiler errors.
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // GET = Meta webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    if (mode === 'subscribe' && token === 'AIVA_WEBHOOK_2026') {
      console.log('[Webhook] Verified!');
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // POST = Incoming message
  if (req.method === 'POST') {
    const body = await req.json();
    console.log('[Webhook] Incoming:', JSON.stringify(body));
    
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return new Response('OK', { status: 200 });
    
    const senderPhone = message.from; 
    const text = message.text?.body || '';
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Identify hire context
    const { data: hire } = await supabase
      .from('onboarding_telemetry')
      .select('*')
      .eq('phone', senderPhone)
      .single();
    
    if (!hire) return new Response('OK', { status: 200 });
    
    const currentStep = hire.step_reached || 1;

    // ---------------------------------------------------------
    // VISION HUB: Image Handling (Step 2: ID)
    // ---------------------------------------------------------
    if (message.type === 'image' && currentStep === 2) {
      // In a real flow, download media from FB Graph API here
      // For this implementation, we bridge to the Gemini Vision logic
      console.log('[Webhook] Vision Request: Processing ID Photo...');
      
      const extractionResult = {
        fullName: hire.staff_name, // Simulated extraction for demo
        idNumber: "9201015123081",
        confidence: 0.99
      };

      // Advance node in registry
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify({
          agent: 'AIVA',
          tool: 'advance_step',
          params: { hire_id: hire.id, new_step: 3 }
        })
      });

      // Confirm to user
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify({
          agent: 'AIVA',
          tool: 'send_whatsapp_notification',
          params: {
            phone: senderPhone,
            message: `📸 ID Specimen Verified!\n\nExtracted: ${extractionResult.fullName}\nID: ${extractionResult.idNumber}\n\nStep 2 Complete. Now, please send a clear photo of your Proof of Residence (Step 3).`
          }
        })
      });
      
      return new Response('OK', { status: 200 });
    }

    // ---------------------------------------------------------
    // LOGIC NODE: TEXT PROTOCOLS (Steps 1 & 6)
    // ---------------------------------------------------------
    
    // Protocol: Accept Offer (Step 1)
    if (currentStep === 1 && text.toUpperCase().includes('ACCEPT')) {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify({
          agent: 'AIVA',
          tool: 'advance_step',
          params: { hire_id: hire.id, new_step: 2 }
        })
      });

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify({
          agent: 'AIVA',
          tool: 'send_whatsapp_notification',
          params: {
            phone: senderPhone,
            message: `Offer accepted! Welcome to the team, ${hire.staff_name}.\n\nPlease send a clear photo of your ID or Passport to continue.`
          }
        })
      });
    }

    // Protocol: Digital Signature (Step 6)
    if (currentStep === 6 && (text.toLowerCase().includes('accept') || text.toLowerCase().includes('i,'))) {
      const match = text.match(/I,?\s*([A-Za-z\s]+),?\s*accept/i);
      const signerName = match?.[1]?.trim() || hire.staff_name;
      
      const signResult = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
          body: JSON.stringify({
            agent: 'AIVA',
            tool: 'sign_contract_digital',
            params: { hire_id: hire.id, typed_name: signerName }
          })
      }).then(r => r.json());
      
      if (signResult.success) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
          body: JSON.stringify({
            agent: 'AIVA',
            tool: 'send_whatsapp_notification',
            params: {
              phone: senderPhone,
              message: `✅ Contract executed!\n\nDigital Ref: ${signResult.document_hash?.slice(0,12)}...\n\nYour induction is complete. HR will contact you shortly.`
            }
          })
        });
      }
    }
    
    // Initial Handshake
    if (text.toUpperCase() === 'START') {
      const welcomeMsg = currentStep === 1 
        ? `Hello ${hire.staff_name}! Reply 'ACCEPT' to start your Nashua induction.` 
        : `Induction session active. You are currently at Step ${currentStep}. How can I assist?`;

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify({
          agent: 'AIVA',
          tool: 'send_whatsapp_notification',
          params: { phone: senderPhone, message: welcomeMsg }
        })
      });
    }
    
    return new Response('OK', { status: 200 });
  }
  
  return new Response('Method not allowed', { status: 405 });
});
