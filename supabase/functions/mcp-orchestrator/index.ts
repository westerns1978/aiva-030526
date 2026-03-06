
// Fix: Added declaration for the global Deno namespace to resolve "Cannot find name 'Deno'" compiler errors.
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { agent, tool, params } = await req.json();
    console.log(`[Orchestrator] Invoking ${agent}/${tool}`);

    // --- AIVA: WHATSAPP PROTOCOLS ---
    if (agent === 'AIVA' && tool === 'send_whatsapp_template') {
      const { phone, template_name, language, components } = params;

      // CRITICAL FIX: The handler now ONLY sends the requested template.
      // Falls back to 'nashua_welcome' instead of 'hello_world'.
      
      const res = await fetch(
        `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
              name: template_name || 'nashua_welcome',
              language: { code: language || 'en' },
              components: components
            }
          }),
        }
      );

      const data = await res.json();
      return new Response(JSON.stringify({ success: res.ok, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (agent === 'AIVA' && tool === 'dispatch_candidate_pulse') {
        const { phone, template_name, language } = params;
        const res = await fetch(
          `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'template',
              template: {
                name: template_name || 'nashua_welcome',
                language: { code: language || 'en' },
                components: []
              }
            }),
          }
        );
        const data = await res.json();
        return new Response(JSON.stringify({ success: res.ok, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    if (agent === 'AIVA' && tool === 'send_whatsapp_notification') {
        const { phone, message } = params;
        const res = await fetch(
          `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'text',
              text: { body: message }
            }),
          }
        );
        const data = await res.json();
        return new Response(JSON.stringify({ success: res.ok, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // --- AIVA: HR REGISTRY OPS ---
    if (agent === 'AIVA' && tool === 'get_pipeline') {
      const { data: pipeline, error } = await supabase
        .from('onboarding_telemetry')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, pipeline }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (agent === 'AIVA' && tool === 'create_new_hire') {
      const { name, phone, position } = params;
      const { data: hire, error } = await supabase
        .from('onboarding_telemetry')
        .insert({
          staff_name: name,
          phone: phone,
          status: 'pending',
          step_reached: 1,
          metadata: { position: position, channel: 'whatsapp' }
        })
        .select()
        .single();
      
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data: hire, whatsapp_sent: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (agent === 'AIVA' && tool === 'advance_step') {
      const { hire_id, new_step } = params;
      const { error } = await supabase
        .from('onboarding_telemetry')
        .update({ step_reached: new_step, updated_at: new Date().toISOString() })
        .eq('id', hire_id);
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (agent === 'AIVA' && tool === 'update_hire_metadata') {
      const { hire_id, metadata } = params;
      
      const { data: currentHire } = await supabase
        .from('onboarding_telemetry')
        .select('metadata')
        .eq('id', hire_id)
        .single();

      const updatedMetadata = {
        ...(currentHire?.metadata || {}),
        ...metadata
      };

      const { error } = await supabase
        .from('onboarding_telemetry')
        .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
        .eq('id', hire_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (agent === 'AIVA' && tool === 'sign_contract_digital') {
        const { hire_id, typed_name, pdf_path, method } = params;
        const hash = `SHS-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
        
        const { data: currentHire } = await supabase
          .from('onboarding_telemetry')
          .select('metadata')
          .eq('id', hire_id)
          .single();

        const { error } = await supabase
          .from('onboarding_telemetry')
          .update({ 
              status: 'completed',
              step_reached: 6,
              metadata: { 
                  ...(currentHire?.metadata || {}),
                  contract_status: 'signed',
                  signed_by: typed_name || 'Manual Signature',
                  signed_at: new Date().toISOString(),
                  document_hash: hash,
                  signed_pdf_path: pdf_path,
                  signature_method: method || 'digital'
              }
          })
          .eq('id', hire_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, document_hash: hash }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    if (agent === 'AIVA' && tool === 'countersign_contract') {
        const { contract_id, countersigner_name, pdf_path } = params;
        
        const { data: currentHire } = await supabase
          .from('onboarding_telemetry')
          .select('metadata')
          .eq('id', contract_id)
          .single();

        const { error } = await supabase
          .from('onboarding_telemetry')
          .update({ 
              metadata: { 
                  ...(currentHire?.metadata || {}),
                  contract_status: 'countersigned',
                  countersigned_by: countersigner_name,
                  countersigned_at: new Date().toISOString(),
                  final_pdf_path: pdf_path
              }
          })
          .eq('id', contract_id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // --- AIVA: HIRE LOOKUP ---
    if (agent === 'AIVA' && tool === 'get_hire') {
      const { hire_id } = params;
      const { data: hire, error } = await supabase
        .from('onboarding_telemetry')
        .select('*')
        .eq('id', hire_id)
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: hire }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- AIVA: NUDGE HIRE (WhatsApp reminder) ---
    if (agent === 'AIVA' && tool === 'nudge_hire') {
      const { hire_id } = params;

      // Look up the hire to get their phone number
      const { data: hire, error: hireErr } = await supabase
        .from('onboarding_telemetry')
        .select('phone, staff_name, step_reached')
        .eq('id', hire_id)
        .single();

      if (hireErr || !hire) throw hireErr || new Error('Hire not found');

      if (!hire.phone) {
        return new Response(JSON.stringify({ success: false, error: 'No phone number on file for this hire.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const message = `Hi ${hire.staff_name}, this is a friendly reminder from Nashua Paarl to continue your onboarding (currently on step ${hire.step_reached} of 7). Open your link to pick up where you left off!`;

      const res = await fetch(
        `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: hire.phone,
            type: 'text',
            text: { body: message }
          }),
        }
      );

      const data = await res.json();
      return new Response(JSON.stringify({ success: res.ok, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default Fallback
    return new Response(JSON.stringify({ success: false, error: 'Unknown tool or agent cluster' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
