
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Obtener el token de la sesión administrativa.
function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : null;
}

// Autenticar al usuario y comprobar su perfil.
async function autenticarColaborador(req) {
  const token = bearerToken(req);

  if (!token) {
    return {
      error: 'Falta la sesión de acceso.',
      status: 401
    };
  }

  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  const user = authData?.user;

  if (authError || !user) {
    return {
      error: 'La sesión no es válida o ha caducado.',
      status: 401
    };
  }

  const { data: colaborador, error: profileError } =
    await supabase
      .from('rodax_colaboradores')
      .select(
        'user_id, perfil, departamento, equipo, estado, protegido'
      )
      .eq('user_id', user.id)
      .maybeSingle();

  if (profileError) throw profileError;

  if (!colaborador) {
    return {
      error: 'La cuenta no está autorizada como colaborador de RODAX.',
      status: 403
    };
  }

  if (colaborador.estado !== 'activo') {
    return {
      error: 'La cuenta de colaborador está suspendida.',
      status: 403
    };
  }

  if (
    colaborador.perfil === 'gerente_general' &&
    colaborador.protegido !== true
  ) {
    return {
      error: 'La cuenta de Gerente General no supera la comprobación de protección.',
      status: 403
    };
  }

  return { user, colaborador };
}

// Calcular los permisos efectivos del colaborador.
// El permiso individual prevalece sobre el de la plantilla.
async function permisosEfectivos(userId) {
  const { data: catalogo, error: catalogoError } =
    await supabase
      .from('rodax_permisos_catalogo')
      .select('id, codigo, grupo, accion')
      .eq('activo', true);

  if (catalogoError) throw catalogoError;

  const { data: individuales, error: individualesError } =
    await supabase
      .from('rodax_permisos_usuario')
      .select('permiso_id, permitido')
      .eq('user_id', userId);

  if (individualesError) throw individualesError;

  const { data: asignacion, error: asignacionError } =
    await supabase
      .from('rodax_asignacion_plantilla')
      .select('plantilla_id')
      .eq('user_id', userId)
      .maybeSingle();

  if (asignacionError) throw asignacionError;

  let plantilla = [];

  if (asignacion?.plantilla_id) {
    const { data, error } = await supabase
      .from('rodax_plantilla_detalle_permisos')
      .select('permiso_id, permitido')
      .eq('plantilla_id', asignacion.plantilla_id);

    if (error) throw error;

    plantilla = data || [];
  }

  const plantillaPorId = new Map(
    plantilla.map(p => [p.permiso_id, p.permitido])
  );

  const individualPorId = new Map(
    (individuales || []).map(p => [p.permiso_id, p.permitido])
  );

  return (catalogo || [])
    .filter(p => {
      if (individualPorId.has(p.id)) {
        return individualPorId.get(p.id) === true;
      }

      return plantillaPorId.get(p.id) === true;
    })
    .map(p => p.codigo);
}

// Comprobar si el usuario tiene un permiso concreto.
async function tienePermiso(contexto, codigo) {
  if (
    !contexto?.colaborador ||
    contexto.colaborador.estado !== 'activo'
  ) {
    return false;
  }

  // El Gerente General protegido tiene autoridad completa.
  if (
    contexto.colaborador.perfil === 'gerente_general' &&
    contexto.colaborador.protegido === true
  ) {
    return true;
  }

  const permisos =
    contexto.permisos ||
    await permisosEfectivos(contexto.user.id);

  return permisos.includes(codigo);
}

// Autenticar y exigir un permiso antes de ejecutar una operación.
async function exigirPermiso(req, codigo) {
  const contexto = await autenticarColaborador(req);

  if (contexto.error) return contexto;

  contexto.permisos =
    await permisosEfectivos(contexto.user.id);

  if (!(await tienePermiso(contexto, codigo))) {
    return {
      error: 'No tienes autorización para realizar esta operación.',
      status: 403
    };
  }

  return contexto;
}

module.exports = {
  supabase,
  autenticarColaborador,
  permisosEfectivos,
  tienePermiso,
  exigirPermiso
};
