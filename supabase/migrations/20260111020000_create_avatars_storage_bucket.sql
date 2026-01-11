-- Migration: Create avatars storage bucket
-- This migration creates the avatars storage bucket for user profile pictures

-- Insert the avatars bucket into storage.buckets
-- Using INSERT with ON CONFLICT to avoid errors if bucket already exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket so avatar URLs can be accessed directly
  5242880, -- 5MB file size limit (5 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the avatars bucket
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
