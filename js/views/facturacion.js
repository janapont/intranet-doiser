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
      <div class="head"><div><h1>Facturación</h1><p>A principio de mes se facturan los leads enviados el mes anterior. Los invalidados por el proveedor y los de periodo de prueba no se cobran. En producción, cada factura se crearía en Holded por API y se cobraría por GoCardless.</p></div>
        <select data-change="facMes" style="width:auto">${meses.map(m => `<option value="${m}" ${m === ym ? 'selected' : ''}>${u.nombreMes(m)}</option>`).join('')}</select></div>
      <div class="panel"><h2>Pendiente de facturar · ${u.nombreMes(ym)}</h2>
        ${enCurso ? '<div class="alert info">Este mes aún está en curso: lo normal es cerrarlo el día 1 del mes siguiente.</div>' : ''}
        ${cobrables.length ? `<table><thead><tr><th>Proveedor</th><th class="r">Leads cobrables</th><th class="r">Gratis / invalidados</th><th class="r">Base</th><th class="r">IVA 21%</th><th class="r">Total</th><th>Cobro</th></tr></thead><tbody>
          ${borradores.map(b => `<tr><td>${u.esc(b.proveedor.nombre)}</td><td class="r">${b.cobrables.length}</td><td class="r">${b.gratis}</td><td class="r">${u.eur(b.base)}</td><td class="r">${u.eur(b.iva)}</td><td class="r"><b>${u.eur(b.total)}</b></td><td class="small">${u.esc(b.proveedor.pago)}</td></tr>`).join('')}
          </tbody><tfoot><tr><td><b>Total</b></td><td></td><td></td><td class="r"><b>${u.eur(tot)}</b></td><td class="r">${u.eur(tot * D.billing.IVA)}</td><td class="r"><b>${u.eur(tot * (1 + D.billing.IVA))}</b></td><td></td></tr></tfoot></table>
          <div class="btns" style="margin-top:12px"><button class="btn pri" data-action="facEmitir">Emitir ${cobrables.length} facturas (Holded simulado)</button></div>`
          : '<p class="muted">No hay leads pendientes de facturar en este mes.</p>'}
      </div>
      <div class="panel"><h2>Facturas emitidas · ${u.nombreMes(ym)}</h2>
        ${emitidas.length ? `<table><thead><tr><th>Número</th><th>Proveedor</th><th class="r">Leads</th><th class="r">Total</th><th>Estado</th><th></th></tr></thead><tbody>
          ${emitidas.map(f => `<tr><td><b>${f.numero}</b></td><td>${u.esc(D.store.proveedor(f.proveedorId).nombre)}</td><td class="r">${f.lineas}</td><td class="r">${u.eur(f.total)}</td>
            <td>${f.estado === 'cobrada' ? '<span class="badge b-verde">Cobrada</span>' : '<span class="badge b-azul">Emitida</span>'}</td>
            <td><div class="btns"><button class="btn" data-action="facVer" data-f="${f.id}">Ver envío a Holded</button>
            ${f.estado !== 'cobrada' ? `<button class="btn ok" data-action="facCobrar" data-f="${f.id}">Simular cobro (${u.esc(f.pago)})</button>` : ''}</div></td></tr>`).join('')}
          </tbody></table>` : '<p class="muted">Todavía no se han emitido facturas de este mes.</p>'}
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
  D.ui.modal('Factura ' + f.numero, `<p class="small muted">Datos que se enviarían a la API de Holded para crear la factura (formato orientativo, a validar con la documentación de Holded).</p>${D.ui.json(f.holded)}`);
};
D.act.facCobrar = el => {
  const f = D.store.get().facturas.find(x => x.id === el.dataset.f);
  f.estado = 'cobrada'; f.cobrada = new Date().toISOString();
  D.store.guardar(); D.render();
};
