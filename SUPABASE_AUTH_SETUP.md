# Supabase Authentication Setup Guide

This guide explains how to set up Supabase Authentication for the Table-Side Delight Orders system.

## Overview

The application now uses **Supabase Auth** instead of hardcoded credentials. This provides:
- ✅ Secure, production-ready authentication
- ✅ Email/password authentication
- ✅ Session management
- ✅ Password reset functionality
- ✅ Email verification (optional)
- ✅ Multi-user support

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Creating Admin Users](#creating-admin-users)
3. [Authentication Flow](#authentication-flow)
4. [Security Configuration](#security-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Enable Email Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Configure email settings:
   - **Enable email confirmations**: Optional (disable for faster testing)
   - **Enable secure email change**: Recommended for production
   - **Enable secure password change**: Recommended for production

### 2. Configure Email Templates (Optional)

Navigate to **Authentication** → **Email Templates** to customize:
- Confirmation email
- Password reset email
- Change email confirmation

---

## Creating Admin Users

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Fill in the details:
   ```
   Email: admin@yourcompany.com
   Password: [Strong password - min 6 characters]
   Auto Confirm User: ✅ (check this to skip email verification)
   ```
4. Click **Create User**

### Method 2: Via SQL Query

Run this in the SQL Editor:

```sql
-- Create an admin user
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
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@yourcompany.com',
  crypt('YourSecurePassword123!', gen_salt('bf')),
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
);
```

**⚠️ Important Notes:**
- Replace `admin@yourcompany.com` with your actual email
- Replace `YourSecurePassword123!` with a secure password
- The `email_confirmed_at` is set to `now()` to skip email verification

### Method 3: User Self-Registration (Not Recommended for Admin)

Users can register themselves through the login page, but you should disable this for production or add additional role checks.

---

## Authentication Flow

### Login Process

1. User enters **email** and **password** on the login page
2. Application calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials
4. On success:
   - User session is created
   - User is redirected to `/admin_pedidos`
5. On failure:
   - Error message is displayed

### Session Management

- Sessions are automatically managed by Supabase
- Sessions persist across page refreshes
- Sessions expire after 1 hour (can be configured)
- Refresh tokens are automatically used to maintain login

### Logout Process

1. User clicks logout button
2. Application calls `supabase.auth.signOut()`
3. Session is destroyed
4. User is redirected to login page

---

## Security Configuration

### Row Level Security (RLS) Policies

The database schema includes RLS policies:

```sql
-- Productos: Public read, authenticated write
CREATE POLICY "Allow public read access to productos"
  ON public.productos FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert to productos"
  ON public.productos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Pedidos: Anyone can create, authenticated can view/modify
CREATE POLICY "Allow anyone to create pedidos"
  ON public.pedidos_casino FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated to read pedidos"
  ON public.pedidos_casino FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Key Security Features

1. **Email Verification**: Can be enabled for additional security
2. **Password Requirements**: Minimum 6 characters (configurable)
3. **Rate Limiting**: Built into Supabase Auth
4. **JWT Tokens**: Secure session tokens with automatic refresh
5. **RLS**: Database-level security for all queries

---

## Code Changes

### AuthContext.tsx

The authentication context now uses Supabase Auth:

```typescript
const login = async (email: string, password: string): Promise<void> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
};

const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

### Login.tsx

The login page now accepts email instead of username:

```typescript
<Input
  id="email"
  type="email"
  placeholder="admin@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

## Troubleshooting

### Problem: "Invalid login credentials"

**Solutions:**
1. Verify the email and password are correct
2. Check if email confirmation is required (disable in settings if needed)
3. Ensure the user exists in **Authentication** → **Users**

### Problem: "Email not confirmed"

**Solutions:**
1. Disable email confirmations: **Authentication** → **Providers** → **Email** → Uncheck "Enable email confirmations"
2. Manually confirm user in dashboard: **Authentication** → **Users** → Edit user → Set "Email Confirmed At" to current time

### Problem: User sees blank page after login

**Solutions:**
1. Check browser console for errors
2. Verify RLS policies are set correctly
3. Ensure user has `authenticated` role in Supabase

### Problem: Session expires too quickly

**Solutions:**
1. Go to **Authentication** → **Configuration**
2. Increase **JWT Expiry** (default: 3600 seconds / 1 hour)
3. Configure **Refresh Token Expiry** (default: 604800 seconds / 7 days)

---

## Best Practices

### Production Deployment

1. **Enable Email Confirmation**: Prevents fake accounts
2. **Strong Password Policy**: Minimum 8-12 characters, require special characters
3. **Configure Custom SMTP**: Use your own email service for professional emails
4. **Set Up Password Reset**: Enable users to recover their accounts
5. **Monitor Auth Events**: Check **Authentication** → **Logs** regularly

### Security Checklist

- [ ] Email confirmation enabled
- [ ] Strong password requirements enforced
- [ ] Custom email templates configured
- [ ] SMTP configured (not using Supabase default)
- [ ] RLS policies tested and verified
- [ ] Rate limiting reviewed
- [ ] User roles properly assigned
- [ ] Regular security audits scheduled

---

## Creating Multiple Admin Users

To create multiple administrators:

1. Go to **Authentication** → **Users**
2. Click **Add User** for each admin
3. Use different emails for each admin
4. All authenticated users can access admin panel

**Optional**: Add role-based access control:

```sql
-- Add a role column to track user types
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'cliente';

-- Update RLS policy to check roles
CREATE POLICY "Allow admins to manage productos"
  ON public.productos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );
```

---

## Additional Features

### Password Reset

Users can request password reset:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email);
```

### Update Password

Logged-in users can change password:

```typescript
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

### Email Change

Users can update their email:

```typescript
const { error } = await supabase.auth.updateUser({
  email: newEmail
});
```

---

## Migration from Old System

If you're migrating from the hardcoded credentials system:

1. Remove `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` from `.env`
2. Create admin users in Supabase Dashboard with the same credentials
3. Update all admin users to use email instead of username
4. Test login with new system
5. Deploy changes to production

**Old System:**
- Username: `supervisor`
- Password: `AABB.2025`

**New System:**
- Create user with email: `supervisor@yourcompany.com`
- Use same password: `AABB.2025` (or choose a stronger one)

---

## Support

For additional help:

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers
- **Community**: https://github.com/supabase/supabase/discussions

---

## Summary

✅ **Supabase Auth is now active**
✅ **No more hardcoded credentials**
✅ **Production-ready authentication**
✅ **Multi-user support**
✅ **Secure and scalable**

Remember to create your admin users in the Supabase Dashboard before deploying to production!
