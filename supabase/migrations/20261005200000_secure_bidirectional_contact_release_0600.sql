-- RODAX MUDANZAS
-- Seguridad de contacto bilateral:
-- ni cliente ni transportista reciben los datos de contacto de la contraparte
-- hasta las 06:00 (Europe/Madrid) del mismo día del servicio.

create or replace function public.obtener_contacto_contraparte(p_mudanza_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    m public.mudanzas%rowtype;
    ahora_madrid timestamp;
    rol_solicitante text;
    nombre_contraparte text;
    email_contraparte text;
    telefono_contraparte text;
begin
    if auth.uid() is null then
        return jsonb_build_object('visible', false, 'motivo', 'no_autenticado');
    end if;

    select * into m
    from public.mudanzas
    where id = p_mudanza_id;

    if not found then
        return jsonb_build_object('visible', false, 'motivo', 'mudanza_no_encontrada');
    end if;

    if auth.uid() = m.transportista_id then
        rol_solicitante := 'transportista';
    elsif auth.uid() = m.cliente_id then
        rol_solicitante := 'cliente';
    else
        return jsonb_build_object('visible', false, 'motivo', 'sin_acceso');
    end if;

    if m.transportista_id is null then
        return jsonb_build_object('visible', false, 'motivo', 'sin_transportista_asignado');
    end if;

    if m.estado <> 'Transportista asignado' then
        return jsonb_build_object('visible', false, 'motivo', 'servicio_no_activo');
    end if;

    ahora_madrid := now() at time zone 'Europe/Madrid';

    if ahora_madrid::date <> m.fecha then
        return jsonb_build_object(
            'visible', false,
            'motivo', 'no_es_el_dia_del_servicio',
            'fecha_servicio', m.fecha,
            'hora_liberacion', '06:00'
        );
    end if;

    if ahora_madrid::time < time '06:00' then
        return jsonb_build_object(
            'visible', false,
            'motivo', 'bloqueado_hasta_las_06',
            'fecha_servicio', m.fecha,
            'hora_liberacion', '06:00'
        );
    end if;

    if rol_solicitante = 'transportista' then
        nombre_contraparte := m.nombre;
        email_contraparte := m.email;
        telefono_contraparte := m.telefono;
    else
        select t.nombre, t.email, t.telefono
        into nombre_contraparte, email_contraparte, telefono_contraparte
        from public.transportistas t
        where t.id = m.transportista_id;
    end if;

    return jsonb_build_object(
        'visible', true,
        'motivo', 'contacto_liberado',
        'rol_solicitante', rol_solicitante,
        'nombre', nombre_contraparte,
        'email', email_contraparte,
        'telefono', telefono_contraparte,
        'fecha_servicio', m.fecha,
        'hora_liberacion', '06:00'
    );
end;
$$;

revoke all on function public.obtener_contacto_contraparte(bigint) from public;
grant execute on function public.obtener_contacto_contraparte(bigint) to authenticated;
