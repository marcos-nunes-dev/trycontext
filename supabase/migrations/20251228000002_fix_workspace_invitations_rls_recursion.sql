-- Fix potential RLS recursion in workspace_invitations SELECT policy
-- The policy checks workspaces, which might cause recursion issues
-- Solution: Use the helper function we created for workspaces to avoid recursion

DROP POLICY IF EXISTS "Users can view invitations for their workspaces" ON public.workspace_invitations;

CREATE POLICY "Users can view invitations for their workspaces"
  ON public.workspace_invitations FOR SELECT
  USING (
    -- Use the helper function to check workspace access without recursion
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_invitations.workspace_id
        AND (
          owner_id = auth.uid()
          OR public.user_is_workspace_member(id, auth.uid())
        )
    )
  );
