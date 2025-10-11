# Deployment Guide - Table-Side Delight Orders

Complete step-by-step guide to deploy the Casino Ordering System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Schema Setup](#database-schema-setup)
5. [Local Development](#local-development)
6. [Build for Production](#build-for-production)
7. [Deployment Options](#deployment-options)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** v18 or higher
- **npm** or **bun** package manager
- **Supabase Account** (free tier available at [supabase.com](https://supabase.com))
- **Git** (for version control)

---

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `casino-orders` (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for project initialization

### Step 2: Get Your API Credentials

1. Once the project is ready, navigate to **Settings → API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (long JWT token starting with `eyJ...`)

**IMPORTANT**: Never use the `service_role` key in client-side code - only use the `anon` key.

---

## Environment Configuration

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit the `.env` file and replace with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
VITE_APP_ENV=development
VITE_APP_NAME=Table-Side Delight Orders
VITE_APP_VERSION=1.0.0

# Authentication - Now using Supabase Auth
# No additional environment variables needed!
# Create admin users in Supabase Dashboard: Authentication -> Users
# See SUPABASE_AUTH_SETUP.md for complete guide

# React Query Configuration
VITE_QUERY_CACHE_TIME=300000
VITE_QUERY_STALE_TIME=30000
VITE_QUERY_REFETCH_INTERVAL=0

# Feature Flags
VITE_DEBUG_MODE=true
VITE_ENABLE_PERFORMANCE_MONITORING=false
```

**Security Notes:**
- Never commit `.env` to version control (already in `.gitignore`)
- For production, change the admin credentials
- Consider using Supabase Auth for production authentication

---

## Database Schema Setup

### Option 1: Fresh Database (Recommended for New Installations)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file `database_schema.sql` from the project root
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`
7. Verify success: You should see "Success. No rows returned" or similar

This will:
- Create all tables (`productos`, `pedidos_casino`, `perfiles`)
- Create all indexes for performance
- Set up Row Level Security (RLS) policies
- Create triggers for automatic timestamps
- Insert sample data for testing

### Option 2: Existing Database (Migration)

If you already have a database, apply the performance optimization migration:

1. Open Supabase Dashboard → **SQL Editor**
2. Open the file `supabase/migrations/20251011000000-add-performance-indexes.sql`
3. Copy and paste into SQL Editor
4. Run the migration

### Verify Database Setup

Run these verification queries in SQL Editor:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Count products (should return ~16 with sample data)
SELECT COUNT(*) FROM public.productos;

-- Count orders (should return ~3 with sample data)
SELECT COUNT(*) FROM public.pedidos_casino;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## Local Development

### Step 1: Install Dependencies

Using npm:
```bash
npm install
```

Using bun (faster):
```bash
bun install
```

### Step 2: Start Development Server

Using npm:
```bash
npm run dev
```

Using bun:
```bash
bun dev
```

The application will start at: **http://localhost:8080**

### Step 3: Test the Application

1. **Customer View**: Go to `http://localhost:8080/pedidos?mesa=5`
   - Test adding products to cart
   - Test creating an order

2. **Admin Panel**:
   - First, create an admin user in Supabase Dashboard (see SUPABASE_AUTH_SETUP.md)
   - Go to `http://localhost:8080/login`
   - Login with your Supabase user credentials (email + password)
   - Test order management at `/admin_pedidos`
   - Test product management at `/admin-productos`

---

## Build for Production

### Step 1: Update Environment Variables

Create a production `.env` file:

```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
```

**Note**: No admin credentials needed in `.env` - authentication is now handled by Supabase Auth!

### Step 2: Build the Application

```bash
npm run build
```

or

```bash
bun run build
```

This creates an optimized production build in the `dist/` directory.

### Step 3: Test Production Build Locally

```bash
npm run preview
```

This serves the production build locally for testing.

---

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Git Integration** (easier):
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add environment variables in Vercel Dashboard
   - Click "Deploy"

3. **Deploy via CLI**:
   ```bash
   vercel
   ```

The `vercel.json` file is already configured in the project.

### Option 2: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables in Site Settings → Environment Variables
7. Deploy

### Option 3: Self-Hosted (VPS/Cloud)

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy the `dist/` folder to your server

3. Serve with Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/casino-orders/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

---

## Post-Deployment

### 1. Generate QR Codes for Tables

For each table, generate a QR code that points to:
```
https://your-domain.com/pedidos?mesa=TABLE_NUMBER
```

Example:
- Table 1: `https://your-domain.com/pedidos?mesa=1`
- Table 5: `https://your-domain.com/pedidos?mesa=5`
- Table 10: `https://your-domain.com/pedidos?mesa=10`

**QR Code Generators:**
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode Monkey](https://www.qrcode-monkey.com/)
- Use a bulk generator for multiple tables

### 2. Print and Place QR Codes

- Print QR codes on table stands or laminated cards
- Ensure QR codes are easily scannable
- Include instructions: "Scan to order"

### 3. Train Staff

- Admin login credentials
- How to view and update order status
- How to add/edit products
- How to manage the menu

### 4. Configure Products

1. Log in to admin panel
2. Go to "Administración de Productos"
3. Delete sample products
4. Add your actual menu items:
   - Category: `alimentos` or `bebidas` only
   - Add prices, descriptions, and mark as available

### 5. Monitor Performance

Enable monitoring in `.env`:
```env
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

Check Supabase Dashboard for:
- Database query performance
- API usage
- Storage usage

---

## Troubleshooting

### Issue: White screen after deployment

**Solution:**
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Ensure Supabase URL and key are valid
4. Check that database schema was applied

### Issue: Orders not appearing

**Solution:**
1. Check Supabase logs: Dashboard → Logs
2. Verify Row Level Security policies are applied
3. Run verification queries in SQL Editor
4. Check browser network tab for API errors

### Issue: "Missing Supabase environment variables" error

**Solution:**
1. Ensure `.env` file exists and is not in `.gitignore`
2. Verify variable names start with `VITE_`
3. Restart development server after changing `.env`
4. For production, check hosting platform environment variables

### Issue: Admin login not working

**Solution:**
1. Verify user exists in Supabase Dashboard → Authentication → Users
2. Check if email confirmation is required (disable in Auth settings for testing)
3. Ensure correct email and password
4. Clear browser localStorage
5. Try in incognito mode
6. See SUPABASE_AUTH_SETUP.md for detailed troubleshooting

### Issue: Slow performance

**Solution:**
1. Run the performance indexes migration
2. Check Supabase Dashboard → Database → Performance
3. Verify indexes are created:
   ```sql
   SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
   ```
4. Enable query monitoring in Supabase

### Issue: Categories not showing

**Solution:**
Products must have category as `alimentos` or `bebidas` (lowercase). Other categories are filtered out.

---

## Performance Optimization Checklist

- [x] Database indexes created
- [x] React Query caching configured
- [x] Component memoization with `useMemo` and `useCallback`
- [x] Explicit column selection in queries
- [x] RLS policies optimized
- [x] Automatic refetching for real-time updates

---

## Security Checklist

- [x] `.env` file in `.gitignore`
- [x] Using `anon` key (not `service_role`)
- [x] RLS enabled on all tables
- [x] Supabase Auth implemented for production-ready authentication
- [ ] Create admin users in Supabase Dashboard
- [ ] Enable email confirmation for production
- [ ] Configure custom SMTP for production emails
- [ ] Enable HTTPS in production
- [ ] Set up CORS policies if needed

---

## Maintenance

### Regular Updates

1. **Database backup**: Use Supabase's automatic backups or manual exports
2. **Monitor usage**: Check Supabase Dashboard weekly
3. **Update dependencies**: Run `npm update` monthly
4. **Review logs**: Check for errors in Supabase Logs

### Scaling

When you need to scale:

1. **Upgrade Supabase Plan**: If hitting limits
2. **Enable caching**: Use Supabase's caching features
3. **Optimize queries**: Review slow queries in Dashboard
4. **Add database replicas**: For read-heavy workloads

---

## Support and Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **React Query Docs**: [https://tanstack.com/query](https://tanstack.com/query)
- **Vite Docs**: [https://vitejs.dev](https://vitejs.dev)

---

## License

This project is proprietary. All rights reserved.

---

**Last Updated**: October 11, 2025
**Version**: 1.0.0
