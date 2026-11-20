// Nuevo lead: simula el formulario que rellena el cliente en cada canal.
D.views.entrada = {
  fuente: 'web',
  servicio: 'prl',
  ultimo: null,
  render() {
    const st = D.store.get(), u = D.u, f = this.fuente;
    const s = D.store.servicio(this.servicio);
    const ult = this.ultimo && D.store.lead(this.ultimo);
    const selServ = `<select data-change="entradaServicio" style="width:auto">${st.servicios.map(x => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${u.esc(x.nombre)}</option>`).join('')}</select>`;
    const qMeta = f === 'meta' ? s.preguntas.find(x => ['que_eres', 'sector', 'negocio', 'tipo_web'].includes(x.id)) : null;

    let form;
    if (f === 'web') {
      form = `<div class="webform"><h3>SOLICITAR PRESUPUESTO</h3>
        <input name="nombre_apellidos" placeholder="Nombre y apellidos *">
        <input name="email" placeholder="Email *">
        <input name="telefono" placeholder="Teléfono *">
        <textarea name="comentarios" rows="3" placeholder="Comentarios"></textarea>
        <label class="check"><input type="checkbox" name="rgpd" checked> He leído y acepto la Política de Protección de Datos</label>
        <label class="check"><input type="checkbox" name="newsletter"> Quiero recibir las novedades de Doiser</label>
        <button class="btn cta big" data-action="entradaEnviar">Enviar solicitud</button></div>`;
    } else {
      form = `<div class="metaform"><div class="hd"><div class="avatar" style="width:36px;height:36px;font-size:14px">d</div>
          <div><b>Doiser</b><div class="sub">${f === 'meta' ? 'Formulario instantáneo · Facebook' : 'Formulario de Google Ads'}</div></div></div>
        <label>Nombre completo</label><input name="nombre_apellidos">
        <label>Teléfono</label><input name="telefono">
        <label>Correo electrónico</label><input name="email">
        ${qMeta ? `<label>${u.esc(qMeta.label)}</label>${qMeta.opciones ? `<select name="q_${qMeta.id}">${qMeta.opciones.map(o => `<option>${u.esc(o)}</option>`).join('')}</select>` : `<input name="q_${qMeta.id}">`}` : ''}
        <button class="btn primary big" style="width:100%;margin-top:6px" data-action="entradaEnviar">Enviar</button></div>`;
    }

    return `
      <div class="top"><h1>Nuevo lead</h1>
        <div class="seg">${[['web', 'Web'], ['meta', 'Meta'], ['google', 'Google Ads']].map(([k, t]) => `<span class="${k === f ? 'on' : ''}" data-action="entradaFuente" data-f="${k}">${t}</span>`).join('')}</div></div>
      ${ult ? `<div class="card row" style="justify-content:space-between;padding:14px 20px">
        <span><span class="pill p-green">Recibido</span> &nbsp;<b>${u.esc(ult.contacto.nombre)} ${u.esc(ult.contacto.apellidos)}</b> <span class="muted">· ${u.esc(D.store.servicio(ult.servicio)?.nombre || '')}</span>
        ${(ult.avisos || []).length ? `<span class="pill p-amber" style="margin-left:6px">${u.esc(ult.avisos.join(' · '))}</span>` : ''}</span>
        <a class="btn" href="#lead-${ult.id}">Abrir</a></div>` : ''}
      <div class="card">
        <div class="row" style="justify-content:space-between;margin-bottom:20px">
          <span class="muted">${f === 'web' ? 'Página' : f === 'meta' ? 'Anuncio' : 'Campaña'} ${selServ}</span>
          <button class="btn ghost" data-action="entradaAleatorio">Rellenar datos de prueba</button></div>
        <form id="fEntrada" onsubmit="return false">${form}</form>
      </div>`;
  },
  datos() {
    const f = document.getElementById('fEntrada');
    const d = Object.fromEntries(new FormData(f).entries());
    const partes = (d.nombre_apellidos || '').trim().split(/\s+/);
    const extra = {};
    Object.keys(d).filter(k => k.startsWith('q_')).forEach(k => { extra[k.slice(2)] = d[k]; });
    return { nombre: partes[0] || '', apellidos: partes.slice(1).join(' '), email: d.email || '', telefono: d.telefono || '', comentario: d.comentarios || '', newsletter: !!d.newsletter, rgpd: !!d.rgpd, extra };
  }
};

D.act.entradaFuente = el => { D.views.entrada.fuente = el.dataset.f; D.render(); };
D.act.entradaServicio = el => { D.views.entrada.servicio = el.value; D.render(); };
D.act.entradaAleatorio = () => {
  const f = document.getElementById('fEntrada'), pick = a => a[Math.floor(Math.random() * a.length)];
  const n = pick(D.NOMBRES), ap = pick(D.APELLIDOS) + ' ' + pick(D.APELLIDOS);
  f.nombre_apellidos.value = n + ' ' + ap;
  f.telefono.value = '6' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  f.email.value = D.u.norm(n) + '.' + D.u.norm(ap.split(' ')[0]) + '@example.com';
  if (f.comentarios) f.comentarios.value = Math.random() < 0.5 ? pick(D.demo.COMENTARIOS) : '';
};
D.act.entradaEnviar = () => {
  const v = D.views.entrada, st = D.store.get();
  const d = v.datos();
  if (!d.nombre || !d.telefono) { D.ui.toast('Nombre y teléfono son obligatorios'); return; }
  if (v.fuente === 'web' && !d.rgpd) { D.ui.toast('Hay que aceptar la política de datos'); return; }
  const lead = D.ingest.recibir(v.fuente, D.demo.payload(v.fuente, d, D.store.servicio(v.servicio)), st);
  lead.responsable = st.config.usuario;
  st.leads.unshift(lead);
  D.store.guardar();
  v.ultimo = lead.id;
  D.render();
};
