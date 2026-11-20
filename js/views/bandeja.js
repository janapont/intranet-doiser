// Leads: lista única de todas las fuentes.
D.views.bandeja = {
  filtro: { grupo: 'llamar', servicio: '', q: '' },
  grupos: {
    llamar: { t: 'Por llamar', f: l => ['nuevo', 'no_contesta', 'pendiente'].includes(l.estado) },
    enviar: { t: 'Por enviar', f: l => l.estado === 'cualificado' },
    enviado: { t: 'Enviados', f: l => l.estado === 'enviado' },
    invalido: { t: 'Descartados', f: l => l.estado === 'invalido' },
    todos: { t: 'Todos', f: () => true }
  },
  render() {
    const st = D.store.get(), u = D.u, fl = this.filtro;
    const base = st.leads.filter(l => (!fl.servicio || l.servicio === fl.servicio) &&
      (!fl.q || u.norm([l.id, l.contacto.nombre, l.contacto.apellidos, l.contacto.telefono, l.contacto.email, l.empresa.nombre].join(' ')).includes(u.norm(fl.q))));
    const asc = fl.grupo === 'llamar' || fl.grupo === 'enviar';
    const lista = base.filter(this.grupos[fl.grupo].f).sort((a, b) => asc ? a.creado.localeCompare(b.creado) : b.creado.localeCompare(a.creado));

    const detalle = l => {
      if (l.estado === 'no_contesta') return `<span class="dots">${[1, 2, 3].map(i => `<i class="${i <= l.intentos ? 'on' : ''}"></i>`).join('')}</span>`;
      if (l.estado === 'pendiente') return `<span class="sub">${u.esc(l.rellamar || '')}</span>`;
      if (l.estado === 'enviado') { const e = l.envios.filter(x => x.estado === 'enviado'); return `<span class="sub">${e.length} prov. · ${Math.round(e.reduce((a, x) => a + x.precio, 0))}€</span>`; }
      if (l.estado === 'invalido') return `<span class="sub">${u.esc(l.motivoInvalido)}</span>`;
      if ((l.avisos || []).length) return `<span class="pill p-amber">${u.esc(l.avisos[0])}</span>`;
      return '';
    };

    return `
      <div class="top"><h1>Leads</h1>
        <div class="row"><input placeholder="Buscar…" value="${u.esc(fl.q)}" data-change="bandejaQ" style="width:220px">
        <select data-change="bandejaServicio" style="width:auto"><option value="">Todos los servicios</option>${st.servicios.map(s => `<option value="${s.id}" ${s.id === fl.servicio ? 'selected' : ''}>${u.esc(s.nombre)}</option>`).join('')}</select></div></div>
      <div class="seg" style="margin-bottom:16px">${Object.entries(this.grupos).map(([k, g]) => `<span class="${k === fl.grupo ? 'on' : ''}" data-action="bandejaGrupo" data-g="${k}">${g.t}<b>${base.filter(g.f).length}</b></span>`).join('')}</div>
      <div class="card" style="padding:8px 12px">
        ${lista.length ? `<table><thead><tr><th>Cliente</th><th>Servicio</th><th>Provincia</th><th>Origen</th><th>Estado</th><th></th><th class="r">Entrada</th></tr></thead><tbody>
        ${lista.slice(0, 200).map(l => `<tr class="click" data-href="#lead-${l.id}">
          <td><div class="name">${u.esc(l.contacto.nombre)} ${u.esc(l.contacto.apellidos)}</div><div class="sub">${u.esc(l.empresa.nombre || l.contacto.telefono)}</div></td>
          <td>${u.esc(D.store.servicio(l.servicio)?.nombre || '—')}</td>
          <td>${u.esc(l.empresa.provincia) || '<span class="muted">—</span>'}</td>
          <td>${D.ui.fuente(l.fuente)}</td>
          <td>${D.ui.badgeEstado(l.estado)}</td>
          <td>${detalle(l)}</td>
          <td class="r sub">${u.hace(l.creado)}</td></tr>`).join('')}
        </tbody></table>` : '<div class="empty">Nada pendiente aquí</div>'}
      </div>`;
  }
};
D.act.bandejaGrupo = el => { D.views.bandeja.filtro.grupo = el.dataset.g; D.render(); };
D.act.bandejaServicio = el => { D.views.bandeja.filtro.servicio = el.value; D.render(); };
D.act.bandejaQ = el => { D.views.bandeja.filtro.q = el.value; D.render(); };
