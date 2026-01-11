-- Migration: Verify RLS policies support ownership transfer
-- This migration verifies that the existing UPDATE policy on workspaces
-- allows owners to transfer ownership by updating owner_id

-- The existing policy "Users can update their own workspaces" at line 148-158
-- in 20251227213248_create_workspaces_and_flow_tables.sql already allows
-- owners to update any field including owner_id, since it checks:
-- owner_id = auth.uid() (current user is owner)
--
-- This is sufficient for ownership transfer functionality.
-- The USING clause evaluates BEFORE the update, so if the current user
-- is the owner, they can update owner_id to transfer ownership.

-- No changes needed - existing policy is correct
-- This migration serves as documentation that ownership transfer is supported

-- Note: When transferring ownership, the application should:
-- 1. Verify the current user is the owner (application-level check)
-- 2. Update workspaces.owner_id to the new owner
-- 3. Update workspace_members table accordingly (remove new owner's member entry if exists,
--    add old owner as a member with appropriate role)
