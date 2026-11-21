// Configuración: reglas del algoritmo, automatismos y cuestionarios por servicio.
D.views.config = {
  render() {
    const st = D.store.get(), u = D.u, p = st.pesos;
    const etiquetas = { precio: 'Precio que paga', calidad: 'Pocas invalidaciones', conversion: 'Contrataciones', reparto: 'Reparto equilibrado', prioridad: 'Prioridad' };
        return `
      <div class="top"><h1>Ajustes</h1></div>
      <div class="cols">
        <div class="card"><h2>Peso de cada criterio</h2>
          <form id="fPesos" onsubmit="return false">${Object.keys(p).map(k => `<div class="row" style="justify-content:space-between;padding:6px 0"><span>${etiquetas[k]}</span>
            <span class="row"><input type="range" min="0" max="50" name="${k}" value="${p[k]}" data-change="cfgPeso" style="width:140px;padding:0"><b style="width:26px;text-align:right">${p[k]}</b></span></div>`).join('')}</form>
        </div>
        <div class="card"><h2>Automatismos</h2>
          <label class="check" style="font-size:14px;color:var(--text);padding:6px 0"><input type="checkbox" data-change="cfgAuto" ${st.config.modoAuto ? 'checked' : ''}> Enviar automáticamente al cualificar</label>
          <label class="check" style="font-size:14px;color:var(--text);padding:6px 0"><input type="checkbox" data-change="cfgWaB" ${st.config.waBienvenida ? 'checked' : ''}> WhatsApp de bienvenida al entrar el lead</label>
          <label class="check" style="font-size:14px;color:var(--text);padding:6px 0"><input type="checkbox" data-change="cfgWa" ${st.config.whatsapp ? 'checked' : ''}> WhatsApp si no contesta (cierra tras ${D.MAX_INTENTOS})</label>
          <div class="row" style="justify-content:space-between;margin-top:14px"><span>Usuario</span><select data-change="cfgUsuario" style="width:auto">${['Dani', 'Joan', 'Marcel', 'Ignasi', 'Òscar'].map(x => `<option ${x === st.config.usuario ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div class="row" style="justify-content:space-between;margin-top:14px"><span>Datos de prueba</span><button class="btn" data-action="cfgReset">Reiniciar</button></div>
        </div>
      </div>
      <div class="card" style="padding:8px 12px"><table><thead><tr><th>Servicio</th><th>Preguntas en la llamada</th><th class="r">Máx. proveedores</th></tr></thead><tbody>
        ${st.servicios.map((s, i) => `<tr><td><div class="name">${u.esc(s.nombre)}</div><div class="sub">${s.cplRef} € ref.</div></td>
          <td class="small">${s.preguntas.map(q => `<span class="${q.obligatorio ? 'req' : ''}">${u.esc(q.label)}</span>`).join(' · ')}</td>
          <td class="r"><select data-change="cfgMax" data-i="${i}" style="width:64px">${[1, 2, 3].map(n => `<option ${n === s.maxProveedores ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div>`;
  }
};
D.act.cfgPeso = el => { D.store.get().pesos[el.name] = Number(el.value); D.store.guardar(); D.render(); };
D.act.cfgAuto = el => { D.store.get().config.modoAuto = el.checked; D.store.guardar();  };
D.act.cfgWaB = el => { D.store.get().config.waBienvenida = el.checked; D.store.guardar(); };
D.act.cfgWa = el => { D.store.get().config.whatsapp = el.checked; D.store.guardar(); };
D.act.cfgUsuario = el => { D.store.get().config.usuario = el.value; D.store.guardar(); };
D.act.cfgMax = el => { D.store.get().servicios[Number(el.dataset.i)].maxProveedores = Number(el.value); D.store.guardar(); D.ui.toast('Guardado'); };
D.act.cfgReset = () => { D.store.reiniciar(); D.views.entrada.ultimo = null; D.go('#resumen'); D.ui.toast('Demo reiniciada'); };
