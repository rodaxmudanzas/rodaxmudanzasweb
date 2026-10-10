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
  <span class="reservation-number">
    ${escapeHtml(r.numero_reserva || 'RDX')}
  </span>
</div>

<div class="service-type-badge ${isTotal(r) ? 'total' : 'standard'}">
  <span class="service-type-icon">
    ${isTotal(r) ? '⭐' : '🚚'}
  </span>

  <div>
    <strong>
      ${isTotal(r) ? 'MUDANZA TOTAL' : 'MUDANZA ESTÁNDAR'}
    </strong>

    <small>
      ${isTotal(r)
        ? 'Todos los servicios premium incluidos'
        : 'Transporte profesional'}
    </small>
  </div>
</div>

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

  function getInventario(r) {
    if (Array.isArray(r?.inventario)) return r.inventario;

    if (typeof r?.inventario === 'string') {
      try {
        const parsed = JSON.parse(r.inventario);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

    let text = String(value).trim().replace(/\s/g, '').replace(/€/g, '');

    if (text.includes(',') && text.includes('.')) {
      const lastComma = text.lastIndexOf(',');
      const lastDot = text.lastIndexOf('.');

      if (lastComma > lastDot) {
        text = text.replace(/\./g, '').replace(',', '.');
      } else {
        text = text.replace(/,/g, '');
      }
    } else if (text.includes(',')) {
      text = text.replace(',', '.');
    }

    const n = Number(text);
    return Number.isFinite(n) ? n : 0;
  }

  function inventoryQuantity(item) {
    return Math.max(
      0,
      Math.round(
        toNumber(
          item?.cantidad ??
          item?.quantity ??
          item?.unidades ??
          item?.qty ??
          0
        )
      )
    );
  }

  function inventoryM3Unit(item) {
    return toNumber(
      item?.metrosCubicos ??
      item?.metros_cubicos ??
      item?.m3 ??
      item?.volumen_m3 ??
      item?.volumenM3 ??
      0
    );
  }

  function inventoryName(item) {
    return String(
      item?.nombre ??
      item?.nombre_item ??
      item?.item ??
      item?.articulo ??
      item?.descripcion ??
      item?.name ??
      'Artículo'
    ).trim() || 'Artículo';
  }

  function inventoryCategory(item) {
    return String(
      item?.categoria ??
      item?.habitacion ??
      item?.estancia ??
      item?.grupo ??
      'Otros'
    ).trim() || 'Otros';
  }

  function isTotalExtra(item) {
    return Boolean(
      item?.es_extra_mudanza_total ||
      item?.extra_mudanza_total ||
      item?.tipo_item === 'extra_mudanza_total'
    );
  }

  function getInventoryM3(r) {
    return getInventario(r).reduce((total, item) => {
      return total + (inventoryQuantity(item) * inventoryM3Unit(item));
    }, 0);
  }

  function formatM3Cliente(value) {
    const n = toNumber(value);

    return Number.isFinite(n)
      ? n.toLocaleString('es-ES', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }) + ' m³'
      : '—';
  }

  function renderInventoryRows(items) {
    if (!items.length) {
      return `
        <div class="inventory-empty">
          No hay artículos de inventario registrados.
        </div>`;
    }

    const groups = new Map();

    items.forEach(item => {
      const category = inventoryCategory(item);

      if (!groups.has(category)) {
        groups.set(category, []);
      }

      groups.get(category).push(item);
    });

    return [...groups.entries()].map(([category, group]) => `
      <div class="inventory-group">
        <div class="inventory-group-title">
          <span>${escapeHtml(category)}</span>

          <span class="inventory-group-count">
            ${group.reduce(
              (sum, item) => sum + inventoryQuantity(item),
              0
            )}
          </span>
        </div>

        <div class="inventory-items">
          ${group.map(item => `
            <div class="inventory-item">
              <span>${escapeHtml(inventoryName(item))}</span>
              <strong>×${inventoryQuantity(item)}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderTotalExtras(r, items) {
    const extras = items.filter(isTotalExtra);

    if (!isTotal(r) && !extras.length) return '';

    const findExtraQuantity = (patterns) => {
      const item = extras.find(extra => {
        const name = inventoryName(extra).toLowerCase();

        return patterns.some(pattern =>
          name.includes(pattern)
        );
      });

      return item ? inventoryQuantity(item) : 0;
    };

    const cajas = [
      {
        name: 'Cajas pequeñas',
        quantity: findExtraQuantity([
          'caja pequeña',
          'cajas pequeñas',
          'caja pequena',
          'cajas pequenas'
        ]),
        m3: 0.036
      },
      {
        name: 'Cajas medianas',
        quantity: findExtraQuantity([
          'caja mediana',
          'cajas medianas'
        ]),
        m3: 0.072
      },
      {
        name: 'Cajas grandes',
        quantity: findExtraQuantity([
          'caja grande',
          'cajas grandes'
        ]),
        m3: 0.096
      }
    ];

    return `
      <div class="inventory-extras">

        <div class="inventory-extras-head">
          <div>
            <span class="inventory-extras-eyebrow">
              EXTRAS INCLUIDOS
            </span>

            <strong>
              Material de Mudanza Total
            </strong>
          </div>

          <span class="inventory-extras-badge">
            ⭐
          </span>
        </div>

        <div class="inventory-extra-grid">

          ${cajas.map(caja => `
            <div class="inventory-extra-card">

              <div class="inventory-extra-icon">
                📦
              </div>

              <div>
                <strong>
                  ${caja.name}
                </strong>

                <small>
                  ${caja.m3.toLocaleString('es-ES', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3
                  })} m³ / unidad
                </small>
              </div>

              <span class="inventory-extra-qty">
                ×${caja.quantity}
              </span>

            </div>
          `).join('')}

        </div>

        <p class="inventory-extras-note">
          Estas cajas forman parte del volumen físico de la mudanza
          y están incluidas en la Mudanza Total.
          No generan un coste adicional.
        </p>

      </div>`;
  }

  function renderInventory(r) {
    const items = getInventario(r);

    const normalItems = items.filter(
      item => !isTotalExtra(item)
    );

    const totalM3 = getInventoryM3(r);

    const volume = totalM3 > 0
      ? formatM3Cliente(totalM3)
      : (r.volumen || '—');

    const articleCount = normalItems.reduce(
      (sum, item) => sum + inventoryQuantity(item),
      0
    );

    return `
      <div class="section-card inventory-card">

        <div class="section-title">

          <div>
            <h3>
              Inventario de tu mudanza
            </h3>

            <small class="section-subtitle">
              ${articleCount} artículos
            </small>
          </div>

          <strong class="inventory-volume">
            ${escapeHtml(volume)}
          </strong>

        </div>

        <div class="inventory-list">
          ${renderInventoryRows(normalItems)}
        </div>

        ${renderTotalExtras(r, items)}

        <div class="inventory-total">

          <span>
            Volumen total de la mudanza
          </span>

          <strong>
            ${escapeHtml(volume)}
          </strong>

        </div>

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
</div>

      <div class="type-banner ${total ? 'total' : 'standard'}">
  <div>
    <span class="type-banner-icon">
      ${total ? '⭐' : '🚚'}
    </span>

    <div>
      <strong>
        ${total ? 'MUDANZA TOTAL' : 'MUDANZA ESTÁNDAR'}
      </strong>

      <small>
        ${total
          ? 'Todos los servicios premium incluidos · +249 €'
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
      <strong>
  ${escapeHtml(
    getInventoryM3(r) > 0
      ? formatM3Cliente(getInventoryM3(r))
      : (r.volumen || '—')
  )}
</strong>
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

      ${renderInventory(r)}

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

        <button class="cancel-button" id="btn-cancelar">
          ✕ Cancelar mudanza
        </button>

      </div>
    `;

    $('btn-modificar').onclick = openModification;
$('btn-modificar-2').onclick = openModification;
$('btn-refrescar').onclick = loadReservas;

$('btn-cancelar').onclick = openCancellation;

$('btn-cerrar-cancelacion').onclick = () => {
  $('modal-cancelacion').classList.add('hidden');
};

$('btn-cerrar-cancelacion-2').onclick = () => {
  $('modal-cancelacion').classList.add('hidden');
};
  }

    function openCancellation() {
    const r = reservaActual;

    if (!r) return;

    const modal = $('modal-cancelacion');

    if (!modal) return;

    const reserva = toNumber(
      r.importe_reserva ??
      r.precioreserva ??
      0
    );

    const fechaServicio = r.fecha
      ? new Date(`${r.fecha}T00:00:00`)
      : null;

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    let diasRestantes = null;

    if (
      fechaServicio &&
      !Number.isNaN(fechaServicio.getTime())
    ) {
      diasRestantes = Math.ceil(
        (fechaServicio - hoy) /
        (1000 * 60 * 60 * 24)
      );
    }

    
let porcentaje = 0;

if (diasRestantes === null) {
  porcentaje = 0;
} else if (diasRestantes <= 1) {
  porcentaje = 100;
} else if (diasRestantes <= 3) {
  porcentaje = 50;
} else if (diasRestantes <= 7) {
  porcentaje = 25;
} else if (diasRestantes <= 14) {
  porcentaje = 10;
}


    const penalizacion = reserva * (porcentaje / 100);
    const devolucion = reserva - penalizacion;

    $('cancelacion-fecha').textContent =
      fecha(r.fecha);

    $('cancelacion-reserva').textContent =
      money(reserva);

    $('cancelacion-porcentaje').textContent =
      `${porcentaje} %`;

    $('cancelacion-importe').textContent =
      money(penalizacion);

    $('cancelacion-devolucion').textContent =
      money(devolucion);

    const aviso = $('cancelacion-aviso');

    if (porcentaje >= 100) {

      aviso.className = 'cancel-warning danger';

      aviso.innerHTML = `
        ⚠️ <strong>Cancelación con penalización del 100 %.</strong>
        Al cancelar el mismo día del servicio,
        perderás el importe completo de la reserva.
      `;

    } else if (porcentaje > 0) {

      aviso.className = 'cancel-warning warning';

      aviso.innerHTML = `
        ⚠️ Esta cancelación tiene una penalización del
        <strong>${porcentaje} %</strong> sobre la reserva pagada.
      `;

    } else {

      aviso.className = 'cancel-warning safe';

      aviso.innerHTML = `
        ✓ En este momento no se aplica penalización.
        La reserva será reembolsada íntegramente,
        según las condiciones de cancelación.
      `;
    }

    modal.classList.remove('hidden');
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