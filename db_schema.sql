-- Primero limpiamos cualquier tabla antigua o mal generada
DROP TABLE IF EXISTS "actividades" CASCADE;
DROP TABLE IF EXISTS "recordatorios" CASCADE;
DROP TABLE IF EXISTS "items_venta" CASCADE;
DROP TABLE IF EXISTS "ventas" CASCADE;
DROP TABLE IF EXISTS "inventario_movimientos" CASCADE;
DROP TABLE IF EXISTS "productos" CASCADE;
DROP TABLE IF EXISTS "integraciones" CASCADE;
DROP TABLE IF EXISTS "notificaciones" CASCADE;
DROP TABLE IF EXISTS "automatizaciones" CASCADE;
DROP TABLE IF EXISTS "emails_enviados" CASCADE;
DROP TABLE IF EXISTS "plantillas_email" CASCADE;
DROP TABLE IF EXISTS "seguimientos" CASCADE;
DROP TABLE IF EXISTS "tareas" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 1. Tabla de Usuarios (Con nombre "User" y campo "password" en vez de "passwordHash")
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" VARCHAR(50) DEFAULT 'vendedor',
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Clientes
CREATE TABLE "Cliente" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "telefono" VARCHAR(50),
    "empresa" VARCHAR(255),
    "estado" VARCHAR(50) DEFAULT 'Activo',
    "estado_conversion" VARCHAR(50) DEFAULT 'prospecto',
    "valor_venta" NUMERIC(10, 2),
    "motivo_perdida" TEXT,
    "notas" TEXT,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Tareas
CREATE TABLE "Tarea" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "cliente_id" UUID REFERENCES "Cliente"("id") ON DELETE SET NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "estado" VARCHAR(50) DEFAULT 'pendiente',
    "fecha_vencimiento" TIMESTAMP WITH TIME ZONE,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Seguimientos
CREATE TABLE "Seguimiento" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "cliente_id" UUID REFERENCES "Cliente"("id") ON DELETE CASCADE,
    "tipo" VARCHAR(100) NOT NULL,
    "fecha" TIMESTAMP WITH TIME ZONE NOT NULL,
    "notas" TEXT,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Plantillas de Email
CREATE TABLE "PlantillaEmail" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "nombre" VARCHAR(255) NOT NULL,
    "asunto" VARCHAR(255) NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Emails Enviados
CREATE TABLE "EmailEnviado" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "cliente_id" UUID REFERENCES "Cliente"("id") ON DELETE CASCADE,
    "plantilla_id" UUID REFERENCES "PlantillaEmail"("id") ON DELETE SET NULL,
    "fecha_envio" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "asunto" VARCHAR(255) NOT NULL,
    "cuerpo" TEXT,
    "estado" VARCHAR(50) DEFAULT 'enviado',
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Automatizaciones
CREATE TABLE "Automatizacion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "nombre" VARCHAR(255) NOT NULL,
    "trigger" VARCHAR(255) NOT NULL,
    "accion" VARCHAR(255) NOT NULL,
    "activa" BOOLEAN DEFAULT true,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Notificaciones
CREATE TABLE "Notificacion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "tipo" VARCHAR(100),
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN DEFAULT false,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de Integraciones
CREATE TABLE "Integracion" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "proveedor" VARCHAR(100) NOT NULL,
    "token_acceso" TEXT,
    "activa" BOOLEAN DEFAULT false,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabla de Productos
CREATE TABLE "Producto" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "precio" NUMERIC(10, 2) DEFAULT 0,
    "stock" INTEGER DEFAULT 0,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabla de Movimientos de Inventario
CREATE TABLE "InventarioMovimiento" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "producto_id" UUID REFERENCES "Producto"("id") ON DELETE CASCADE,
    "cantidad" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "motivo" VARCHAR(255),
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Tabla de Ventas
CREATE TABLE "Venta" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "cliente_id" UUID REFERENCES "Cliente"("id") ON DELETE SET NULL,
    "monto_total" NUMERIC(10, 2) DEFAULT 0,
    "estado" VARCHAR(50) DEFAULT 'completada',
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Tabla de Ítems de Venta
CREATE TABLE "ItemVenta" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "venta_id" UUID REFERENCES "Venta"("id") ON DELETE CASCADE,
    "producto_id" UUID REFERENCES "Producto"("id") ON DELETE CASCADE,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" NUMERIC(10, 2) NOT NULL,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Tabla de Recordatorios
CREATE TABLE "Recordatorio" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "tarea_id" UUID REFERENCES "Tarea"("id") ON DELETE CASCADE,
    "fecha_recordatorio" TIMESTAMP WITH TIME ZONE NOT NULL,
    "enviado" BOOLEAN DEFAULT false,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Tabla de Actividades
CREATE TABLE "Actividad" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuario_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "tipo_entidad" VARCHAR(100) NOT NULL,
    "entidad_id" UUID NOT NULL,
    "accion" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "created" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
