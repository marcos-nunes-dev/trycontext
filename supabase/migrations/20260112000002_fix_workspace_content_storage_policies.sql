-- Migration: Fix workspace-content storage bucket RLS policies
-- The foldername function indexing needs to be corrected

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload content to their workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can view content in their workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can update content in their workspaces" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete content in their workspaces" ON storage.objects;

-- Recreate policies with correct path parsing
-- Path format: workspaceId/contentId/filename
-- foldername(name) returns array, [1] is first folder (workspaceId)

-- Allow authenticated users to upload content to their workspace folders
CREATE POLICY "Users can upload content to their workspaces"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id::text = (string_to_array(name, '/'))[1]
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
    WHERE id::text = (string_to_array(name, '/'))[1]
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
    WHERE id::text = (string_to_array(name, '/'))[1]
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
    WHERE id::text = (string_to_array(name, '/'))[1]
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
    WHERE id::text = (string_to_array(name, '/'))[1]
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      ))
  )
);
