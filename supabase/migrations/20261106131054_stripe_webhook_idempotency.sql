
-- ==========================================================
-- RODAX MUDANZAS
-- Idempotencia de eventos Stripe
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'processed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 1,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status
ON public.stripe_webhook_events (status);

ALTER TABLE public.stripe_webhook_events
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.stripe_webhook_events
FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.stripe_webhook_events
TO service_role;

-- ==========================================================
-- Reclamar un evento de forma atómica.
-- Evita que dos ejecuciones procesen simultáneamente
-- el mismo evento.
-- Permite recuperar eventos fallidos o bloqueados
-- durante más de 10 minutos.
-- ==========================================================

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
    p_event_id TEXT,
    p_event_type TEXT,
    p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id TEXT;
BEGIN
    INSERT INTO public.stripe_webhook_events (
        event_id,
        event_type,
        session_id,
        status,
        attempts,
        received_at,
        processing_started_at
    )
    VALUES (
        p_event_id,
        p_event_type,
        p_session_id,
        'processing',
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (event_id)
    DO UPDATE SET
        status = 'processing',
        attempts = stripe_webhook_events.attempts + 1,
        processing_started_at = NOW(),
        last_error = NULL
    WHERE
        stripe_webhook_events.status = 'failed'
        OR (
            stripe_webhook_events.status = 'processing'
            AND stripe_webhook_events.processing_started_at
                < NOW() - INTERVAL '10 minutes'
        )
    RETURNING event_id INTO v_event_id;

    RETURN v_event_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(
    TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(
    TEXT, TEXT, TEXT
) TO service_role;
