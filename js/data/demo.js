// Construcción de payloads simulados (como los enviaría cada fuente) y generación de la demo.
window.D = window.D || {};
D.demo = (function () {
  const u = D.u;

  // Datos sencillos -> payload con el formato real de cada fuente.
  function payload(fuente, d, servicio) {
    const nombreCompleto = `${d.nombre} ${d.apellidos}`.trim();
    if (fuente === 'web') {
      return {
        pagina: 'doiser.com/' + servicio.id.replace(/_/g, '-') + '/', servicio: servicio.nombre,
        nombre_apellidos: nombreCompleto, email: d.email, telefono: d.telefono, comentarios: d.comentario || '',
        acepta_rgpd: true, newsletter: !!d.newsletter, dispositivo: d.dispositivo || 'movil'
      };
    }
    if (fuente === 'meta') {
      const fd = [
        { name: 'full_name', values: [nombreCompleto] },
        { name: 'phone_number', values: [d.telefono] },
        { name: 'email', values: [d.email] }
      ];
      // Algunos anuncios añaden una pregunta propia de la línea.
      Object.entries(d.extra || {}).forEach(([k, v]) => { if (v !== '' && v !== undefined) fd.push({ name: k, values: [String(v)] }); });
      return {
        id: String(Math.floor(1e14 + Math.random() * 9e14)),
        created_time: d.fecha || new Date().toISOString(),
        ad_name: `Anuncio ${servicio.nombre} vídeo`, campaign_name: `Leads ${servicio.nombre}`,
        form_name: `Leads ${servicio.nombre} form`, platform: 'fb', field_data: fd
      };
    }
    // Google Ads lead form
    const ucd = [
      { column_id: 'FULL_NAME', string_value: nombreCompleto },
      { column_id: 'PHONE_NUMBER', string_value: d.telefono },
      { column_id: 'EMAIL', string_value: d.email }
    ];
    return {
      lead_id: 'TeSter-' + Math.random().toString(36).slice(2, 10), api_version: '1.0', form_id: 40000000000 + Math.floor(Math.random() * 1e6),
      campaign_id: 20000000000 + Math.floor(Math.random() * 1e6), campaign_name: `Search ${servicio.nombre}`,
      gcl_id: 'Cj0KCQ' + Math.random().toString(36).slice(2, 12), is_test: true, user_column_data: ucd
    };
  }

  function elegir(rnd, pares) {
    const total = pares.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * total;
    for (const [v, w] of pares) { r -= w; if (r <= 0) return v; }
    return pares[pares.length - 1][0];
  }

  function respuestaAleatoria(rnd, q, tipoCliente) {
    if (q.tipo === 'number') {
      if (q.id === 'trabajadores') return tipoCliente === 'Autónomo' ? Math.floor(rnd() * 3) : 2 + Math.floor(rnd() * (rnd() < 0.15 ? 120 : 25));
      if (q.id === 'km') return 10000 + Math.floor(rnd() * 5) * 10000;
      return 1 + Math.floor(rnd() * 3);
    }
    if (q.tipo === 'select') return q.opciones[Math.floor(rnd() * q.opciones.length)];
    if (q.id === 'profesion') return elegir(rnd, [['Fontanero', 1], ['Electricista', 1], ['Diseñadora', 1], ['Fisioterapeuta', 1], ['Transportista', 1]]);
    return elegir(rnd, [['Comercio', 1], ['Hostelería', 1], ['Construcción', 1], ['Servicios', 1]]);
  }

  // Genera un histórico creíble: mes anterior cerrado y mes en curso a medias.
  function generar(state) {
    const rnd = D.rng(20261120);
    const servPesos = [['prl', 25], ['lopd', 15], ['renting_furgo', 15], ['gestoria', 10], ['renting_coche', 10], ['tpv', 10], ['control_horario', 5], ['seguro_baja', 5], ['web', 3], ['igualdad', 2]];
    const provPesos = [['Madrid', 18], ['Barcelona', 14], ['Valencia', 6], ['Alicante', 4], ['Málaga', 4], ['Sevilla', 4], ['Murcia', 3], ['Vizcaya', 2], ['Zaragoza', 2], ['Islas Baleares', 2], ['Girona', 2], ['Toledo', 2], ['A Coruña', 2], ['Las Palmas', 1], ['Badajoz', 1], ['Asturias', 1], ['Valladolid', 1], ['Granada', 1]];
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const diasAnterior = Math.round((inicioMes - inicioAnterior) / 864e5);
    const diasActual = Math.max(1, ahora.getDate());

    function nuevoLead(fecha) {
      const sid = elegir(rnd, servPesos);
      const s = state.servicios.find(x => x.id === sid);
      const fuente = elegir(rnd, [['meta', 60], ['web', 25], ['google', 15]]);
      const tipo = s.tiposCliente.length === 1 ? s.tiposCliente[0] : elegir(rnd, s.tiposCliente.map(t => [t, t === 'Particular' ? 1 : 3]));
      const nombre = D.NOMBRES[Math.floor(rnd() * D.NOMBRES.length)];
      const ap = D.APELLIDOS[Math.floor(rnd() * D.APELLIDOS.length)] + ' ' + D.APELLIDOS[Math.floor(rnd() * D.APELLIDOS.length)];
      const telefono = '6' + String(Math.floor(rnd() * 1e8)).padStart(8, '0');
      const d = {
        nombre, apellidos: ap, telefono, email: u.norm(nombre) + '.' + u.norm(ap.split(' ')[0]) + Math.floor(rnd() * 90 + 10) + '@example.com',
        empresa: tipo === 'Particular' ? '' : D.NEGOCIOS[Math.floor(rnd() * D.NEGOCIOS.length)],
        tipoCliente: rnd() < 0.15 ? '' : tipo,
        provincia: rnd() < 0.12 ? '' : elegir(rnd, provPesos),
        fecha: fecha.toISOString(),
        comentario: rnd() < 0.3 ? D.demo.COMENTARIOS[Math.floor(rnd() * D.demo.COMENTARIOS.length)] : '',
        extra: fuente === 'meta' ? D.demo.preguntaMeta(s, rnd) : {}
      };
      const lead = D.ingest.recibir(fuente, payload(fuente, d, s), state);
      lead.creado = fecha.toISOString();
      lead.historial.forEach(h => { h.fecha = lead.creado; });
      lead.responsable = elegir(rnd, [['Dani', 1], ['Joan', 1], ['Marcel', 1]]);
      lead._perfil = { tipo, empresa: d.empresa };
      D.ops.bienvenida(lead);
      state.leads.push(lead);
      return { lead, s };
    }

    function completar(lead, s) {
      if (!lead.empresa.provincia) lead.empresa.provincia = elegir(rnd, provPesos);
      if (!lead.empresa.tipoCliente) lead.empresa.tipoCliente = lead._perfil.tipo;
      if (!lead.empresa.nombre && lead._perfil.empresa) lead.empresa.nombre = lead._perfil.empresa;
      for (const q of s.preguntas) if (lead.respuestas[q.id] === undefined || lead.respuestas[q.id] === '') {
        if (q.obligatorio || rnd() < 0.6) lead.respuestas[q.id] = respuestaAleatoria(rnd, q, lead.empresa.tipoCliente);
      }
    }

    function llamar(lead, fecha, resultado) {
      lead.llamadas.push({ fecha: fecha.toISOString(), resultado, nota: '', usuario: lead.responsable });
      lead.historial.push({ fecha: fecha.toISOString(), texto: `Llamada: ${D.RESULTADOS_LLAMADA[resultado]}` });
    }

    function enviarHistorico(lead, s, fecha) {
      completar(lead, s);
      llamar(lead, fecha, 'ok');
      const ev = D.matching.evaluar(lead, state);
      if (!ev.seleccion.length) {
        lead.estado = 'invalido'; lead.motivoInvalido = 'Sin proveedor disponible';
        lead.historial.push({ fecha: fecha.toISOString(), texto: 'Inválido: sin proveedor disponible' });
        return;
      }
      lead.estado = 'enviado'; lead.cualificado = fecha.toISOString(); lead.motivoNoTriple = ev.motivoNoTriple;
      for (const pid of ev.seleccion) {
        const c = ev.candidatos.find(x => x.p.id === pid);
        const invalidado = rnd() < c.p.invalidacion;
        lead.envios.push({ proveedorId: pid, precio: c.precio, puntos: c.puntos, fecha: fecha.toISOString(), estado: invalidado ? 'invalidado' : 'enviado', canal: c.p.entrega, facturaId: null });
      }
      lead.historial.push({ fecha: fecha.toISOString(), texto: `Enviado a ${ev.seleccion.length} proveedor(es)` });
    }

    // Mes anterior: 80 leads, casi todos gestionados.
    for (let i = 0; i < 80; i++) {
      const f = new Date(inicioAnterior.getTime() + rnd() * diasAnterior * 864e5);
      f.setHours(9 + Math.floor(rnd() * 10), Math.floor(rnd() * 60));
      const { lead, s } = nuevoLead(f);
      const r = rnd();
      const fGest = new Date(f.getTime() + (1 + rnd() * 20) * 3600e3);
      if (r < 0.78) enviarHistorico(lead, s, fGest);
      else if (r < 0.92) { llamar(lead, fGest, 'no_contesta'); llamar(lead, fGest, 'no_contesta'); llamar(lead, fGest, 'no_contesta'); lead.intentos = 3; lead.estado = 'invalido'; lead.motivoInvalido = 'No localizado'; }
      else { llamar(lead, fGest, 'ok'); lead.estado = 'invalido'; lead.motivoInvalido = 'Datos incorrectos'; }
    }

    // Mes actual: 55 leads en todos los estados.
    for (let i = 0; i < 55; i++) {
      const edadDias = rnd() * Math.min(diasActual - 0.1, 19);
      const f = new Date(ahora.getTime() - edadDias * 864e5 - rnd() * 3 * 3600e3);
      if (f < inicioMes) f.setTime(inicioMes.getTime() + 3600e3 * (8 + rnd() * 8));
      const { lead, s } = nuevoLead(f);
      const edadH = (ahora - f) / 3600e3;
      const fGest = new Date(Math.min(ahora.getTime() - 60e3, f.getTime() + (0.5 + rnd() * 6) * 3600e3));
      if (edadH < 5) continue; // recién llegados: nuevos
      const r = rnd();
      if (edadH > 30 && r < 0.62) enviarHistorico(lead, s, fGest);
      else if (r < 0.75) { llamar(lead, fGest, 'no_contesta'); lead.intentos = 1; lead.estado = 'no_contesta'; lead.mensajes.push({ fecha: fGest.toISOString(), canal: 'whatsapp', plantilla: 'no_contesta_1', texto: D.ops.textoWhatsApp(lead, 1) }); }
      else if (r < 0.85) { llamar(lead, fGest, 'mas_tarde'); lead.estado = 'pendiente'; }
      else if (r < 0.93) { completar(lead, s); llamar(lead, fGest, 'ok'); lead.estado = 'cualificado'; lead.cualificado = fGest.toISOString(); }
      else { llamar(lead, fGest, 'ok'); lead.estado = 'invalido'; lead.motivoInvalido = 'No necesita el servicio'; }
    }
    state.leads.forEach(l => { delete l._perfil; });
    state.leads.sort((a, b) => b.creado.localeCompare(a.creado));
  }

  // Pregunta propia que llevan algunos formularios de Meta.
  function preguntaMeta(s, rnd = Math.random) {
    const q = s.preguntas.find(x => ['que_eres', 'sector', 'negocio', 'tipo_web'].includes(x.id));
    if (!q) return {};
    return { [q.id]: q.opciones ? q.opciones[Math.floor(rnd() * q.opciones.length)] : 'Comercio' };
  }
  const COMENTARIOS = ['Quiero comparar precios', 'Llamadme por la tarde', 'Es urgente', 'Ahora tengo otro proveedor y quiero cambiar', 'Somos una empresa pequeña'];
  return { payload, generar, respuestaAleatoria, elegir, preguntaMeta, COMENTARIOS };
})();
