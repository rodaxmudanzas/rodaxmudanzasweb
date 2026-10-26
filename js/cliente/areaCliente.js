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

  // mudanzas.urls_fotos es text: URLs separadas por comas (formato histórico).
  // También se aceptan arrays, JSON en texto y "|".
  function normalizarFotos(valor) {
    let lista = [];

    if (Array.isArray(valor)) {
      lista = valor;
    } else if (typeof valor === 'string') {
      const texto = valor.trim();
      if (texto.startsWith('[')) {
        try {
          const parsed = JSON.parse(texto);
          lista = Array.isArray(parsed) ? parsed : [];
        } catch (_) {
          lista = texto.split(/,|\s*\|\s*/);
        }
      } else {
        lista = texto.split(/,|\s*\|\s*/);
      }
    }

    const vistas = new Set();
    return lista
      .filter(url => typeof url === 'string')
      .map(url => url.trim())
      .filter(url => url && !vistas.has(url) && vistas.add(url));
  }

  async function llamarApiFotografias(payload) {
    const { data: { session } } = await db.auth.getSession();

    if (!session) {
      throw new Error("Tu sesión ha caducado. Vuelve a entrar.");
    }

    const response = await fetch("/api/cliente-fotografias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo gestionar la fotografía.");
    }

    return data;
  }

  // ===== INICIO BLOQUE 7 · INDICACIONES PARA EL TRANSPORTISTA =====
  // Se guardan en mudanzas.observaciones: la misma columna que rellena la Home
  // y que lee el Panel Transportista. Editable hasta las 00:00 (Europe/Madrid)
  // del día del servicio. La validación definitiva se hace en
  // /api/cliente-indicaciones.
  const INDICACIONES_MAX = 500;

  const INDICACIONES_EJEMPLOS = [
    'Ejemplos:',
    '',
    '• Calles muy estrechas en origen o destino',
    '• Horario restringido en origen o destino',
    '• Difícil aparcar o se necesita permiso del Ayuntamiento',
    '• Escalera de caracol',
    '• Urbanización privada',
    '• Ascensor pequeño',
    '• Objetos muy delicados',
    '• Hay mascotas',
    '• El portero debe abrir la puerta',
    '• Necesito algún requerimiento especial, etc.'
  ].join('\n');

  let indicacionesUI = { id: null, editando: false, borrador: '' };

  // 'editable' | 'plazo' (ya es el día del servicio o posterior) | 'cerrada'
  function indicacionesEstadoEdicion(r) {
    const estado = String(r.estado || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (/cancel|completad|finaliz|realizad/.test(estado)) return 'cerrada';

    const dias = diasHastaServicioMadrid(String(r.fecha || '').slice(0, 10));

    return dias !== null && dias > 0 ? 'editable' : 'plazo';
  }

  function renderIndicaciones(r) {
    if (indicacionesUI.id !== r.id) {
      indicacionesUI = { id: r.id, editando: false, borrador: '' };
    }

    const modo = indicacionesEstadoEdicion(r);
    const texto = String(r.observaciones || '').trim();
    const editando = indicacionesUI.editando && modo === 'editable';

    let cuerpo;

    if (editando) {
      cuerpo = `
        <textarea
          id="indicaciones-texto"
          maxlength="${INDICACIONES_MAX}"
          rows="6"
          placeholder="${escapeHtml(INDICACIONES_EJEMPLOS)}">${escapeHtml(indicacionesUI.borrador)}</textarea>

        <div class="indic-counter">
          <span id="indicaciones-contador">${indicacionesUI.borrador.length}</span>
          / ${INDICACIONES_MAX} caracteres
        </div>

        <div class="indic-actions">
          <button type="button" class="indic-btn primary" id="btn-indicaciones-guardar">
            Guardar indicaciones
          </button>
          <button type="button" class="indic-btn secondary" id="btn-indicaciones-cancelar">
            Cancelar
          </button>
        </div>`;
    } else if (texto) {
      cuerpo = `<div class="indic-text">${escapeHtml(texto)}</div>`;
    } else {
      cuerpo = `<p class="indic-empty">Todavía no has añadido indicaciones para el transportista.</p>`;
    }

    const pista =
      modo === 'editable'
        ? 'Puedes modificarlas hasta las 00:00 del día del servicio.'
        : modo === 'plazo'
          ? 'El plazo para modificarlas terminó a las 00:00 del día del servicio.'
          : '';

    const boton =
      modo === 'editable' && !editando
        ? `<button type="button" class="indic-edit-button" id="btn-indicaciones-editar">
             ${texto ? '✏️ Editar' : '+ Añadir'}
           </button>`
        : '';

    return `
      <div class="section-card indicaciones-card" id="indicaciones-card">
        <div class="section-title">
          <h3>📝 Indicaciones para el transportista</h3>
          ${boton}
        </div>

        ${pista ? `<p class="indic-hint">${pista}</p>` : ''}

        ${cuerpo}

        <div id="indicaciones-mensaje" class="photos-message" role="status"></div>
      </div>`;
  }

  function repintarIndicaciones() {
    const card = $('indicaciones-card');
    const r = reservaActual;

    if (!card || !r) return;

    card.outerHTML = renderIndicaciones(r);
    bindIndicaciones();
  }

  function bindIndicaciones() {
    const editar = $('btn-indicaciones-editar');

    if (editar) {
      editar.onclick = () => {
        indicacionesUI.editando = true;
        indicacionesUI.borrador = String(
          (reservaActual && reservaActual.observaciones) || ''
        ).trim();
        repintarIndicaciones();

        const area = $('indicaciones-texto');
        if (area) area.focus();
      };
    }

    const area = $('indicaciones-texto');

    if (area) {
      area.addEventListener('input', () => {
        indicacionesUI.borrador = area.value;

        const contador = $('indicaciones-contador');
        if (contador) contador.textContent = String(area.value.length);
      });
    }

    const cancelar = $('btn-indicaciones-cancelar');

    if (cancelar) {
      cancelar.onclick = () => {
        indicacionesUI.editando = false;
        indicacionesUI.borrador = '';
        repintarIndicaciones();
      };
    }

    const guardar = $('btn-indicaciones-guardar');
    if (guardar) guardar.onclick = guardarIndicaciones;
  }

  async function llamarApiIndicaciones(payload) {
    const { data: { session } } = await db.auth.getSession();

    if (!session) {
      throw new Error('Tu sesión ha caducado. Vuelve a entrar.');
    }

    const response = await fetch('/api/cliente-indicaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'No se pudieron guardar las indicaciones.');
    }

    return data;
  }

  async function guardarIndicaciones() {
    const r = reservaActual;
    const area = $('indicaciones-texto');
    const boton = $('btn-indicaciones-guardar');
    const mensaje = $('indicaciones-mensaje');

    if (!r || !area) return;

    const texto = area.value.replace(/\r\n?/g, '\n').trim();

    if (texto.length > INDICACIONES_MAX) {
      if (mensaje) {
        mensaje.textContent =
          `Las indicaciones no pueden superar los ${INDICACIONES_MAX} caracteres.`;
      }
      return;
    }

    if (boton) boton.disabled = true;
    if (mensaje) mensaje.textContent = 'Guardando…';

    try {
      const respuesta = await llamarApiIndicaciones({
        mudanza_id: r.id,
        observaciones: texto
      });

      r.observaciones = respuesta.observaciones;
      indicacionesUI = { id: r.id, editando: false, borrador: '' };
      repintarIndicaciones();

      const confirmacion = $('indicaciones-mensaje');
      if (confirmacion) confirmacion.textContent = 'Indicaciones guardadas.';
    } catch (error) {
      console.error('Error al guardar indicaciones:', error);

      if (boton) boton.disabled = false;
      if (mensaje) {
        mensaje.textContent =
          error.message || 'No se pudieron guardar las indicaciones.';
      }
    }
  }
  // ===== FIN BLOQUE 7 · INDICACIONES PARA EL TRANSPORTISTA =====

  function renderFotografias(r) {
    const fotos = normalizarFotos(r.urls_fotos);

    return `
      <div class="section-card photos-card">
        <div class="section-title">
          <h3>Fotografías de tu mudanza</h3>
          <label class="photos-add-button" for="cliente-fotos-input">
            + Añadir fotos
          </label>
        </div>

        <p>JPG, PNG o WEBP. Máximo 10 MB por fotografía.</p>

        <input
          id="cliente-fotos-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
        >

        <div id="cliente-fotos-mensaje" class="photos-message" role="status"></div>

        <div class="photos-grid">
          ${fotos.length
            ? fotos.map((foto, index) => `
                <div class="photo-item">
                  <a href="${escapeHtml(foto)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(foto)}" alt="Fotografía ${index + 1}" loading="lazy">
                  </a>
                  <div class="photo-actions">
                    <button type="button" class="photo-replace" data-photo-index="${index}">Sustituir</button>
                    <input type="file" class="photo-replace-input" data-photo-index="${index}" accept="image/jpeg,image/png,image/webp" hidden>
                    <button type="button" class="photo-delete" data-photo-index="${index}">Eliminar</button>
                  </div>
                </div>
              `).join("")
            : `<p class="photos-empty">Todavía no hay fotografías en esta mudanza.</p>`
          }
        </div>
      </div>
    `;
  }

  async function subirFotografias(files) {
    const r = reservaActual;
    if (!r || !files.length) return;

    const input = $("cliente-fotos-input");
    const mensaje = $("cliente-fotos-mensaje");
    const addButton = document.querySelector(".photos-add-button");

    if (addButton) addButton.classList.add("disabled");
    if (input) input.disabled = true;

    try {
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Solo se permiten imágenes JPG, PNG o WEBP.");
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`La imagen "${file.name}" supera los 10 MB.`);
        }

        mensaje.textContent = `Subiendo ${file.name}…`;

        const preparada = await llamarApiFotografias({
          accion: "preparar",
          mudanza_id: r.id,
          nombre: file.name,
          tipo: file.type
        });

        const { error: uploadError } = await db.storage
          .from("documentos")
          .uploadToSignedUrl(
            preparada.path,
            preparada.token,
            file,
            { contentType: file.type, upsert: false }
          );

        if (uploadError) throw uploadError;

        const registrada = await llamarApiFotografias({
          accion: "registrar",
          mudanza_id: r.id,
          url: preparada.publicUrl
        });

        r.urls_fotos = normalizarFotos(registrada.urls_fotos);
      }

      renderLista();
      renderDetalle();
    } catch (error) {
      console.error("Error con fotografías:", error);

      // Actualizar la galería por si alguna foto anterior
      // de la selección ya se subió correctamente.
      renderLista();
      renderDetalle();

      const mensajeActual = $("cliente-fotos-mensaje");

      if (mensajeActual) {
        mensajeActual.textContent =
          error.message || "No se pudieron subir las fotografías.";
      }
    } finally {
      const inputActual = $("cliente-fotos-input");
      const addButtonActual = document.querySelector(".photos-add-button");

      if (inputActual) {
        inputActual.disabled = false;
        inputActual.value = "";
      }
      if (addButtonActual) addButtonActual.classList.remove("disabled");
    }
  }

  async function sustituirFotografia(index, file) {
    const r = reservaActual;
    if (!r || !file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Solo se permiten imágenes JPG, PNG o WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("La fotografía supera el límite de 10 MB.");
      return;
    }

    const fotos = normalizarFotos(r.urls_fotos);
    const urlAnterior = fotos[index];
    if (!urlAnterior) return;

    const mensaje = $("cliente-fotos-mensaje");
    try {
      if (mensaje) mensaje.textContent = `Subiendo ${file.name}…`;
      const preparada = await llamarApiFotografias({
        accion: "preparar", mudanza_id: r.id, nombre: file.name, tipo: file.type
      });
      const { error: uploadError } = await db.storage
        .from("documentos")
        .uploadToSignedUrl(preparada.path, preparada.token, file, {
          contentType: file.type, upsert: false
        });
      if (uploadError) throw uploadError;

      const registrada = await llamarApiFotografias({
        accion: "registrar", mudanza_id: r.id, url: preparada.publicUrl
      });
      r.urls_fotos = normalizarFotos(registrada.urls_fotos);

      // La nueva foto ya está registrada; ahora quitamos la anterior.
      const eliminada = await llamarApiFotografias({
        accion: "eliminar", mudanza_id: r.id, url: urlAnterior
      });
      r.urls_fotos = normalizarFotos(eliminada.urls_fotos);
      renderLista();
      renderDetalle();

      if (eliminada.aviso) {
        const mensajeAviso = $("cliente-fotos-mensaje");
        if (mensajeAviso) mensajeAviso.textContent = eliminada.aviso;
      }
    } catch (error) {
      console.error("Error al sustituir fotografía:", error);
      renderLista();
      renderDetalle();
      const mensajeActual = $("cliente-fotos-mensaje");
      if (mensajeActual) mensajeActual.textContent = error.message || "No se pudo sustituir la fotografía.";
    }
  }

  async function eliminarFotografia(index) {
    const r = reservaActual;
    if (!r) return;

    const fotos = normalizarFotos(r.urls_fotos);
    const url = fotos[index];

    if (!url || !confirm("¿Quieres quitar esta fotografía de la mudanza?")) {
      return;
    }

    try {
      const respuesta = await llamarApiFotografias({
        accion: "eliminar",
        mudanza_id: r.id,
        url
      });

      r.urls_fotos = normalizarFotos(respuesta.urls_fotos);
      renderLista();
      renderDetalle();

      if (respuesta.aviso) {
        const mensajeAviso = $("cliente-fotos-mensaje");
        if (mensajeAviso) mensajeAviso.textContent = respuesta.aviso;
      }
    } catch (error) {
      console.error("Error al eliminar fotografía:", error);
      alert(error.message || "No se pudo eliminar la fotografía.");
    }
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

            ${renderFotografias(r)}

      ${renderIndicaciones(r)}

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


    $('cliente-fotos-input').addEventListener('change', event => {
      subirFotografias(Array.from(event.target.files || []));
    });

    document.querySelectorAll('.photo-delete').forEach(button => {
      button.addEventListener('click', () => {
        eliminarFotografia(Number(button.dataset.photoIndex));
      });
    });

    document.querySelectorAll('.photo-replace').forEach(button => {
      button.addEventListener('click', () => {
        const input = document.querySelector(`.photo-replace-input[data-photo-index="${button.dataset.photoIndex}"]`);
        if (input) input.click();
      });
    });

    document.querySelectorAll('.photo-replace-input').forEach(input => {
      input.addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (file) sustituirFotografia(Number(event.target.dataset.photoIndex), file);
      });
    });


