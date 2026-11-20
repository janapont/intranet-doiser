// Bandeja única de leads, con todas las fuentes juntas.
D.views.bandeja = {
  filtro: { grupo: 'llamar', servicio: '', fuente: '', q: '' },
  grupos: {
    llamar: { t: 'Por llamar', f: l => ['nuevo', 'no_contesta', 'pendiente'].includes(l.estado) },
    asignar: { t: 'Por enviar', f: l => l.estado === 'cualificado' },
    enviado: { t: 'Enviados', f: l => l.estado === 'enviado' },
    invalido: { t: 'Inválidos', f: l => l.estado === 'invalido' },
    todos: { t: 'Todos', f: () => true }
  },
  render() {
    const st = D.store.get(), u = D.u, fl = this.filtro;
    const base = st.leads.filter(l => (!fl.servicio || l.servicio === fl.servicio) && (!fl.fuente || l.fuente === fl.fuente) &&
      (!fl.q || u.norm([l.id, l.contacto.nombre, l.contacto.apellidos, l.contacto.telefono, l.contacto.email, l.empresa.nombre].join(' ')).includes(u.norm(fl.q))));
    let lista = base.filter(this.grupos[fl.grupo].f);
    // Orden: por llamar, primero los más antiguos; resto, los más recientes.
    lista = lista.slice().sort((a, b) => fl.grupo === 'llamar' || fl.grupo === 'asignar' ? a.creado.localeCompare(b.creado) : b.creado.localeCompare(a.creado));
    const opt = (arr, sel) => arr.map(([v, t]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${u.esc(t)}</option>`).join('');
    return `
      <div class="head"><div><h1>Bandeja de leads</h1><p>Todas las fuentes en una sola lista. «Por llamar» se ordena del más antiguo al más nuevo para que nadie se quede sin atender.</p></div>
        <a class="btn" href="#entrada">+ Simular lead</a></div>
      <div class="tabs">${Object.entries(this.grupos).map(([k, g]) => `<span class="tab ${k === fl.grupo ? 'on' : ''}" data-action="bandejaGrupo" data-g="${k}">${g.t} (${base.filter(g.f).length})</span>`).join('')}</div>
      <div class="panel">
        <div class="form" style="grid-template-columns: 2fr 1fr 1fr; margin-bottom: 10px">
          <input placeholder="Buscar nombre, teléfono, email, empresa o ID" value="${u.esc(fl.q)}" data-change="bandejaQ">
          <select data-change="bandejaServicio"><option value="">Todos los servicios</option>${opt(st.servicios.map(s => [s.id, s.nombre]), fl.servicio)}</select>
          <select data-change="bandejaFuente"><option value="">Todas las fuentes</option>${opt(Object.entries(D.FUENTES), fl.fuente)}</select>
        </div>
        <table><thead><tr><th>ID</th><th>Entrada</th><th>Fuente</th><th>Servicio</th><th>Cliente</th><th>Provincia</th><th>Estado</th><th>Info</th><th>Resp.</th></tr></thead><tbody>
        ${lista.slice(0, 200).map(l => {
          const s = D.store.servicio(l.servicio);
          let info = '';
          if (l.estado === 'no_contesta') info = `${l.intentos}/${D.MAX_INTENTOS} intentos`;
          else if (l.estado === 'pendiente') info = l.rellamar ? 'Rellamar ' + u.esc(l.rellamar) : 'Rellamar';
          else if (l.estado === 'enviado') info = `${l.envios.filter(e => e.estado === 'enviado').length} prov. · ${u.eur(l.envios.filter(e => e.estado === 'enviado').reduce((a, e) => a + e.precio, 0))}`;
          else if (l.estado === 'invalido') info = u.esc(l.motivoInvalido);
          else if ((l.avisos || []).length && l.estado === 'nuevo') info = `<span class="badge b-ambar">${l.avisos.length} aviso(s)</span>`;
          return `<tr class="click" data-href="#lead-${l.id}">
            <td><b>${l.id}</b></td><td title="${u.fechaHora(l.creado)}">${u.hace(l.creado)}</td><td>${D.ui.fuente(l.fuente)}</td>
            <td>${s ? u.esc(s.nombre) : '<span class="badge b-ambar">Sin servicio</span>'}</td>
            <td>${u.esc(l.contacto.nombre)} ${u.esc(l.contacto.apellidos)}<div class="small muted">${u.esc(l.empresa.nombre || l.empresa.tipoCliente || '')}</div></td>
            <td>${u.esc(l.empresa.provincia) || '<span class="muted">—</span>'}</td><td>${D.ui.badgeEstado(l.estado)}</td><td class="small">${info}</td><td class="small">${u.esc(l.responsable)}</td></tr>`;
        }).join('') || '<tr><td colspan="9" class="muted">No hay leads con estos filtros.</td></tr>'}
        </tbody></table>
        ${lista.length > 200 ? `<p class="small muted">Mostrando 200 de ${lista.length}.</p>` : ''}
      </div>`;
  }
};
D.act.bandejaGrupo = el => { D.views.bandeja.filtro.grupo = el.dataset.g; D.render(); };
D.act.bandejaServicio = el => { D.views.bandeja.filtro.servicio = el.value; D.render(); };
D.act.bandejaFuente = el => { D.views.bandeja.filtro.fuente = el.value; D.render(); };
D.act.bandejaQ = el => { D.views.bandeja.filtro.q = el.value; D.render(); };
