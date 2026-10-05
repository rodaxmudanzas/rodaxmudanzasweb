-- RODAX MUDANZAS
-- Solicitudes de modificación realizadas desde el Área Cliente.
-- No modifica automáticamente el precio: Administración revisa y aplica los cambios
-- que puedan afectar al presupuesto o a la operativa.

create table if not exists public.solicitudes_modificacion (
  id bigint generated always as identity primary key,
  mudanza_id bigint not null references public.mudanzas(id) on delete cascade,
  numero_reserva text not null,
  email_cliente text not null,
  cambios jsonb not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','en_revision','aprobada','rechazada','aplicada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_solicitudes_modificacion_mudanza
  on public.solicitudes_modificacion(mudanza_id);

create index if not exists idx_solicitudes_modificacion_estado
  on public.solicitudes_modificacion(estado);

alter table public.solicitudes_modificacion enable row level security;

-- Las operaciones del Área Cliente pasan por la API con Service Role.
-- No se exponen permisos directos al cliente sobre esta tabla.