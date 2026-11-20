// Simulador de entradas: genera el payload que enviaría cada fuente y lo pasa por la ingesta real.
D.views.entrada = {
  fuente: 'meta',
  ultimo: null,
  render() {
    const st = D.store.get(), u = D.u, f = this.fuente;
    const explicacion = {
      meta: 'Un anuncio de Facebook/Instagram con formulario instantáneo. Meta envía el lead por webhook (directamente o reenviado por GoHighLevel) con los campos en <code>field_data</code>.',
      web: 'El formulario «Pide presupuesto» de doiser.com. Hace un POST con los campos del formulario.',
      google: 'Un formulario de clientes potenciales de Google Ads. Google envía el lead por webhook con los campos en <code>user_column_data</code>.'
    }[f];
    const opt = (arr, sel) => arr.map(x => `<option ${x === sel ? 'selected' : ''}>${u.esc(x)}</option>`).join('');
    const ult = this.ultimo && D.store.lead(this.ultimo);
    return `
      <div class="head"><div><h1>Simular la entrada de un lead</h1>
        <p>Rellena un formulario como si fueras el cliente. Se genera el mensaje con el formato real de cada plataforma y entra en la bandeja por el mismo camino que lo haría en producción.</p></div></div>
      <div class="tabs">${['meta', 'web', 'google'].map(k => `<span class="tab ${k === f ? 'on' : ''}" data-action="entradaFuente" data-f="${k}">${D.FUENTES[k]}</span>`).join('')}</div>
      ${ult ? `<div class="alert ok">Lead <b>${ult.id}</b> recibido y en la bandeja. ${(ult.avisos || []).length ? 'Avisos: ' + ult.avisos.map(u.esc).join(' ') : 'Sin avisos.'} <a href="#lead-${ult.id}">Abrir ficha →</a></div>` : ''}
      <div class="grid2">
        <div class="panel"><h2>Formulario del cliente</h2><p class="sub">${explicacion}</p>
          <form id="fEntrada" class="form">
            <label class="f full">Servicio
              <select name="servicio">${st.servicios.map(s => `<option value="${s.id}">${u.esc(s.nombre)}</option>`).join('')}</select></label>
            <label class="f">Nombre<input name="nombre" value="Laura"></label>
            <label class="f">Apellidos<input name="apellidos" value="Martín Serra"></label>
            <label class="f">Teléfono<input name="telefono" value="612345678"></label>
            <label class="f">Email<input name="email" value="laura.martin@example.com"></label>
            <label class="f">Empresa<input name="empresa" value="Reformas Delta"></label>
            <label class="f">Tipo de cliente<select name="tipoCliente"><option value="">(no lo indica)</option>${opt(D.TIPOS_CLIENTE, 'Empresa')}</select></label>
            <label class="f">Provincia<select name="provincia"><option value="">(no lo indica)</option>${opt(D.PROVINCIAS, 'Barcelona')}</select></label>
            <label class="f">Nº de trabajadores<input name="trabajadores" type="number" min="0" value="8"></label>
            <label class="f full">Comentario<textarea name="comentario" rows="2">Quiero comparar precios.</textarea></label>
          </form>
          <div class="btns" style="margin-top:12px">
            <button class="btn" data-action="entradaAleatorio">Datos aleatorios</button>
            <button class="btn pri" data-action="entradaEnviar">Enviar lead</button>
          </div>
        </div>
        <div class="panel"><h2>Lo que llega al sistema</h2><p class="sub">Mensaje tal como lo enviaría ${D.FUENTES[f]}.</p><div id="payload"></div></div>
      </div>`;
  },
  datos() {
    const fd = new FormData(document.getElementById('fEntrada'));
    const d = Object.fromEntries(fd.entries());
    d.trabajadores = d.trabajadores === '' ? undefined : Number(d.trabajadores);
    return d;
  },
  payload() {
    const d = this.datos();
    const s = D.store.servicio(d.servicio);
    return D.demo.payload(this.fuente, d, s);
  },
  pintar() { const el = document.getElementById('payload'); if (el) el.innerHTML = D.ui.json(this.payload()); },
  after() {
    this.pintar();
    document.getElementById('fEntrada').addEventListener('input', () => this.pintar());
  }
};

D.act.entradaFuente = el => { D.views.entrada.fuente = el.dataset.f; D.views.entrada.ultimo = null; D.render(); };
D.act.entradaAleatorio = () => {
  const f = document.getElementById('fEntrada'), r = Math.random, pick = a => a[Math.floor(r() * a.length)];
  const n = pick(D.NOMBRES), ap = pick(D.APELLIDOS) + ' ' + pick(D.APELLIDOS);
  f.servicio.value = pick(D.store.get().servicios).id;
  f.nombre.value = n; f.apellidos.value = ap;
  f.telefono.value = '6' + String(Math.floor(r() * 1e8)).padStart(8, '0');
  f.email.value = D.u.norm(n) + '.' + D.u.norm(ap.split(' ')[0]) + '@example.com';
  f.empresa.value = pick(D.NEGOCIOS);
  f.tipoCliente.value = r() < 0.15 ? '' : pick(D.TIPOS_CLIENTE);
  f.provincia.value = r() < 0.15 ? '' : pick(['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Vizcaya', 'Zaragoza', 'A Coruña', 'Murcia', 'Las Palmas']);
  f.trabajadores.value = r() < 0.4 ? '' : 1 + Math.floor(r() * 30);
  f.comentario.value = '';
  D.views.entrada.pintar();
};
D.act.entradaEnviar = () => {
  const v = D.views.entrada, st = D.store.get();
  const lead = D.ingest.recibir(v.fuente, v.payload(), st);
  lead.responsable = st.config.usuario;
  st.leads.unshift(lead);
  D.store.guardar();
  v.ultimo = lead.id;
  D.render();
  D.ui.toast(`Lead ${lead.id} recibido`);
};
