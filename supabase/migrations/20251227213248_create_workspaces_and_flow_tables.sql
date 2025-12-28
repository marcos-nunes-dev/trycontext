-- Migration: Create workspaces and flow data tables
-- This migration creates the core workspace structure and flow data tables (epics, stories, tasks, content)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- WORKSPACES
-- ============================================================================

-- Workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace members table (for future multi-user support)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- User workspace preferences (stores current workspace per user)
CREATE TABLE IF NOT EXISTS public.user_workspace_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- FLOW DATA TABLES
-- ============================================================================

-- Content table (files, documents, etc.)
CREATE TABLE IF NOT EXISTS public.content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transcription', 'document', 'image')),
  file_url TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'queued', 'processing', 'analyzed', 'ready', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Epics table
CREATE TABLE IF NOT EXISTS public.epics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'synced')),
  content_ids UUID[] DEFAULT '{}',
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  epic_id UUID REFERENCES public.epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'synced')),
  content_ids UUID[] DEFAULT '{}',
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'synced')),
  content_ids UUID[] DEFAULT '{}',
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workspace_preferences_user_id ON public.user_workspace_preferences(user_id);

-- Flow data indexes
CREATE INDEX IF NOT EXISTS idx_content_workspace_id ON public.content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_epics_workspace_id ON public.epics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stories_workspace_id ON public.stories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stories_epic_id ON public.stories(epic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_story_id ON public.tasks(story_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workspace_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Workspaces RLS policies
CREATE POLICY "Users can view their own workspaces"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own workspaces"
  ON public.workspaces FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete their own workspaces"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Workspace members RLS policies
CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_members.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Workspace owners can add members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update members"
  ON public.workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can remove members"
  ON public.workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
    )
  );

-- User workspace preferences RLS policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_workspace_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.user_workspace_preferences FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can update their own preferences"
  ON public.user_workspace_preferences FOR UPDATE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

-- Content RLS policies
CREATE POLICY "Users can view content in their workspaces"
  ON public.content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create content in their workspaces"
  ON public.content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can update content in their workspaces"
  ON public.content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can delete content in their workspaces"
  ON public.content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
  );

-- Epics RLS policies
CREATE POLICY "Users can view epics in their workspaces"
  ON public.epics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = epics.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create epics in their workspaces"
  ON public.epics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = epics.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can update epics in their workspaces"
  ON public.epics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = epics.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can delete epics in their workspaces"
  ON public.epics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = epics.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
  );

-- Stories RLS policies
CREATE POLICY "Users can view stories in their workspaces"
  ON public.stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = stories.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create stories in their workspaces"
  ON public.stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = stories.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can update stories in their workspaces"
  ON public.stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = stories.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can delete stories in their workspaces"
  ON public.stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = stories.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
  );

-- Tasks RLS policies
CREATE POLICY "Users can view tasks in their workspaces"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = tasks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create tasks in their workspaces"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = tasks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can update tasks in their workspaces"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = tasks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can delete tasks in their workspaces"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = tasks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workspace_preferences_updated_at
  BEFORE UPDATE ON public.user_workspace_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_epics_updated_at
  BEFORE UPDATE ON public.epics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a default workspace for new users
CREATE OR REPLACE FUNCTION create_default_workspace_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create a default workspace for the new user
  INSERT INTO public.workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Set it as the current workspace
  INSERT INTO public.user_workspace_preferences (user_id, workspace_id)
  VALUES (NEW.id, new_workspace_id)
  ON CONFLICT (user_id) DO UPDATE SET workspace_id = new_workspace_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default workspace when a user signs up
-- Note: This trigger should fire after the user is created
-- We'll use a different approach - create workspace on first login instead
-- This is safer than relying on auth.users trigger
