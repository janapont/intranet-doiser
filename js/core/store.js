// Estado de la aplicación y operaciones de negocio.
// La capa de datos está aislada aquí: en producción, estas funciones llamarían a la API
// de la intranet (PHP + MySQL) en lugar de guardar en el navegador.
window.D = window.D || {};

D.ESTADOS = {
  nuevo: { label: 'Nuevo', color: 'azul', desc: 'Pendiente de primera llamada' },
  no_contesta: { label: 'No contesta', color: 'rojo', desc: 'Llamado sin respuesta; se reintenta' },
  pendiente: { label: 'Llamar más tarde', color: 'ambar', desc: 'El cliente pidió que se le llame luego' },
  cualificado: { label: 'Cualificado', color: 'violeta', desc: 'Datos completos, listo para asignar' },
  enviado: { label: 'Enviado', color: 'verde', desc: 'Enviado a proveedores' },
  invalido: { label: 'Inválido', color: 'gris', desc: 'Descartado' }
};
D.RESULTADOS_LLAMADA = { ok: 'Contactado', no_contesta: 'No contesta', mas_tarde: 'Pide que se le llame más tarde', invalido: 'Inválido' };
D.MOTIVOS_INVALIDO = ['Datos incorrectos', 'No necesita el servicio', 'No localizado', 'Duplicado', 'Sin proveedor disponible', 'Es un proveedor, no un cliente'];
D.MAX_INTENTOS = 3;

D.store = (function () {
  const KEY = 'doiser-gestor-demo-v2';
  let state = null;

  function vacio() {
    return {
      version: 1,
      servicios: D.u.copia(D.SEED_SERVICIOS),
      proveedores: D.u.copia(D.SEED_PROVEEDORES),
      pesos: D.u.copia(D.SEED_PESOS),
      config: { modoAuto: false, whatsapp: true, usuario: 'Dani' },
      leads: [], facturas: [],
      seq: { lead: 1000, factura: 0 }
    };
  }

  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento: la demo funciona en memoria */ }
  }

  function cargar() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { state = JSON.parse(raw); return state; }
    } catch (e) { /* ignorado */ }
    return reiniciar();
  }

  function reiniciar() {
    state = vacio();
    D.demo.generar(state);
    guardar();
    return state;
  }

  return {
    cargar, guardar, reiniciar,
    get: () => state,
    lead: id => state.leads.find(l => l.id === id),
    proveedor: id => state.proveedores.find(p => p.id === id),
    servicio: id => state.servicios.find(s => s.id === id)
  };
})();

