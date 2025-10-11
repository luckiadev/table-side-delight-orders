-- ============================================================================
-- CREATE ADMIN USER FOR SUPABASE AUTH
-- ============================================================================
-- Run this in Supabase SQL Editor to create your first admin user
-- ============================================================================

-- Create admin user with email and password
-- Replace the email and password with your desired credentials

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@casino.com', -- ← CHANGE THIS EMAIL
  crypt('Admin123!', gen_salt('bf')), -- ← CHANGE THIS PASSWORD
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@casino.com'
);

-- ============================================================================
-- ALTERNATIVE: Create multiple admin users
-- ============================================================================
-- Uncomment and modify as needed

/*
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'supervisor@casino.com', -- Second admin
  crypt('Supervisor123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"supervisor"}',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'supervisor@casino.com'
);
*/

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the user was created

SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@casino.com';

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. Replace 'admin@casino.com' with your actual email
-- 2. Replace 'Admin123!' with a strong password
-- 3. The password is hashed using bcrypt (crypt function)
-- 4. email_confirmed_at is set to now() to skip email verification
-- 5. The user can log in immediately after creation
-- ============================================================================

-- ============================================================================
-- LOGIN CREDENTIALS (After running this script)
-- ============================================================================
-- Email: admin@casino.com
-- Password: Admin123!
--
-- Go to: http://localhost:8080/login
-- Enter these credentials to access the admin panel
-- ============================================================================
