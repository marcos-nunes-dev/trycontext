-- Fix permission denied error when accessing auth.users in RLS policy
-- The issue: RLS policy tries to query auth.users directly, which is not allowed
-- Solution: Create a SECURITY DEFINER function to get user email safely

-- Create a helper function to get user email (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email::TEXT FROM auth.users WHERE id = user_uuid;
$$;

-- Drop and recreate the policy that was accessing auth.users
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.workspace_invitations;

CREATE POLICY "Users can view invitations sent to their email"
  ON public.workspace_invitations FOR SELECT
  USING (
    email = public.get_user_email(auth.uid())
  );
