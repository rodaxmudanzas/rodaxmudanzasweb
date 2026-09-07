-- RODAX — Ubicación pública de mudanzas
-- Reproducible y segura: no toca origen/destino exactos.

ALTER TABLE public.mudanzas
    ADD COLUMN IF NOT EXISTS origen_ciudad TEXT,
    ADD COLUMN IF NOT EXISTS origen_cp TEXT,
    ADD COLUMN IF NOT EXISTS origen_provincia TEXT,
    ADD COLUMN IF NOT EXISTS origen_comunidad_autonoma TEXT,
    ADD COLUMN IF NOT EXISTS destino_ciudad TEXT,
    ADD COLUMN IF NOT EXISTS destino_cp TEXT,
    ADD COLUMN IF NOT EXISTS destino_provincia TEXT,
    ADD COLUMN IF NOT EXISTS destino_comunidad_autonoma TEXT;

COMMENT ON COLUMN public.mudanzas.origen_ciudad IS
    'Ubicación pública: municipio/ciudad de origen. Nunca contiene calle ni número.';
COMMENT ON COLUMN public.mudanzas.origen_cp IS
    'Ubicación pública: código postal de origen.';
COMMENT ON COLUMN public.mudanzas.origen_comunidad_autonoma IS
    'Ubicación pública: comunidad autónoma de origen.';
COMMENT ON COLUMN public.mudanzas.destino_ciudad IS
    'Ubicación pública: municipio/ciudad de destino. Nunca contiene calle ni número.';
COMMENT ON COLUMN public.mudanzas.destino_cp IS
    'Ubicación pública: código postal de destino.';
COMMENT ON COLUMN public.mudanzas.destino_comunidad_autonoma IS
    'Ubicación pública: comunidad autónoma de destino.';
