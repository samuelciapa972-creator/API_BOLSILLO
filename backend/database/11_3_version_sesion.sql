-- ========================================
-- LAB 11.3 - Versión de sesión
-- Ejecutar UNA VEZ en Supabase SQL Editor.
-- Conserva usuarios, roles, titulares y
-- hashes existentes (no hay DROP/TRUNCATE).
--
-- En API Bolsillo la tabla de login es
-- public.usuarios_auth (equivale a
-- public.usuarios de la guía Hospital).
-- ========================================
ALTER TABLE public.usuarios_auth
  ADD COLUMN IF NOT EXISTS version_sesion INTEGER NOT NULL DEFAULT 0;

SELECT id, email, version_sesion
FROM public.usuarios_auth
ORDER BY id;