// Operaciones de negocio sobre un lead.
D.ops = (function () {
  const u = D.u;
  const st = () => D.store.get();
  const log = (lead, texto) => lead.historial.push({ fecha: new Date().toISOString(), texto, usuario: st().config.usuario });

  function textoWhatsApp(lead, intento) {
    const s = D.store.servicio(lead.servicio);
    const serv = s ? s.nombre.toLowerCase() : 'el servicio que solicitaste';
    if (intento === 1) return `Hola ${lead.contacto.nombre}, soy de Doiser. Te hemos llamado por tu solicitud de ${serv} y no hemos podido hablar contigo. ¿Cuándo te va bien que te llamemos?`;
    if (intento === 2) return `Hola ${lead.contacto.nombre}, seguimos con tu solicitud de ${serv}. Responde a este mensaje con la hora que prefieras y te llamamos.`;
    return `Hola ${lead.contacto.nombre}, como no hemos podido contactar contigo cerramos tu solicitud de ${serv}. Si aún lo necesitas, responde a este mensaje y la reabrimos.`;
  }

  function registrarLlamada(lead, resultado, nota, extra = {}) {
    lead.llamadas.push({ fecha: new Date().toISOString(), resultado, nota: nota || '', usuario: st().config.usuario });
    log(lead, `Llamada: ${D.RESULTADOS_LLAMADA[resultado]}${nota ? ' — ' + nota : ''}`);
    if (resultado === 'no_contesta') {
      lead.intentos = (lead.intentos || 0) + 1;
      if (st().config.whatsapp) {
        lead.mensajes.push({ fecha: new Date().toISOString(), canal: 'whatsapp', plantilla: 'no_contesta_' + Math.min(lead.intentos, 3), texto: textoWhatsApp(lead, Math.min(lead.intentos, 3)) });
        log(lead, `WhatsApp automático enviado (plantilla no_contesta_${Math.min(lead.intentos, 3)})`);
      }
      if (lead.intentos >= D.MAX_INTENTOS) { invalidar(lead, 'No localizado'); }
      else lead.estado = 'no_contesta';
    } else if (resultado === 'mas_tarde') {
      lead.estado = 'pendiente';
      lead.rellamar = extra.rellamar || '';
    } else if (resultado === 'ok') {
      if (['nuevo', 'no_contesta', 'pendiente'].includes(lead.estado)) lead.estado = 'nuevo';
      lead.contactado = true;
    } else if (resultado === 'invalido') {
      invalidar(lead, extra.motivo || 'Datos incorrectos');
    }
    D.store.guardar();
  }

  function invalidar(lead, motivo) {
    lead.estado = 'invalido'; lead.motivoInvalido = motivo;
    log(lead, 'Marcado como inválido: ' + motivo);
    D.store.guardar();
  }

  function reabrir(lead) {
    lead.estado = 'nuevo'; lead.motivoInvalido = ''; lead.intentos = 0;
    log(lead, 'Reabierto');
    D.store.guardar();
  }

  // Guarda los datos del cuestionario. Si no falta nada, pasa a "cualificado".
  function guardarDatos(lead, datos) {
    Object.assign(lead.contacto, datos.contacto || {});
    Object.assign(lead.empresa, datos.empresa || {});
    if (datos.servicio && datos.servicio !== lead.servicio) { log(lead, `Servicio cambiado a ${D.store.servicio(datos.servicio).nombre}`); lead.servicio = datos.servicio; }
    lead.respuestas = Object.assign({}, lead.respuestas, datos.respuestas || {});
    if (datos.comentario !== undefined) lead.comentario = datos.comentario;
    lead.contacto.telefono = u.telefono(lead.contacto.telefono);
    const s = D.store.servicio(lead.servicio);
    const faltan = D.matching.faltanObligatorios(lead, s);
    const contactado = lead.contactado || lead.llamadas.some(c => c.resultado === 'ok');
    if (!faltan.length && contactado && ['nuevo', 'no_contesta', 'pendiente'].includes(lead.estado)) {
      lead.estado = 'cualificado'; lead.cualificado = new Date().toISOString();
      log(lead, 'Cualificado: datos completos');
    } else log(lead, 'Datos actualizados');
    D.store.guardar();
    return faltan;
  }

  function enviar(lead, ids) {
    const ev = D.matching.evaluar(lead, st());
    const ahora = new Date().toISOString();
    const enviados = [];
    for (const pid of ids) {
      const c = ev.candidatos.find(x => x.p.id === pid);
      if (!c) continue;
      lead.envios.push({ proveedorId: pid, precio: c.precio, puntos: c.puntos, fecha: ahora, estado: 'enviado', canal: c.p.entrega, facturaId: null });
      enviados.push(c);
    }
    if (!enviados.length) return [];
    const s = ev.servicio;
    if (s && enviados.length < s.maxProveedores) lead.motivoNoTriple = ev.motivoNoTriple || 'Decisión del comercial';
    lead.estado = 'enviado';
    log(lead, `Enviado a ${enviados.map(c => c.p.nombre).join(', ')} (${u.eur(enviados.reduce((a, c) => a + c.precio, 0))})`);
    D.store.guardar();
    return enviados;
  }

  // El proveedor rechaza el lead (no se le factura).
  function invalidarEnvio(lead, pid, motivo) {
    const e = lead.envios.find(x => x.proveedorId === pid && x.estado === 'enviado');
    if (!e || e.facturaId) return false;
    e.estado = 'invalidado'; e.motivo = motivo;
    log(lead, `${D.store.proveedor(pid).nombre} invalida el lead: ${motivo}`);
    D.store.guardar();
    return true;
  }

  // Mensaje que recibiría el proveedor.
  function mensajeProveedor(lead, p) {
    const s = D.store.servicio(lead.servicio);
    const resp = s.preguntas.filter(q => lead.respuestas[q.id] !== undefined && lead.respuestas[q.id] !== '')
      .map(q => ({ pregunta: q.label, respuesta: lead.respuestas[q.id] }));
    if (p.entrega === 'email') {
      return {
        tipo: 'email', para: p.email, asunto: `Nuevo cliente Doiser: ${s.nombre} en ${lead.empresa.provincia}`,
        cuerpo: [
          `Hola ${p.nombre},`, '', `Te pasamos un cliente interesado en ${s.nombre}. Ya está informado de que le llamaréis.`, '',
          `Nombre: ${lead.contacto.nombre} ${lead.contacto.apellidos}`, `Teléfono: ${lead.contacto.telefono}`, `Email: ${lead.contacto.email}`,
          `Empresa: ${lead.empresa.nombre || '—'} (${lead.empresa.tipoCliente})`, `Zona: ${lead.empresa.poblacion ? lead.empresa.poblacion + ', ' : ''}${lead.empresa.provincia}`, '',
          ...resp.map(r => `${r.pregunta}: ${r.respuesta}`), '', lead.comentario ? `Comentario: ${lead.comentario}` : '',
          'Si el contacto no es válido, puedes invalidarlo desde tu área de proveedor en 7 días.'
        ].join('\n')
      };
    }
    return {
      tipo: p.entrega, para: p.entrega === 'webhook' ? 'https://crm.' + p.email.split('@')[1] + '/webhooks/doiser' : p.email,
      json: {
        lead_id: lead.id, servicio: s.nombre, fecha: new Date().toISOString(),
        contacto: lead.contacto, empresa: lead.empresa, respuestas: lead.respuestas, comentario: lead.comentario
      }
    };
  }

  return { registrarLlamada, invalidar, reabrir, guardarDatos, enviar, invalidarEnvio, mensajeProveedor, textoWhatsApp };
})();
