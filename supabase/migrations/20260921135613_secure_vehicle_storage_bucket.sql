-- Storage seguro para fotografías y documentación de vehículos.
-- El bucket existente `documentos` permanece dedicado a contenido público
-- de mudanzas; este bucket es privado y se controla por transportista/vehículo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-vehiculos',
  'documentos-vehiculos',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vehiculos storage select" on storage.objects;
drop policy if exists "vehiculos storage insert" on storage.objects;
drop policy if exists "vehiculos storage update" on storage.objects;
drop policy if exists "vehiculos storage delete" on storage.objects;

create policy "vehiculos storage select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documentos-vehiculos'
  and (
    (
      split_part(name, '/', 1) = (select auth.uid()::text)
      and exists (
        select 1
        from public.vehiculos v
        where v.id::text = split_part(name, '/', 2)
          and v.transportista_id = (select auth.uid())
      )
    )
    or
    exists (
      select 1
      from public.vehiculos v
      where v.id::text = split_part(name, '/', 1)
        and v.transportista_id = (select auth.uid())
    )
  )
);

create policy "vehiculos storage insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documentos-vehiculos'
  and (
    (
      split_part(name, '/', 1) = (select auth.uid()::text)
      and exists (
        select 1
        from public.vehiculos v
        where v.id::text = split_part(name, '/', 2)
          and v.transportista_id = (select auth.uid())
      )
    )
    or
    exists (
      select 1
      from public.vehiculos v
      where v.id::text = split_part(name, '/', 1)
        and v.transportista_id = (select auth.uid())
    )
  )
);

create policy "vehiculos storage update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documentos-vehiculos'
  and (
    (
      split_part(name, '/', 1) = (select auth.uid()::text)
      and exists (
        select 1
        from public.vehiculos v
        where v.id::text = split_part(name, '/', 2)
          and v.transportista_id = (select auth.uid())
      )
    )
    or
    exists (
      select 1
      from public.vehiculos v
      where v.id::text = split_part(name, '/', 1)
        and v.transportista_id = (select auth.uid())
    )
  )
)
with check (
  bucket_id = 'documentos-vehiculos'
  and (
    (
      split_part(name, '/', 1) = (select auth.uid()::text)
      and exists (
        select 1
        from public.vehiculos v
        where v.id::text = split_part(name, '/', 2)
          and v.transportista_id = (select auth.uid())
      )
    )
    or
    exists (
      select 1
      from public.vehiculos v
      where v.id::text = split_part(name, '/', 1)
        and v.transportista_id = (select auth.uid())
    )
  )
);

create policy "vehiculos storage delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documentos-vehiculos'
  and (
    (
      split_part(name, '/', 1) = (select auth.uid()::text)
      and exists (
        select 1
        from public.vehiculos v
        where v.id::text = split_part(name, '/', 2)
          and v.transportista_id = (select auth.uid())
      )
    )
    or
    exists (
      select 1
      from public.vehiculos v
      where v.id::text = split_part(name, '/', 1)
        and v.transportista_id = (select auth.uid())
    )
  )
);
