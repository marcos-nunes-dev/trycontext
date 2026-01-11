-- Migration: Debug and simplify storage policy
-- Temporarily create a more permissive policy to test

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload content to their workspaces" ON storage.objects;

-- Create a simpler test policy first
-- This allows any authenticated user to upload to workspace-content bucket
-- We'll tighten it once we confirm the basic upload works
CREATE POLICY "Users can upload content to their workspaces"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-content'
);

-- Also add a policy that allows users to see their own uploads
CREATE POLICY "Users can view their uploaded content"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workspace-content' AND
  owner = auth.uid()
);
