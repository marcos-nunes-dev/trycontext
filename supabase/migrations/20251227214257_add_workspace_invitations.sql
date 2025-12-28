-- Migration: Add workspace invitations table
-- This migration creates the workspace_invitations table for managing workspace sharing invitations

-- ============================================================================
-- WORKSPACE INVITATIONS
-- ============================================================================

-- Workspace invitations table
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_expires_at ON public.workspace_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON public.workspace_invitations(status);

-- Unique index to prevent duplicate pending invitations for same email and workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_invitations_unique_pending 
  ON public.workspace_invitations(workspace_id, email) 
  WHERE status = 'pending';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Workspace invitations RLS policies
CREATE POLICY "Users can view invitations for their workspaces"
  ON public.workspace_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_invitations.workspace_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Workspace owners can create invitations"
  ON public.workspace_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_invitations.workspace_id AND owner_id = auth.uid()
    )
    AND role != 'owner'  -- Cannot invite as owner
  );

CREATE POLICY "Workspace owners can update invitations"
  ON public.workspace_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_invitations.workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete invitations"
  ON public.workspace_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_invitations.workspace_id AND owner_id = auth.uid()
    )
  );

-- Allow users to view their own invitations (for acceptance page)
CREATE POLICY "Users can view invitations sent to their email"
  ON public.workspace_invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Apply updated_at trigger
CREATE TRIGGER update_workspace_invitations_updated_at
  BEFORE UPDATE ON public.workspace_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set expiration date on insert
CREATE OR REPLACE FUNCTION set_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiration to 7 days from creation if not explicitly set
  IF NEW.expires_at IS NULL OR NEW.expires_at <= NOW() THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_workspace_invitation_expiration
  BEFORE INSERT ON public.workspace_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_expiration();

-- Function to auto-update status to expired
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.workspace_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function that can be called periodically to expire invitations
-- This can be called via a cron job or manually
