-- ========================================
-- API Bolsillo — Esquema relacional
-- Bloque 7.1 — Supabase + PostgreSQL
--
-- Ejecutar UNA sola vez sobre un proyecto
-- nuevo (no es idempotente).
-- ========================================

BEGIN;

-- ========================================
-- ROLES
-- Roles de negocio de la API. No son los
-- roles de Supabase (anon, authenticated,
-- service_role).
-- ========================================
CREATE TABLE public.roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT ck_roles_nombre
    CHECK (
        nombre IN (
            'administrador',
            'cliente',
            'auditor'
        )
    )
);

-- ========================================
-- USUARIOS_AUTH
-- Personas que inician sesión (login).
-- auth_user_id queda preparado para
-- vincular Supabase Auth más adelante.
-- ========================================
CREATE TABLE public.usuarios_auth (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    auth_user_id UUID UNIQUE
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    rol_id BIGINT NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,

    -- Hash bcrypt (transitorio hasta decidir
    -- la migración a Supabase Auth)
    password_hash TEXT,

    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_usuarios_auth_nombre
        CHECK (LENGTH(TRIM(nombre)) >= 3),

    CONSTRAINT ck_usuarios_auth_email_minusculas
        CHECK (email = LOWER(email))
);

-- ========================================
-- USUARIOS (titulares de la billetera)
-- usuario_auth_id: relación opcional 1:1
-- con el login. Es la base de la cadena de
-- propiedad (BOLA/IDOR).
-- ========================================
CREATE TABLE public.usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_auth_id BIGINT UNIQUE
        REFERENCES public.usuarios_auth(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(100) NOT NULL,
    documento VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(10) NOT NULL,

    estado VARCHAR(10) NOT NULL
        DEFAULT 'activo',

    CONSTRAINT ck_usuarios_nombre
        CHECK (LENGTH(TRIM(nombre)) BETWEEN 3 AND 100),

    CONSTRAINT ck_usuarios_documento
        CHECK (documento ~ '^[0-9]{6,15}$'),

    CONSTRAINT ck_usuarios_telefono
        CHECK (telefono ~ '^3[0-9]{9}$'),

    CONSTRAINT ck_usuarios_estado
    CHECK (
        estado IN (
            'activo',
            'inactivo'
        )
    )
);

-- ========================================
-- CUENTAS
-- numero_cuenta lo genera la base de datos
-- (nunca el cliente): '300' + 7 dígitos
-- ========================================
CREATE SEQUENCE public.cuentas_numero_seq;

CREATE TABLE public.cuentas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES public.usuarios(id)
        ON DELETE RESTRICT,

    numero_cuenta VARCHAR(10) NOT NULL UNIQUE
        DEFAULT (
            '300' ||
            LPAD(nextval('public.cuentas_numero_seq')::TEXT, 7, '0')
        ),

    -- Dinero: NUMERIC, nunca float
    saldo_total NUMERIC(14, 2) NOT NULL
        DEFAULT 0,

    moneda CHAR(3) NOT NULL
        DEFAULT 'COP',

    estado VARCHAR(10) NOT NULL
        DEFAULT 'activa',

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_cuentas_saldo_total
        CHECK (saldo_total >= 0),

    CONSTRAINT ck_cuentas_moneda
        CHECK (moneda = 'COP'),

    CONSTRAINT ck_cuentas_estado
    CHECK (
        estado IN (
            'activa',
            'bloqueada',
            'cerrada'
        )
    ),

    -- Regla 7: una cuenta cerrada tiene
    -- saldo en cero
    CONSTRAINT ck_cuentas_cerrada_sin_saldo
        CHECK (estado <> 'cerrada' OR saldo_total = 0)
);

ALTER SEQUENCE public.cuentas_numero_seq
    OWNED BY public.cuentas.numero_cuenta;

-- ========================================
-- BOLSILLOS
-- ========================================
CREATE TABLE public.bolsillos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    cuenta_id BIGINT NOT NULL
        REFERENCES public.cuentas(id)
        ON DELETE RESTRICT,

    nombre VARCHAR(40) NOT NULL,

    meta NUMERIC(14, 2),

    saldo NUMERIC(14, 2) NOT NULL
        DEFAULT 0,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    estado VARCHAR(10) NOT NULL
        DEFAULT 'activo',

    CONSTRAINT ck_bolsillos_nombre
        CHECK (LENGTH(TRIM(nombre)) BETWEEN 3 AND 40),

    CONSTRAINT ck_bolsillos_meta
        CHECK (meta IS NULL OR meta > 0),

    CONSTRAINT ck_bolsillos_saldo
        CHECK (saldo >= 0),

    CONSTRAINT ck_bolsillos_estado
    CHECK (
        estado IN (
            'activo',
            'archivado'
        )
    ),

    -- Archivado es terminal y exige saldo
    -- en cero
    CONSTRAINT ck_bolsillos_archivado_sin_saldo
        CHECK (estado <> 'archivado' OR saldo = 0)
);

