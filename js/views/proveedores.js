// Proveedores: la información que usa el algoritmo.
D.views.proveedores = {
  servicio: '',
  render() {
    const st = D.store.get(), u = D.u;
    const lista = st.proveedores.filter(p => !this.servicio || p.servicios.some(x => x.s === this.servicio));
    const zonas = p => (p.zonas.includes('ES') ? 'España' : p.zonas.map(z => z.slice(2)).join(', ')) + (p.excluidas.length ? ' (excepto ' + p.excluidas.map(z => z.slice(2)).join(', ') + ')' : '');
    const cobro = { ok: '<span class="pill p-green">Al día</span>', cuidado: '<span class="pill p-amber">Cuidado</span>', impago: '<span class="pill p-red">Impago</span>' };
    const estado = { activo: '<span class="pill p-blue">Activo</span>', pausado: '<span class="pill p-grey">Pausado</span>', prueba: '<span class="pill p-violet">Prueba</span>' };
    return `
      <div class="top"><h1>Proveedores</h1>
        <div class="row"><select data-change="provServicio" style="width:auto"><option value="">Todos los servicios</option>${st.servicios.map(s => `<option value="${s.id}" ${s.id === this.servicio ? 'selected' : ''}>${u.esc(s.nombre)}</option>`).join('')}</select>
        <button class="btn primary" data-action="provNuevo">+ Nuevo proveedor</button></div></div>
      <div class="card" style="padding:8px 12px">
        <table><thead><tr><th>Proveedor</th><th>Precio por lead</th><th>Zona</th><th>Este mes</th><th class="r">Invalida</th><th class="r">Contrata</th><th>Cobro</th><th>Estado</th></tr></thead><tbody>
        ${lista.map(p => {
          const c = D.matching.consumo(p, st);
          const lim = p.limMes ? Math.min(100, 100 * c.mes / p.limMes) : 0;
          return `<tr class="click" data-action="provEditar" data-p="${p.id}">
            <td><div class="name">${u.esc(p.nombre)}</div><div class="sub">${p.tipos.join(', ')}</div></td>
            <td class="small">${p.servicios.map(x => `${u.esc(D.store.servicio(x.s)?.nombre || x.s)} <b>${x.cpl}€</b>`).join('<br>')}</td>
            <td class="small">${u.esc(zonas(p))}</td>
            <td style="min-width:110px">${p.limMes ? `<div class="meter"><i style="width:${lim}%;${lim >= 100 ? 'background:var(--red)' : ''}"></i></div>` : ''}<div class="sub">${c.mes}${p.limMes ? ' / ' + p.limMes : ''}</div></td>
            <td class="r small">${p.invalidacion == null ? '—' : u.pct(p.invalidacion)}</td><td class="r small">${p.contratacion == null ? '—' : u.pct(p.contratacion)}</td>
            <td>${cobro[p.cobro]}</td><td>${estado[p.estado]}</td></tr>`;
        }).join('')}
        </tbody></table></div>`;
  }
};
D.act.provServicio = el => { D.views.proveedores.servicio = el.value; D.render(); };
// Formulario de alta y edición (mismo formulario para los dos casos).
D.views.proveedores.form = function (p) {
  const st = D.store.get(), u = D.u;
  const nuevo = !p;
  p = p || { nombre: '', email: '', pago: 'GoCardless', servicios: [], tipos: ['Autónomo', 'Empresa'], zonas: ['ES'], excluidas: [], limMes: 0, limDia: 0, estado: 'activo', cobro: 'ok', importancia: 'media', entrega: 'email' };
  const sel = (n, opts, v) => `<select name="${n}">${opts.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const chip = (name, value, label, on) => `<label class="chip"><input type="checkbox" name="${name}" value="${u.esc(value)}" ${on ? 'checked' : ''}>${u.esc(label)}</label>`;
  const nacional = p.zonas.includes('ES');
  const provSueltas = p.zonas.filter(z => z.startsWith('P:'));
  return `
    <form id="fProv" class="form" onsubmit="return false">
      <label class="field full"><span class="req">Nombre</span><input name="nombre" value="${u.esc(p.nombre)}"></label>
      <label class="field"><span class="req">Email de envío</span><input name="email" value="${u.esc(p.email)}"></label>
      <label class="field"><span>Forma de pago</span>${sel('pago', [['GoCardless', 'GoCardless'], ['Domiciliación', 'Domiciliación'], ['Transferencia', 'Transferencia']], p.pago)}</label>

      <div class="group">Servicios y precio por lead</div>
      <div class="full">${st.servicios.map(s => {
        const c = p.servicios.find(x => x.s === s.id);
        return `<div class="svc-row"><label class="check"><input type="checkbox" name="svc" value="${s.id}" ${c ? 'checked' : ''}> ${u.esc(s.nombre)}</label>
          <input type="number" min="0" name="cpl_${s.id}" value="${c ? c.cpl : ''}" placeholder="${s.cplRef}">
          ${sel('prio_' + s.id, [['alta', 'Prioridad alta'], ['baja', 'Prioridad baja']], c ? c.prioridad : 'alta')}</div>`;
      }).join('')}</div>

      <div class="group">Clientes que acepta</div>
      <div class="full chips">${D.TIPOS_CLIENTE.map(t => chip('tipo', t, t, p.tipos.includes(t))).join('')}</div>

      <div class="group">Zona</div>
      <div class="full chips">${chip('nacional', '1', 'Toda España', nacional)}</div>
      <div class="full chips" id="zonasConcretas" ${nacional ? 'style="display:none"' : ''}>
        ${Object.keys(D.COMUNIDADES).map(c => chip('com', c, c, p.zonas.includes('C:' + c))).join('')}
        <details class="full" style="margin-top:8px;width:100%" ${provSueltas.length ? 'open' : ''}><summary>Provincias sueltas</summary>
          <div class="chips" style="margin-top:8px">${D.PROVINCIAS.map(x => chip('prov', x, x, p.zonas.includes('P:' + x))).join('')}</div></details>
      </div>

      <div class="group">Condiciones</div>
      <label class="field"><span>Límite mensual</span><input type="number" min="0" name="limMes" value="${p.limMes || ''}" placeholder="Sin límite"></label>
      <label class="field"><span>Límite diario</span><input type="number" min="0" name="limDia" value="${p.limDia || ''}" placeholder="Sin límite"></label>
      <label class="field"><span>Estado</span>${sel('estado', [['activo', 'Activo'], ['prueba', 'Prueba (gratis)'], ['pausado', 'Pausado']], p.estado)}</label>
      <label class="field"><span>Cobro</span>${sel('cobro', [['ok', 'Al día'], ['cuidado', 'Cuidado'], ['impago', 'Impago']], p.cobro)}</label>
      <label class="field"><span>Importancia</span>${sel('importancia', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], p.importancia)}</label>
      <label class="field"><span>Entrega del lead</span>${sel('entrega', [['email', 'Email'], ['json', 'Email + JSON'], ['webhook', 'Webhook a su CRM']], p.entrega)}</label>
    </form>
    <div class="row" style="justify-content:space-between;margin-top:18px"><span class="sub" id="provError"></span>
      <button class="btn primary" data-action="provGuardar" data-p="${nuevo ? '' : p.id}">${nuevo ? 'Crear proveedor' : 'Guardar'}</button></div>`;
};
D.views.proveedores.abrir = function (p) {
  D.ui.modal(p ? D.u.esc(p.nombre) : 'Nuevo proveedor', this.form(p));
  document.querySelector('.modal').classList.add('wide');
  const f = document.getElementById('fProv');
  f.nacional.addEventListener('change', () => { document.getElementById('zonasConcretas').style.display = f.nacional.checked ? 'none' : ''; });
  // Al marcar un servicio sin precio, propone el precio de referencia.
  f.querySelectorAll('[name=svc]').forEach(cb => cb.addEventListener('change', () => {
    const inp = f['cpl_' + cb.value];
    if (cb.checked && !inp.value) inp.value = inp.placeholder;
  }));
};
D.act.provNuevo = () => D.views.proveedores.abrir(null);
D.act.provEditar = el => D.views.proveedores.abrir(D.store.proveedor(el.dataset.p));
D.act.provGuardar = el => {
  const st = D.store.get(), f = document.getElementById('fProv'), fd = new FormData(f);
  const err = m => { document.getElementById('provError').innerHTML = `<span class="pill p-red">${m}</span>`; };
  const svc = fd.getAll('svc'), tipos = fd.getAll('tipo');
  const nacional = !!fd.get('nacional');
  const zonas = nacional ? ['ES'] : [...fd.getAll('com').map(c => 'C:' + c), ...fd.getAll('prov').map(x => 'P:' + x)];
  const nombre = (fd.get('nombre') || '').trim(), email = (fd.get('email') || '').trim();
  if (!nombre) return err('Falta el nombre');
  if (!D.u.emailValido(email)) return err('Email no válido');
  if (!svc.length) return err('Elige al menos un servicio');
  if (!tipos.length) return err('Elige qué clientes acepta');
  if (!zonas.length) return err('Elige una zona');
  let p = el.dataset.p ? D.store.proveedor(el.dataset.p) : null;
  const datos = {
    nombre, email, pago: fd.get('pago'), tipos, zonas,
    servicios: svc.map(s => {
      const prev = p && p.servicios.find(x => x.s === s);
      return Object.assign({}, prev, { s, cpl: Number(fd.get('cpl_' + s)) || D.store.servicio(s).cplRef, prioridad: fd.get('prio_' + s) });
    }),
    limMes: Number(fd.get('limMes')) || 0, limDia: Number(fd.get('limDia')) || 0,
    estado: fd.get('estado'), cobro: fd.get('cobro'), importancia: fd.get('importancia'), entrega: fd.get('entrega')
  };
  if (p) Object.assign(p, datos);
  else {
    p = Object.assign({ id: 'p' + Date.now().toString(36), excluidas: [], baseMes: 0, invalidacion: null, contratacion: null, alta: new Date().toISOString() }, datos);
    st.proveedores.unshift(p);
  }
  D.store.guardar();
  D.ui.cerrarModal();
  D.render();
  D.ui.toast(el.dataset.p ? 'Guardado' : 'Proveedor creado');
};
