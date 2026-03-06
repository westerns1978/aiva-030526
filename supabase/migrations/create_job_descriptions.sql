-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS public.job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    branch TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anonymous read access to job_descriptions"
    ON public.job_descriptions FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow authenticated read access to job_descriptions"
    ON public.job_descriptions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert access to job_descriptions"
    ON public.job_descriptions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Seed initial data
INSERT INTO public.job_descriptions (title, file_url, branch)
VALUES ('PBX/VBX/Voice/Surveillance/IT/Access Control/Time & Attendance Engineer', '', 'Nashua Paarl')
ON CONFLICT DO NOTHING;
