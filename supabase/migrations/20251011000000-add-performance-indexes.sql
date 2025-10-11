-- ============================================================================
-- PERFORMANCE OPTIMIZATION - Add Missing Indexes
-- Created: 2025-10-11
-- ============================================================================
-- This migration adds critical indexes for query performance optimization
-- Run this on existing databases to improve performance
-- ============================================================================

-- Add indexes to productos table if they don't exist
CREATE INDEX IF NOT EXISTS idx_productos_categoria
  ON public.productos(categoria);

CREATE INDEX IF NOT EXISTS idx_productos_disponible
  ON public.productos(disponible);

CREATE INDEX IF NOT EXISTS idx_productos_categoria_disponible
  ON public.productos(categoria, disponible);

CREATE INDEX IF NOT EXISTS idx_productos_created_at
  ON public.productos(created_at DESC);

-- Add indexes to pedidos_casino table if they don't exist
CREATE INDEX IF NOT EXISTS idx_pedidos_casino_estado_fecha
  ON public.pedidos_casino(estado, fecha_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_casino_fecha_pedido_range
  ON public.pedidos_casino(fecha_pedido);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================
-- Update statistics for the query planner to use the new indexes effectively
ANALYZE public.productos;
ANALYZE public.pedidos_casino;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
