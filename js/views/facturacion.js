// Facturación mensual por proveedor.
D.views.facturacion = {
  mes: null,
  render() {
    const st = D.store.get(), u = D.u;
    const meses = [...new Set(st.leads.flatMap(l => l.envios.map(e => u.mes(e.fecha))))].sort().reverse();
    if (!this.mes) this.mes = u.mesAnterior();
    const ym = this.mes;
    const borradores = D.billing.pendientes(st, ym);
    const cobrables = borradores.filter(b => b.cobrables.length);
    const tot = cobrables.reduce((s, b) => s + b.base, 0);
    const emitidas = st.facturas.filter(f => f.mes === ym);
    const enCurso = ym === u.mesActual();
    return `
      <div class="top"><h1>Facturación</h1>
        <select data-change="facMes" style="width:auto">${meses.map(m => `<option value="${m}" ${m === ym ? 'selected' : ''}>${u.nombreMes(m)}</option>`).join('')}</select></div>
      ${cobrables.length ? `<div class="card">
        <div class="row" style="justify-content:space-between;margin-bottom:6px"><h2 style="margin:0">Pendiente${enCurso ? ' · mes en curso' : ''}</h2>
          <div class="row"><span class="name">${u.eur(tot * (1 + D.billing.IVA))}</span><button class="btn primary" data-action="facEmitir">Emitir ${cobrables.length} facturas</button></div></div>
        <table><thead><tr><th>Proveedor</th><th class="r">Leads</th><th class="r">Base</th><th class="r">Total con IVA</th><th>Cobro</th></tr></thead><tbody>
        ${cobrables.map(b => `<tr><td class="name">${u.esc(b.proveedor.nombre)}</td><td class="r">${b.cobrables.length}${b.gratis ? `<span class="sub"> +${b.gratis}</span>` : ''}</td><td class="r">${u.eur(b.base)}</td><td class="r">${u.eur(b.total)}</td><td class="sub">${u.esc(b.proveedor.pago)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
      <div class="card"><h2>Emitidas</h2>
        ${emitidas.length ? `<table><thead><tr><th>Factura</th><th>Proveedor</th><th class="r">Leads</th><th class="r">Total</th><th>Estado</th><th></th></tr></thead><tbody>
          ${emitidas.map(f => `<tr><td class="name">${f.numero}</td><td>${u.esc(D.store.proveedor(f.proveedorId).nombre)}</td><td class="r">${f.lineas}</td><td class="r">${u.eur(f.total)}</td>
            <td>${f.estado === 'cobrada' ? '<span class="pill p-green">Cobrada</span>' : '<span class="pill p-blue">Emitida</span>'}</td>
            <td class="r"><button class="btn ghost" data-action="facVer" data-f="${f.id}">Holded</button>${f.estado !== 'cobrada' ? `<button class="btn ghost" data-action="facCobrar" data-f="${f.id}">Cobrar</button>` : ''}</td></tr>`).join('')}
          </tbody></table>` : '<div class="empty">Sin facturas emitidas</div>'}
      </div>`;
  }
};
D.act.facMes = el => { D.views.facturacion.mes = el.value; D.render(); };
D.act.facEmitir = () => {
  const st = D.store.get(), ym = D.views.facturacion.mes;
  const creadas = D.billing.emitir(st, ym, D.billing.pendientes(st, ym));
  D.store.guardar(); D.render();
  D.ui.toast(`${creadas.length} facturas emitidas`);
};
D.act.facVer = el => {
  const f = D.store.get().facturas.find(x => x.id === el.dataset.f);
  D.ui.modal(f.numero, `<p class="sub">Envío a la API de Holded (formato orientativo)</p>${D.ui.json(f.holded)}`);
};
D.act.facCobrar = el => {
  const f = D.store.get().facturas.find(x => x.id === el.dataset.f);
  f.estado = 'cobrada'; f.cobrada = new Date().toISOString();
  D.store.guardar(); D.render();
};
