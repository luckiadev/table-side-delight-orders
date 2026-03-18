# INFORME DE AUDITORÍA Y ESTADO DEL PROYECTO

**Proyecto:** Table-Side Delight Orders — Sistema de pedidos para casino
**Fecha de auditoría:** 2026-03-17
**Estado general:** Funcional y seguro para producción

---

## 1. CREDENCIALES, API KEYS Y SECRETOS

### 1.1 Supabase (Base de datos y autenticación)

| Variable | Valor | Ubicación | Propósito |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `https://nmmtdpvijpafbkxquvfn.supabase.co` | `.env` (local) / Vercel dashboard (producción) | URL de la instancia Supabase. Es pública por diseño — Supabase la expone en el frontend |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (JWT) | `.env` (local) / Vercel dashboard (producción) | Clave anónima de Supabase. Es pública por diseño — la seguridad real la da RLS, no esta clave |

**IMPORTANTE:** La anon key NO es un secreto. Es una clave pública que permite acceso limitado por las políticas RLS. La clave secreta (`service_role_key`) NO está en el proyecto ni debe estarlo nunca.

### 1.2 Credenciales de administrador

| Campo | Valor | Ubicación | Notas |
|---|---|---|---|
| Email admin | Configurado en Supabase Auth | Dashboard de Supabase > Authentication > Users | El admin se crea vía SQL o dashboard, NO está hardcodeado en código |
| Password admin | Configurado en Supabase Auth | Almacenado con bcrypt en Supabase | Solo el admin conoce su contraseña |

**Credenciales legadas (ya no se usan):**
- El `.env` contiene comentadas las líneas `#VITE_ADMIN_USERNAME=supervisor` y `#VITE_ADMIN_PASSWORD=AABB.2025`. Estas son de una versión anterior que usaba autenticación localStorage. Ya no tienen efecto pero están documentadas como referencia.

### 1.3 Archivo rootPass.txt

- Existe en la raíz del proyecto
- Está en `.gitignore` (no se sube al repositorio)
- **Acción pendiente:** El propietario del proyecto lo eliminará manualmente cuando corresponda

### 1.4 Resumen de seguridad de credenciales

| Elemento | Estado | Exposición |
|---|---|---|
| Supabase URL | En `.env` + Vercel | Pública por diseño (segura) |
| Supabase anon key | En `.env` + Vercel | Pública por diseño (segura, protegida por RLS) |
| Supabase service_role_key | NO está en el proyecto | Correctamente excluida |
| Admin password | En Supabase Auth (bcrypt) | No expuesta |
| rootPass.txt | En `.gitignore` | No se sube al repo |
| `.env` | En `.gitignore` | No se sube al repo |

---

## 2. CAMBIOS APLICADOS EN LA AUDITORÍA

### 2.1 Fase 1 — Seguridad (2026-03-17)

#### RLS (Row Level Security) — Políticas endurecidas

**Antes:** Políticas completamente abiertas (`USING (true)` para ALL). Cualquier usuario anónimo podía leer, modificar y eliminar todos los datos.

**Después:** Políticas restrictivas verificadas con tests automatizados:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `pedidos_casino` | Público | Público | Solo admin | Solo admin |
| `productos` | Público | Solo admin | Solo admin | Solo admin |
| `configuracion_sitio` | Público | Solo admin | Solo admin | Solo admin |

**Migraciones aplicadas:**
- `20260317000000-security-hardening-rls-policies.sql` — Nuevas políticas restrictivas
- `20260317010000-cleanup-legacy-rls-policies.sql` — Eliminación de políticas legacy permisivas

**Verificación:** Se ejecutó un script de prueba que confirmó:
- UPDATE de pedidos como anónimo: 0 filas afectadas (BLOQUEADO)
- DELETE de pedidos como anónimo: 0 filas afectadas (BLOQUEADO)
- INSERT de productos como anónimo: Error RLS explícito (BLOQUEADO)
- UPDATE de productos como anónimo: 0 filas afectadas (BLOQUEADO)
- DELETE de productos como anónimo: 0 filas afectadas (BLOQUEADO)
- INSERT de nota > 200 chars: Error de constraint (BLOQUEADO)

#### Console.log eliminados de producción

**Antes:** ~15 sentencias `console.log`/`console.error` exponían estructura de datos, IDs y flujo de la aplicación en la consola del navegador.

**Después:** 0 console statements en producción. Solo queda 1 `console.error` en `client.ts` protegido con `import.meta.env.DEV` (solo se ejecuta en desarrollo).

**Archivos limpiados:**
- `src/hooks/usePedidos.ts` — 10 console removidos
- `src/hooks/useProductos.ts` — 8 console removidos
- `src/pages/ClientesPedidos.tsx` — 1 console removido
- `src/contexts/AuthContext.tsx` — 3 console removidos
- `src/pages/AdminProductos.tsx` — 1 console removido
- `src/pages/Login.tsx` — 1 console removido
- `src/pages/NotFound.tsx` — 1 console removido + import `useEffect` innecesario
- `src/components/ui/tooltip.tsx` — 1 debug log de versión de React removido

