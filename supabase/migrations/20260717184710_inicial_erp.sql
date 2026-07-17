-- =====================================================
-- RODAX MUDANZAS ERP
-- Migración 001
-- Catálogo maestro de estados
-- =====================================================

CREATE TABLE public.catalogo_estados (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    codigo TEXT NOT NULL UNIQUE,

    nombre TEXT NOT NULL,

    color TEXT NOT NULL,

    progreso SMALLINT NOT NULL
        CHECK (progreso BETWEEN 0 AND 100),

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

COMMENT ON TABLE public.catalogo_estados IS
'Catálogo maestro de estados utilizados por todo el ERP.';

COMMENT ON COLUMN public.catalogo_estados.codigo IS
'Código interno del estado.';

COMMENT ON COLUMN public.catalogo_estados.nombre IS
'Nombre visible para el usuario.';

COMMENT ON COLUMN public.catalogo_estados.color IS
'Color hexadecimal utilizado por la interfaz.';

COMMENT ON COLUMN public.catalogo_estados.progreso IS
'Porcentaje de progreso asociado al estado.';

INSERT INTO public.catalogo_estados
(codigo,nombre,color,progreso)
VALUES

('pendiente_pago','Pendiente de pago','#f59e0b',10),

('pago_confirmado','Pago confirmado','#22c55e',25),

('pendiente_asignacion','Pendiente de asignación','#3b82f6',40),

('transportista_asignado','Transportista asignado','#8b5cf6',60),

('en_ruta','En ruta','#0ea5e9',80),

('finalizada','Mudanza finalizada','#16a34a',100);