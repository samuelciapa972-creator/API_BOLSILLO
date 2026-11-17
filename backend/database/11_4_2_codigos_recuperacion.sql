-- ========================================
-- LAB 11.4.2 - Códigos de recuperación
-- Tabla nueva: no modifica tablas existentes.
-- Cada código se guarda solo como hash.
-- ========================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.codigos_recuperacion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES public.usuarios_auth(id)
        ON DELETE CASCADE,

    codigo_hash VARCHAR(64) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_uso TIMESTAMPTZ,

    CONSTRAINT ck_codigos_fecha_uso
        CHECK (fecha_uso IS NULL OR fecha_uso >= fecha_creacion)
);

CREATE INDEX IF NOT EXISTS idx_codigos_recuperacion_usuario
    ON public.codigos_recuperacion(usuario_id);

ALTER TABLE public.codigos_recuperacion ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.codigos_recuperacion
    FROM PUBLIC, anon, authenticated;

REVOKE ALL ON SEQUENCE public.codigos_recuperacion_id_seq
    FROM PUBLIC, anon, authenticated;

COMMIT;
-- El rol del pool pg (postgres) conserva SELECT, INSERT, UPDATE y DELETE.