-- ========================================
-- TRANSACCIONES
-- Libro contable: inmutable (ver trigger
-- más abajo). Las columnas nulas dependen
-- del tipo de movimiento.
-- ========================================
CREATE TABLE public.transacciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    tipo VARCHAR(15) NOT NULL,

    cuenta_origen_id BIGINT
        REFERENCES public.cuentas(id)
        ON DELETE RESTRICT,

    cuenta_destino_id BIGINT
        REFERENCES public.cuentas(id)
        ON DELETE RESTRICT,

    bolsillo_id BIGINT
        REFERENCES public.bolsillos(id)
        ON DELETE RESTRICT,

    monto NUMERIC(14, 2) NOT NULL,

    descripcion VARCHAR(120),

    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    estado VARCHAR(10) NOT NULL
        DEFAULT 'exitosa',

    CONSTRAINT ck_transacciones_tipo
    CHECK (
        tipo IN (
            'deposito',
            'retiro',
            'transferencia',
            'apartado',
            'devolucion'
        )
    ),

    -- Regla 5: mayor que cero y máximo
    -- 2.000.000 por transacción
    CONSTRAINT ck_transacciones_monto
        CHECK (monto > 0 AND monto <= 2000000),

    CONSTRAINT ck_transacciones_estado
    CHECK (
        estado IN (
            'pendiente',
            'exitosa',
            'fallida'
        )
    ),

    -- Coherencia entre el tipo y las
    -- referencias (mismo criterio que los
    -- controllers)
    CONSTRAINT ck_transacciones_referencias
    CHECK (
        (tipo = 'deposito'
            AND cuenta_origen_id IS NULL
            AND cuenta_destino_id IS NOT NULL
            AND bolsillo_id IS NULL)
        OR
        (tipo = 'retiro'
            AND cuenta_origen_id IS NOT NULL
            AND cuenta_destino_id IS NULL
            AND bolsillo_id IS NULL)
        OR
        (tipo = 'transferencia'
            AND cuenta_origen_id IS NOT NULL
            AND cuenta_destino_id IS NOT NULL
            AND cuenta_origen_id <> cuenta_destino_id
            AND bolsillo_id IS NULL)
        OR
        (tipo = 'apartado'
            AND cuenta_origen_id IS NOT NULL
            AND cuenta_destino_id IS NULL
            AND bolsillo_id IS NOT NULL)
        OR
        (tipo = 'devolucion'
            AND cuenta_origen_id IS NULL
            AND cuenta_destino_id IS NOT NULL
            AND bolsillo_id IS NOT NULL)
    )
);

-- ========================================
-- API_KEYS
-- Clientes confiables de la API. Nunca se
-- guarda la API Key original, solo su hash
-- SHA-256 en hexadecimal.
-- ========================================
CREATE TABLE public.api_keys (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente VARCHAR(100) NOT NULL UNIQUE,
    hash CHAR(64) NOT NULL UNIQUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_api_keys_hash
        CHECK (hash ~ '^[0-9a-f]{64}$')
);

-- ========================================
-- UNICIDAD SIN DISTINGUIR MAYÚSCULAS
-- ========================================
CREATE UNIQUE INDEX uq_usuarios_auth_email_ci
    ON public.usuarios_auth (LOWER(email));

CREATE UNIQUE INDEX uq_usuarios_email_ci
    ON public.usuarios (LOWER(email));

-- Regla 10: nombre de bolsillo único dentro
-- de la misma cuenta
CREATE UNIQUE INDEX uq_bolsillos_cuenta_nombre_ci
    ON public.bolsillos (cuenta_id, LOWER(nombre));

-- ========================================
-- ÍNDICES DE RELACIONES
-- ========================================
CREATE INDEX idx_usuarios_auth_rol
    ON public.usuarios_auth(rol_id);

CREATE INDEX idx_cuentas_usuario
    ON public.cuentas(usuario_id);

CREATE INDEX idx_bolsillos_cuenta
    ON public.bolsillos(cuenta_id);

CREATE INDEX idx_transacciones_cuenta_origen
    ON public.transacciones(cuenta_origen_id);

CREATE INDEX idx_transacciones_cuenta_destino
    ON public.transacciones(cuenta_destino_id);

CREATE INDEX idx_transacciones_bolsillo
    ON public.transacciones(bolsillo_id);

CREATE INDEX idx_transacciones_fecha
    ON public.transacciones(fecha);

-- ========================================
-- TRANSACCIONES INMUTABLES (regla 11)
-- Se rechaza cualquier UPDATE, DELETE o
-- TRUNCATE, incluso desde la conexión de
-- servidor.
-- ========================================
CREATE FUNCTION public.impedir_modificacion_transacciones()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION
        'Las transacciones son inmutables: no se pueden modificar ni eliminar'
        USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER trg_transacciones_inmutables
    BEFORE UPDATE OR DELETE ON public.transacciones
    FOR EACH ROW
    EXECUTE FUNCTION public.impedir_modificacion_transacciones();

CREATE TRIGGER trg_transacciones_sin_truncate
    BEFORE TRUNCATE ON public.transacciones
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.impedir_modificacion_transacciones();

COMMIT;
