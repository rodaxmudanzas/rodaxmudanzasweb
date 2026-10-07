/* RODAX MUDANZAS — Área Cliente
 * Acceso sin contraseña mediante Magic Link de Supabase.
 * Privacidad bilateral:
 *   - Dirección exacta: 00:00 del día del servicio.
 *   - Contacto del transportista: 06:00 del día del servicio.
 * La API es la autoridad de privacidad; este archivo solo representa su estado.
 */
(() => {
  const SUPABASE_URL = 'https://defvfvfyrydopaybnisg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_dKIRJ1_K4u1ypfCNTuylIw_AyAKeZTS';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const $ = (id) => document.getElementById(id);
  let reservas = [];
  let reservaActual = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(v) {
  if (v === null || v === undefined || v === '') {
    return '—';
  }

  if (typeof v === 'number') {
    return Number.isFinite(v)
      ? v.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' €'
      : '—';
  }

  let text = String(v).trim();

  if (!text) {
    return '—';
  }

  text = text
    .replace(/\s/g, '')
    .replace(/€/g, '');

  /*
   * Admite:
   * 1274.80
   * 1274,80
   * 1.274,80
   * 1,274.80
   */

  if (text.includes(',') && text.includes('.')) {
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');

    if (lastComma > lastDot) {
      text = text
        .replace(/\./g, '')
        .replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (text.includes(',')) {
    text = text.replace(',', '.');
  }

  const n = Number(text);

  return Number.isFinite(n)
    ? n.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €'
    : '—';
}

  function fecha(v) {
    if (!v) return '—';
    const d = new Date(v + (String(v).length === 10 ? 'T12:00:00' : ''));
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('es-ES', {day:'2-digit', month:'long', year:'numeric'});
  }

  function routeLabel(r) {
    const o = r.privacidad?.direccion_exacta_disponible
      ? (r.origen || '')
      : [r.origen_ciudad, r.origen_cp, r.origen_comunidad_autonoma].filter(Boolean).join(' - ');

    const d = r.privacidad?.direccion_exacta_disponible
      ? (r.destino || '')
      : [r.destino_ciudad, r.destino_cp, r.destino_comunidad_autonoma].filter(Boolean).join(' - ');

    return {
      origen: o || r.origen || 'Origen pendiente',
      destino: d || r.destino || 'Destino pendiente'
    };
  }

  function statusClass(status='') {
    const s = status.toLowerCase();
    if (s.includes('final')) return 'status-green';
    if (s.includes('transportista')) return 'status-blue';
    if (s.includes('pago')) return 'status-amber';
    return 'status-gray';
  }

  function serviceTypeLabel(r) {
    return String(r.tipo_servicio || 'Mudanza Estándar');
  }

  function isTotal(r) {
    return serviceTypeLabel(r).toLowerCase().includes('total');
  }

  function renderLista() {
    const box = $('reservas-lista');

    if (!reservas.length) {
      box.innerHTML = `<div class="empty"><div class="empty-icon">📦</div><h3>No hay mudanzas asociadas</h3><p>Cuando exista una reserva con este email aparecerá aquí.</p></div>`;
      return;
    }

    box.innerHTML = reservas.map((r, i) => {
      const route = routeLabel(r);
      const selected = reservaActual && String(reservaActual.id) === String(r.id);

      return `
        <button class="reserva-card ${selected ? 'selected' : ''}" data-index="${i}">
          <div class="card-top">
            <span class="reservation-number">${escapeHtml(r.numero_reserva || 'RDX')}</span>
            <span class="status ${statusClass(r.estado)}">${escapeHtml(r.estado || 'En gestión')}</span>
          </div>

          <div class="service-type">${escapeHtml(serviceTypeLabel(r))}</div>

          <div class="route-mini">
            <strong>${escapeHtml(route.origen)}</strong>
            <span>→</span>
            <strong>${escapeHtml(route.destino)}</strong>
          </div>

          <div class="card-bottom">
            <span>📅 ${escapeHtml(fecha(r.fecha))}</span>
            <span>${money(r.importe_total ?? r.preciototal)}</span>
          </div>
        </button>`;
    }).join('');

    box.querySelectorAll('.reserva-card').forEach(btn => {
      btn.addEventListener('click', () => {
        reservaActual = reservas[Number(btn.dataset.index)];
        renderLista();
        renderDetalle();
      });
    });
  }

  function renderContact(r) {
    if (!r.transportista_id) {
      return `
        <div class="contact-box">
          <span>ℹ️</span>
          <div>
            <strong>Transportista pendiente de asignación</strong>
            <p>Te avisaremos cuando RODAX haya asignado el servicio.</p>
          </div>
        </div>`;
    }

    if (!r.privacidad?.contacto_transportista_disponible) {
      return `
        <div class="contact-box locked">
          <span>🔒</span>
          <div>
            <strong>Contacto del transportista protegido</strong>
            <p>
              Por privacidad, los datos de contacto entre cliente y transportista
              se habilitan para ambas partes el mismo día del servicio a partir
              de las <strong>06:00</strong> (hora de Madrid).
            </p>
          </div>
        </div>`;
    }

    const t = r.transportista_contacto || {};

    const phone = t.telefono
      ? `<a href="tel:${escapeHtml(t.telefono)}">📱 ${escapeHtml(t.telefono)}</a>`
      : '<span>📱 Teléfono no disponible</span>';

    const email = t.email
      ? `<a href="mailto:${escapeHtml(t.email)}">📧 ${escapeHtml(t.email)}</a>`
      : '<span>📧 Email no disponible</span>';

    return `
      <div class="contact-box unlocked">
        <span>🔓</span>
        <div>
          <strong>Contacto del transportista disponible</strong>
          <p class="contact-name">${escapeHtml(t.nombre || 'Transportista RODAX')}</p>
          <div class="contact-links">${phone}${email}</div>
          <small>Datos disponibles desde las 06:00 del día del servicio.</small>
        </div>
      </div>`;
  }

  function renderAddressPrivacy(r) {
    if (r.privacidad?.direccion_exacta_disponible) {
      return `
        <div class="privacy-note unlocked">
          📍 Dirección exacta disponible desde las 00:00 del día del servicio.
        </div>`;
    }

    return `
      <div class="privacy-note">
        🔒 Antes del día del servicio solo se muestra ciudad, código postal y comunidad autónoma.
      </div>`;
  }

  function renderDetailServices(r) {
    if (isTotal(r)) {
      return `
        <div class="total-services">
          <div class="total-services-head">
            <strong>Mudanza Total</strong>
            <span>+249 €</span>
          </div>

          <p>Todos los servicios premium están incluidos en la Mudanza Total:</p>

          <ul>
            <li>✓ Desmontaje ilimitado</li>
            <li>✓ Montaje ilimitado</li>
            <li>✓ Embalaje ilimitado</li>
            <li>✓ Empaquetado y cajas ilimitado</li>
            <li>✓ Seguro premium hasta 50.000 €</li>
            <li>✓ Prioridad operativa</li>
          </ul>
        </div>`;
    }

    return `<p>${escapeHtml(r.extras || 'Solo transporte básico')}</p>`;
  }

  function renderDetalle() {
    const r = reservaActual;
    const panel = $('detalle');

    if (!r) {
      panel.innerHTML = `
        <div class="detail-placeholder">
          <div>👋</div>
          <h2>Selecciona tu mudanza</h2>
          <p>Aquí podrás consultar y gestionar toda la información de tu servicio.</p>
        </div>`;
      return;
    }

    const route = routeLabel(r);
    const total = isTotal(r);

    panel.innerHTML = `
      <div class="detail-header">
        <div>
          <span class="eyebrow">MI MUDANZA</span>
          <h2>${escapeHtml(r.numero_reserva || '')}</h2>
        </div>

        <span class="status ${statusClass(r.estado)}">
          ${escapeHtml(r.estado || 'En gestión')}
        </span>
      </div>

      <div class="type-banner ${total ? 'total' : ''}">
  <div>
    <span>${total ? '⭐' : '🚚'}</span>

    <div>
      <strong>${escapeHtml(serviceTypeLabel(r))}</strong>

      <small>
        ${total
          ? 'Incluye todos los servicios premium · +249 €'
          : 'Transporte profesional'}
      </small>
    </div>
  </div>
</div>

      <div class="detail-grid">
  <div class="info-card">
    <span>📅</span>
    <div>
      <small>Fecha</small>
      <strong>${escapeHtml(fecha(r.fecha))}</strong>
    </div>
  </div> 

  <div class="info-card">
    <span>🕐</span>
    <div>
      <small>Recogida</small>
      <strong>${escapeHtml(r.franja_horaria_recogida || '—')}</strong>
    </div>
  </div>

  <div class="info-card">
    <span>📦</span>
    <div>
      <small>Volumen</small>
      <strong>${escapeHtml(r.volumen || '—')}</strong>
    </div>
  </div>

  <div class="info-card">
    <span>💳</span>
    <div>
      <small>Reserva</small>
      <strong>${money(r.importe_reserva ?? r.precioreserva)}</strong>
    </div>
  </div>
</div>

<div class="economy-card">
  <div class="economy-header">
    <div>
      <span class="eyebrow">RESUMEN ECONÓMICO</span>
      <h3>Precio de tu mudanza</h3>
    </div>
  </div>

  <div class="economy-row economy-total">
    <div>
      <strong>Total</strong>
      <small>100 % del servicio</small>
    </div>

    <strong>
      ${money(r.importe_total ?? r.preciototal)}
    </strong>
  </div>

  <div class="economy-row">
    <div>
      <strong>Reserva pagada</strong>
      <small>30 %</small>
    </div>

    <strong>
      ${money(r.importe_reserva ?? r.precioreserva)}
    </strong>
  </div>

  <div class="economy-row economy-pending">
    <div>
      <strong>Pendiente de pago</strong>
      <small>70 %</small>
    </div>

    <strong>
      ${money(r.importe_restante)}
    </strong>
  </div>
</div>

      <div class="route-box">
        <div class="route-row">
          <span class="dot"></span>
          <div>
            <small>RECOGIDA</small>
            <strong>${escapeHtml(route.origen)}</strong>
          </div>
        </div>

        <div class="route-line"></div>

        <div class="route-row">
          <span class="dot destination"></span>
          <div>
            <small>ENTREGA</small>
            <strong>${escapeHtml(route.destino)}</strong>
          </div>
        </div>

        ${renderAddressPrivacy(r)}
      </div>

      <div class="section-card">
        <div class="section-title">
          <h3>Servicios contratados</h3>
          <button id="btn-modificar">Modificar</button>
        </div>

        ${renderDetailServices(r)}
      </div>

      <div class="section-card">
        <div class="section-title">
          <h3>Accesos</h3>
        </div>

        <p>
          Recogida:
          ${r.ascensor_origen ? 'Ascensor' : 'Sin ascensor'}
          · Piso ${escapeHtml(r.piso_origen ?? 0)}
        </p>

        <p>
          Entrega:
          ${r.ascensor_destino ? 'Ascensor' : 'Sin ascensor'}
          · Piso ${escapeHtml(r.piso_destino ?? 0)}
        </p>
      </div>

      ${renderContact(r)}

      <div class="actions">
        <button class="primary" id="btn-modificar-2">
          ✏️ Solicitar modificación
        </button>

        <button class="secondary" id="btn-refrescar">
          ↻ Actualizar
        </button>
      </div>
    `;

    $('btn-modificar').onclick = openModification;
    $('btn-modificar-2').onclick = openModification;
    $('btn-refrescar').onclick = loadReservas;
  }

  function openModification() {
    const r = reservaActual;
    if (!r) return;

    $('modificacion-id').value = r.id;
    $('mod-origen').value = r.origen || '';
    $('mod-destino').value = r.destino || '';
    $('mod-fecha').value = r.fecha || '';
    $('mod-franja').value = r.franja_horaria_recogida || '';
    $('mod-tipo').value = r.tipo_servicio || 'Mudanza Estándar';
    $('mod-cambios').value = '';

    $('modal-modificacion').classList.remove('hidden');
  }

  async function loadReservas() {
    $('loading').classList.remove('hidden');
    $('app').classList.add('hidden');

    const {
      data: { session }
    } = await db.auth.getSession();

    if (!session) {
      $('login').classList.remove('hidden');
      $('loading').classList.add('hidden');
      return;
    }

    $('login').classList.add('hidden');

    const res = await fetch('/api/cliente-reservas', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'No se pudieron cargar tus mudanzas.');
    }

    reservas = data.reservas || [];

    const requested =
      new URLSearchParams(location.search).get('reserva');

    reservaActual =
      reservas.find(r => r.numero_reserva === requested) ||
      reservas[0] ||
      null;

    $('cliente-nombre').textContent =
      data.cliente?.nombre ||
      session.user.email ||
      'Cliente';

    $('cliente-email').textContent =
      session.user.email || '';

    renderLista();
    renderDetalle();

    $('app').classList.remove('hidden');
    $('loading').classList.add('hidden');
  }

  async function sendMagicLink() {
    const email = $('email').value.trim();

    if (!email) {
      return setLoginMessage('Introduce tu email.');
    }

    $('btn-email').disabled = true;
    $('btn-email').textContent = 'Enviando enlace…';

    const { error } = await db.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/area-cliente.html`
      }
    });

    $('btn-email').disabled = false;
    $('btn-email').textContent = '📧 Enviar enlace de acceso';

    if (error) {
      return setLoginMessage(error.message, true);
    }

    setLoginMessage(
      'Enlace enviado. Revisa tu correo y pulsa “Acceder a mi Área Cliente”.'
    );
  }

  function setLoginMessage(msg, error=false) {
    $('login-message').textContent = msg;
    $('login-message').className =
      `login-message ${error ? 'error' : ''}`;
  }

  async function requestModification(e) {
    e.preventDefault();

    const {
      data: { session }
    } = await db.auth.getSession();

    if (!session) return;

    const payload = {
      mudanza_id: Number($('modificacion-id').value),

      cambios: {
        origen: $('mod-origen').value.trim(),
        destino: $('mod-destino').value.trim(),
        fecha: $('mod-fecha').value,
        franja_horaria_recogida: $('mod-franja').value,
        tipo_servicio: $('mod-tipo').value,
        detalle: $('mod-cambios').value.trim()
      }
    };

    const res = await fetch('/api/cliente-modificacion', {
      method:'POST',

      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${session.access_token}`
      },

      body:JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      return setLoginMessage(
        data.error || 'No se pudo enviar la solicitud.',
        true
      );
    }

    $('modal-modificacion').classList.add('hidden');

    alert(
      'Solicitud enviada. RODAX revisará los cambios y te confirmará cualquier modificación de precio antes de aplicarla.'
    );
  }

  document.addEventListener('DOMContentLoaded', async () => {

    $('btn-email').onclick = sendMagicLink;

    $('email').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMagicLink();
    });

    $('btn-logout').onclick = async () => {
      await db.auth.signOut();
      location.reload();
    };

    $('close-mod').onclick = () =>
      $('modal-modificacion').classList.add('hidden');

    $('form-modificacion').onsubmit =
      requestModification;

    db.auth.onAuthStateChange(() =>
      loadReservas().catch(e =>
        setLoginMessage(e.message, true)
      )
    );

    try {
      await loadReservas();
    } catch(e) {
      console.error(e);
      setLoginMessage(e.message, true);
      $('loading').classList.add('hidden');
      $('login').classList.remove('hidden');
    }
  });
})();