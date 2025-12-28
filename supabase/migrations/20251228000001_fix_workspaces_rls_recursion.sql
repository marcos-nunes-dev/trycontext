-- Fix infinite recursion in workspaces SELECT policy
-- The issue: When creating a workspace and selecting it back, the SELECT policy checks workspace_members,
-- which then checks workspaces again, causing infinite recursion.
-- 
-- Solution: Use a SECURITY DEFINER function to check membership without triggering RLS recursion.
-- This function bypasses RLS when checking workspace_members, breaking the circular dependency.

-- Create a helper function that checks membership without RLS recursion
CREATE OR REPLACE FUNCTION public.user_is_workspace_member(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = workspace_uuid 
      AND user_id = user_uuid
  );
$$;

-- Drop and recreate the workspaces SELECT policy
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;

CREATE POLICY "Users can view their own workspaces"
  ON public.workspaces FOR SELECT
  USING (
    -- Direct owner check (no recursion, always works)
    owner_id = auth.uid()
    OR
    -- For members: Use the helper function to avoid RLS recursion
    public.user_is_workspace_member(id, auth.uid())
  );
