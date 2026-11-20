// Ficha del lead: llamada, cuestionario, selección de proveedores y envío.
D.views.lead = {
  render(id) {
    const st = D.store.get(), u = D.u, l = D.store.lead(id);
    if (!l) return `<div class="panel">No existe el lead ${u.esc(id)}. <a href="#bandeja">Volver</a></div>`;
    const s = D.store.servicio(l.servicio);
    const ev = D.matching.evaluar(l, st);
    const faltan = new Set(ev.faltan);
    const cerrado = ['enviado', 'invalido'].includes(l.estado);

    const campo = (name, label, valor, opts = {}) => {
      const falta = opts.req && faltan.has(opts.reqKey || label);
      let ctrl;
      if (opts.opciones) ctrl = `<select name="${name}"><option value="">—</option>${opts.opciones.map(o => `<option ${String(o) === String(valor) ? 'selected' : ''}>${u.esc(o)}</option>`).join('')}</select>`;
      else ctrl = `<input name="${name}" type="${opts.tipo || 'text'}" value="${u.esc(valor ?? '')}">`;
      return `<label class="f ${opts.full ? 'full' : ''} ${falta ? 'falta' : ''}"><span>${u.esc(label)}${opts.req ? ' <span class="req">*</span>' : ''}</span>${ctrl}</label>`;
    };

    const preguntas = s ? s.preguntas.map(q => campo('r.' + q.id, q.label, l.respuestas[q.id], { req: q.obligatorio, reqKey: q.label, tipo: q.tipo === 'number' ? 'number' : 'text', opciones: q.tipo === 'select' ? q.opciones : null })).join('') : '<p class="full muted">Elige el servicio para ver su cuestionario.</p>';

    // Panel de llamada
    const llamada = cerrado ? `<p class="muted small">Lead ${D.ESTADOS[l.estado].label.toLowerCase()}${l.motivoInvalido ? ': ' + u.esc(l.motivoInvalido) : ''}.</p>
        ${l.estado === 'invalido' ? '<button class="btn" data-action="leadReabrir">Reabrir lead</button>' : ''}` : `
      <p style="font-size:20px;font-weight:800;margin:0 0 4px">${u.esc(l.contacto.telefono || 'Sin teléfono')}</p>
      <p class="small muted" style="margin:0 0 10px">${l.contactado ? 'Ya contactado. Completa el cuestionario.' : `Intentos sin respuesta: ${l.intentos || 0}/${D.MAX_INTENTOS}`}</p>
      <input id="notaLlamada" placeholder="Nota (si es «más tarde», indica cuándo)" style="margin-bottom:8px">
      <div class="btns">
        <button class="btn ok" data-action="leadLlamada" data-r="ok">Contactado</button>
        <button class="btn ko" data-action="leadLlamada" data-r="no_contesta">No contesta</button>
        <button class="btn warn" data-action="leadLlamada" data-r="mas_tarde">Más tarde</button>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px"><select id="motivoInv">${D.MOTIVOS_INVALIDO.map(m => `<option>${m}</option>`).join('')}</select>
        <button class="btn" data-action="leadLlamada" data-r="invalido">Inválido</button></div>
      ${st.config.whatsapp ? '<p class="small muted" style="margin:8px 0 0">Si no contesta, se envía un WhatsApp automático.</p>' : ''}`;

    // Panel de proveedores
    let proveedores = '';
    if (l.estado === 'enviado') {
      proveedores = `<h2>Enviado a ${l.envios.length} proveedor(es)</h2>
        ${l.motivoNoTriple ? `<p class="sub">No se envió al máximo: ${u.esc(l.motivoNoTriple)}</p>` : ''}
        <table><thead><tr><th>Proveedor</th><th>Canal</th><th class="r">Precio</th><th>Estado</th><th></th></tr></thead><tbody>
        ${l.envios.map(e => { const p = D.store.proveedor(e.proveedorId); return `<tr><td>${u.esc(p.nombre)}<div class="small muted">${u.fechaHora(e.fecha)} · ${e.puntos ?? '—'} pts</div></td>
          <td class="small">${{ email: 'Email', json: 'Email + JSON', webhook: 'Webhook' }[e.canal] || e.canal}</td><td class="r">${e.precio ? u.eur(e.precio) : '<span class="badge b-violeta">Prueba</span>'}</td>
          <td>${e.estado === 'enviado' ? (e.facturaId ? `<span class="badge b-verde">Facturado</span>` : '<span class="badge b-azul">Enviado</span>') : `<span class="badge b-gris" title="${u.esc(e.motivo || '')}">Invalidado</span>`}</td>
          <td><div class="btns"><button class="btn small" data-action="leadVerMensaje" data-p="${p.id}">Ver mensaje</button>
          ${e.estado === 'enviado' && !e.facturaId ? `<button class="btn small" data-action="leadInvalidaProv" data-p="${p.id}">Proveedor invalida</button>` : ''}</div></td></tr>`; }).join('')}
        </tbody></table>`;
    } else if (s) {
      const activo = l.estado === 'cualificado';
      const sel = new Set(ev.seleccion);
      proveedores = `<h2>${activo ? 'Proveedores propuestos' : 'Vista previa de proveedores'}</h2>
        <p class="sub">${activo ? `El algoritmo propone <b>${ev.n}</b>. Puedes cambiar la selección antes de enviar.` : 'Se activará cuando el lead esté cualificado. Ya puedes ver quién encajaría.'}
          Calidad del lead: <b>${u.pct(ev.calidad)}</b>. ${ev.razones.map(u.esc).join(' · ')}</p>
        <table><thead><tr><th></th><th>Proveedor</th><th class="r">Precio</th><th>Puntuación</th><th>Uso del mes</th></tr></thead><tbody>
        ${ev.candidatos.map(c => `<tr class="${c.puntos < ev.umbral ? 'cand-off' : ''}">
          <td><input type="checkbox" class="selProv" value="${c.p.id}" ${sel.has(c.p.id) ? 'checked' : ''} ${activo ? '' : 'disabled'} style="width:auto"></td>
          <td>${u.esc(c.p.nombre)} ${c.p.estado === 'prueba' ? '<span class="badge b-violeta">Prueba</span>' : ''} ${c.p.cobro === 'cuidado' ? '<span class="badge b-ambar">Aviso cobro</span>' : ''}
            <div class="desglose">${Object.entries(c.desglose).map(([k, v]) => `${D.ETIQ_PESOS[k] || k} ${v.toFixed(0)}`).join(' · ')}${c.ajustes.length ? ' · ' + c.ajustes.join(' · ') : ''}</div></td>
          <td class="r">${c.precio ? u.eur(c.precio) : 'Gratis'}</td>
          <td><span class="score"><span class="bar"><i style="width:${c.puntos}%"></i></span><b>${c.puntos}</b></span></td>
          <td class="small">${c.consumo.mes}${c.p.limMes ? '/' + c.p.limMes : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Ningún proveedor cumple los requisitos.</td></tr>'}
        </tbody></table>
        ${ev.excluidos.length ? `<details style="margin-top:8px"><summary class="small">Descartados (${ev.excluidos.length})</summary>
          <table><tbody>${ev.excluidos.map(x => `<tr><td>${u.esc(x.p.nombre)}</td><td class="small muted">${u.esc(x.motivo)}</td></tr>`).join('')}</tbody></table></details>` : ''}
        ${activo ? `<div class="btns" style="margin-top:12px"><button class="btn pri" data-action="leadEnviar">Enviar a los seleccionados</button>
          <button class="btn" data-action="leadLlamada" data-r="invalido" data-motivo="Sin proveedor disponible">Sin proveedor: invalidar</button></div>` : ''}`;
    }

    return `
      <div class="head"><div>
        <div class="small muted"><a href="#bandeja">← Bandeja</a> · ${l.id} · entrada ${u.fechaHora(l.creado)} (${u.hace(l.creado)})</div>
        <h1>${u.esc(l.contacto.nombre)} ${u.esc(l.contacto.apellidos)} ${D.ui.badgeEstado(l.estado)}</h1>
        <p>${D.ui.fuente(l.fuente)} ${u.esc(l.campana)} · ${s ? u.esc(s.nombre) : 'Servicio sin identificar'} · Responsable: ${u.esc(l.responsable || '—')}</p></div></div>
      ${(l.avisos || []).length && !cerrado ? `<div class="alert warn">${l.avisos.map(u.esc).join('<br>')}</div>` : ''}
      ${l.duplicadoDe ? `<div class="alert info">Posible duplicado de <a href="#lead-${l.duplicadoDe}">${l.duplicadoDe}</a>.</div>` : ''}
      <div class="lead-grid">
        <div>
          <div class="panel"><h2>Llamada</h2>${llamada}</div>
          ${l.mensajes.length ? `<div class="panel"><h2>WhatsApp</h2>${l.mensajes.map(m => `<div class="wa">${u.esc(m.texto)}<span class="t">${u.fechaHora(m.fecha)} · plantilla ${u.esc(m.plantilla)}</span></div>`).join('')}</div>` : ''}
          <div class="panel"><h2>Historial</h2><ul class="timeline">${l.historial.slice().reverse().map(h => `<li><span class="t">${u.fechaHora(h.fecha)}${h.usuario ? ' · ' + u.esc(h.usuario) : ''}</span>${u.esc(h.texto)}</li>`).join('')}</ul></div>
        </div>
        <div>
          <div class="panel"><h2>Datos y cuestionario</h2>
            ${!cerrado && ev.faltan.length ? `<p class="sub">Faltan: ${ev.faltan.map(u.esc).join(', ')}.${!l.contactado ? ' Registra la llamada como «Contactado» para poder cualificar.' : ''}</p>` : ''}
            ${!cerrado && !ev.faltan.length && !l.contactado ? `<p class="sub">Datos completos. Registra la llamada como «Contactado» para cualificar.</p>` : ''}
            <form id="fLead"><fieldset class="form" style="border:0;padding:0;margin:0;min-width:0" ${cerrado ? 'disabled' : ''}>
              <div class="sep">Contacto</div>
              ${campo('c.nombre', 'Nombre', l.contacto.nombre)}${campo('c.apellidos', 'Apellidos', l.contacto.apellidos)}
              ${campo('c.telefono', 'Teléfono', l.contacto.telefono, { req: true, reqKey: 'Teléfono válido' })}${campo('c.email', 'Email', l.contacto.email)}
              <div class="sep">Empresa</div>
              ${campo('e.nombre', 'Empresa', l.empresa.nombre)}${campo('e.tipoCliente', 'Tipo de cliente', l.empresa.tipoCliente, { req: true, opciones: D.TIPOS_CLIENTE })}
              ${campo('e.provincia', 'Provincia', l.empresa.provincia, { req: true, opciones: D.PROVINCIAS })}${campo('e.poblacion', 'Población', l.empresa.poblacion)}
              <div class="sep">Servicio</div>
              <label class="f full">Servicio <select name="servicio" data-change="leadServicio"><option value="">—</option>${st.servicios.map(x => `<option value="${x.id}" ${x.id === l.servicio ? 'selected' : ''}>${u.esc(x.nombre)}</option>`).join('')}</select></label>
              ${preguntas}
              <label class="f full">Comentario<textarea name="comentario" rows="2">${u.esc(l.comentario)}</textarea></label>
            </fieldset></form>
            ${cerrado ? '' : '<div class="btns" style="margin-top:12px"><button class="btn pri" data-action="leadGuardar">Guardar datos</button></div>'}
          </div>
          ${proveedores ? `<div class="panel">${proveedores}</div>` : ''}
          <div class="panel"><details><summary><b>Datos originales recibidos</b> <span class="small muted">(${D.FUENTES[l.fuente]})</span></summary><div style="margin-top:8px">${D.ui.json(l.raw)}</div></details></div>
        </div>
      </div>`;
  }
};

D.views.lead.id = () => location.hash.replace(/^#lead-/, '');
D.views.lead.leerForm = function () {
  const f = document.getElementById('fLead');
  const d = { contacto: {}, empresa: {}, respuestas: {} };
  for (const [k, v] of new FormData(f).entries()) {
    if (k.startsWith('c.')) d.contacto[k.slice(2)] = v.trim();
    else if (k.startsWith('e.')) d.empresa[k.slice(2)] = v.trim();
    else if (k.startsWith('r.')) {
      const s = D.store.servicio(D.store.lead(this.id()).servicio);
      const q = s && s.preguntas.find(x => x.id === k.slice(2));
      d.respuestas[k.slice(2)] = q && q.tipo === 'number' && v !== '' ? Number(v) : v.trim();
    } else d[k] = v;
  }
  return d;
};

D.act.leadLlamada = el => {
  const l = D.store.lead(D.views.lead.id());
  const r = el.dataset.r;
  const extra = {};
  if (r === 'invalido') extra.motivo = el.dataset.motivo || document.getElementById('motivoInv')?.value;
  if (r === 'mas_tarde') extra.rellamar = document.getElementById('notaLlamada')?.value || 'sin hora';
  // Si hay datos escritos en el formulario, se guardan antes.
  if (r === 'ok' && document.getElementById('fLead')) { D.ops.registrarLlamada(l, r, document.getElementById('notaLlamada')?.value, extra); D.ops.guardarDatos(l, D.views.lead.leerForm()); }
  else D.ops.registrarLlamada(l, r, document.getElementById('notaLlamada')?.value, extra);
  D.views.lead.trasCualificar(l);
  D.render();
  D.ui.toast(D.RESULTADOS_LLAMADA[r] + (r === 'no_contesta' && D.store.get().config.whatsapp ? ' · WhatsApp enviado' : ''));
};
D.act.leadGuardar = () => {
  const l = D.store.lead(D.views.lead.id());
  const faltan = D.ops.guardarDatos(l, D.views.lead.leerForm());
  D.views.lead.trasCualificar(l);
  D.render();
  D.ui.toast(l.estado === 'cualificado' ? 'Lead cualificado' : l.estado === 'enviado' ? 'Lead enviado automáticamente' : faltan.length ? `Guardado. Faltan ${faltan.length} dato(s)` : 'Guardado');
};
D.act.leadServicio = () => { const l = D.store.lead(D.views.lead.id()); D.ops.guardarDatos(l, D.views.lead.leerForm()); D.render(); };
D.act.leadReabrir = () => { D.ops.reabrir(D.store.lead(D.views.lead.id())); D.render(); };
D.act.leadEnviar = () => {
  const l = D.store.lead(D.views.lead.id());
  const ids = [...document.querySelectorAll('.selProv:checked')].map(x => x.value);
  if (!ids.length) { D.ui.toast('Selecciona al menos un proveedor'); return; }
  const env = D.ops.enviar(l, ids);
  D.render();
  D.ui.toast(`Enviado a ${env.length} proveedor(es)`);
};
D.act.leadVerMensaje = el => {
  const l = D.store.lead(D.views.lead.id()), p = D.store.proveedor(el.dataset.p);
  const m = D.ops.mensajeProveedor(l, p);
  const html = m.tipo === 'email'
    ? `<p class="small muted">Para: ${D.u.esc(m.para)}<br>Asunto: <b>${D.u.esc(m.asunto)}</b></p><div class="mailbox">${D.u.esc(m.cuerpo)}</div>`
    : `<p class="small muted">${m.tipo === 'webhook' ? 'POST a' : 'Email con adjunto JSON a'} ${D.u.esc(m.para)}</p>${D.ui.json(m.json)}`;
  D.ui.modal('Mensaje a ' + D.u.esc(p.nombre), html);
};
D.act.leadInvalidaProv = el => {
  const p = D.store.proveedor(el.dataset.p);
  D.ui.modal('Invalidación de ' + D.u.esc(p.nombre), `<p>El proveedor indica que el lead no es válido. No se le facturará.</p>
    <select id="motivoProv">${['Teléfono no existe', 'Datos falsos', 'El cliente no pidió presupuesto', 'Fuera de su zona', 'Otro'].map(m => `<option>${m}</option>`).join('')}</select>
    <div class="btns" style="margin-top:12px"><button class="btn pri" data-action="leadInvalidaProvOk" data-p="${p.id}">Confirmar invalidación</button></div>`);
};
D.act.leadInvalidaProvOk = el => {
  const l = D.store.lead(D.views.lead.id());
  D.ops.invalidarEnvio(l, el.dataset.p, document.getElementById('motivoProv').value);
  D.ui.cerrarModal();
  D.render();
};
// Modo automático: al cualificar, se envía directamente la selección propuesta.
D.views.lead.trasCualificar = function (l) {
  const st = D.store.get();
  if (!st.config.modoAuto || l.estado !== 'cualificado') return;
  const ev = D.matching.evaluar(l, st);
  if (ev.seleccion.length) { D.ops.enviar(l, ev.seleccion); l.historial.push({ fecha: new Date().toISOString(), texto: 'Envío automático (modo automático activado)' }); D.store.guardar(); }
};
