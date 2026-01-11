-- Migration: Create workspace-content storage bucket
-- This migration creates the workspace-content storage bucket for uploaded context files

-- Insert the workspace-content bucket into storage.buckets
-- Using INSERT with ON CONFLICT to avoid errors if bucket already exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-content',
  'workspace-content',
  false, -- Private bucket - access controlled via RLS
  52428800, -- 50MB file size limit (50 * 1024 * 1024 bytes)
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/x-subrip', -- SRT
    'text/vtt', -- VTT
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the workspace-content bucket
-- Allow authenticated users to upload content to their workspace folders
CREATE POLICY "Users can upload content to their workspaces"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-content' AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id::text = (storage.foldername(name))[1]
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
    WHERE id::text = (storage.foldername(name))[1]
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
    WHERE id::text = (storage.foldername(name))[1]
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
    WHERE id::text = (storage.foldername(name))[1]
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
    WHERE id::text = (storage.foldername(name))[1]
      AND (owner_id = auth.uid() OR id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      ))
  )
);