#### Validación server-side del campo nota

**Antes:** Solo validación HTML client-side (`maxLength={200}`), bypasseable vía API directa.

**Después:** Constraint en base de datos `CHECK (char_length(nota) <= 200)`. La BD rechaza cualquier nota mayor a 200 caracteres sin importar el origen.

#### Dependencias actualizadas

**Antes:** 11 vulnerabilidades (7 high, 4 moderate) incluyendo XSS en react-router-dom, bypass de seguridad en Vite, escritura arbitraria en rollup.

**Después:** 0 vulnerabilidades. `npm audit fix` aplicado exitosamente.

### 2.2 Fase 3 — Suspensión temporal del sitio (2026-03-17)

#### Archivos creados

| Archivo | Propósito |
|---|---|
| `supabase/migrations/20260317020000-create-configuracion-sitio.sql` | Tabla `configuracion_sitio` con RLS |
| `src/hooks/useConfiguracion.ts` | Hook para leer/actualizar configuración de suspensión |
| `src/components/SuspensionControl.tsx` | Componente admin: toggle de suspensión con mensaje y fecha |

#### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/pages/AdminPedidos.tsx` | Agregado `SuspensionControl` encima de las estadísticas |
| `src/pages/ClientesPedidos.tsx` | Pantalla de bloqueo cuando el sitio está suspendido |

#### Funcionamiento

1. **Activar suspensión:** Toggle en el panel admin > switch rojo > opcionalmente configurar mensaje y fecha de fin
2. **Página del cliente:** Muestra pantalla completa con mensaje de suspensión en vez del menú
3. **Reactivación automática:** Si se configura fecha "hasta", el hook detecta expiración y reactiva automáticamente
4. **Reactivación manual:** Toggle en admin para reactivar inmediatamente

### 2.3 Correcciones menores

| Archivo | Corrección |
|---|---|
| `src/components/PedidoCard.tsx` | Protección contra `productos` que no sea array (datos legacy) |
| `src/hooks/useConfiguracion.ts` | Resiliente si la tabla `configuracion_sitio` no existe (devuelve defaults) |

---

## 3. ARCHIVOS ELIMINADOS

| Archivo | Razón |
|---|---|
| `bun.lockb` | Lockfile de Bun — el proyecto usa npm (tiene `package-lock.json`) |
| `src/App.css` | CSS template de Vite — no estaba importado en ningún archivo |
| `src/pages/Index.tsx` | Página legacy — no está en las rutas de `App.tsx` (usa `Landing.tsx`) |
| `database_schema.sql` | Schema completo con políticas RLS desactualizadas — reemplazado por migraciones |
| `CREATE_ADMIN_USER.sql` | Script con credenciales template — ya no es necesario, admin se crea vía dashboard |
| `DEPLOYMENT.md` | Documentación legacy (ya estaba en `.gitignore`) |
| `OPTIMIZATION_REPORT.md` | Documentación legacy (ya estaba en `.gitignore`) |
| `QUICK_START.md` | Documentación legacy (ya estaba en `.gitignore`) |
| `SUPABASE_AUTH_MIGRATION_SUMMARY.md` | Documentación legacy (ya estaba en `.gitignore`) |
| `SUPABASE_AUTH_SETUP.md` | Documentación legacy de migración a Supabase Auth — proceso ya completado |

**Archivos NO eliminados intencionalmente:**
- `rootPass.txt` — El propietario lo eliminará manualmente
- `README.md` — Contiene link al proyecto Lovable original (referencia)

---

## 4. DOCUMENTACIÓN ACTUALIZADA

| Archivo | Cambios |
|---|---|
| `CLAUDE.md` | Corregida sección de autenticación (era localStorage, ahora Supabase Auth). Corregida sección de variables de entorno (eran hardcoded, ahora `.env`). Agregadas secciones de `configuracion_sitio`, `SuspensionControl`, y nuevas políticas RLS. Puerto dev corregido (8080, no 5173) |

---

## 5. ESTADO ACTUAL DE SEGURIDAD

| Check | Estado |
|---|---|
| RLS habilitado y restrictivo | OK |
| Console.log en producción | OK (0 statements) |
| Validación server-side de inputs | OK (nota <= 200 chars) |
| Dependencias sin vulnerabilidades | OK (0 vulnerabilities) |
| Credenciales no hardcodeadas | OK (Supabase Auth) |
| `.env` en `.gitignore` | OK |
| Service key no expuesta | OK (no está en el proyecto) |
| Protección de rutas admin | OK (ProtectedRoute + Supabase session) |
| Queries parametrizadas (anti SQL injection) | OK (Supabase client) |
| Anti-XSS | OK (React escaping, sin dangerouslySetInnerHTML) |

