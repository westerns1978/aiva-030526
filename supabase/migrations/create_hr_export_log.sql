-- Create the hr_export_log table
CREATE TABLE IF NOT EXISTS public.hr_export_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hire_id UUID NOT NULL,
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_system TEXT DEFAULT 'sage_hr',
    status TEXT DEFAULT 'pending_sync',
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies (adjust as needed for your security model)
ALTER TABLE public.hr_export_log ENABLE ROW LEVEL SECURITY;

-- Allow anon/authenticated users to insert logs (since the frontend uses anon key)
CREATE POLICY "Allow inserts from anon" ON public.hr_export_log
    FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users to read logs
CREATE POLICY "Allow select for authenticated users" ON public.hr_export_log
    FOR SELECT
    USING (auth.role() = 'authenticated');