bindIndicaciones();

$('btn-cancelar').onclick = openCancellation;

$('btn-cerrar-cancelacion').onclick = () => {
  $('modal-cancelacion').classList.add('hidden');
};

$('btn-cerrar-cancelacion-2').onclick = () => {
  $('modal-cancelacion').classList.add('hidden');
};
  }

    // Días naturales hasta el servicio, calculados igual que en el servidor
    // (api/cliente-cancelacion.js): fecha de hoy en Europe/Madrid y diferencia
    // en días de calendario, sin depender de la zona horaria del navegador
    // ni de los cambios de hora.
    function diasHastaServicioMadrid(fechaServicio) {
      if (
        typeof fechaServicio !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaServicio)
      ) {
        return null;
      }

      const [anio, mes, dia] = fechaServicio.split('-').map(Number);
      const servicioUTC = Date.UTC(anio, mes - 1, dia);
      const comprobada = new Date(servicioUTC);

      if (
        comprobada.getUTCFullYear() !== anio ||
        comprobada.getUTCMonth() !== mes - 1 ||
        comprobada.getUTCDate() !== dia
      ) {
        return null;
      }

      const hoy = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      const [anioHoy, mesHoy, diaHoy] = hoy.split('-').map(Number);

      return Math.round(
        (servicioUTC - Date.UTC(anioHoy, mesHoy - 1, diaHoy)) / 86400000
      );
    }

    function openCancellation() {
    const r = reservaActual;

    if (!r) return;

    const modal = $('modal-cancelacion');

    if (!modal) return;

    const estadoReserva = String(r.estado || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (/cancel|completad|finaliz|realizad/.test(estadoReserva)) {
      alert('Esta mudanza ya está cancelada o finalizada.');
      return;
    }

    const reserva = Math.round(
      toNumber(
        r.importe_reserva ??
        r.precioreserva ??
        0
      ) * 100
    ) / 100;

    const diasRestantes = diasHastaServicioMadrid(r.fecha);

    if (diasRestantes === null) {
      alert(
        'No se puede calcular la penalización porque la fecha de la mudanza no es válida.'
      );
      return;
    }

    if (diasRestantes < 0) {
      alert(
        'No se puede cancelar mediante este proceso una mudanza cuya fecha ya ha pasado.'
      );
      return;
    }

    // Misma tabla que el servidor. mudanzas.fecha no guarda la hora,
    // por lo que el cálculo se hace por días naturales.
    let porcentaje = 0;

    if (diasRestantes <= 1) {
      porcentaje = 100;
    } else if (diasRestantes <= 3) {
      porcentaje = 50;
    } else if (diasRestantes <= 7) {
      porcentaje = 25;
    } else if (diasRestantes <= 14) {
      porcentaje = 10;
    }

    // Mismo redondeo que el servidor.
    const penalizacion = Math.round(reserva * porcentaje) / 100;
    const devolucion = Math.round((reserva - penalizacion) * 100) / 100;

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

    modificacionInicial = {
      origen: $('mod-origen').value.trim(),
      destino: $('mod-destino').value.trim(),
      fecha: $('mod-fecha').value,
      franja: $('mod-franja').value,
      tipo: $('mod-tipo').value
    };

    mostrarMensajeModificacion('');
    estadoBotonModificacion(false);

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

    reservas = (data.reservas || []).map(reserva => ({
      ...reserva,
      urls_fotos: normalizarFotos(reserva.urls_fotos)
    }));

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

  // ===== INICIO MODAL MODIFICACIÓN: mensajes visibles dentro del modal =====
  let modificacionInicial = null;

  function mostrarMensajeModificacion(texto, tipo) {
    const caja = $('mod-mensaje');
    if (!caja) return;

    caja.textContent = texto || '';
    caja.className = tipo ? `mod-mensaje ${tipo}` : 'mod-mensaje';
  }

  function estadoBotonModificacion(enviando) {
    const boton = $('btn-enviar-mod');
    if (!boton) return;

    boton.disabled = enviando;
    boton.textContent = enviando
      ? 'Enviando…'
      : 'Enviar solicitud a RODAX';
  }

  function hayCambiosEnModificacion() {
    if ($('mod-cambios').value.trim()) return true;
    if (!modificacionInicial) return true;

    return (
      $('mod-origen').value.trim() !== modificacionInicial.origen ||
      $('mod-destino').value.trim() !== modificacionInicial.destino ||
      $('mod-fecha').value !== modificacionInicial.fecha ||
      $('mod-franja').value !== modificacionInicial.franja ||
      $('mod-tipo').value !== modificacionInicial.tipo
    );
  }

  async function requestModification(e) {
    e.preventDefault();

    mostrarMensajeModificacion('');

    if (!hayCambiosEnModificacion()) {
      mostrarMensajeModificacion(
        'No has cambiado ningún dato. Modifica algo o cuéntanos en «Qué quieres cambiar» lo que necesitas.',
        'error'
      );
      return;
    }

    estadoBotonModificacion(true);

    try {
      const {
        data: { session }
      } = await db.auth.getSession();

      if (!session) {
        throw new Error('Tu sesión ha caducado. Vuelve a entrar.');
      }

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || 'No se pudo enviar la solicitud. Inténtalo de nuevo.'
        );
      }

      $('modal-modificacion').classList.add('hidden');

      alert(
        'Solicitud enviada. RODAX revisará los cambios y te confirmará cualquier modificación de precio antes de aplicarla.'
      );
    } catch (error) {
      console.error('Error al enviar la solicitud de modificación:', error);

      mostrarMensajeModificacion(
        error instanceof TypeError
          ? 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.'
          : error.message || 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
        'error'
      );
    } finally {
      estadoBotonModificacion(false);
    }
  }
  // ===== FIN MODAL MODIFICACIÓN =====

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


    let cancelacionEnCurso = false;

    $('btn-confirmar-cancelacion').onclick =
      confirmarCancelacion;

    // Evita solicitudes repetidas (doble clic) también durante la espera
    // de la sesión y el cuadro de confirmación, antes de deshabilitar el botón.
    async function confirmarCancelacion() {
      if (cancelacionEnCurso) return;
      cancelacionEnCurso = true;

      try {
        await ejecutarCancelacion();
      } finally {
        cancelacionEnCurso = false;
      }
    }

    async function ejecutarCancelacion() {
      const r = reservaActual;

      if (!r || !r.id) {
        alert('No se ha podido identificar la reserva.');
        return;
      }

      const {
        data: { session },
        error: errorSesion
      } = await db.auth.getSession();

      if (errorSesion || !session) {
        alert('Tu sesión ha caducado. Vuelve a acceder a tu Área Cliente.');
        return;
      }

      const boton = $('btn-confirmar-cancelacion');
      const textoOriginal = boton.textContent;

      const confirmar = window.confirm(
        '¿Confirmas la cancelación de la reserva ' +
        (r.numero_reserva || '') +
        '?\n\nSe aplicará la penalización mostrada en pantalla.'
      );

      if (!confirmar) return;

      boton.disabled = true;
      boton.textContent = 'Procesando cancelación…';

      try {
        const res = await fetch('/api/cliente-cancelacion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            mudanza_id: Number(r.id)
          })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(
            data.error ||
            'No se ha podido completar la cancelación. Revisa el estado de tu reserva antes de volver a intentarlo.'
          );
          return;
        }

        $('modal-cancelacion').classList.add('hidden');

        alert(
          data.mensaje ||
          'La cancelación se ha procesado correctamente.'
        );

        await loadReservas();

      } catch (error) {
        console.error(
          'Error al solicitar la cancelación:',
          error
        );

        alert(
          'No se ha podido confirmar el resultado de la operación. Comprueba el estado de la reserva antes de volver a intentarlo.'
        );

      } finally {
        boton.disabled = false;
        boton.textContent = textoOriginal;
      }
    }


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
