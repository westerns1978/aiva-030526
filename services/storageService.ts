import { createClient } from '@supabase/supabase-js';
import { westflow } from './westflowClient';
import type { AgentKnowledgeRecord, OnboardingRecord, UploadedFileRecord } from '../types';
import { SUPABASE_CONFIG } from '../constants';

const STORAGE_BUCKET = SUPABASE_CONFIG.bucket;
const LEGACY_BUCKET = SUPABASE_CONFIG.legacyBucket;
const DEFAULT_ORG_ID = SUPABASE_CONFIG.defaultOrgId;

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export type { AgentKnowledgeRecord, OnboardingRecord, UploadedFileRecord };

export const storageService = {
  
  // ============================================
  // STORAGE OPERATIONS (Keep direct - no orchestrator tool for this yet)
  // ============================================
  
  checkConnection: async () => {
    try {
      const { error } = await supabase.storage.listBuckets();
      if (error) return { status: 'offline', message: error.message };
      return { status: 'healthy', message: 'Connected' };
    } catch (e) {
      return { status: 'offline', message: 'Connection Timeout' };
    }
  },

  uploadFile: async (
    file: File | Blob, 
    name?: string, 
    folder = 'uploads', 
    metadata: any = {},
    options?: { hireId?: string; documentType?: string; appId?: string; documentStatus?: string }
  ) => {
    const fileName = name || (file instanceof File ? file.name : `asset_${Date.now()}.jpg`);
    const cleanName = fileName.replace(/\s/g, '_');
    
    // Build hire-aware path: {hireId}/{folder}/{timestamp}_{name}
    // Falls back to flat path if no hireId provided
    const hirePrefix = options?.hireId ? `${options.hireId}/` : '';
    const filePath = `${hirePrefix}${folder}/${Date.now()}_${cleanName}`;
    
    // Determine bucket — AIVA uses private bucket, others use legacy
    const bucket = (options?.appId && options.appId !== 'aiva') ? LEGACY_BUCKET : STORAGE_BUCKET;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    // Insert with CMS indexing columns
    const { data: dbData, error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        file_name: fileName,
        file_path: filePath,
        file_type: file.type || 'image/jpeg',
        file_size: file.size,
        public_url: urlData.publicUrl,
        org_id: DEFAULT_ORG_ID,
        uploaded_by: 'westflow-agent',
        metadata: metadata,
        // CMS indexing
        app_id: options?.appId || 'aiva',
        bucket_id: bucket,
        hire_id: options?.hireId || null,
        document_type: options?.documentType || null,
        document_status: options?.documentStatus || 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Supabase] uploaded_files sync skipped:", dbError.message);
    }

    return { dbData, publicUrl: urlData.publicUrl };
  },

  getFiles: async (limit = 50, filter?: { workerId?: string; category?: string }): Promise<UploadedFileRecord[]> => {
    let query = supabase
      .from('uploaded_files')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID)
      .order('uploaded_at', { ascending: false });

    if (filter?.workerId) {
      query = query.eq('metadata->>worker_id', filter.workerId);
    }
    
    if (filter?.category) {
      query = query.eq('metadata->>classification', filter.category);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return (data || []) as UploadedFileRecord[];
  },

  deleteFile: async (fileId: string, filePath: string) => {
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    if (storageError) throw storageError;

    const { error: dbError } = await supabase.from('uploaded_files').delete().eq('id', fileId);
    if (dbError) throw dbError;
  },

  // ============================================
  // KNOWLEDGE BASE (Keep direct for now - read-only)
  // ============================================

  getAgentKnowledge: async (): Promise<AgentKnowledgeRecord[]> => {
    const { data, error } = await supabase
      .from('agent_knowledge')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID);
    if (error) throw error;
    return (data || []) as AgentKnowledgeRecord[];
  },

  saveKnowledge: async (record: Partial<AgentKnowledgeRecord>) => {
    const { data, error } = await supabase
      .from('agent_knowledge')
      .insert({ ...record, org_id: DEFAULT_ORG_ID })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ============================================
  // ONBOARDING OPERATIONS → NOW VIA ORCHESTRATOR
  // These now route through AIVA so conversations get logged
  // ============================================

  /**
   * @deprecated Use westflow.getOnboardingPipeline() instead
   * Kept for backward compatibility - now routes through orchestrator
   */
  getOnboardingRecords: async (): Promise<OnboardingRecord[]> => {
    const result = await westflow.getOnboardingPipeline();
    if (result.success && result.pipeline) {
      return result.pipeline as OnboardingRecord[];
    }
    // Fallback to direct query if orchestrator fails
    console.warn('[storageService] Orchestrator failed, falling back to direct query');
    const { data, error } = await supabase
      .from('onboarding_telemetry')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as OnboardingRecord[];
  },

  /**
   * @deprecated Use westflow.advanceOnboardingStep() instead
   * Kept for backward compatibility - now routes through orchestrator
   */
  syncOnboardingProgress: async (workerId: string, status: string, metadata: any) => {
    // Route through orchestrator so AIVA can trigger notifications
    try {
      // First, find the hire by worker_id to get the hire_id
      const pipeline = await westflow.getOnboardingPipeline();
      if (pipeline.success && pipeline.pipeline) {
        const hire = pipeline.pipeline.find((h: any) => h.staff_id === workerId);
        if (hire) {
          // Use the orchestrator to update
          await westflow.call('AIVA', 'update_hire_details', {
            hire_id: hire.id,
            status: status,
            notes: JSON.stringify(metadata)
          });
          return;
        }
      }
      
      // Fallback: direct update (non-blocking)
      console.warn('[storageService] Could not find hire, falling back to direct update');
      const { error } = await supabase
        .from('onboarding_telemetry')
        .upsert({
          staff_id: workerId,
          status: status,
          metadata: metadata,
          updated_at: new Date().toISOString()
        }, { onConflict: 'staff_id' });
      if (error) console.warn("[Supabase Telemetry] Sync deferred:", error.message);
    } catch (e) {
      console.warn('[storageService] syncOnboardingProgress failed:', e);
    }
  },

  /**
   * @deprecated Use westflow.createNewHire() instead
   * Kept for backward compatibility - now routes through orchestrator
   */
  trackWorkerInvite: async (workerId: string, fullName: string) => {
    try {
      // Route through orchestrator - this triggers the welcome WhatsApp
      const result = await westflow.createNewHire(fullName);
      if (result.success) {
        console.log('[storageService] New hire created via orchestrator:', result.data?.staff_id);
        return;
      }
      
      // Fallback: direct insert (no WhatsApp notification)
      console.warn('[storageService] Orchestrator failed, falling back to direct insert');
      const { error } = await supabase
        .from('onboarding_telemetry')
        .upsert({
          staff_id: workerId,
          staff_name: fullName,
          status: 'pending',
          step_reached: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'staff_id' });
      if (error) console.warn("[Supabase Telemetry] Invite tracking deferred.");
    } catch (e) {
      console.warn('[storageService] trackWorkerInvite failed:', e);
    }
  }
};