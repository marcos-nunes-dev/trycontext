-- Migration: Add content ingestion tables (pgvector, content_links, content_chunks)
-- This migration enables vector search and context scoping for workspace content ingestion

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- CONTENT LINKS (scoping: workspace/epic/story/task)
-- ============================================================================

-- Content links table for scoping content to workspace/epic/story/task
CREATE TABLE IF NOT EXISTS public.content_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('workspace', 'epic', 'story', 'task')),
  scope_id UUID, -- NULL when scope_type='workspace', otherwise references epic/story/task
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure scope_id is NULL only when scope_type='workspace'
  CONSTRAINT content_links_scope_check CHECK (
    (scope_type = 'workspace' AND scope_id IS NULL) OR
    (scope_type IN ('epic', 'story', 'task') AND scope_id IS NOT NULL)
  )
);

-- ============================================================================
-- CONTENT CHUNKS (vector embeddings)
-- ============================================================================

-- Content chunks table for storing text chunks and embeddings
CREATE TABLE IF NOT EXISTS public.content_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, -- Order of chunk within content
  text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- { sourceFileName, pageNumber?, section?, scopeHints }
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  embedding_model TEXT, -- e.g., 'text-embedding-3-small'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure chunk_index is unique per content
  UNIQUE(content_id, chunk_index)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Content links indexes
CREATE INDEX IF NOT EXISTS idx_content_links_workspace_id ON public.content_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_links_content_id ON public.content_links(content_id);
CREATE INDEX IF NOT EXISTS idx_content_links_scope ON public.content_links(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_content_links_created_by ON public.content_links(created_by);

-- Content chunks indexes
CREATE INDEX IF NOT EXISTS idx_content_chunks_workspace_id ON public.content_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_content_id ON public.content_chunks(content_id);
-- Vector index for similarity search
-- Note: IVFFLAT requires data to exist and specific parameters
-- For MVP, we'll create a basic index; optimize with IVFFLAT/HNSW after data is loaded
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding ON public.content_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.content_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

-- Content links RLS policies
CREATE POLICY "Users can view content links in their workspaces"
  ON public.content_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_links.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create content links in their workspaces"
  ON public.content_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_links.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update content links in their workspaces"
  ON public.content_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_links.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can delete content links in their workspaces"
  ON public.content_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_links.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

-- Content chunks RLS policies
CREATE POLICY "Users can view content chunks in their workspaces"
  ON public.content_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_chunks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create content chunks in their workspaces"
  ON public.content_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_chunks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can update content chunks in their workspaces"
  ON public.content_chunks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_chunks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
        ))
    )
  );

CREATE POLICY "Users can delete content chunks in their workspaces"
  ON public.content_chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = content_chunks.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at column (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
