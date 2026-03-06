import { SUPABASE_CONFIG } from '../constants';

const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_KEY = SUPABASE_CONFIG.anonKey;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export const telemetryService = {
  getHireDetails: async (hireId: string, select = '*') => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}&select=${select}`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch hire details');
    const data = await resp.json();
    return data[0];
  },

  updateHire: async (hireId: string, payload: any) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?id=eq.${hireId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Failed to update hire');
    return resp;
  },

  getConversationLogs: async (agentId = 'AIVA', limit = 15) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/agent_conversation_logs?agent_id=eq.${agentId}&select=*&order=created_at.desc&limit=${limit}`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch conversation logs');
    return resp.json();
  },

  getDashboardMetrics: async () => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/v_dashboard_metrics?select=*`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch dashboard metrics');
    const data = await resp.json();
    return data[0];
  },

  getAllHires: async (select = 'id,staff_name,status,step_reached,updated_at,created_at,metadata') => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?select=${select}`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch all hires');
    return resp.json();
  },

  getHiresByManager: async (managerPhone: string) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/onboarding_telemetry?metadata->>manager_phone=eq.${managerPhone}`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch hires by manager');
    return resp.json();
  },

  getUploadedFiles: async (hireId: string) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/uploaded_files?hire_id=eq.${hireId}`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch uploaded files');
    return resp.json();
  },

  getExportLogs: async () => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/hr_export_log?select=*&order=exported_at.desc`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch export logs');
    return resp.json();
  },

  getExportLogById: async (logId: string) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/hr_export_log?id=eq.${logId}`, { headers });
    if (!resp.ok) throw new Error('Failed to fetch export log');
    const data = await resp.json();
    return data[0];
  },

  createExportLog: async (payload: any) => {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/hr_export_log`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Failed to create export log');
    return resp;
  }
};
