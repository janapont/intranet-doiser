// Proveedores: la información que usa el algoritmo.
D.views.proveedores = {
  servicio: '',
  render() {
    const st = D.store.get(), u = D.u;
    const lista = st.proveedores.filter(p => !this.servicio || p.servicios.some(x => x.s === this.servicio));
    const zonas = p => p.zonas.includes('ES') ? 'Toda España' : p.zonas.map(z => z.slice(2)).join(', ');
    const cobro = { ok: '<span class="badge b-verde">Al día</span>', cuidado: '<span class="badge b-ambar">Cuidado</span>', impago: '<span class="badge b-rojo">Impago</span>' };
    const estado = { activo: '<span class="badge b-verde">Activo</span>', pausado: '<span class="badge b-gris">Pausado</span>', prueba: '<span class="badge b-violeta">Prueba</span>' };
    return `
      <div class="head"><div><h1>Proveedores</h1><p>Lo que el algoritmo tiene en cuenta de cada proveedor: servicios y precio por servicio, zonas, tipo de cliente, límites, estado de cobro y calidad (invalidaciones y contrataciones según las encuestas).</p></div></div>
      <div class="panel">
        <div style="max-width:320px;margin-bottom:10px"><select data-change="provServicio"><option value="">Todos los servicios</option>${st.servicios.map(s => `<option value="${s.id}" ${s.id === this.servicio ? 'selected' : ''}>${u.esc(s.nombre)}</option>`).join('')}</select></div>
        <table><thead><tr><th>Proveedor</th><th>Servicios y precio</th><th>Zonas</th><th>Acepta</th><th>Uso del mes</th><th>Invalida</th><th>Contrata</th><th>Cobro</th><th>Estado</th></tr></thead><tbody>
        ${lista.map(p => {
          const c = D.matching.consumo(p, st);
          return `<tr class="click" data-action="provEditar" data-p="${p.id}">
            <td><b>${u.esc(p.nombre)}</b><div class="small muted">${u.esc(p.email)} · ${u.esc(p.pago)}</div></td>
            <td><div class="pill-list">${p.servicios.map(x => `<span class="pill">${u.esc(D.store.servicio(x.s)?.nombre || x.s)}: ${x.cpl} €</span>`).join('')}</div></td>
            <td class="small">${u.esc(zonas(p))}${p.excluidas.length ? `<div class="muted">excepto ${u.esc(p.excluidas.map(z => z.slice(2)).join(', '))}</div>` : ''}</td>
            <td class="small">${p.tipos.join(', ')}</td>
            <td class="small">${c.mes}${p.limMes ? ' / ' + p.limMes : ''}${p.limDia ? `<div class="muted">máx. ${p.limDia}/día</div>` : ''}</td>
            <td class="small">${u.pct(p.invalidacion)}</td><td class="small">${u.pct(p.contratacion)}</td>
            <td>${cobro[p.cobro]}</td><td>${estado[p.estado]}</td></tr>`;
        }).join('')}
        </tbody></table>
        <p class="small muted">Haz clic en un proveedor para cambiar sus condiciones y ver cómo cambia la selección en los leads.</p>
      </div>`;
  }
};
D.act.provServicio = el => { D.views.proveedores.servicio = el.value; D.render(); };
D.act.provEditar = el => {
  const p = D.store.proveedor(el.dataset.p), u = D.u;
  const sel = (n, opts, v) => `<select name="${n}">${opts.map(([k, t]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  D.ui.modal(u.esc(p.nombre), `
    <form id="fProv" class="form">
      <div class="sep">Precio por servicio (€ por lead)</div>
      ${p.servicios.map((x, i) => `<label class="f">${u.esc(D.store.servicio(x.s).nombre)}<input type="number" min="0" name="cpl${i}" value="${x.cpl}"></label>`).join('')}
      <div class="sep">Condiciones</div>
      <label class="f">Estado${sel('estado', [['activo', 'Activo'], ['prueba', 'Periodo de prueba (leads gratis)'], ['pausado', 'Pausado']], p.estado)}</label>
      <label class="f">Cobro${sel('cobro', [['ok', 'Al día'], ['cuidado', 'Cuidado (penaliza)'], ['impago', 'Impago (no recibe leads)']], p.cobro)}</label>
      <label class="f">Límite mensual (0 = sin límite)<input type="number" min="0" name="limMes" value="${p.limMes}"></label>
      <label class="f">Límite diario (0 = sin límite)<input type="number" min="0" name="limDia" value="${p.limDia}"></label>
      <label class="f">Importancia${sel('importancia', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], p.importancia)}</label>
      <label class="f">Entrega del lead${sel('entrega', [['email', 'Email'], ['json', 'Email + JSON'], ['webhook', 'Webhook a su CRM']], p.entrega)}</label>
    </form>
    <div class="btns" style="margin-top:14px"><button class="btn pri" data-action="provGuardar" data-p="${p.id}">Guardar</button></div>`);
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
