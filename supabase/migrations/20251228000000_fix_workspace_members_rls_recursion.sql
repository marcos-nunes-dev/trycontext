-- Fix infinite recursion in workspace_members SELECT policy
-- The original policy was querying workspace_members recursively, causing infinite loops
-- New policy: Users can view members if they're the workspace owner OR if it's their own membership record

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;

CREATE POLICY "Users can view members of their workspaces"
  ON public.workspace_members FOR SELECT
  USING (
    -- Workspace owners can see all members
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
    )
    OR
    -- Users can see their own membership record (non-recursive check)
    user_id = auth.uid()
  );
