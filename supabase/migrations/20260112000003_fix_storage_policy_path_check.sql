-- Migration: Fix workspace-content storage bucket RLS policies
-- Use a more reliable path checking method

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload content to their workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can view content in their workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can update content in their workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete content in their workspaces" ON storage.objects;

-- Recreate policies with correct path parsing
-- Path format: workspaceId/contentId/filename
-- We'll use a function to extract workspace ID from path

-- Create a helper function to extract workspace ID from storage path
CREATE OR REPLACE FUNCTION extract_workspace_id_from_path(path TEXT)
RETURNS UUID AS $$
BEGIN
  -- Path format: workspaceId/contentId/filename
  -- Split by '/' and get first part
  RETURN (string_to_array(path, '/'))[1]::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Allow authenticated users to upload content to their workspace folders
CREATE POLICY "Users can upload content to their workspaces"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = extract_workspace_id_from_path(name)
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      ))
  )
);

-- Allow authenticated users to view content in their workspaces
CREATE POLICY "Users can view content in their workspaces"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = extract_workspace_id_from_path(name)
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      ))
  )
);

-- Allow authenticated users to update content in their workspaces
CREATE POLICY "Users can update content in their workspaces"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = extract_workspace_id_from_path(name)
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      ))
  )
)
WITH CHECK (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = extract_workspace_id_from_path(name)
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      ))
  )
);

-- Allow authenticated users to delete content in their workspaces
CREATE POLICY "Users can delete content in their workspaces"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = extract_workspace_id_from_path(name)
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      ))
  )
);
