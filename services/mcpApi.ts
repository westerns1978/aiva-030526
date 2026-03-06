
import type { Bridge, Scanner, Job } from '../types';
import { westflow } from './westflowClient';

// --- MOCK DATA FOR FALLBACK ---
const MOCK_BRIDGES: Bridge[] = [
    { bridge_id: "pds-bridge-paarl-01", machine_name: "Nashua_Paarl_Gateway", last_seen: new Date().toISOString(), scanner_count: 1, status: "online", scanners: [] }
];

const MOCK_SCANNERS: Scanner[] = [
    { id: "scanner-hp-7000", name: "HP ScanJet 7000", manufacturer: "HP", model: "ScanJet", bridge_id: "pds-bridge-paarl-01", twainSourceName: "TWAIN-HP", status: "available", capabilities: {} }
];

MOCK_BRIDGES[0].scanners = MOCK_SCANNERS;

export async function fetchBridges(): Promise<Bridge[]> {
    const resp = await westflow.getFleetStatus();
    if (resp.success) return resp.data.bridges || MOCK_BRIDGES;
    return MOCK_BRIDGES;
}

export async function fetchScanners(): Promise<Scanner[]> {
    const bridges = await fetchBridges();
    return bridges.flatMap(b => b.scanners);
}

export async function fetchJobs(): Promise<Job[]> {
    // Linked to WestFlow billing/telemetry in future phase
    return [];
}

export async function startScanJob(scanner_id: string): Promise<string> {
    const resp = await westflow.scanDocument(scanner_id);
    if (!resp.success) throw new Error(resp.error || 'WestFlow Scan Failed');
    return resp.data.job_id || `job-${Date.now()}`;
}

export async function startCertJob(scanner_id: string): Promise<string> {
    // Routing certification through Universal Hardware tool
    const resp = await westflow.scanDocument(scanner_id, 'calibration_check');
    if (!resp.success) throw new Error('Certification Job Failed');
    return resp.data.job_id || `cert-${Date.now()}`;
}
