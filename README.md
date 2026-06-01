# CRM-CypherCode (CRM Pro / HeyTexx)

> Sistema CRM completo tipo SaaS multi-tenant con gestión de clientes, ventas, tareas, automatizaciones, inventario e integraciones.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Características Implementadas](#características-implementadas)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Multi-Tenant](#multi-tenant)
- [Roles y Permisos](#roles-y-permisos)
- [Planes de Suscripción](#planes-de-suscripción)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Estado del Proyecto](#estado-del-proyecto)
- [Tareas Pendientes](#tareas-pendientes)

---

## Descripción

CRM-CypherCode es un sistema de gestión de relaciones con clientes (CRM) diseñado como aplicación SaaS multi-tenant. Cada empresa (Company) tiene sus datos completamente aislados. Permite gestionar clientes, tareas, seguimientos, ventas, inventario, correos electrónicos, automatizaciones e integraciones con servicios externos como PlaceToPay, Slack y Google Calendar.

El sistema incluye:
- Autenticación JWT con roles (admin/seller) y verificación por email
- OAuth con Google para login
- Sistema de invitaciones por email (Resend)
- Dashboard con métricas y gráficos
- Gestión completa de clientes con estados de conversión
- Pipeline de ventas e inventario con control de stock
- Sistema de email con plantillas y tracking de apertura
- Motor de automatizaciones basado en reglas predefinidas
- Integraciones con PlaceToPay (pagos), Slack (notificaciones) y Google Calendar
- Importación masiva de clientes vía CSV
- Búsqueda avanzada cruzada
- Modo oscuro y diseño responsive
- Cron de recordatorios automáticos

---

## Arquitectura

### Tipo: Monorepo Híbrido

```
CRM-CypherCode/
├── frontend/          # React SPA (Vite) - Puerto 5173 (dev)
├── backend/           # Express API - Puerto 3001
├── apps/pocketbase/   # PocketBase (legacy - puede eliminarse)
├── package.json       # Scripts root (concurrently)
└── backend/prisma/    # Schema Prisma + migraciones
```

### Flujo de Datos

```
Frontend (React/Vite) → API Express → Prisma ORM → PostgreSQL
                              ↓
                    PlaceToPay / Slack / Google Calendar / Resend
```

### Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 7 + React Router 7 |
| Backend | Express 5 + ES Modules |
| ORM | Prisma 6.4 |
| Base de datos | PostgreSQL |
| Autenticación | JWT (7 días) + bcrypt |
| Pagos | PlaceToPay (Ecuador) |
| Emails | Resend |
| UI | shadcn/ui + Tailwind CSS + Radix UI |

---

## Tecnologías

### Frontend (`frontend/`)

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React 18.3 (JSX) |
| Build Tool | Vite 7.3 |
| Routing | React Router DOM 7.13 |
| UI Components | shadcn/ui (New York style) + Radix UI (55 componentes) |
| Styling | Tailwind CSS 3.4 + CSS Variables + tailwindcss-animate |
| Icons | Lucide React 0.469 |
| Forms | React Hook Form 7.71 + Zod 4.3 + @hookform/resolvers |
| Charts | Recharts 2.15 |
| Calendar | react-big-calendar 1.13 + react-day-picker 9.14 |
| Animations | Framer Motion 11.15 |
| Notifications | Sonner 2.07 |
| Date Utils | date-fns 2.30 |
| PDF Export | jsPDF 2.5 + html2canvas 1.4 |
| CSV Parsing | PapaParse 5.4 |
| Font | Plus Jakarta Sans (Google Fonts) |
| Theme | Navy/Cyan con soporte dark mode |

### Backend (`backend/`)

| Categoría | Tecnología |
|-----------|-----------|
| Framework | Express 5.0 |
| ORM | Prisma 6.4 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken 9.0) + bcryptjs 3.0 |
| Payments | PlaceToPay (checkout-test.placetopay.ec) |
| Email | Resend |
| Security | Helmet 8.0 + CORS 2.8 |
| Logging | Morgan 1.10 |
| Env | dotenv 16.4 |
| Module Type | ES Modules |

---

## Estructura del Proyecto

### Frontend (`frontend/src/`)

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router (25 rutas)
├── index.css                   # Tailwind + CSS variables + dark mode
├── components/
│   ├── ui/                     # 55 componentes shadcn/ui
│   ├── ActivityFeed.jsx
│   ├── CategoryCombobox.jsx
│   ├── CheckoutModal.jsx
│   ├── ClientAutocomplete.jsx
│   ├── ConfirmDialog.jsx
│   ├── FormModal.jsx
│   ├── Header.jsx              # Top bar (search, notificaciones, usuario)
│   ├── LoadingSpinner.jsx
│   ├── MetricCard.jsx
│   ├── NotificationBell.jsx
│   ├── PriorityBadge.jsx
│   ├── ProtectedRoute.jsx      # Auth guard
│   ├── ScrollToTop.jsx
│   ├── SearchBar.jsx
│   ├── SendEmailModal.jsx
│   ├── Sidebar.jsx             # Nav colapsable con items por rol
│   └── StatusBadge.jsx
├── contexts/
│   └── AuthContext.jsx         # Auth provider (login/signup/logout/plan/role/limits)
├── hooks/
│   ├── use-mobile.jsx
│   └── use-toast.js
├── lib/
│   ├── apiServerClient.js      # Cliente fetch con auth + session-revoked handling
│   └── utils.js                # cn() utility (clsx + tailwind-merge)
└── pages/                      # 26 páginas
    ├── ActivityTimelinePage.jsx
    ├── AdvancedSearchPage.jsx
    ├── AutomationsPage.jsx
    ├── CalendarPage.jsx
    ├── ClientDetailPage.jsx
    ├── ClientesPage.jsx
    ├── ConversionAnalysisPage.jsx
    ├── DashboardPage.jsx
    ├── EmailHistoryPage.jsx
    ├── EmailTemplatesPage.jsx
    ├── GoogleCallbackPage.jsx
    ├── HomePage.jsx
    ├── ImportClientsPage.jsx
    ├── IntegrationsPage.jsx
    ├── InventarioPage.jsx
    ├── LoginPage.jsx
    ├── PipelinePage.jsx
    ├── PricingPage.jsx
    ├── ReportsPage.jsx
    ├── SeguimientosPage.jsx
    ├── SetupPasswordPage.jsx
    ├── SignupPage.jsx
    ├── SuccessPage.jsx
    ├── TareasPage.jsx
    ├── UsersPage.jsx
    ├── VentasPage.jsx
    └── VerifyEmailPage.jsx
```

### Backend (`backend/src/`)

```
src/
├── main.js                     # Express app (helmet, cors, morgan, routes, error handler, cron)
├── constants/
│   └── common.js
├── middleware/
│   ├── auth.js                 # JWT auth middleware (verifica token + status user)
│   ├── error.js                # Error handler genérico 500
│   └── index.js
├── routes/
│   ├── index.js                # Route aggregator (23 rutas montadas)
│   ├── auth.js                 # Signup, login, Google OAuth, email verification, invitaciones
│   ├── clientes.js             # CRUD clientes con límite por plan + activity log
│   ├── tareas.js               # CRUD tareas + reminders + sync Google Calendar
│   ├── seguimientos.js         # CRUD seguimientos + activity log
│   ├── ventas.js               # CRUD ventas con control de stock + IVA
│   ├── productos.js            # CRUD productos + movimientos de inventario
│   ├── emails.js               # CRUD emails + pixel tracking
│   ├── plantillas.js           # CRUD plantillas de email
│   ├── notificaciones.js       # Listar + marcar como leídas
│   ├── actividad.js            # Timeline de actividades
│   ├── usuarios.js             # Gestión de usuarios (invite, resend, delete)
│   ├── reports.js              # Reportes globales (admin)
│   ├── automatizaciones.js     # CRUD automatizaciones + plantillas predefinidas
│   ├── search.js               # Búsqueda cruzada (clientes, tareas, seguimientos)
│   ├── integraciones.js        # Gestión de integraciones
│   ├── categorias.js           # CRUD categorías
│   ├── import.js               # Importación CSV de clientes
│   ├── google-calendar.js      # OAuth2 + sync tareas → eventos
│   ├── placetopay.js           # Crear sesión de pago + verificar
│   ├── features.js             # Validación de límites por plan
│   ├── slack.js                # Envío de mensajes Slack
│   └── health-check.js         # GET /health
├── lib/
│   ├── prisma.js               # PrismaClient singleton
│   ├── scopeWhere.js           # Helper para aislamiento multi-tenant
│   ├── reminderCron.js         # Cron job para recordatorios de tareas
│   └── googleCalendarSync.js   # Sync tareas con Google Calendar
├── utils/
│   └── logger.js               # Logger
└── prisma/
    └── schema.prisma           # 16 modelos
```

---

## Características Implementadas

### Autenticación y Usuarios

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Signup** | Registro con creación de Company + usuario admin | ✅ Completo |
| **Login** | Email + password con JWT (7 días) | ✅ Completo |
| **Google OAuth** | Login con Google, auto-creación de cuenta | ✅ Completo |
| **Verificación Email** | Envío de link de verificación (Resend) | ✅ Completo |
| **Invitaciones** | Admin invita vendedores por email con token | ✅ Completo |
| **Setup Password** | Usuario invitado crea su contraseña | ✅ Completo |
| **Reenvío Verificación** | Reenviar link de verificación | ✅ Completo |
| **Check Email** | Verificar si email existe y su estado | ✅ Completo |
| **Auth Me** | Obtener usuario actual con sesión | ✅ Completo |
| **Session Revoked** | Detección de sesión eliminada por admin | ✅ Completo |
| **Auto-check sesión** | Verifica sesión cada 60s | ✅ Completo |

### Core CRM

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Dashboard** | Métricas, gráficos, actividad reciente, alertas | ✅ Completo |
| **Clientes CRUD** | Crear, leer, actualizar, eliminar con búsqueda y filtros | ✅ Completo |
| **Detalle Cliente** | Vista completa con tareas, seguimientos, ventas | ✅ Completo |
| **Tareas CRUD** | Con fecha vencimiento, prioridad, recordatorios | ✅ Completo |
| **Tareas por Cliente** | Filtrar tareas de un cliente específico | ✅ Completo |
| **Seguimientos CRUD** | Registro de interacciones con clientes | ✅ Completo |
| **Seguimientos por Cliente** | Historial de seguimientos de un cliente | ✅ Completo |
| **Pipeline de Ventas** | Vista pipeline de oportunidades | ✅ UI completa |
| **Ventas CRUD** | Con items, productos, control de stock, IVA 15% | ✅ Completo |
| **Items de Venta** | Detalle de items por venta | ✅ Completo |
| **Inventario CRUD** | Productos con stock, SKU, categoría, costo | ✅ Completo |
| **Movimientos Inventario** | Registro de entradas/salidas automáticas | ✅ Completo |
| **Emails CRUD** | Registro de emails enviados | ✅ Completo |
| **Emails por Cliente** | Historial de emails de un cliente | ✅ Completo |
| **Plantillas Email** | CRUD de plantillas reutilizables | ✅ Completo |
| **Email Tracking** | Pixel de apertura (1x1 GIF) | ✅ Completo |
| **Notificaciones** | Listar no leídas, marcar como leída, leer todas | ✅ Completo |
| **Actividad Timeline** | Log cronológico de todas las entidades | ✅ Completo |
| **Búsqueda Avanzada** | Búsqueda cruzada en clientes, tareas, seguimientos | ✅ Completo |
| **Calendario** | Vista calendario de tareas/eventos | ✅ Completo |
| **Análisis Conversión** | Funnel prospecto → ganado/perdido | ✅ UI completa |
| **Importación CSV** | Import masivo con validación y duplicados | ✅ Completo |
| **Categorías CRUD** | Categorías para productos/clientes | ✅ Completo |

### SaaS / Negocio

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Multi-Tenant** | Aislamiento total por Company (scopedWhere) | ✅ Completo |
| **Planes** | gratis, pro, enterprise con límites | ✅ Completo |
| **PlaceToPay** | Checkout + verificación de pago | ✅ Completo |
| **Límites por Plan** | Clientes, usuarios, automatizaciones | ✅ Completo |
| **Página de Precios** | Comparación de planes | ✅ UI completa |
| **Página de Éxito** | Post-pago con verificación | ✅ Completo |

### Automatizaciones

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Plantillas Predefinidas** | 4 templates: sin seguimiento, tarea vencida, cliente nuevo, cliente ganado | ✅ Completo |
| **CRUD Automatizaciones** | Activar/desactivar, editar | ✅ Completo |
| **Ejecución** | Trigger manual de automatizaciones activas | ✅ Completo |
| **Límite por Plan** | Solo planes pagos | ✅ Completo |

### Integraciones

| Integración | Descripción | Estado |
|-------------|-------------|--------|
| **Slack** | Envío de mensajes y rich messages | ✅ Completo |
| **Google Calendar** | OAuth2, refresh token, sync tareas → eventos (auto en crear/actualizar/eliminar) | ✅ Completo |
| **Resend** | Emails transaccionales (verificación, invitaciones) | ✅ Completo |
| **PlaceToPay** | Pasarela de pagos (Ecuador) | ✅ Completo |

### Sistema

| Feature | Descripción | Estado |
|---------|-------------|--------|
| **Roles** | `admin` (acceso total) vs `seller` (operativo) | ✅ Completo |
| **Middleware Auth** | JWT validation + check status user (removed) | ✅ Completo |
| **Rutas Protegidas** | Auth guard en frontend | ✅ Completo |
| **Sidebar por Rol** | Items de navegación según rol | ✅ Completo |
| **Dark Mode** | next-themes + CSS variables | ✅ Completo |
| **Notificaciones Toast** | Sonner con richColors | ✅ Completo |
| **Health Check** | `GET /health` | ✅ Completo |
| **Cron Recordatorios** | Job automático para recordatorios de tareas | ✅ Completo |
| **Error Handling** | Middleware global + 404 catch | ✅ Completo |
| **Graceful Shutdown** | SIGINT, SIGTERM handlers | ✅ Completo |

---

## Base de Datos

### PostgreSQL (vía Prisma)

**16 Modelos:**

| Modelo | Descripción |
|--------|-------------|
| `Company` | Empresas (nombre, plan_id, owner_id) |
| `Categoria` | Categorías (nombre, descripción, por empresa) |
| `Cliente` | Clientes (nombre, email, teléfono, empresa, estado, conversión, valor_venta) |
| `Venta` | Ventas (monto_sin_iva, iva_monto, monto_total, estado, fecha) |
| `ItemVenta` | Líneas de venta (cantidad, precio_unitario, subtotal) |
| `User` | Usuarios (email, password, name, role, status, email_verified, google_id, invitation_token) |
| `Actividad` | Log de auditoría (tipo_entidad, entidad_id, acción, descripción) |
| `Automatizacion` | Reglas de automatización (nombre, trigger, acción, activa) |
| `EmailEnviado` | Emails enviados (asunto, cuerpo, estado, fecha_envio) |
| `Integracion` | Integraciones externas (proveedor, tokens, activa) |
| `InventarioMovimiento` | Movimientos de stock (cantidad, tipo, motivo) |
| `Notificacion` | Notificaciones (tipo, mensaje, leída) |
| `PlantillaEmail` | Plantillas de email (nombre, asunto, cuerpo) |
| `Producto` | Productos (nombre, descripción, precio, costo, stock, SKU, categoría) |
| `Recordatorio` | Recordatorios de tareas (fecha_recordatorio, enviado) |
| `Seguimiento` | Seguimientos (tipo, fecha, notas) |
| `Tarea` | Tareas (título, descripción, estado, prioridad, fecha_vencimiento, google_calendar_event_id) |

**Características del schema:**
- UUIDs como primary keys (`gen_random_uuid()`)
- Timestamps con timezone (`Timestamptz(6)`)
- Foreign keys con cascade delete
- Multi-tenant: todos los modelos tienen `company_id`
- Relaciones con `onDelete: Cascade` o `NoAction` según caso

---

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/signup` | Registro (crea Company + admin) | No |
| `POST` | `/api/auth/login` | Login con JWT | No |
| `POST` | `/api/auth/check-email` | Verificar existencia de email | No |
| `POST` | `/api/auth/setup-password` | Activar cuenta invitada | No |
| `POST` | `/api/auth/resend-verification` | Reenviar verificación | No |
| `GET` | `/api/auth/me` | Obtener usuario actual | Sí |
| `GET` | `/api/auth/invite/:token` | Validar token invitación | No |
| `GET` | `/api/auth/verify-email/:token` | Verificar email | No |
| `GET` | `/api/auth/google` | Redirect a Google OAuth | No |
| `GET` | `/api/auth/google/callback` | Callback Google OAuth | No |

### Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/clientes` | Listar (con búsqueda `q` y filtro `estado`) | Sí |
| `GET` | `/api/clientes/:id` | Obtener detalle | Sí |
| `POST` | `/api/clientes` | Crear (con límite por plan) | Sí |
| `PUT` | `/api/clientes/:id` | Actualizar | Sí |
| `DELETE` | `/api/clientes/:id` | Eliminar | Sí |

### Tareas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/tareas` | Listar | Sí |
| `GET` | `/api/tareas/cliente/:clienteId` | Tareas de un cliente | Sí |
| `POST` | `/api/tareas` | Crear (con reminders + auto-sync Google Calendar) | Sí |
| `PUT` | `/api/tareas/:id` | Actualizar (auto-sync Google Calendar) | Sí |
| `PUT` | `/api/tareas/:id/estado` | Cambiar estado | Sí |
| `DELETE` | `/api/tareas/:id` | Eliminar (auto-eliminar de Google Calendar) | Sí |

### Seguimientos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/seguimientos` | Listar | Sí |
| `GET` | `/api/seguimientos/cliente/:clienteId` | Seguimientos de un cliente | Sí |
| `POST` | `/api/seguimientos` | Crear | Sí |
| `PUT` | `/api/seguimientos/:id` | Actualizar | Sí |
| `DELETE` | `/api/seguimientos/:id` | Eliminar | Sí |

### Ventas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/ventas` | Listar (filtro `cliente_id`) | Sí |
| `POST` | `/api/ventas` | Crear (con items, stock check, IVA 15%) | Sí |
| `GET` | `/api/ventas/:id/items` | Items de una venta | Sí |
| `PUT` | `/api/ventas/:id/estado` | Cambiar estado | Sí |

### Productos / Inventario

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/productos` | Listar | Sí |
| `GET` | `/api/productos/movimientos` | Últimos 50 movimientos | Sí |
| `POST` | `/api/productos` | Crear (con movimiento inicial) | Sí |
| `PUT` | `/api/productos/:id` | Actualizar (con movimiento de ajuste) | Sí |
| `DELETE` | `/api/productos/:id` | Eliminar | Sí |

### Emails

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/emails` | Listar | Sí |
| `GET` | `/api/emails/cliente/:clienteId` | Emails de un cliente | Sí |
| `POST` | `/api/emails` | Registrar email | Sí |
| `PATCH` | `/api/emails/:id/estado` | Cambiar estado (pendiente/enviado) | Sí |
| `POST` | `/api/emails/email-tracking/:messageId` | Pixel tracking | No |

### Plantillas Email

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/plantillas` | Listar | Sí |
| `POST` | `/api/plantillas` | Crear | Sí |
| `PUT` | `/api/plantillas/:id` | Actualizar | Sí |
| `DELETE` | `/api/plantillas/:id` | Eliminar | Sí |

### Notificaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/notificaciones` | No leídas | Sí |
| `PUT` | `/api/notificaciones/:id/leer` | Marcar leída | Sí |
| `PUT` | `/api/notificaciones/leer-todas` | Marcar todas leídas | Sí |

### Actividades

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/actividad` | Timeline (filtro `tipo_entidad`, `entidad_id`) | Sí |

### Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/usuarios` | Listar (solo admin) | Sí (admin) |
| `POST` | `/api/usuarios/invite` | Invitar vendedor | Sí (admin) |
| `POST` | `/api/usuarios/:id/resend-invite` | Reenviar invitación | Sí (admin) |
| `DELETE` | `/api/usuarios/:id` | Eliminar usuario | Sí (admin) |

### Reportes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/reports` | Reportes globales | Sí (admin) |

### Automatizaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/automatizaciones` | Listar | Sí |
| `GET` | `/api/automatizaciones/plantillas` | Plantillas disponibles | Sí |
| `POST` | `/api/automatizaciones` | Activar automatización (solo planes pagos) | Sí |
| `PUT` | `/api/automatizaciones/:id` | Actualizar | Sí |
| `DELETE` | `/api/automatizaciones/:id` | Eliminar | Sí |
| `POST` | `/api/automatizaciones/ejecutar` | Ejecutar activas | Sí |

### Búsqueda

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/search?q=` | Búsqueda cruzada (clientes, tareas, seguimientos) | Sí |

### Integraciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/integraciones` | Listar | Sí |
| `POST` | `/api/integraciones` | Crear | Sí |
| `PUT` | `/api/integraciones/:id` | Actualizar | Sí |
| `DELETE` | `/api/integraciones/:id` | Eliminar | Sí |

### Categorías

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/categorias` | Listar | Sí |
| `POST` | `/api/categorias` | Crear | Sí |
| `PUT` | `/api/categorias/:id` | Actualizar | Sí |
| `DELETE` | `/api/categorias/:id` | Eliminar | Sí |

### Importación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/import` | Importar clientes desde CSV | Sí |

### Google Calendar

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/google-calendar/auth` | Generar URL OAuth | Sí |
| `GET` | `/api/google-calendar/callback` | Callback OAuth | Sí |
| `POST` | `/api/google-calendar/sync` | Sync tareas a eventos | Sí |

### Pagos (PlaceToPay)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/payments/session` | Crear sesión de pago | Sí |
| `POST` | `/api/payments/verify/:requestId` | Verificar pago y actualizar plan | Sí |

### Features

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/features/validate-feature-limit` | Validar límite de clientes por plan | Sí |

### Slack

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/slack/send-message` | Enviar mensaje | No |
| `POST` | `/slack/send-rich-message` | Enviar bloque mensaje | No |

### Sistema

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | No |

---

## Multi-Tenant

El sistema usa un modelo de **aislamiento total por empresa (Company)**:

- Cada usuario pertenece a una `company_id`
- Todas las queries usan `scopedWhere(req)` que filtra por `company_id` del usuario autenticado
- Los datos de una empresa son completamente inaccesibles para otra
- El admin solo ve usuarios de su empresa
- Las automatizaciones, integraciones, plantillas, etc. son por empresa

```js
// backend/src/lib/scopeWhere.js
export const scopedWhere = (req) => ({ company_id: req.user.company_id });
```

---

## Roles y Permisos

### Admin
- Acceso total a todas las funcionalidades
- Gestión de usuarios (invitar, eliminar)
- Reportes globales
- Importación CSV
- Configuración de automatizaciones e integraciones

### Seller
- Operaciones CRM: clientes, tareas, seguimientos, ventas, inventario
- Emails y plantillas
- Calendario
- Búsqueda y timeline
- **No** puede gestionar usuarios, reportes, automatizaciones ni integraciones

---

## Planes de Suscripción

| Plan | Clientes | Usuarios | Automatizaciones |
|------|----------|----------|------------------|
| **gratis** | 5 | 2 | ❌ |
| **pro** | 50 | Definido | ✅ |
| **enterprise** | Ilimitado | Ilimitado | ✅ |

Definidos en `backend/src/routes/features.js`:

```js
export const FEATURE_LIMITS = {
  gratis:   { clientes: 5, usuarios: 2, automatizaciones: false },
  pro:      { clientes: 50, usuarios: 5, automatizaciones: true },
  enterprise: { clientes: Infinity, usuarios: Infinity, automatizaciones: true },
};
```

---

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd CRM-CypherCode
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar Prisma Client
npx prisma generate

# Crear tablas en la base de datos
npx prisma db push
# O con migraciones:
# npx prisma migrate dev

# Iniciar servidor
npm run dev
```

### 3. Configurar Frontend

```bash
cd frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con VITE_API_URL=http://localhost:3001

# Iniciar dev server
npm run dev
```

### 4. Ejecutar ambos simultáneamente (desde root)

```bash
npm install
npm run dev
```

### Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend (Vite dev) | 5173 |
| Backend (Express) | 3001 |

---

## Variables de Entorno

### Backend (`.env`)

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db?schema=public"

# JWT
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Emails (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="CRM <noreply@resend.dev>"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3001"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# PlaceToPay
PLACETOPAY_URL="https://checkout-test.placetopay.ec"
PLACETOPAY_LOGIN="tu-login"
PLACETOPAY_SECRET_KEY="tu-secret-key"

# Slack
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001
```

---

## Estado del Proyecto

### ✅ Completado

- [x] Multi-tenant con aislamiento por Company
- [x] Schema Prisma completo (16 modelos)
- [x] Autenticación JWT con middleware
- [x] Google OAuth login
- [x] Verificación de email (Resend)
- [x] Sistema de invitaciones por email
- [x] 23 rutas backend montadas y funcionales
- [x] CRUD completo: clientes, tareas, seguimientos, ventas, productos, emails, plantillas
- [x] Control de stock automático en ventas
- [x] Movimientos de inventario automáticos
- [x] IVA 15% en ventas
- [x] Frontend 100% conectado a API (apiServerClient)
- [x] 26 páginas frontend con ProtectedRoute
- [x] 55 componentes shadcn/ui
- [x] Dashboard con métricas
- [x] Dark mode
- [x] Sidebar colapsable con navegación por rol
- [x] PlaceToPay integración (pagos)
- [x] Slack integración
- [x] Google Calendar integración (OAuth2 + auto-sync)
- [x] Motor de automatizaciones con plantillas predefinidas
- [x] Importación CSV
- [x] Email tracking (pixel)
- [x] Búsqueda avanzada cruzada
- [x] Timeline de actividad
- [x] Notificaciones (listar, marcar leída)
- [x] Cron de recordatorios
- [x] Health check
- [x] Gestión de usuarios (invitar, eliminar, reenviar)
- [x] Límites por plan
- [x] Session revoked detection
- [x] Graceful shutdown

### ⚠️ Pendiente / Por Mejorar

- [ ] Tests unitarios y de integración
- [ ] CI/CD pipeline
- [ ] Docker / docker-compose
- [ ] Documentación API con Swagger
- [ ] TypeScript (migrar de JS/JSX a TS/TSX)
- [ ] Logging mejorado (Winston/Pino)
- [ ] Rate limiting en endpoints públicos
- [ ] Paginación en listados grandes
- [ ] Validación de inputs con Zod en backend
- [ ] Manejo de errores más detallado en frontend
- [ ] Seed script para desarrollo
- [ ] Producción build y deploy

---

## Tareas Pendientes

### Críticas

1. **Archivos legacy de PocketBase** - `pocketbaseClient.js` en frontend y backend ya no se usan, pueden eliminarse
2. **`stripe.js` obsoleto** - Usa PocketBase mock, NO está montado, reemplazado por `placetopay.js`
3. **`automations.js` duplicado** - Existe `automatizaciones.js` que es el que se usa
4. **`apps/pocketbase/`** - Directorio legacy con binario y migraciones viejas

### Importantes

5. **Tests** - Unitarios y de integración para rutas críticas
6. **Validación de inputs** - Zod en backend para todos los endpoints
7. **Paginación** - Implementar en listados de clientes, tareas, etc.
8. **Manejo de errores** - Más detallado en frontend (mensajes específicos)

### Mejoras

9. **TypeScript** - Migrar de JS/JSX a TS/TSX
10. **Logging** - Reemplazar logger mock con Winston/Pino
11. **Rate limiting** - En endpoints públicos (login, signup)
12. **Swagger** - Documentación API automática
13. **Docker** - docker-compose para dev y producción
14. **Seed script** - Datos de prueba para desarrollo
15. **Accesibilidad** - Mejorar a11y en componentes
16. **PWA** - Soporte offline básico

---

## Notas Importantes

### 🌐 Idioma

La interfaz de usuario y la base de datos están en **español** (Clientes, Tareas, Ventas, Seguimientos, etc.).

### 📁 Archivos Legacy (pueden eliminarse)

- `apps/pocketbase/` - Binario de PocketBase y migraciones (migración completa a PostgreSQL)
- `frontend/src/lib/pocketbaseClient.js` - Mock sin uso
- `backend/src/utils/pocketbaseClient.js` - Mock sin uso
- `backend/src/routes/stripe.js` - Obsoleto, usa PocketBase, reemplazado por PlaceToPay
- `backend/src/routes/automations.js` - Duplicado, usar `automatizaciones.js`

### 🏗️ Arquitectura de Datos

- **Multi-tenant**: Cada Company tiene datos aislados
- **Soft delete**: Usuarios eliminados tienen `status: 'removed'` en vez de borrarse
- **Activity log**: Todas las operaciones CRUD de clientes, tareas y seguimientos generan registros en `Actividad`
- **Auto-sync**: Las tareas se sincronizan automáticamente con Google Calendar al crear/actualizar/eliminar

---

## Licencia

[Definir licencia]

---

## Contacto

[Información de contacto del equipo]
