// Ficha del lead: llamar → cualificar → enviar.
D.views.lead = {
  render(id) {
    const st = D.store.get(), u = D.u, l = D.store.lead(id);
    if (!l) return `<div class="card empty">Lead no encontrado · <a href="#bandeja">Volver</a></div>`;
    const s = D.store.servicio(l.servicio);
    const contactado = l.contactado || l.llamadas.some(c => c.resultado === 'ok');
    const abierto = !['enviado', 'invalido'].includes(l.estado);
    const ev = D.matching.evaluar(l, st);
    const faltan = new Set(ev.faltan);
    const paso = l.estado === 'enviado' ? 3 : l.estado === 'cualificado' ? 2 : contactado ? 1 : 0;

    // Campo de formulario
    const campo = (name, label, valor, o = {}) => {
      const miss = o.req && faltan.has(o.key || label);
      const ctrl = o.opciones
        ? `<select name="${name}"><option value=""></option>${o.opciones.map(x => `<option ${String(x) === String(valor ?? '') ? 'selected' : ''}>${u.esc(x)}</option>`).join('')}</select>`
        : `<input name="${name}" type="${o.tipo || 'text'}" value="${u.esc(valor ?? '')}">`;
      return `<label class="field ${o.full ? 'full' : ''} ${miss ? 'missing' : ''}"><span class="${o.req ? 'req' : ''}">${u.esc(label)}</span>${ctrl}</label>`;
    };

    // Bloque: llamada
    const llamada = abierto && !contactado ? `
      <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h2 style="margin:0">Llamada</h2>
        ${l.intentos ? `<span class="sub">Intentos <span class="dots">${[1, 2, 3].map(i => `<i class="${i <= l.intentos ? 'on' : ''}"></i>`).join('')}</span></span>` : ''}</div>
        <div class="call-btns">
          <button class="btn yes" data-action="leadLlamada" data-r="ok"><i>✓</i>Contesta</button>
          <button class="btn no" data-action="leadLlamada" data-r="no_contesta"><i>✕</i>No contesta</button>
          <button class="btn later" data-action="leadLlamada" data-r="mas_tarde"><i>◷</i>Más tarde</button>
        </div>
        <input id="notaLlamada" placeholder="Nota (opcional)" style="margin-top:12px">
        ${D.views.lead.descartar()}
      </div>` : '';

    // Bloque: cualificación
    const preguntas = s ? s.preguntas.map(q => campo('r.' + q.id, q.label, l.respuestas[q.id], { req: q.obligatorio, tipo: q.tipo === 'number' ? 'number' : 'text', opciones: q.tipo === 'select' ? q.opciones : null })).join('') : '';
    const cualif = contactado || !abierto ? `
      <div class="card"><h2>Cualificación</h2>
        <form id="fLead" onsubmit="return false"><fieldset class="form" ${abierto ? '' : 'disabled'}>
          ${campo('e.tipoCliente', 'Tipo de cliente', l.empresa.tipoCliente, { req: true, opciones: D.TIPOS_CLIENTE })}
          ${campo('e.nombre', 'Empresa', l.empresa.nombre)}
          ${campo('e.provincia', 'Provincia', l.empresa.provincia, { req: true, opciones: D.PROVINCIAS })}
          ${campo('e.poblacion', 'Población', l.empresa.poblacion)}
          <label class="field full"><span class="req">Servicio</span><select name="servicio" data-change="leadServicio">${st.servicios.map(x => `<option value="${x.id}" ${x.id === l.servicio ? 'selected' : ''}>${u.esc(x.nombre)}</option>`).join('')}</select></label>
          ${preguntas}
          <label class="field full"><span>Notas para el proveedor</span><textarea name="comentario" rows="2">${u.esc(l.comentario)}</textarea></label>
          <div class="group">Contacto</div>
          ${campo('c.nombre', 'Nombre', l.contacto.nombre)}${campo('c.apellidos', 'Apellidos', l.contacto.apellidos)}
          ${campo('c.telefono', 'Teléfono', l.contacto.telefono, { req: true, key: 'Teléfono válido' })}${campo('c.email', 'Email', l.contacto.email)}
        </fieldset></form>
        ${abierto && l.estado !== 'cualificado' ? `<div class="row" style="justify-content:space-between;margin-top:16px">
          <span class="sub">${ev.faltan.length ? `Faltan ${ev.faltan.length}` : ''}</span>
          <div class="row">${D.views.lead.descartar(true)}<button class="btn primary" data-action="leadGuardar">Cualificar</button></div></div>` : ''}
        ${l.estado === 'cualificado' ? `<div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-action="leadGuardar">Guardar cambios</button></div>` : ''}
      </div>` : '';

    // Bloque: proveedores propuestos
    let provs = '';
    if (l.estado === 'cualificado') {
      const sel = new Set(ev.seleccion);
      provs = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h2 style="margin:0">Proveedores</h2>
          <span class="sub">${ev.n} de ${ev.servicio.maxProveedores}${ev.motivoNoTriple ? ' · ' + u.esc(ev.motivoNoTriple.toLowerCase()) : ''}</span></div>
        ${ev.candidatos.map(c => `<div class="prov ${c.puntos < ev.umbral ? 'off' : ''}">
          <input type="checkbox" class="selProv" value="${c.p.id}" ${sel.has(c.p.id) ? 'checked' : ''}>
          <div><div class="name">${u.esc(c.p.nombre)} ${c.p.estado === 'prueba' ? '<span class="pill p-violet">Prueba</span>' : ''}${c.p.cobro === 'cuidado' ? ' <span class="pill p-amber">Cobro</span>' : ''}</div>
            <div class="sub">${c.consumo.mes}${c.p.limMes ? '/' + c.p.limMes : ''} este mes</div></div>
          <div class="name">${c.precio ? c.precio + ' €' : 'Gratis'}</div>
          <div title="${Object.entries(c.desglose).map(([k, v]) => `${D.ETIQ_PESOS[k]} ${v.toFixed(0)}`).join(' · ')}${c.ajustes.length ? ' · ' + c.ajustes.join(' · ') : ''}">
            <div class="meter"><i style="width:${c.puntos}%"></i></div><div class="sub" style="text-align:right">${c.puntos}</div></div>
        </div>`).join('') || '<div class="empty">Ningún proveedor disponible</div>'}
        ${ev.excluidos.length ? `<details style="margin-top:6px"><summary>${ev.excluidos.length} no encajan</summary>
          ${ev.excluidos.map(x => `<div class="row sub" style="justify-content:space-between;padding:4px 0"><span>${u.esc(x.p.nombre)}</span><span>${u.esc(x.motivo)}</span></div>`).join('')}</details>` : ''}
        <div class="row" style="justify-content:flex-end;margin-top:16px">
          ${ev.candidatos.length ? `<button class="btn cta big" data-action="leadEnviar">Enviar</button>` : `<button class="btn" data-action="leadLlamada" data-r="invalido" data-motivo="Sin proveedor disponible">Descartar: sin proveedor</button>`}</div>
      </div>`;
    } else if (l.estado === 'enviado') {
      provs = `<div class="card"><h2>Enviado</h2>
        ${l.envios.map(e => { const p = D.store.proveedor(e.proveedorId); return `<div class="prov" style="grid-template-columns:1fr auto auto">
          <div><div class="name">${u.esc(p.nombre)}</div><div class="sub">${u.fechaHora(e.fecha)} · ${{ email: 'email', json: 'email + JSON', webhook: 'webhook' }[e.canal]}</div></div>
          <div>${e.estado !== 'enviado' ? '<span class="pill p-grey">Invalidado</span>' : e.facturaId ? '<span class="pill p-green">Facturado</span>' : `<span class="name">${e.precio ? e.precio + ' €' : 'Gratis'}</span>`}</div>
          <div class="row"><button class="btn ghost" data-action="leadVerMensaje" data-p="${p.id}">Ver</button>
            ${e.estado === 'enviado' && !e.facturaId ? `<button class="btn ghost" data-action="leadInvalidaProv" data-p="${p.id}">Invalidar</button>` : ''}</div>
        </div>`; }).join('')}</div>`;
    }

    // Lateral: actividad
    const actividad = `<div class="card"><h2>Actividad</h2>
      ${l.mensajes.map(m => `<div class="wa">${u.esc(m.texto)}<span class="t">WhatsApp · ${u.fechaHora(m.fecha)}</span></div>`).join('')}
      <ul class="feed">${l.historial.slice().reverse().filter(h => !h.texto.startsWith('Aviso')).slice(0, 12).map(h => `<li>${u.esc(h.texto)}<span class="t">${u.fechaHora(h.fecha)}${h.usuario ? ' · ' + u.esc(h.usuario) : ''}</span></li>`).join('')}</ul></div>`;

    return `
      <div style="margin-bottom:14px"><a href="#bandeja" class="sub">← Leads</a></div>
      <div class="card">
        <div class="lead-head">
          <div class="avatar">${D.ui.iniciales(l)}</div>
          <div style="flex:1;min-width:0">
            <div class="row" style="justify-content:space-between"><h1>${u.esc(l.contacto.nombre)} ${u.esc(l.contacto.apellidos)}</h1>${D.ui.badgeEstado(l.estado)}</div>
            <div class="row sub" style="margin-top:2px">${u.esc(s?.nombre || 'Servicio sin identificar')}${l.empresa.provincia ? ' · ' + u.esc(l.empresa.provincia) : ''} · ${D.ui.fuente(l.fuente)} · ${u.hace(l.creado)}</div>
          </div>
          <div style="text-align:right"><div class="phone">${u.esc(l.contacto.telefono || '—')}</div><div class="sub">${u.esc(l.contacto.email)}</div></div>
        </div>
        <div class="steps" style="margin-bottom:0">${[1, 2, 3].map(i => `<div class="${i <= paso ? 'done' : ''}"></div>`).join('')}</div>
      </div>
      ${(l.avisos || []).length && abierto ? `<div class="row" style="margin-bottom:14px">${l.avisos.map(a => `<span class="pill p-amber">${u.esc(a)}</span>`).join('')}</div>` : ''}
      <div class="lead-grid">
        <div>
          ${l.comentario && !contactado ? `<div class="note-client">“${u.esc(l.comentario)}”</div>` : ''}
          ${l.estado === 'invalido' ? `<div class="card row" style="justify-content:space-between"><span>Descartado · ${u.esc(l.motivoInvalido)}</span><button class="btn" data-action="leadReabrir">Reabrir</button></div>` : ''}
          ${llamada}${provs}${abierto ? cualif : `<div class="card"><details><summary>Datos del cliente</summary>${cualif.replace('<div class="card"><h2>Cualificación</h2>', '<div style="margin-top:14px">')}</details></div>`}
        </div>
        <div>${actividad}</div>
      </div>`;
  },
  descartar(compacto) {
    return `<details ${compacto ? 'style="display:inline-block"' : 'style="margin-top:12px"'}><summary>Descartar</summary>
      <div class="row" style="margin-top:8px"><select id="motivoInv" style="width:auto">${D.MOTIVOS_INVALIDO.map(m => `<option>${m}</option>`).join('')}</select>
      <button class="btn" data-action="leadLlamada" data-r="invalido">Descartar</button></div></details>`;
  }
};

D.views.lead.id = () => location.hash.replace(/^#lead-/, '');
D.views.lead.leerForm = function () {
  const f = document.getElementById('fLead');
  const d = { contacto: {}, empresa: {}, respuestas: {} };
  if (!f) return d;
  const s = D.store.servicio(D.store.lead(this.id()).servicio);
  for (const [k, v] of new FormData(f).entries()) {
    if (k.startsWith('c.')) d.contacto[k.slice(2)] = v.trim();
    else if (k.startsWith('e.')) d.empresa[k.slice(2)] = v.trim();
    else if (k.startsWith('r.')) {
      const q = s && s.preguntas.find(x => x.id === k.slice(2));
      d.respuestas[k.slice(2)] = q && q.tipo === 'number' && v !== '' ? Number(v) : v.trim();
    } else d[k] = v;
  }
  return d;
};

D.act.leadLlamada = el => {
  const l = D.store.lead(D.views.lead.id());
  const r = el.dataset.r;
  const nota = document.getElementById('notaLlamada')?.value || '';
  const extra = {};
  if (r === 'invalido') extra.motivo = el.dataset.motivo || document.getElementById('motivoInv')?.value;
  if (r === 'mas_tarde') extra.rellamar = nota;
  D.ops.registrarLlamada(l, r, nota, extra);
  D.render();
  if (r === 'no_contesta') D.ui.toast(l.estado === 'invalido' ? 'Cerrado tras 3 intentos' : D.store.get().config.whatsapp ? 'WhatsApp enviado' : 'Anotado');
};
D.act.leadGuardar = () => {
  const l = D.store.lead(D.views.lead.id());
  const faltan = D.ops.guardarDatos(l, D.views.lead.leerForm());
  D.views.lead.trasCualificar(l);
  D.render();
  D.ui.toast(l.estado === 'enviado' ? 'Enviado automáticamente' : l.estado === 'cualificado' ? 'Cualificado' : `Faltan ${faltan.length} datos`);
};
D.act.leadServicio = () => { const l = D.store.lead(D.views.lead.id()); D.ops.guardarDatos(l, D.views.lead.leerForm()); D.render(); };
D.act.leadReabrir = () => { D.ops.reabrir(D.store.lead(D.views.lead.id())); D.render(); };
D.act.leadEnviar = () => {
  const l = D.store.lead(D.views.lead.id());
  const ids = [...document.querySelectorAll('.selProv:checked')].map(x => x.value);
  if (!ids.length) { D.ui.toast('Selecciona al menos un proveedor'); return; }
  const env = D.ops.enviar(l, ids);
  D.render();
  D.ui.toast(`Enviado a ${env.length}`);
};
D.act.leadVerMensaje = el => {
  const l = D.store.lead(D.views.lead.id()), p = D.store.proveedor(el.dataset.p);
  const m = D.ops.mensajeProveedor(l, p);
  D.ui.modal(D.u.esc(p.nombre), m.tipo === 'email'
    ? `<p class="sub">${D.u.esc(m.para)}</p><p><b>${D.u.esc(m.asunto)}</b></p><div class="mail">${D.u.esc(m.cuerpo)}</div>`
    : `<p class="sub">${m.tipo === 'webhook' ? 'Webhook' : 'Email + JSON'} · ${D.u.esc(m.para)}</p>${D.ui.json(m.json)}`);
};
D.act.leadInvalidaProv = el => {
  const p = D.store.proveedor(el.dataset.p);
  D.ui.modal('Invalidar envío', `<p class="sub">${D.u.esc(p.nombre)} · no se le facturará</p>
    <select id="motivoProv">${['Teléfono no existe', 'Datos falsos', 'No pidió presupuesto', 'Fuera de su zona', 'Otro'].map(m => `<option>${m}</option>`).join('')}</select>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" data-action="leadInvalidaProvOk" data-p="${p.id}">Invalidar</button></div>`);
};
D.act.leadInvalidaProvOk = el => {
  D.ops.invalidarEnvio(D.store.lead(D.views.lead.id()), el.dataset.p, document.getElementById('motivoProv').value);
  D.ui.cerrarModal();
  D.render();
};
// Modo automático: al cualificar se envía directamente la selección propuesta.
D.views.lead.trasCualificar = function (l) {
  const st = D.store.get();
  if (!st.config.modoAuto || l.estado !== 'cualificado') return;
  const ev = D.matching.evaluar(l, st);
  if (ev.seleccion.length) { D.ops.enviar(l, ev.seleccion); l.historial.push({ fecha: new Date().toISOString(), texto: 'Envío automático' }); D.store.guardar(); }
};
