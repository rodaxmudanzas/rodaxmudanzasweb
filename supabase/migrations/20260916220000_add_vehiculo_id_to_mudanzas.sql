alter table public.mudanzas
    add column if not exists vehiculo_id uuid;

alter table public.mudanzas
    drop constraint if exists mudanzas_vehiculo_id_fkey;

alter table public.mudanzas
    add constraint mudanzas_vehiculo_id_fkey
    foreign key (vehiculo_id)
    references public.vehiculos(id)
    on delete set null;

create index if not exists idx_mudanzas_vehiculo_id
    on public.mudanzas (vehiculo_id);
