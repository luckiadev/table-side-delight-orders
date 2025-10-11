# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **table-side ordering system for a casino restaurant**, built with React + TypeScript + Vite, using Supabase as the backend. The application allows customers to order food/drinks via QR codes from their tables, and provides an admin panel for managing orders and products.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS with custom components

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Build for development mode (includes dev environment variables)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### 1. Data Flow Architecture

**Supabase Client → Custom Hooks → React Query → UI Components**

- `src/integrations/supabase/client.ts`: Supabase client configuration (Easypanel hosted instance)
- `src/hooks/usePedidos.ts`: Order management (fetch, create, update order status)
- `src/hooks/useProductos.ts`: Product management with category filtering (only 'alimentos' and 'bebidas')
- All data mutations are handled via TanStack Query mutations with automatic cache invalidation

### 2. Authentication System

**Simple localStorage-based auth** (not Supabase Auth):
- Admin credentials hardcoded in `src/contexts/AuthContext.tsx` (username: 'supervisor', password: 'AABB.2025')
- `ProtectedRoute` component wraps admin pages
- Admin pages: `/admin_pedidos` (order management), `/admin-productos` (product CRUD)

### 3. Database Schema

**Main Tables:**
- `pedidos_casino`: Stores orders with JSONB productos array, mesa number, estado (status), total, nota (optional note), timestamps
- `productos`: Stores products with nombre, descripcion, precio, categoria (ONLY 'alimentos' or 'bebidas'), disponible (boolean), imagen_url

**Order States Flow:**
`Pendiente → En Preparación → Preparado → Entregado`

### 4. Page Structure

- **Landing (`/`)**: Welcome page with navigation to customer/admin areas
- **Customer Order Page (`/pedidos?mesa=X`)**: QR-code driven ordering interface
  - Mesa (table) number comes from URL query parameter
  - Shows available products with large buttons optimized for mobile
  - Shopping cart with expandable mini-view + fixed bottom checkout bar
  - Optional order notes field
- **Admin Order Management (`/admin_pedidos`)**: Protected admin panel
  - Real-time order status board with state-based filters
  - Statistics cards (pending, in preparation, prepared, delivered, sales)
  - Create new orders manually
  - Date range filtering for order history
  - Responsive grid layout for different screen sizes
- **Admin Product Management (`/admin-productos`)**: Protected CRUD for products
  - Only allows 'alimentos' (food) and 'bebidas' (drinks) categories
  - Product availability toggle
  - Form validation with React Hook Form + Zod
- **Login (`/login`)**: Simple form for admin access

### 5. Component Organization

- `src/components/ui/`: shadcn/ui components (DO NOT modify directly, regenerate with shadcn CLI if needed)
- `src/components/`: Custom components
  - `PedidoCard.tsx`: Order card with status change buttons
  - `MenuProductos.tsx`: Product catalog with add-to-cart functionality
  - `CarritoCompras.tsx`: Shopping cart component for admin panel
  - `FiltroFechas.tsx`: Date range picker for order filtering
  - `NavigationHeader.tsx`: Shared header with navigation links
  - `ProtectedRoute.tsx`: Auth guard for admin routes

### 6. Type System

- `src/types/pedido.ts`: Core types for orders and products
  - `Pedido`: Complete order with ID, mesa, productos array, total, estado, timestamps, nota
  - `NuevoPedido`: DTO for order creation
  - `Producto`: Product item in cart (id, name, price, quantity)
- `src/integrations/supabase/types.ts`: Auto-generated Supabase types
- `src/hooks/useProductos.ts`: ProductoDB type for database products

### 7. Key Implementation Details

**Category Restrictions:**
- Products are STRICTLY limited to 'alimentos' (food) and 'bebidas' (drinks) categories
- Validation occurs at hook level (`useProductos.ts`) before database operations
- `CATEGORIAS_PERMITIDAS` constant exported for consistency across app

**Order Notes:**
- Optional `nota` field added to orders for special instructions
- Supports use cases like: waiter ID, direct customer orders, VIP tables, special requests
- Max 200 characters

**Responsive Design:**
- Mobile-first approach with large touch targets for customer interface
- Breakpoint detection via custom `useBreakpoint` hook
- Admin panel adapts grid layouts (1 col mobile → 2 cols tablet → 3 cols desktop)

**Real-time Updates:**
- TanStack Query cache invalidation ensures UI updates after mutations
- No WebSocket/realtime subscriptions (manual refresh required for now)

**Toast Notifications:**
- Using Sonner + shadcn/ui toast for user feedback
- Custom senior-friendly toasts for customer interface (large text, clear icons)

## Common Development Workflows

### Adding a New Product Category

If you need to add a category beyond 'alimentos'/'bebidas':
1. Update `CATEGORIAS_PERMITIDAS` in `src/hooks/useProductos.ts`
2. Add category config to `CATEGORIA_CONFIG` object (label, color, badge styles)
3. Update type definition: `type CategoriaPermitida = typeof CATEGORIAS_PERMITIDAS[number]`
4. Ensure database accepts new category value (check migrations)

### Modifying Order Status Flow

Order state transitions are controlled in:
- `src/hooks/usePedidos.ts`: `actualizarEstado` mutation
- `src/components/PedidoCard.tsx`: UI buttons for state changes
- When estado changes to 'Entregado', `fecha_entregado` timestamp is auto-set

### Working with Supabase

Current instance is self-hosted via Easypanel:
- URL: `https://primer-panel-supabase.vy9dc8.easypanel.host/`
- Migrations in `supabase/migrations/`
- To apply new migrations, use Supabase CLI or Easypanel dashboard

### Adding shadcn/ui Components

```bash
# Use shadcn CLI to add components
npx shadcn@latest add [component-name]
```

Components are configured in `components.json` with custom styling.

## Important Constraints

- **No test runner configured**: Add Vitest or Jest if testing is needed
- **No environment variables for Supabase**: Credentials are hardcoded in `src/integrations/supabase/client.ts` (move to `.env` for production security)
- **No real authentication**: Current auth is localStorage-based with hardcoded credentials
- **No realtime subscriptions**: App requires manual refresh to see new orders from other users
- **Mobile-optimized**: Customer interface prioritizes mobile UX (large buttons, simplified navigation)

## Deployment

This project is configured for deployment on Vercel (see `vercel.json`). Key points:
- All routes fallback to `index.html` for client-side routing
- Production build: `npm run build`
- Build output: `dist/` directory

## Project Originally Created With

This project was scaffolded via [Lovable](https://lovable.dev) platform (see README.md for Lovable project URL).
