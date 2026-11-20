// Configuración: reglas del algoritmo, automatismos y cuestionarios por servicio.
D.views.config = {
  render() {
    const st = D.store.get(), u = D.u, p = st.pesos;
    const etiquetas = { precio: 'Precio que paga', calidad: 'Pocas invalidaciones', conversion: 'Tasa de contratación', reparto: 'Reparto equilibrado (margen de su límite)', prioridad: 'Prioridad e importancia' };
    const suma = Object.values(p).reduce((a, b) => a + Number(b), 0);
    return `
      <div class="head"><div><h1>Configuración</h1><p>Reglas que usa el sistema. Al cambiarlas, la selección de proveedores de los leads se recalcula al momento.</p></div></div>
      <div class="grid2">
        <div class="panel"><h2>Pesos del algoritmo</h2><p class="sub">Importancia de cada criterio al puntuar a los proveedores que pasan los filtros. Suma actual: <b>${suma}</b>.</p>
          <form id="fPesos" class="form" style="grid-template-columns:1fr 90px">
            ${Object.keys(p).map(k => `<span>${etiquetas[k]}</span><input type="number" min="0" max="100" name="${k}" value="${p[k]}">`).join('')}
          </form>
          <div class="btns" style="margin-top:12px"><button class="btn pri" data-action="cfgPesos">Guardar pesos</button></div>
          <p class="small muted">Filtros obligatorios (no puntúan, excluyen): ofrece el servicio, no está pausado, cubre la provincia, acepta ese tipo de cliente, rango de trabajadores, sin impagos, no ha superado su límite diario o mensual y no ha recibido ya a este cliente en 90 días.</p>
        </div>
        <div class="panel"><h2>Automatismos</h2>
          <label class="f" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" style="width:auto" data-change="cfgAuto" ${st.config.modoAuto ? 'checked' : ''}> Envío automático al cualificar (sin confirmación del comercial)</label>
          <label class="f" style="flex-direction:row;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" style="width:auto" data-change="cfgWa" ${st.config.whatsapp ? 'checked' : ''}> WhatsApp automático cuando no contesta (máx. ${D.MAX_INTENTOS} intentos, luego se cierra como «No localizado»)</label>
          <label class="f" style="margin-top:12px">Usuario de la demo<select data-change="cfgUsuario">${['Dani', 'Joan', 'Marcel', 'Ignasi', 'Òscar'].map(x => `<option ${x === st.config.usuario ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
          <h3>Datos de la demo</h3><p class="small muted">Vuelve a generar el histórico ficticio y borra los cambios hechos.</p>
          <button class="btn ko" data-action="cfgReset">Reiniciar demo</button>
        </div>
      </div>
      <div class="panel"><h2>Servicios y cuestionarios</h2><p class="sub">Cada servicio tiene sus preguntas. Las marcadas con * son obligatorias para cualificar. Añadir una línea nueva es añadir un servicio con su cuestionario.</p>
        <table><thead><tr><th>Servicio</th><th class="r">Precio ref.</th><th class="r">Máx. proveedores</th><th>Clientes</th><th>Preguntas</th></tr></thead><tbody>
        ${st.servicios.map((s, i) => `<tr><td><b>${u.esc(s.nombre)}</b><div class="small muted">${u.esc(s.categoria)}</div></td>
          <td class="r">${s.cplRef} €</td>
          <td class="r"><select data-change="cfgMax" data-i="${i}" style="width:64px">${[1, 2, 3].map(n => `<option ${n === s.maxProveedores ? 'selected' : ''}>${n}</option>`).join('')}</select></td>
          <td class="small">${s.tiposCliente.join(', ')}</td>
          <td class="small">${s.preguntas.map(q => u.esc(q.label) + (q.obligatorio ? ' *' : '')).join(' · ')}</td></tr>`).join('')}
        </tbody></table></div>`;
  }
};
D.act.cfgPesos = () => {
  const d = Object.fromEntries(new FormData(document.getElementById('fPesos')).entries());
  const st = D.store.get();
  Object.keys(st.pesos).forEach(k => { st.pesos[k] = Math.max(0, Number(d[k]) || 0); });
  D.store.guardar(); D.render(); D.ui.toast('Pesos guardados');
};
D.act.cfgAuto = el => { D.store.get().config.modoAuto = el.checked; D.store.guardar(); D.ui.toast(el.checked ? 'Envío automático activado' : 'Envío automático desactivado'); };
D.act.cfgWa = el => { D.store.get().config.whatsapp = el.checked; D.store.guardar(); };
D.act.cfgUsuario = el => { D.store.get().config.usuario = el.value; D.store.guardar(); };
D.act.cfgMax = el => { D.store.get().servicios[Number(el.dataset.i)].maxProveedores = Number(el.value); D.store.guardar(); D.ui.toast('Guardado'); };
D.act.cfgReset = () => { D.store.reiniciar(); D.views.entrada.ultimo = null; D.go('#resumen'); D.ui.toast('Demo reiniciada'); };