---

## 6. PENDIENTES CONOCIDOS

### Para Fase 2 (integración Webpay) — No implementado aún

- Crear tabla `transacciones_pago` con campos: id, pedido_id, monto, estado_pago, token_webpay, timestamps
- Crear Supabase Edge Function para manejar tokens Webpay (clave secreta del comercio NUNCA en frontend)
- Agregar validación server-side de montos (trigger PostgreSQL que recalcule total)
- Implementar audit log para trazabilidad de pagos
- Agregar campo `estado_pago` a pedidos (separar estado del pedido vs estado del pago)
- Agregar `idempotency_key` para prevenir cobros duplicados

### Mejoras opcionales de baja prioridad

| Mejora | Impacto | Esfuerzo |
|---|---|---|
| Habilitar TypeScript strict mode (`tsconfig.app.json`) | Detecta bugs de tipos en compilación | Medio (requiere corregir errores existentes) |
| Reemplazar `as any` en `usePedidos.ts:57` | Mejor type safety en datos de productos | Bajo |
| Habilitar ESLint `no-unused-vars` | Código más limpio | Bajo |
| Agregar rate limiting (Supabase Edge Functions) | Previene spam de pedidos | Medio |
| Agregar realtime subscriptions (Supabase Realtime) | Actualizaciones instantáneas sin polling | Medio |

---

## 7. ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
table-side-delight-orders/
├── .env                          # Variables de entorno (NO en git)
├── .gitignore
├── AUDIT_REPORT.md               # Este documento
├── CLAUDE.md                     # Instrucciones para Claude Code
├── README.md                     # Info del proyecto Lovable
├── rootPass.txt                  # Contraseña (NO en git, eliminar manualmente)
├── index.html                    # Entry point HTML
├── package.json
├── package-lock.json
├── vite.config.ts                # Configuración Vite (puerto 8080)
├── vercel.json                   # Configuración Vercel (SPA fallback)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.ts
├── components.json               # Configuración shadcn/ui
├── public/                       # Assets estáticos
├── src/
│   ├── App.tsx                   # Rutas y providers
│   ├── main.tsx                  # Entry point React
│   ├── index.css                 # Estilos globales Tailwind
│   ├── contexts/
│   │   └── AuthContext.tsx        # Autenticación Supabase Auth
│   ├── hooks/
│   │   ├── useConfiguracion.ts   # Configuración del sitio (suspensión)
│   │   ├── usePedidos.ts         # CRUD de pedidos
│   │   ├── useProductos.ts       # CRUD de productos
│   │   ├── use-mobile.tsx        # Detección de breakpoints
│   │   └── use-toast.ts          # Toast notifications
│   ├── pages/
│   │   ├── Landing.tsx           # Página principal (/)
│   │   ├── Login.tsx             # Login admin (/login)
│   │   ├── AdminPedidos.tsx      # Panel de pedidos (/admin_pedidos)
│   │   ├── AdminProductos.tsx    # Panel de productos (/admin-productos)
│   │   ├── ClientesPedidos.tsx   # Página del cliente (/pedidos)
│   │   └── NotFound.tsx          # 404
│   ├── components/
│   │   ├── SuspensionControl.tsx # Control de suspensión (admin)
│   │   ├── PedidoCard.tsx        # Tarjeta de pedido
│   │   ├── MenuProductos.tsx     # Catálogo de productos
│   │   ├── CarritoCompras.tsx    # Carrito de compras (admin)
│   │   ├── FiltroFechas.tsx      # Filtro de fechas
│   │   ├── NavigationHeader.tsx  # Header con navegación
│   │   ├── ProtectedRoute.tsx    # Guard de autenticación
│   │   └── ui/                   # Componentes shadcn/ui (no modificar)
│   ├── integrations/supabase/
│   │   ├── client.ts             # Cliente Supabase (env vars)
│   │   └── types.ts              # Tipos auto-generados
│   ├── types/
│   │   └── pedido.ts             # Tipos de pedidos y productos
│   └── lib/
│       ├── utils.ts              # Utilidades (cn helper)
│       └── formatNumber.ts       # Formateo de números/precios
└── supabase/
    ├── config.toml
    └── migrations/               # Migraciones SQL (ejecutar en orden)
        ├── 20250612...-crear-pedidos-casino.sql
        ├── 20250613...-actualizar-mesa-check.sql
        ├── 20250613...-crear-productos.sql
        ├── 20250614...-rls-productos-autenticado.sql
        ├── 20250614...-rls-productos-publico.sql
        ├── 20250619...-rls-abierto-temporal.sql
        ├── 20251011...-add-performance-indexes.sql
        ├── 20260317000000-security-hardening-rls-policies.sql
        ├── 20260317010000-cleanup-legacy-rls-policies.sql
        └── 20260317020000-create-configuracion-sitio.sql
```
