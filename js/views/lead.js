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
      const auto = (l.autoCampos || []).includes(name) && abierto;
      return `<label class="field ${o.full ? 'full' : ''} ${miss ? 'missing' : ''} ${auto ? 'auto' : ''}"><span class="${o.req ? 'req' : ''}">${u.esc(label)}</span>${ctrl}</label>`;
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
      <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h2 style="margin:0">Cualificación</h2>
        ${s && abierto && l.estado !== 'cualificado' ? `<button class="btn" data-action="leadTranscribir">🎙 ${l.transcripcion ? 'Volver a transcribir' : 'Transcribir llamada'}</button>` : ''}</div>
        ${l.transcripcion ? `<details class="transcript" ${abierto && l.estado !== 'cualificado' ? 'open' : ''}><summary>Transcripción de la llamada</summary>
          <div class="tx">${l.transcripcion.map(([q, t]) => `<p><b>${q}:</b> ${u.esc(t)}</p>`).join('')}</div></details>` : ''}
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

    // Bloque: proveedores (propuesta editable, o envío ya hecho)
    let provs = '';
    const editando = D.views.lead.editando === l.id;
    if (l.estado === 'cualificado' || (l.estado === 'enviado' && editando)) {
      provs = D.views.lead.seleccion(l, ev, editando);
    } else if (l.estado === 'enviado') {
      const activos = l.envios.filter(e => e.estado !== 'anulado');
      provs = `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h2 style="margin:0">Enviado</h2>
          <button class="btn ghost" data-action="leadEditarEnvio">Editar</button></div>
        ${activos.map(e => { const p = D.store.proveedor(e.proveedorId); return `<div class="prov" style="grid-template-columns:1fr auto auto">
          <div><div class="name">${u.esc(p.nombre)}</div><div class="sub">${u.fechaHora(e.fecha)} · ${{ email: 'email', json: 'email + JSON', webhook: 'webhook' }[e.canal]}${e.aviso ? ` · <span style="color:var(--amber)">⚠ ${u.esc(e.aviso)}</span>` : ''}</div></div>
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

// Lista editable de proveedores: propuesta del algoritmo + cualquier otro, con avisos.
D.views.lead.seleccion = function (l, ev, editando) {
  const u = D.u, st = D.store.get();
  const activos = new Set(l.envios.filter(e => e.estado === 'enviado').map(e => e.proveedorId));
  const facturados = new Set(l.envios.filter(e => e.estado === 'enviado' && e.facturaId).map(e => e.proveedorId));
  const marcados = editando ? activos : new Set(ev.seleccion);
  // Los ya enviados siempre aparecen, aunque no ofrezcan el servicio.
  const extra = [...new Set([...(D.views.lead.extra[l.id] || []), ...activos])];
  // Orden: candidatos, descartados que ofrecen el servicio, añadidos a mano.
  const filas = [
    ...ev.candidatos.map(c => ({ p: c.p, precio: c.precio, puntos: c.puntos, consumo: c.consumo })),
    ...ev.excluidos.map(x => ({ p: x.p, precio: x.cfg.cpl, puntos: null })),
    ...extra.filter(id => !ev.candidatos.some(c => c.p.id === id) && !ev.excluidos.some(x => x.p.id === id)).map(id => ({ p: D.store.proveedor(id), precio: ev.servicio.cplRef, puntos: null }))
  ];
  const visibles = filas.filter(f => f.puntos !== null || marcados.has(f.p.id) || extra.includes(f.p.id) || D.views.lead.verTodos);
  const ocultos = filas.length - visibles.length;
  const enLista = new Set(filas.map(f => f.p.id));
  const otros = st.proveedores.filter(p => !enLista.has(p.id));
  const fila = f => {
    const aviso = D.ops.avisoProveedor(ev, f.p.id);
    const bloq = facturados.has(f.p.id);
    return `<div class="prov ${aviso ? 'warn' : ''}">
      <input type="checkbox" class="selProv" value="${f.p.id}" data-aviso="${u.esc(aviso)}" ${marcados.has(f.p.id) ? 'checked' : ''} ${bloq ? 'disabled' : ''} data-change="leadSel">
      <div><div class="name">${u.esc(f.p.nombre)} ${f.p.estado === 'prueba' ? '<span class="pill p-violet">Prueba</span>' : ''}${bloq ? ' <span class="pill p-green">Facturado</span>' : ''}</div>
        <div class="sub">${aviso ? `<span style="color:var(--amber)">⚠ ${u.esc(aviso)}</span>` : `${f.consumo.mes}${f.p.limMes ? '/' + f.p.limMes : ''} este mes`}</div></div>
      <div class="name">${f.p.estado === 'prueba' ? 'Gratis' : f.precio + ' €'}</div>
      <div>${f.puntos !== null ? `<div class="meter"><i style="width:${f.puntos}%"></i></div><div class="sub" style="text-align:right">${f.puntos}</div>` : ''}</div>
    </div>`;
  };
  return `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h2 style="margin:0">${editando ? 'Editar envío' : 'Proveedores'}</h2>
      <span class="sub">Propuesta: ${ev.n} de ${ev.servicio.maxProveedores}${ev.motivoNoTriple ? ' · ' + u.esc(ev.motivoNoTriple.toLowerCase()) : ''}</span></div>
    ${visibles.map(fila).join('') || '<div class="empty">Ningún proveedor disponible</div>'}
    <div class="row" style="justify-content:space-between;margin-top:10px">
      <div class="row">${ocultos ? `<button class="btn ghost" data-action="leadVerTodos">+ ${ocultos} que no encajan</button>` : ''}
        ${otros.length ? `<select data-change="leadAddProv" style="width:auto"><option value="">Añadir otro proveedor…</option>${otros.map(p => `<option value="${p.id}">${u.esc(p.nombre)}</option>`).join('')}</select>` : ''}</div>
      <div class="row">${editando ? '<button class="btn ghost" data-action="leadCancelarEdicion">Cancelar</button>' : ''}
        <button class="btn cta big" id="btnEnviar" data-action="leadEnviar">${editando ? 'Guardar cambios' : 'Enviar'}</button></div>
    </div></div>`;
};
D.views.lead.after = () => D.views.lead.contarSel();
D.views.lead.extra = {};
D.views.lead.verTodos = false;
D.views.lead.editando = null;
D.views.lead.contarSel = function () {
  const sel = [...document.querySelectorAll('.selProv:checked')];
  const btn = document.getElementById('btnEnviar');
  if (btn && D.views.lead.editando !== D.views.lead.id()) btn.textContent = sel.length ? `Enviar a ${sel.length}` : 'Enviar';
};
D.act.leadSel = () => D.views.lead.contarSel();
D.act.leadVerTodos = () => { D.views.lead.verTodos = true; D.render(); };
D.act.leadAddProv = el => {
  if (!el.value) return;
  const id = D.views.lead.id();
  (D.views.lead.extra[id] = D.views.lead.extra[id] || []).push(el.value);
  D.render();
  const cb = document.querySelector(`.selProv[value="${el.value}"]`); if (cb) cb.checked = true;
  D.views.lead.contarSel();
};
D.act.leadEditarEnvio = () => { D.views.lead.editando = D.views.lead.id(); D.render(); };
D.act.leadCancelarEdicion = () => { D.views.lead.editando = null; D.views.lead.extra = {}; D.render(); };
D.act.leadTranscribir = () => {
  const l = D.store.lead(D.views.lead.id());
  D.ops.transcribir(l);
  D.render();
  D.ui.toast('Cuestionario rellenado desde la llamada');
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
  const sel = [...document.querySelectorAll('.selProv:checked:not(:disabled)')];
  const editando = D.views.lead.editando === l.id;
  if (!sel.length && !editando) { D.ui.toast('Selecciona al menos un proveedor'); return; }
  const avisos = sel.filter(x => x.dataset.aviso).map(x => `<li><b>${D.u.esc(D.store.proveedor(x.value).nombre)}</b>: ${D.u.esc(x.dataset.aviso)}</li>`);
  const hacer = () => {
    const ids = sel.map(x => x.value);
    if (editando) {
      l.envios.filter(e => e.estado === 'enviado' && !e.facturaId && !ids.includes(e.proveedorId)).forEach(e => D.ops.anularEnvio(l, e.proveedorId));
    }
    D.ops.enviar(l, ids);
    D.views.lead.editando = null; D.views.lead.extra = {}; D.views.lead.verTodos = false;
    D.ui.cerrarModal(); D.render();
    D.ui.toast(editando ? 'Envío actualizado' : `Enviado a ${ids.length}`);
  };
  if (!avisos.length) return hacer();
  D.views.lead._confirmar = hacer;
  D.ui.modal('Hay avisos', `<ul style="margin:0 0 14px;padding-left:18px">${avisos.join('')}</ul>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" data-action="cerrarModal">Revisar</button>
    <button class="btn cta" data-action="leadConfirmarEnvio">Enviar igualmente</button></div>`);
};
D.act.leadConfirmarEnvio = () => D.views.lead._confirmar && D.views.lead._confirmar();
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
