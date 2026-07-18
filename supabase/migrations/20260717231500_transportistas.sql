-- Crear tabla de transportistas
create table if not exists public.transportistas (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    nombre text not null,
    telefono text,
    ciudad text,
    vehiculo text,
    estado text default 'Activo',
    created_at timestamptz default now()
);

-- Activar Row Level Security
alter table public.transportistas enable row level security;

-- Permitir que cada transportista cree únicamente su propio perfil
create policy "Transportista puede crear su perfil"
on public.transportistas
for insert
to authenticated
with check (auth.uid() = id);

-- Permitir que cada transportista consulte únicamente su propio perfil
create policy "Transportista puede ver su perfil"
on public.transportistas
for select
to authenticated
using (auth.uid() = id);

-- Permitir que cada transportista actualice únicamente su propio perfil
create policy "Transportista puede actualizar su perfil"
on public.transportistas
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);