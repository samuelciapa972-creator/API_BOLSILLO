BEGIN;

-- ========================================
-- Roles de negocio
-- ========================================
INSERT INTO public.roles
    (nombre, descripcion)
VALUES
    (
        'administrador',
        'Gestiona usuarios, cuentas, bolsillos y transacciones'
    ),
    (
        'cliente',
        'Opera únicamente sus propias cuentas y bolsillos'
    ),
    (
        'auditor',
        'Consulta toda la información en modo solo lectura'
    );

-- Activar RLS desde el principio.
-- Todavía no creamos políticas de acceso
-- directo: la autorización vive en Express.
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolsillos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Impedir acceso directo de los roles de la
-- API de datos de Supabase mientras no
-- existan políticas definitivas.
REVOKE ALL ON TABLE
    public.roles,
    public.usuarios_auth,
    public.usuarios,
    public.cuentas,
    public.bolsillos,
    public.transacciones,
    public.api_keys
FROM anon, authenticated;

REVOKE ALL ON SEQUENCE
    public.cuentas_numero_seq
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION
    public.impedir_modificacion_transacciones()
FROM PUBLIC, anon, authenticated;

COMMIT;
