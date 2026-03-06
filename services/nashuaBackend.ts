
// DEPRECATED: Google Sheets integration replaced by TierFive Cirrus File Server
// See services/cirrusService.ts for active implementation.

export interface NashuaData {
    policies: { title: string; content: string }[];
    staff: { id: string; name: string; role: string; status: string }[];
}

export const syncNashuaData = async (): Promise<NashuaData | null> => {
    console.warn("syncNashuaData is deprecated. Use cirrusService instead.");
    return null;
};

export const logToNashua = async (type: string, user: string, details: any) => {
    console.warn("logToNashua is deprecated. Use logCirrusAudit instead.");
};
