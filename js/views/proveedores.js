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
        <select data-change="provServicio" style="width:auto"><option value="">Todos los servicios</option>${st.servicios.map(s => `<option value="${s.id}" ${s.id === this.servicio ? 'selected' : ''}>${u.esc(s.nombre)}</option>`).join('')}</select></div>
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
            <td class="r small">${u.pct(p.invalidacion)}</td><td class="r small">${u.pct(p.contratacion)}</td>
            <td>${cobro[p.cobro]}</td><td>${estado[p.estado]}</td></tr>`;
        }).join('')}
        </tbody></table></div>`;
  }
};
D.act.provServicio = el => { D.views.proveedores.servicio = el.value; D.render(); };
D.act.provEditar = el => {
  const p = D.store.proveedor(el.dataset.p), u = D.u;
  const sel = (n, opts, v) => `<select name="${n}">${opts.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  D.ui.modal(u.esc(p.nombre), `
    <form id="fProv" class="form" onsubmit="return false">
      <div class="group">Precio por lead (€)</div>
      ${p.servicios.map((x, i) => `<label class="field">${u.esc(D.store.servicio(x.s).nombre)}<input type="number" min="0" name="cpl${i}" value="${x.cpl}"></label>`).join('')}
      <div class="group">Condiciones</div>
      <label class="field">Estado${sel('estado', [['activo', 'Activo'], ['prueba', 'Prueba (gratis)'], ['pausado', 'Pausado']], p.estado)}</label>
      <label class="field">Cobro${sel('cobro', [['ok', 'Al día'], ['cuidado', 'Cuidado'], ['impago', 'Impago']], p.cobro)}</label>
      <label class="field">Límite mensual<input type="number" min="0" name="limMes" value="${p.limMes}"></label>
      <label class="field">Límite diario<input type="number" min="0" name="limDia" value="${p.limDia}"></label>
      <label class="field">Importancia${sel('importancia', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], p.importancia)}</label>
      <label class="field">Entrega${sel('entrega', [['email', 'Email'], ['json', 'Email + JSON'], ['webhook', 'Webhook a su CRM']], p.entrega)}</label>
    </form>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" data-action="provGuardar" data-p="${p.id}">Guardar</button></div>`);
};
D.act.provGuardar = el => {
  const p = D.store.proveedor(el.dataset.p);
  const d = Object.fromEntries(new FormData(document.getElementById('fProv')).entries());
  p.servicios.forEach((x, i) => { x.cpl = Number(d['cpl' + i]) || 0; });
  Object.assign(p, { estado: d.estado, cobro: d.cobro, limMes: Number(d.limMes) || 0, limDia: Number(d.limDia) || 0, importancia: d.importancia, entrega: d.entrega });
  D.store.guardar();
  D.ui.cerrarModal();
  D.render();
  D.ui.toast('Proveedor actualizado');
};
