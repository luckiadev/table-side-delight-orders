# Casino Restaurant — Sistema de Pedidos (Table-Side Ordering)

> Documento completo del proyecto para contexto de AI assistants (Claude Desktop, etc.)
> Última actualización: 2026-03-18

---

## 1. Descripción General

Sistema de pedidos para el restaurante de un casino. Los clientes escanean un código QR en su mesa para hacer pedidos de comida/bebidas desde su celular. El panel de administración permite gestionar pedidos en tiempo real, administrar productos y controlar la suspensión del servicio.

**URL de producción:** Desplegado en Vercel (SPA con fallback a `index.html`).

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | React | 18.3.1 |
| **Lenguaje** | TypeScript | 5.5.3 |
| **Bundler** | Vite | 7.1.9 |
| **UI Components** | shadcn/ui (Radix UI) | Múltiples @radix-ui/* |
| **Estilos** | Tailwind CSS | 3.4.11 |
| **Estado servidor** | TanStack React Query | 5.56.2 |
| **Base de datos** | Supabase (PostgreSQL) | 2.50.0 (@supabase/supabase-js) |
| **Routing** | React Router DOM | 6.26.2 |
| **Formularios** | React Hook Form + Zod | 7.53.0 / 3.23.8 |
| **Gráficos** | Recharts | 2.12.7 |
| **Iconos** | Flaticon UIcons | 3.3.1 |
| **Notificaciones** | Sonner + shadcn Toast | 1.5.0 |
| **Fechas** | date-fns | 3.6.0 |
| **Calendario** | react-day-picker | 8.10.1 |
| **Deploy** | Vercel | — |
| **Origen** | Lovable (scaffold) | — |

### Dev Dependencies destacadas

- `@vitejs/plugin-react-swc` 3.5.0 (SWC para compilación rápida)
- `lovable-tagger` 1.1.7 (tagger de componentes en dev)
- `@tailwindcss/typography` 0.5.15
- `eslint` 9.9.0 con `typescript-eslint` 8.0.1
- `autoprefixer` 10.4.20, `postcss` 8.4.47

---

## 3. Estructura del Proyecto

```
table-side-delight-orders/
├── public/
│   └── lovable-uploads/          # Imágenes estáticas (logo casino)
├── src/
│   ├── App.tsx                   # Raíz: providers, router, QueryClient
│   ├── main.tsx                  # Entry point (ReactDOM.createRoot)
│   ├── index.css                 # Variables CSS (HSL), estilos globales, toasts
│   ├── pages/
│   │   ├── Landing.tsx           # / — Página de bienvenida
│   │   ├── Login.tsx             # /login — Autenticación admin
│   │   ├── AdminPedidos.tsx      # /admin_pedidos — Panel de gestión de pedidos (protegido)
│   │   ├── AdminProductos.tsx    # /admin-productos — CRUD de productos (protegido)
│   │   ├── ClientesPedidos.tsx   # /pedidos?mesa=X — Interfaz de pedidos del cliente
│   │   ├── Index.tsx             # (Legacy, no en uso activo)
│   │   └── NotFound.tsx          # /* — Página 404
│   ├── components/
│   │   ├── PedidoCard.tsx        # Tarjeta de pedido con botones de cambio de estado
│   │   ├── MenuProductos.tsx     # Catálogo de productos para cliente/admin
│   │   ├── CarritoCompras.tsx    # Carrito de compras (admin)
│   │   ├── FiltroFechas.tsx      # Selector de rango de fechas
│   │   ├── NavigationHeader.tsx  # Header con navegación
│   │   ├── ProtectedRoute.tsx    # Guard de autenticación para rutas admin
│   │   ├── SuspensionControl.tsx # Toggle de suspensión del servicio (admin)
│   │   └── ui/                   # 48 componentes shadcn/ui (ver sección 8)
│   ├── hooks/
│   │   ├── usePedidos.ts         # CRUD de pedidos (TanStack Query)
│   │   ├── useProductos.ts       # CRUD de productos con validación de categorías
│   │   ├── useConfiguracion.ts   # Gestión de suspensión del sitio
│   │   ├── use-mobile.tsx        # Detección de breakpoints responsive
│   │   └── use-toast.ts          # Hook de notificaciones toast
│   ├── contexts/
│   │   └── AuthContext.tsx        # Contexto de autenticación (Supabase Auth)
│   ├── lib/
│   │   ├── jornada.ts            # Utilidades de jornada casino (9AM→6AM)
│   │   ├── formatNumber.ts       # Formato numérico chileno (1.500)
│   │   └── utils.ts              # cn() helper (clsx + tailwind-merge)
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Cliente Supabase (env vars)
│   │       └── types.ts          # Tipos auto-generados de Supabase
│   └── types/
│       └── pedido.ts             # Interfaces: Pedido, Producto, NuevoPedido
├── supabase/
│   └── migrations/               # 10 archivos de migración SQL
├── CLAUDE.md                     # Instrucciones para Claude Code
├── PROJECT.md                    # Este documento
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── tailwind.config.ts
├── vite.config.ts
├── vercel.json                   # Rewrite SPA → index.html
├── components.json               # Configuración shadcn/ui
└── eslint.config.js
```

---

## 4. Rutas y Páginas

| Ruta | Componente | Protegida | Descripción |
|------|-----------|-----------|-------------|
| `/` | `Landing` | No | Bienvenida con botones "Administrar" y "Hacer Pedido" |
| `/login` | `Login` | No | Formulario de login (email/password via Supabase Auth) |
| `/admin_pedidos` | `AdminPedidos` | Sí | Panel de gestión de pedidos con estadísticas, filtros, creación manual |
| `/admin-productos` | `AdminProductos` | Sí | CRUD de productos (solo categorías alimentos/bebidas) |
| `/pedidos` | `ClientesPedidos` | No | Interfaz del cliente. Requiere `?mesa=X` en query params |
| `*` | `NotFound` | No | Página 404 |

---

## 5. Base de Datos (Supabase PostgreSQL)

### Tablas principales

#### `pedidos_casino`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `numero_mesa` | integer | Número de mesa del cliente |
| `productos` | JSONB | Array de `{id, name, price, quantity}` |
| `total` | numeric | Total del pedido |
| `estado` | text | `'Pendiente'` \| `'En Preparación'` \| `'Preparado'` \| `'Entregado'` |
| `nota` | text | Nota opcional (max 200 chars, CHECK constraint en DB) |
| `fecha_pedido` | timestamptz | Fecha/hora del pedido |
| `fecha_entregado` | timestamptz | Fecha/hora de entrega (null hasta ser entregado) |
| `created_at` | timestamptz | Creación del registro |
| `updated_at` | timestamptz | Última actualización |

#### `productos`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | Identificador único |
| `nombre` | text | Nombre del producto |
| `descripcion` | text (nullable) | Descripción |
| `precio` | numeric | Precio del producto |
| `categoria` | text | Solo `'alimentos'` o `'bebidas'` |
| `disponible` | boolean | Disponibilidad del producto |
| `imagen_url` | text (nullable) | URL de imagen |
| `created_at` | timestamptz | Creación |
| `updated_at` | timestamptz | Actualización |

#### `configuracion_sitio`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `clave` | text (PK) | Clave de configuración (ej: `'suspension'`) |
| `valor` | JSONB | Valor JSON: `{activa, mensaje, hasta}` |

### Flujo de estados de pedidos

```
Pendiente → En Preparación → Preparado → Entregado
```

Al cambiar a `'Entregado'`, se setea automáticamente `fecha_entregado = NOW()`.

### Políticas RLS (Row Level Security)

Endurecidas el 2026-03-17:

| Tabla | INSERT | SELECT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `pedidos_casino` | Público | Público | Solo autenticados | Solo autenticados |
| `productos` | Solo autenticados | Público | Solo autenticados | Solo autenticados |
| `configuracion_sitio` | Solo autenticados | Público | Solo autenticados | Solo autenticados |

### Migraciones SQL (10 archivos)

1. `20250612141743` — Creación inicial de tablas
2. `20250613173518` — Modificaciones tempranas
3. `20250613214240` — Ajustes de esquema
4. `20250614174931` — Mejoras de estructura
5. `20250614175426` — Ajustes adicionales
6. `20250619120923` — Modificaciones de features
7. `20251011000000` — Índices de rendimiento
8. `20260317000000` — Endurecimiento de seguridad RLS
9. `20260317010000` — Limpieza de políticas RLS legacy
10. `20260317020000` — Creación de tabla `configuracion_sitio`

---

## 6. Autenticación

- **Método:** Supabase Auth con `signInWithPassword()` (email/password)
- **Contexto:** `AuthContext.tsx` provee `user`, `session`, `isAuthenticated`, `login()`, `logout()`
- **Guard:** `ProtectedRoute` envuelve las rutas admin; redirige a `/login` si no hay sesión
- **Usuarios admin:** Se crean directamente en el dashboard de Supabase (no hay registro público)
- **Estado:** `isLoading` controla el spinner durante verificación de sesión inicial

---

## 7. Hooks Principales

### `usePedidos(fechaInicio?, fechaFin?)`
- **Query:** Obtiene pedidos de `pedidos_casino` con filtros de fecha opcionales
- **Polling:** Refetch cada 30 segundos, staleTime 10s
- **Mutaciones:** `crearPedido(NuevoPedido)`, `actualizarEstado(id, estado)`
- **Auto:** Setea `fecha_entregado` cuando estado = `'Entregado'`
- **Cache:** Invalidación automática post-mutación

### `useProductos()`
- **Query:** Obtiene productos filtrados por `CATEGORIAS_PERMITIDAS` (`['alimentos', 'bebidas']`)
- **Doble filtro:** En query SQL (`.in()`) y en cliente (seguridad)
- **Mutaciones:** `crearProducto`, `actualizarProducto`, `eliminarProducto`
- **Validación:** Rechaza categorías no permitidas antes de enviar a DB
- **Cache:** staleTime 5 min, gcTime 10 min (productos cambian poco)
- **Helpers:** `obtenerProductosPorCategoria()`, `obtenerProductosDisponibles()`, `obtenerEstadisticas()`

### `useConfiguracion()`
- **Query:** Lee clave `'suspension'` de `configuracion_sitio`
- **Polling:** Cada 30 segundos
- **`isSuspendido()`:** Verifica si suspensión está activa y no ha expirado
- **Auto-desactivación:** Si `hasta` expiró, desactiva automáticamente
- **Mutación:** `actualizarSuspension(Partial<SuspensionConfig>)`

### `use-mobile.tsx`
- Hook de detección de breakpoints responsive
- Usado para adaptar layouts (mobile → desktop)

---

## 8. Componentes Personalizados

### `PedidoCard.tsx`
Tarjeta individual de pedido. Muestra: mesa, productos, total, nota, estado. Botones para avanzar el estado según el flujo definido.

### `MenuProductos.tsx`
Catálogo de productos separado por categorías (alimentos/bebidas). Botones grandes optimizados para mobile. Funcionalidad de agregar al carrito.

### `CarritoCompras.tsx`
Carrito de compras con vista expandible. Barra fija inferior con resumen y botón de checkout. Campo opcional para nota del pedido.

### `FiltroFechas.tsx`
Selector de rango de fechas con calendario (react-day-picker).

### `NavigationHeader.tsx`
Header compartido con enlaces de navegación entre secciones.

### `ProtectedRoute.tsx`
Componente wrapper que verifica `isAuthenticated` del AuthContext. Redirige a `/login` si no hay sesión activa.

### `SuspensionControl.tsx`
Toggle para activar/desactivar la suspensión del servicio al cliente. Configuración expandible para mensaje personalizado y fecha/hora de fin automático. Indicador visual rojo cuando está activo.

### Componentes shadcn/ui (48 componentes)

```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb,
button, calendar, card, carousel, chart, checkbox, collapsible, command,
context-menu, dialog, drawer, dropdown-menu, form, hover-card, input,
input-otp, label, menubar, navigation-menu, pagination, popover, progress,
radio-group, resizable, scroll-area, select, separator, sheet, sidebar,
skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster,
toggle, toggle-group, tooltip
```

Más `use-toast.ts` (hook de toast).

---

## 9. Utilidades (`src/lib/`)

### `jornada.ts` — Sistema de Jornada del Casino
El casino opera de **9:00 AM a 6:00 AM del día siguiente**. Si la hora actual es antes de las 9 AM, la "jornada actual" corresponde al día anterior.

**Funciones:**
- `getJornadaActual()` → Jornada del día en curso
- `getJornadaAyer()` → Jornada del día anterior
- `getSemanaActual()` → Rango lunes 9AM → domingo+1 6AM
- `getMesActual()` → Rango del 1° 9AM → 1° siguiente 6AM
- `formatJornadaRango(inicio, fin)` → String legible ("Lun 17 Mar, 09:00 – Mar 18 Mar, 06:00")

### `formatNumber.ts`
Formatea números al estilo chileno: `1500 → "1.500"` (sin decimales, punto como separador de miles).

### `utils.ts`
`cn()`: Merge de clases CSS con `clsx` + `tailwind-merge`.

---

## 10. Tipos TypeScript

### `Pedido` (pedido completo)
```typescript
interface Pedido {
  id: string;
  numero_mesa: number;
  productos: Producto[];
  total: number;
  estado: 'Pendiente' | 'En Preparación' | 'Preparado' | 'Entregado';
  fecha_pedido: string;
  fecha_entregado?: string;
  created_at: string;
  updated_at: string;
  nota: string;
}
```

### `NuevoPedido` (DTO para crear)
```typescript
interface NuevoPedido {
  numero_mesa: number;
  productos: Producto[];
  total: number;
  nota: string;
}
```

### `Producto` (item en carrito)
```typescript
interface Producto {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
```

### `ProductoDB` (producto de la DB)
```typescript
interface ProductoDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string; // 'alimentos' | 'bebidas'
  disponible: boolean;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}
```

### `SuspensionConfig`
```typescript
interface SuspensionConfig {
  activa: boolean;
  mensaje: string;
  hasta: string | null; // ISO date o null
}
```

### `Jornada`
```typescript
interface Jornada {
  inicio: string; // ISO string
  fin: string;
  label: string;
}
```

---

## 11. Configuración del Proyecto

### TypeScript (`tsconfig.app.json`)
- Target: ES2020
- Module: ESNext con resolución "bundler"
- JSX: react-jsx
- **Strict mode: DESHABILITADO** (`strict: false`)
- Path alias: `@/*` → `./src/*`

### Vite (`vite.config.ts`)
- Plugin: `@vitejs/plugin-react-swc` (SWC compiler)
- Plugin dev: `lovable-tagger` (solo en desarrollo)
- Dev server: puerto 8080, host `::`
- Alias: `@` → `./src`

### Tailwind (`tailwind.config.ts`)
- Dark mode: `["class"]` (preparado pero no implementado en UI)
- Sistema de colores HSL con CSS variables
- Plugin: `tailwindcss-animate`
- Plugin: `@tailwindcss/typography`

### Vercel (`vercel.json`)
- Rewrite: `/(.*) → /index.html` (SPA fallback)

### React Query (`App.tsx`)
- `staleTime`: 30s (global), 10s (pedidos), 5min (productos)
- `gcTime`: 5 min
- `retry`: 1
- `refetchOnWindowFocus`: false
- `refetchOnMount`: false
- `refetchOnReconnect`: true

---

## 12. Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | Sí |

Si no están configuradas, la app muestra un mensaje de error amigable en lugar de crashear.

---

## 13. Comandos de Desarrollo

```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo (http://localhost:8080)
npm run build        # Build de producción
npm run build:dev    # Build con env de desarrollo
npm run lint         # ESLint
npm run preview      # Preview del build de producción
```

---

## 14. Funcionalidades Implementadas

### Para Clientes (Público)
- Escaneo de QR → acceso a `/pedidos?mesa=X`
- Catálogo de productos con categorías (alimentos/bebidas)
- Carrito de compras con vista expandible
- Campo opcional de notas en el pedido (max 200 chars)
- Interfaz mobile-first con botones grandes (senior-friendly)
- Bloqueo de pedidos cuando el servicio está suspendido
- Toasts con estilo accesible (texto grande, iconos claros)

### Para Administradores
- Login con email/password (Supabase Auth)
- Panel de pedidos en tiempo real (polling 30s)
- Filtros por estado: Pendiente, En Preparación, Preparado, Entregado
- Filtro por rango de fechas
- Estadísticas: pendientes, en preparación, preparados, entregados, ventas totales
- Creación manual de pedidos
- Control de suspensión del servicio (activar/desactivar, mensaje, tiempo límite)
- CRUD completo de productos (crear, editar, eliminar, toggle disponibilidad)
- Validación estricta de categorías permitidas
- Layout responsive (1 col mobile → 2 tablet → 3 desktop)

### Seguridad
- Row Level Security (RLS) en todas las tablas
- Separación público/autenticado por operación
- Validación de categorías a nivel de hook y base de datos
- Supabase credentials via env vars (no hardcoded)
- Constraint CHECK en DB para largo de nota

### Sistema de Jornada
- Lógica de jornada casino: 9AM → 6AM día siguiente
- Funciones para jornada actual, ayer, semana, mes
- Consideración del horario nocturno (antes de 9AM = jornada anterior)

---

## 15. Limitaciones y Consideraciones

- **No hay test runner configurado** — Necesita Vitest o Jest si se requieren tests
- **No hay WebSocket/realtime** — Se usa polling cada 30 segundos
- **TypeScript strict mode deshabilitado** — Permite `any`, parámetros sin tipo, etc.
- **No hay registro público** — Los admins se crean en el dashboard de Supabase
- **`next-themes` instalado pero sin uso** — Queda como dependencia no utilizada
- **`lovable-tagger` en devDependencies** — Plugin del scaffold original (Lovable)
- **Sin internacionalización formal** — La UI está en español, hardcoded
- **Sin sistema de roles** — Todos los autenticados son admin

---

## 16. Flujo de Datos Simplificado

```
[Cliente QR] → /pedidos?mesa=X
                    ↓
            MenuProductos (productos disponibles)
                    ↓
            CarritoCompras (selección + nota)
                    ↓
            usePedidos.crearPedido() → Supabase INSERT → pedidos_casino
                    ↓
[Admin] → /admin_pedidos
                    ↓
            usePedidos() → Supabase SELECT (polling 30s)
                    ↓
            PedidoCard → actualizarEstado() → Supabase UPDATE
                    ↓
            Pendiente → En Preparación → Preparado → Entregado
```

---

## 17. Origen del Proyecto

Scaffolded con [Lovable](https://lovable.dev). La estructura base y los componentes shadcn/ui fueron generados por esta plataforma. El desarrollo posterior incluye: sistema de jornada, control de suspensión, endurecimiento de seguridad RLS, optimización de React Query, y todas las funcionalidades de negocio específicas del casino.
