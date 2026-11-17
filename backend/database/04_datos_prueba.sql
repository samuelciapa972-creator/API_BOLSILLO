-- ========================================
-- Datos de prueba (equivalentes a src/data)
-- Solo para un entorno de laboratorio.
--
-- Los saldos se respaldan con transacciones
-- (regla 12): cada peso en una cuenta o en
-- un bolsillo tiene su movimiento.
--
-- Si Ana Ruiz ya existe, no hace nada.
-- ========================================

DO $$
DECLARE
    v_ana BIGINT;
    v_carlos BIGINT;
    v_cuenta_ana BIGINT;
    v_cuenta_carlos BIGINT;
    v_bolsillo BIGINT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE documento = '1057234891'
    ) THEN
        RAISE NOTICE 'Datos de prueba ya cargados';
        RETURN;
    END IF;

    INSERT INTO public.usuarios
        (nombre, documento, email, telefono)
    VALUES
        ('Ana Ruiz', '1057234891', 'ana.ruiz@example.com', '3124567890')
    RETURNING id INTO v_ana;

    INSERT INTO public.usuarios
        (nombre, documento, email, telefono)
    VALUES
        ('Carlos Gómez', '1098765432', 'carlos.gomez@example.com', '3109876543')
    RETURNING id INTO v_carlos;

    INSERT INTO public.cuentas (usuario_id, saldo_total)
    VALUES (v_ana, 100000.00)
    RETURNING id INTO v_cuenta_ana;

    INSERT INTO public.cuentas (usuario_id, saldo_total)
    VALUES (v_carlos, 200000.00)
    RETURNING id INTO v_cuenta_carlos;

    INSERT INTO public.bolsillos (cuenta_id, nombre, meta, saldo)
    VALUES (v_cuenta_ana, 'Viaje a Cartagena', 800000.00, 80000.00)
    RETURNING id INTO v_bolsillo;

    INSERT INTO public.transacciones
        (tipo, cuenta_origen_id, cuenta_destino_id, bolsillo_id, monto, descripcion)
    VALUES
        ('deposito', NULL, v_cuenta_ana, NULL, 100000.00, 'Saldo inicial'),
        ('deposito', NULL, v_cuenta_carlos, NULL, 200000.00, 'Saldo inicial'),
        ('apartado', v_cuenta_ana, NULL, v_bolsillo, 80000.00, 'Apartado inicial');
END;
$$;

-- Caso estrella de la sustentación:
-- cuenta de Ana con 100.000 total, 80.000
-- apartados y 20.000 disponibles.
SELECT
    c.id AS cuenta_id,
    u.nombre AS titular,
    c.numero_cuenta,
    c.saldo_total,
    COALESCE(SUM(b.saldo) FILTER (WHERE b.estado = 'activo'), 0) AS saldo_apartado,
    c.saldo_total
      - COALESCE(SUM(b.saldo) FILTER (WHERE b.estado = 'activo'), 0) AS saldo_disponible
FROM public.cuentas c
JOIN public.usuarios u ON u.id = c.usuario_id
LEFT JOIN public.bolsillos b ON b.cuenta_id = c.id
GROUP BY c.id, u.nombre
ORDER BY c.id;
