// Inicio: lo esencial del mes.
D.views.resumen = {
  render() {
    const st = D.store.get(), u = D.u, mes = u.mesActual();
    const delMes = st.leads.filter(l => u.mes(l.creado) === mes);
    const porLlamar = st.leads.filter(l => ['nuevo', 'no_contesta', 'pendiente'].includes(l.estado)).length;
    const porEnviar = st.leads.filter(l => l.estado === 'cualificado').length;
    const validos = st.leads.flatMap(l => l.envios.map(e => ({ l, e }))).filter(x => u.mes(x.e.fecha) === mes && x.e.estado === 'enviado');
    const facturable = validos.reduce((s, x) => s + x.e.precio, 0);

    const bars = (pares, total, color) => `<div class="bars">${pares.map(([k, v]) =>
      `<div class="b"><span>${k}</span><span class="meter"><i style="width:${total ? (100 * v / total).toFixed(0) : 0}%;${color ? 'background:' + color : ''}"></i></span><span class="r">${v}</span></div>`).join('')}</div>`;

    const porFuente = ['meta', 'web', 'google'].map(f => [{ meta: 'Meta', web: 'Web', google: 'Google Ads' }[f], delMes.filter(l => l.fuente === f).length]);
    const porServ = st.servicios.map(s => [s.nombre, validos.filter(x => x.l.servicio === s.id).reduce((a, x) => a + x.e.precio, 0)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxServ = Math.max(1, ...porServ.map(x => x[1]));
    const motivos = {};
    delMes.filter(l => l.motivoNoTriple).forEach(l => { motivos[l.motivoNoTriple] = (motivos[l.motivoNoTriple] || 0) + 1; });

    return `
      <div class="top"><h1>${u.nombreMes(mes).replace(/^./, c => c.toUpperCase())}</h1>
        <a class="btn primary" href="#bandeja">Ir a leads</a></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${delMes.length}</div><div class="l">Leads del mes</div></div>
        <div class="kpi"><div class="v">${porLlamar}</div><div class="l">Por llamar</div></div>
        <div class="kpi"><div class="v">${porEnviar}</div><div class="l">Por enviar</div></div>
        <div class="kpi"><div class="v">${u.eur(facturable).replace(',00', '')}</div><div class="l">Facturable</div></div>
      </div>
      <div class="cols3">
        <div class="card"><h2>Origen</h2>${bars(porFuente, delMes.length)}</div>
        <div class="card"><h2>Facturable por servicio</h2><div class="bars">${porServ.map(([k, v]) =>
          `<div class="b"><span>${k}</span><span class="meter"><i style="width:${(100 * v / maxServ).toFixed(0)}%"></i></span><span class="r">${Math.round(v)}€</span></div>`).join('') || '<p class="muted">—</p>'}</div></div>
        <div class="card"><h2>Leads sin el máximo de proveedores</h2>${Object.keys(motivos).length
          ? bars(Object.entries(motivos).sort((a, b) => b[1] - a[1]), Object.values(motivos).reduce((a, b) => a + b, 0), 'var(--coral)')
          : '<p class="muted">—</p>'}</div>
      </div>`;
  }
};
