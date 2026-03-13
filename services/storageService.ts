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
  // STORAGE OPERATIONS
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
    const hirePrefix = options?.hireId ? `${options.hireId}/` : '';
    const filePath = `${hirePrefix}${folder}/${Date.now()}_${cleanName}`;
    const bucket = (options?.appId && options.appId !== 'aiva') ? LEGACY_BUCKET : STORAGE_BUCKET;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

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
        metadata,
        app_id: options?.appId || 'aiva',
        bucket_id: bucket,
        hire_id: options?.hireId || null,
        document_type: options?.documentType || null,
        document_status: options?.documentStatus || 'uploaded'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Supabase] uploaded_files sync skipped:', dbError.message);
    }

    return { dbData, publicUrl: urlData.publicUrl };
  },

  /**
   * Upload a file AND immediately embed it for semantic search.
   * Drop-in replacement for uploadFile() on any document that should be searchable.
   *
   * @example
   * const { dbData, publicUrl } = await storageService.uploadAndEmbed(file, 'id.jpg', 'documents', {}, {
   *   hireId: currentHire.id,
   *   documentType: 'id_document',
   *   embedAs: 'image'   // 'image' | 'pdf' | 'text'
   * });
   */
  uploadAndEmbed: async (
    file: File | Blob,
    name?: string,
    folder = 'uploads',
    metadata: any = {},
    options?: {
      hireId?: string;
      documentType?: string;
      appId?: string;
      documentStatus?: string;
      embedAs?: 'image' | 'pdf' | 'text';
      embedText?: string;
    }
  ) => {
    // 1. Upload first
    const result = await storageService.uploadFile(file, name, folder, metadata, options);
    const fileId = result.dbData?.id;

    // 2. Embed async — don't block the upload response
    if (fileId) {
      storageService._embedFileAsync(fileId, file, options?.embedAs, options?.embedText)
        .catch(e => console.warn('[embedding] uploadAndEmbed embed step failed silently:', e));
    }

    return result;
  },

  /** Internal: convert file to base64 and call embed-document edge function */
  _embedFileAsync: async (
    fileId: string,
    file: File | Blob,
    embedAs: 'image' | 'pdf' | 'text' = 'image',
    text?: string
  ): Promise<void> => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const body: any = {
        action: 'store',
        fileId,
        appId: 'aiva',
        tableName: 'uploaded_files',
      };

      if (embedAs === 'image') {
        body.imageBase64 = base64;
        body.imageMimeType = file.type || 'image/jpeg';
      } else if (embedAs === 'pdf') {
        body.pdfBase64 = base64;
      } else if (embedAs === 'text' && text) {
        body.text = text;
      }

      const { error } = await supabase.functions.invoke('embed-document', { body });
      if (error) throw error;
      console.log(`[embedding] ✅ ${fileId} embedded (${embedAs})`);
    } catch (e) {
      console.warn(`[embedding] ⚠️ embed failed for ${fileId}:`, e);
    }
  },

  // ============================================
  // EMBEDDING — semantic search across AIVA docs
  // ============================================

  /**
   * Embed any document by ID after it already exists in uploaded_files.
   * Use this when you have the record but need to (re)embed it.
   */
  embedDocument: async (params: {
    fileId: string;
    text?: string;
    pdfBase64?: string;
    imageBase64?: string;
    imageMimeType?: string;
    tableName?: string;
  }): Promise<{ success: boolean; dims?: number; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('embed-document', {
        body: {
          action: 'store',
          fileId: params.fileId,
          text: params.text,
          pdfBase64: params.pdfBase64,
          imageBase64: params.imageBase64,
          imageMimeType: params.imageMimeType || 'image/jpeg',
          appId: 'aiva',
          tableName: params.tableName || 'uploaded_files',
        }
      });
      if (error) throw error;
      const dims = data?.embedding?.length ?? 0;
      console.log(`[embedding] ✅ ${params.fileId} — ${dims} dims`);
      return { success: true, dims };
    } catch (e: any) {
      console.error('[embedding] ❌ embedDocument failed:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Semantic search across all AIVA documents.
   * Returns top matches ranked by similarity.
   *
   * @example
   * const results = await storageService.searchDocuments('commission structure');
   * // → [{ id, file_name, similarity: 0.91 }, ...]
   */
  searchDocuments: async (
    query: string,
    matchCount = 5,
    matchThreshold = 0.70
  ): Promise<Array<{ id: string; file_name: string; similarity: number }>> => {
    try {
      const { data, error } = await supabase.functions.invoke('embed-document', {
        body: { action: 'search', text: query, appId: 'aiva', matchCount }
      });
      if (error || !data?.embedding) throw error || new Error('No embedding returned');

      const { data: matches, error: rpcError } = await supabase.rpc('match_documents', {
        query_embedding: data.embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_app_id: 'aiva',
      });
      if (rpcError) throw rpcError;
      return matches || [];
    } catch (e: any) {
      console.error('[embedding] ❌ searchDocuments failed:', e);
      return [];
    }
  },

  /**
   * Find job descriptions semantically matching a query.
   * Used in ManagerHub dispatch to auto-suggest the right JD.
   *
   * @example
   * const jds = await storageService.searchJobDescriptions('field technician copier');
   */
  searchJobDescriptions: async (
    query: string,
    matchCount = 3
  ): Promise<Array<{ id: string; title: string; similarity: number }>> => {
    try {
      const { data, error } = await supabase.functions.invoke('embed-document', {
        body: { action: 'search', text: query, appId: 'aiva', matchCount }
      });
      if (error || !data?.embedding) throw error || new Error('No embedding returned');

      const { data: matches, error: rpcError } = await supabase.rpc('match_job_descriptions', {
        query_embedding: data.embedding,
        match_threshold: 0.70,
        match_count: matchCount,
      });
      if (rpcError) throw rpcError;
      return matches || [];
    } catch (e: any) {
      console.error('[embedding] ❌ searchJobDescriptions failed:', e);
      return [];
    }
  },

  /**
   * Embed an ID photo for verification and future matching.
   * Call automatically when DocumentHub processes an ID upload.
   */
  embedIdPhoto: async (fileId: string, imageBase64: string): Promise<boolean> => {
    const result = await storageService.embedDocument({
      fileId,
      imageBase64,
      imageMimeType: 'image/jpeg',
      tableName: 'uploaded_files',
    });
    return result.success;
  },

  // ============================================
  // KNOWLEDGE BASE
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

  getFiles: async (limit = 50, filter?: { workerId?: string; category?: string }): Promise<UploadedFileRecord[]> => {
    let query = supabase
      .from('uploaded_files')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID)
      .order('uploaded_at', { ascending: false });

    if (filter?.workerId) query = query.eq('metadata->>worker_id', filter.workerId);
    if (filter?.category) query = query.eq('metadata->>classification', filter.category);

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
  // ONBOARDING OPERATIONS → VIA ORCHESTRATOR
  // ============================================

  /** @deprecated Use westflow.getOnboardingPipeline() */
  getOnboardingRecords: async (): Promise<OnboardingRecord[]> => {
    const result = await westflow.getOnboardingPipeline();
    if (result.success && result.pipeline) return result.pipeline as OnboardingRecord[];
    console.warn('[storageService] Orchestrator failed, falling back to direct query');
    const { data, error } = await supabase
      .from('onboarding_telemetry')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as OnboardingRecord[];
  },

  /** @deprecated Use westflow.advanceOnboardingStep() */
  syncOnboardingProgress: async (workerId: string, status: string, metadata: any) => {
    try {
      const pipeline = await westflow.getOnboardingPipeline();
      if (pipeline.success && pipeline.pipeline) {
        const hire = pipeline.pipeline.find((h: any) => h.staff_id === workerId);
        if (hire) {
          await westflow.call('AIVA', 'update_hire_details', {
            hire_id: hire.id,
            status,
            notes: JSON.stringify(metadata)
          });
          return;
        }
      }
      console.warn('[storageService] Could not find hire, falling back to direct update');
      const { error } = await supabase
        .from('onboarding_telemetry')
        .upsert({ staff_id: workerId, status, metadata, updated_at: new Date().toISOString() },
          { onConflict: 'staff_id' });
      if (error) console.warn('[Supabase Telemetry] Sync deferred:', error.message);
    } catch (e) {
      console.warn('[storageService] syncOnboardingProgress failed:', e);
    }
  },

  /** @deprecated Use westflow.createNewHire() */
  trackWorkerInvite: async (workerId: string, fullName: string) => {
    try {
      const result = await westflow.createNewHire(fullName);
      if (result.success) {
        console.log('[storageService] New hire created via orchestrator:', result.data?.staff_id);
        return;
      }
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
      if (error) console.warn('[Supabase Telemetry] Invite tracking deferred.');
    } catch (e) {
      console.warn('[storageService] trackWorkerInvite failed:', e);
    }
  }
};
