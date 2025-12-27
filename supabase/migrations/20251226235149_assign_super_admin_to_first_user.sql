-- Migration: Assign super_admin role to the first user
-- This ensures the first user created in the system is automatically assigned super_admin role

-- Function to assign super_admin role to the first user
CREATE OR REPLACE FUNCTION assign_super_admin_to_first_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count total users in the system
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE deleted_at IS NULL;

  -- If this is the first user (count = 1), assign super_admin role
  IF user_count = 1 THEN
    -- Update the user's metadata to include super_admin role
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'super_admin', 'is_super_admin', true)
    WHERE id = NEW.id;
  ELSE
    -- For subsequent users, set default role to 'user'
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'user', 'is_super_admin', false)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_super_admin_to_first_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION assign_super_admin_to_first_user() TO service_role;
