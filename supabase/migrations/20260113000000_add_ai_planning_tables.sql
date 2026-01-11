-- Migration: Add AI planning support tables and metadata columns
-- This migration adds revision history, AI metadata columns, and AI change suggestions table

-- ============================================================================
-- WORK ITEM REVISIONS (Version History + Rollback)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_item_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('epic', 'story', 'task')),
  target_id UUID NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('ai_suggestion_accept', 'manual_edit', 'system', 'rollback')),
  before_json JSONB NOT NULL, -- Snapshot of relevant fields before change
  after_json JSONB NOT NULL, -- Snapshot of relevant fields after change
  summary TEXT,
  citations JSONB DEFAULT '[]'::jsonb, -- Optional: contentIds/chunkIds that influenced this change
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for work_item_revisions
CREATE INDEX IF NOT EXISTS idx_work_item_revisions_workspace_id ON public.work_item_revisions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_work_item_revisions_target ON public.work_item_revisions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_work_item_revisions_created_at ON public.work_item_revisions(created_at DESC);

-- ============================================================================
-- AI CHANGE SUGGESTIONS (Suggest-only impact tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_change_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('epic', 'story', 'task')),
  target_id UUID NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('content_uploaded', 'content_deleted', 'manual_recheck')),
  summary TEXT NOT NULL,
  diff_json JSONB NOT NULL, -- Proposed changes (field-level diffs)
  citations JSONB DEFAULT '[]'::jsonb, -- contentIds/chunkIds that triggered this suggestion
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL -- NULL for system-generated
);

-- Indexes for ai_change_suggestions
CREATE INDEX IF NOT EXISTS idx_ai_change_suggestions_workspace_id ON public.ai_change_suggestions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_change_suggestions_target ON public.ai_change_suggestions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ai_change_suggestions_status ON public.ai_change_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_change_suggestions_created_at ON public.ai_change_suggestions(created_at DESC);

-- ============================================================================
-- ADD METADATA COLUMNS TO EPICS, STORIES, TASKS
-- ============================================================================

-- Add metadata column to epics if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'epics' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.epics ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add metadata column to stories if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stories' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.stories ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add metadata column to tasks if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.work_item_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_change_suggestions ENABLE ROW LEVEL SECURITY;

-- Work item revisions RLS policies
CREATE POLICY "Users can view revisions in their workspaces"
  ON public.work_item_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = work_item_revisions.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create revisions in their workspaces"
  ON public.work_item_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = work_item_revisions.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
    AND created_by = auth.uid()
  );

-- AI change suggestions RLS policies
CREATE POLICY "Users can view suggestions in their workspaces"
  ON public.ai_change_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = ai_change_suggestions.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create suggestions in their workspaces"
  ON public.ai_change_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = ai_change_suggestions.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "Users can update suggestions in their workspaces"
  ON public.ai_change_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = ai_change_suggestions.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );
