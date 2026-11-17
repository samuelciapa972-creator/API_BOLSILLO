-- ========================================
-- LAB 11.4 - Recuperación administrativa
-- Tabla nueva: no modifica tablas existentes.
-- El token se guarda solo como hash SHA-256.
-- ========================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Cuenta que recupera el acceso
    usuario_id BIGINT NOT NULL
        REFERENCES public.usuarios_auth(id)
        ON DELETE CASCADE,

    -- Administrador que autoriza
    administrador_id BIGINT NOT NULL
        REFERENCES public.usuarios_auth(id),

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_uso TIMESTAMPTZ,

    CONSTRAINT ck_reset_expiracion
        CHECK (fecha_expiracion > fecha_creacion),

    CONSTRAINT ck_reset_uso
        CHECK (fecha_uso IS NULL OR fecha_uso >= fecha_creacion)
);

CREATE INDEX IF NOT EXISTS idx_reset_usuario
    ON public.password_reset_tokens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_reset_expiracion
    ON public.password_reset_tokens(fecha_expiracion);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.password_reset_tokens
    FROM PUBLIC, anon, authenticated;

REVOKE ALL ON SEQUENCE public.password_reset_tokens_id_seq
    FROM PUBLIC, anon, authenticated;

COMMIT;
