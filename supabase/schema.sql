-- ==============================================================================
-- ArhaStudio - Video Project Library
-- Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- 1. Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create / Update the Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_number INTEGER NOT NULL CHECK (video_number > 0),
    video_type TEXT NOT NULL DEFAULT 'shorts' CHECK (video_type IN ('shorts', 'long')),
    project_date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT DEFAULT '',
    video_url TEXT NOT NULL CHECK (video_url ~* '^https?://'),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT unique_video_number UNIQUE (video_number)
);

-- Ensure columns exist on projects if table was already created
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'shorts';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_date DATE DEFAULT CURRENT_DATE;

-- Migrate all existing projects to 'shorts'
UPDATE public.projects SET video_type = 'shorts' WHERE video_type IS NULL OR video_type = '';
UPDATE public.projects SET project_date = CURRENT_DATE WHERE project_date IS NULL;

-- 3. Projects Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_video_number ON public.projects(video_number ASC);
CREATE INDEX IF NOT EXISTS idx_projects_video_type ON public.projects(video_type);
CREATE INDEX IF NOT EXISTS idx_projects_date ON public.projects(project_date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- 4. Create the Upcoming Table (Dedicated Planning Area)
CREATE TABLE IF NOT EXISTS public.upcoming (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_number INTEGER NOT NULL CHECK (video_number > 0),
    video_type TEXT NOT NULL DEFAULT 'shorts' CHECK (video_type IN ('shorts', 'long')),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT DEFAULT '',
    audio_prompt TEXT DEFAULT '',
    edit_prompt TEXT DEFAULT '',
    target_date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_upcoming_video_number ON public.upcoming(video_number ASC);
CREATE INDEX IF NOT EXISTS idx_upcoming_type ON public.upcoming(video_type);
CREATE INDEX IF NOT EXISTS idx_upcoming_target_date ON public.upcoming(target_date ASC);

-- 5. Auto-update Timestamp Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_upcoming_updated_at ON public.upcoming;
CREATE TRIGGER set_upcoming_updated_at
    BEFORE UPDATE ON public.upcoming
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
DROP POLICY IF EXISTS "Authenticated users can select projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

CREATE POLICY "Authenticated users can select projects"
    ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects"
    ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects"
    ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete projects"
    ON public.projects FOR DELETE TO authenticated USING (true);

-- Upcoming RLS Policies
DROP POLICY IF EXISTS "Authenticated users can select upcoming" ON public.upcoming;
DROP POLICY IF EXISTS "Authenticated users can insert upcoming" ON public.upcoming;
DROP POLICY IF EXISTS "Authenticated users can update upcoming" ON public.upcoming;
DROP POLICY IF EXISTS "Authenticated users can delete upcoming" ON public.upcoming;

CREATE POLICY "Authenticated users can select upcoming"
    ON public.upcoming FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert upcoming"
    ON public.upcoming FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update upcoming"
    ON public.upcoming FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete upcoming"
    ON public.upcoming FOR DELETE TO authenticated USING (true);
