// Resumen: cómo va el mes.
D.views.resumen = {
  render() {
    const st = D.store.get(), u = D.u, mes = u.mesActual();
    const delMes = st.leads.filter(l => u.mes(l.creado) === mes);
    const hoy = st.leads.filter(l => u.dia(l.creado) === u.hoy());
    const envMes = st.leads.flatMap(l => l.envios.map(e => ({ l, e }))).filter(x => u.mes(x.e.fecha) === mes);
    const validos = envMes.filter(x => x.e.estado === 'enviado');
    const ingresos = validos.reduce((s, x) => s + x.e.precio, 0);
    const enviados = delMes.filter(l => l.estado === 'enviado');
    const media = enviados.length ? enviados.reduce((s, l) => s + l.envios.length, 0) / enviados.length : 0;
    const completos = enviados.filter(l => { const s = D.store.servicio(l.servicio); return s && l.envios.length >= s.maxProveedores; }).length;
    const porLlamar = st.leads.filter(l => ['nuevo', 'no_contesta', 'pendiente'].includes(l.estado));
    const porAsignar = st.leads.filter(l => l.estado === 'cualificado');

    const porEstado = Object.keys(D.ESTADOS).map(k => [k, delMes.filter(l => l.estado === k).length]);
    const porFuente = ['meta', 'web', 'google', 'manual'].map(f => [f, delMes.filter(l => l.fuente === f).length]).filter(x => x[1]);
    const motivos = {};
    st.leads.filter(l => l.motivoNoTriple && u.mes(l.creado) === mes).forEach(l => { motivos[l.motivoNoTriple] = (motivos[l.motivoNoTriple] || 0) + 1; });
    const porServ = st.servicios.map(s => {
      const ls = delMes.filter(l => l.servicio === s.id);
      const imp = validos.filter(x => x.l.servicio === s.id).reduce((a, x) => a + x.e.precio, 0);
      return { s, n: ls.length, imp };
    }).filter(x => x.n).sort((a, b) => b.imp - a.imp);
    const maxImp = Math.max(1, ...porServ.map(x => x.imp));

    const barras = (pares, total) => `<div class="bars-h">${pares.map(([k, v]) => `<div class="row"><span>${k}</span><span class="track"><i style="width:${total ? (100 * v / total).toFixed(0) : 0}%"></i></span><span class="r">${u.num(v)}</span></div>`).join('')}</div>`;

    return `
      <div class="head"><div><h1>Resumen de ${u.nombreMes(mes)}</h1>
        <p>Demo con datos ficticios. Todos los leads, de cualquier fuente, se gestionan aquí: llamada, cuestionario, selección de proveedores, envío y factura.</p></div>
        <div class="btns"><a class="btn" href="#entrada">Simular un lead nuevo</a><a class="btn pri" href="#bandeja">Ir a la bandeja</a></div></div>
      <div class="panel"><div class="flow"><b>Meta · Google · Web</b> → <b>Bandeja única</b> → <b>Llamada + cuestionario</b> → <b>Algoritmo propone proveedores</b> → <b>Envío automático</b> → <b>Factura mensual (Holded)</b></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${hoy.length}</div><div class="l">Leads hoy</div></div>
        <div class="kpi"><div class="v">${delMes.length}</div><div class="l">Leads este mes</div></div>
        <div class="kpi"><div class="v">${porLlamar.length}</div><div class="l">Por llamar</div></div>
        <div class="kpi"><div class="v">${porAsignar.length}</div><div class="l">Cualificados por enviar</div></div>
        <div class="kpi"><div class="v">${media.toFixed(2)}</div><div class="l">Proveedores por lead enviado</div></div>
        <div class="kpi"><div class="v">${enviados.length ? u.pct(completos / enviados.length) : '—'}</div><div class="l">Leads con el máximo de proveedores</div></div>
        <div class="kpi"><div class="v">${u.eur(ingresos)}</div><div class="l">Facturable este mes (sin IVA)</div></div>
      </div>
      <div class="grid3">
        <div class="panel"><h2>Leads del mes por estado</h2>${barras(porEstado.map(([k, v]) => [D.ESTADOS[k].label, v]), delMes.length)}</div>
        <div class="panel"><h2>Por fuente</h2>${barras(porFuente.map(([k, v]) => [D.FUENTES[k], v]), delMes.length)}</div>
        <div class="panel"><h2>¿Por qué no se envía al máximo?</h2>
          ${Object.keys(motivos).length ? barras(Object.entries(motivos).sort((a, b) => b[1] - a[1]), Object.values(motivos).reduce((a, b) => a + b, 0)) : '<p class="muted">Sin datos este mes.</p>'}
          <p class="small muted">Indica dónde faltan proveedores para poder enviar más leads.</p></div>
      </div>
      <div class="panel"><h2>Facturable por servicio este mes</h2>
        <table><thead><tr><th>Servicio</th><th class="r">Leads</th><th>Importe</th><th class="r"></th></tr></thead><tbody>
        ${porServ.map(x => `<tr><td>${x.s.nombre}</td><td class="r">${x.n}</td><td><span class="bar" style="width:240px"><i style="width:${(100 * x.imp / maxImp).toFixed(0)}%"></i></span></td><td class="r">${u.eur(x.imp)}</td></tr>`).join('')}
        </tbody></table></div>`;
  }
};
