-- ==============================================================================
-- ArhaStudio - Video Project Library
-- Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- 1. Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_number INTEGER NOT NULL CHECK (video_number > 0),
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT DEFAULT '',
    video_url TEXT NOT NULL CHECK (video_url ~* '^https?://'),
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Enforce strict unique constraint on video_number
    CONSTRAINT unique_video_number UNIQUE (video_number)
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_video_number ON public.projects(video_number ASC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_title ON public.projects(title);

-- GIN index for full-text search across title and description
CREATE INDEX IF NOT EXISTS idx_projects_fts ON public.projects USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- 4. Automatic updated_at Timestamp Trigger
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

-- 5. Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies for a clean state
DROP POLICY IF EXISTS "Admin full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can select projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

-- Strict Policies: Only authenticated users can perform CRUD operations
CREATE POLICY "Authenticated users can select projects"
    ON public.projects
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
    ON public.projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
    ON public.projects
    FOR DELETE
    TO authenticated
    USING (true);

-- Anonymous / unauthenticated access is completely blocked by RLS.

-- ==============================================================================
-- Sample Initial Data (Optional for testing)
-- Run this if you want to seed a few projects
-- ==============================================================================
-- INSERT INTO public.projects (video_number, title, description, video_url, category, tags)
-- VALUES 
--   (1, 'Python Introduction & Environment Setup in Telugu', 'Complete walkthrough of installing Python, VS Code, and writing our first hello world script in Telugu.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Python', ARRAY['Python', 'Basics', 'Setup']),
--   (2, 'Python Data Types & Variables', 'Detailed explanation of integers, floats, strings, booleans, and dynamic typing.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Python', ARRAY['Python', 'Variables', 'Data Types']),
--   (3, 'Python Operators and Expressions', 'Arithmetic, relational, logical, bitwise, and membership operators with clear examples.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Python', ARRAY['Python', 'Operators']),
--   (5, 'Python Conditional Statements - if, elif, else', 'Decision making statements in Python with real-world scenarios.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Python', ARRAY['Python', 'Control Flow']),
--   (10, 'Python Functions & Scope Deep Dive', 'Mastering positional vs keyword arguments, *args, **kwargs, and variable scope.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Python', ARRAY['Python', 'Functions', 'Advanced'])
-- ON CONFLICT (video_number) DO NOTHING;
