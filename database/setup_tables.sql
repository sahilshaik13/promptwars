-- setup_tables.sql
-- Run this in the Supabase SQL Editor.

-- 1. Create chat_messages table tied to auth.users
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL, -- Logical session (e.g. current map view session)
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    zones_referenced TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create zone_snapshots for historical density tracking
CREATE TABLE IF NOT EXISTS public.zone_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_minute INTEGER,
    match_phase TEXT,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.zone_snapshots ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Create wait_predictions for logging AI performance
CREATE TABLE IF NOT EXISTS public.wait_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    zone_id TEXT NOT NULL,
    predicted_wait_minutes INTEGER NOT NULL,
    confidence FLOAT NOT NULL,
    trend TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.wait_predictions ADD COLUMN IF NOT EXISTS user_id UUID;

-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Create policies so users can only read/write their own chat messages
DROP POLICY IF EXISTS "Users can view their own chat_messages" ON public.chat_messages;
CREATE POLICY "Users can view their own chat_messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat_messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own chat_messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Allow service role to view/manage all for admin logic
DROP POLICY IF EXISTS "Service role full access chat_messages" ON public.chat_messages;
CREATE POLICY "Service role full access chat_messages"
ON public.chat_messages
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Enable RLS on zone_snapshots
ALTER TABLE public.zone_snapshots ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for zone_snapshots
DROP POLICY IF EXISTS "Users can view their own zone_snapshots" ON public.zone_snapshots;
CREATE POLICY "Users can view their own zone_snapshots"
ON public.zone_snapshots FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own zone_snapshots" ON public.zone_snapshots;
CREATE POLICY "Users can insert their own zone_snapshots"
ON public.zone_snapshots FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access zone_snapshots" ON public.zone_snapshots;
CREATE POLICY "Service role full access zone_snapshots"
ON public.zone_snapshots
TO service_role
USING (true)
WITH CHECK (true);

-- 9. Enable RLS on wait_predictions
ALTER TABLE public.wait_predictions ENABLE ROW LEVEL SECURITY;

-- 10. Create policies for wait_predictions
DROP POLICY IF EXISTS "Users can view their own wait_predictions" ON public.wait_predictions;
CREATE POLICY "Users can view their own wait_predictions"
ON public.wait_predictions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wait_predictions" ON public.wait_predictions;
CREATE POLICY "Users can insert their own wait_predictions"
ON public.wait_predictions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access wait_predictions" ON public.wait_predictions;
CREATE POLICY "Service role full access wait_predictions"
ON public.wait_predictions
TO service_role
USING (true)
WITH CHECK (true);
