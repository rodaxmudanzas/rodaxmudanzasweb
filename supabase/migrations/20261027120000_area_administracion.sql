-- RODAX MUDANZAS
-- Área Administración: administradores, historial de auditoría y
-- trazabilidad de la resolución de solicitudes de modificación.
--
-- Todas las operaciones del panel pasan por /api/admin con Service Role.
-- Ninguna tabla de este archivo concede permisos de escritura a roles
-- anon/authenticated.
--
-- ALTA DEL PRIMER ADMINISTRADOR
-- 1. Crear el usuario en Supabase > Authentication > Users (email + contraseña).
-- 2. Ejecutar (sustituyendo el email y el nombre):
--
--    insert into public.administradores (id, email, nombre, rol)
--    select id, email, 'Nombre Apellidos', 'superadmin'
--    from auth.users
--    where email = 'admin@tu-dominio.com';

-- =====================================================
-- ADMINISTRADORES
-- =====================================================

create table if not exists public.administradores (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    nombre text not null,
    rol text not null default 'soporte'
        check (rol in ('superadmin','operaciones','finanzas','soporte')),
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.administradores enable row level security;

-- Cada administrador solo puede comprobar su propia ficha.
-- Altas, bajas y cambios de rol se hacen con Service Role / SQL.
drop policy if exists "Administrador puede ver su ficha" on public.administradores;

create policy "Administrador puede ver su ficha"
on public.administradores
for select
to authenticated
using (auth.uid() = id);

-- =====================================================
-- HISTORIAL DE AUDITORÍA
-- =====================================================

create table if not exists public.admin_historial (
    id bigint generated always as identity primary key,
    admin_id uuid not null,
    admin_email text not null,
    accion text not null,
    entidad text not null default 'mudanza',
    entidad_id text,
    mudanza_id bigint,
    numero_reserva text,
    antes jsonb,
    despues jsonb,
    nota text,
    created_at timestamptz not null default now()
);

create index if not exists idx_admin_historial_mudanza
    on public.admin_historial (mudanza_id, created_at desc);

create index if not exists idx_admin_historial_created
    on public.admin_historial (created_at desc);

-- Sin políticas: solo accesible con Service Role desde la API.
alter table public.admin_historial enable row level security;

-- =====================================================
-- SOLICITUDES DE MODIFICACIÓN: quién y cuándo las resolvió
-- =====================================================

alter table public.solicitudes_modificacion
    add column if not exists nota_admin text,
    add column if not exists resuelta_por uuid,
    add column if not exists resuelta_at timestamptz;
