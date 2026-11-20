// Ingesta: convierte lo que envía cada fuente en un lead con un formato único.
// En producción, cada función sería el manejador de un webhook:
//   web     -> POST desde el formulario de doiser.com
//   meta    -> webhook "leadgen" de Meta Lead Ads (o reenviado por GoHighLevel)
//   google  -> webhook de formularios de clientes potenciales de Google Ads
window.D = window.D || {};
D.ingest = (function () {
  const u = D.u;

  // Relación entre nombre de formulario/campaña y servicio interno.
  const MAPEO_FORMULARIOS = [
    [/prl|prevenci/i, 'prl'],
    [/lopd|protecci[oó]n de datos|rgpd/i, 'lopd'],
    [/gestor/i, 'gestoria'],
    [/furgo/i, 'renting_furgo'],
    [/renting.*coche|coches/i, 'renting_coche'],
    [/tpv/i, 'tpv'],
    [/horari|fichaje|presencia/i, 'control_horario'],
    [/baja|ilt/i, 'seguro_baja'],
    [/web|dise[nñ]o/i, 'web'],
    [/igualdad/i, 'igualdad']
  ];
  function servicioDesdeTexto(txt, servicios) {
    const porNombre = servicios.find(s => u.norm(s.nombre) === u.norm(txt) || s.id === txt);
    if (porNombre) return porNombre.id;
    for (const [re, id] of MAPEO_FORMULARIOS) if (re.test(txt || '')) return id;
    return null;
  }

  function provinciaValida(p) {
    if (!p) return '';
    const n = u.norm(p);
    return D.PROVINCIAS.find(x => u.norm(x) === n) || '';
  }

  function tipoCliente(t) {
    const n = u.norm(t);
    if (n.startsWith('aut')) return 'Autónomo';
    if (n.startsWith('emp') || n === 'sl' || n === 'sa') return 'Empresa';
    if (n.startsWith('par')) return 'Particular';
    return '';
  }

  function base(fuente, raw) {
    return {
      id: null, creado: new Date().toISOString(), fuente, campana: '', servicio: null,
      contacto: { nombre: '', apellidos: '', telefono: '', email: '' },
      empresa: { nombre: '', tipoCliente: '', provincia: '', poblacion: '' },
      respuestas: {}, comentario: '', utm: {}, dispositivo: '',
      raw, estado: 'nuevo', motivoInvalido: '', intentos: 0,
      llamadas: [], mensajes: [], envios: [], historial: [], responsable: '', duplicadoDe: null
    };
  }

  // Formulario de la web (doiser.com). Campos planos.
  function desdeWeb(p, servicios) {
    const l = base('web', p);
    l.campana = p.form || 'Formulario web';
    l.servicio = servicioDesdeTexto(p.servicio, servicios);
    l.contacto = { nombre: p.nombre || '', apellidos: p.apellidos || '', telefono: u.telefono(p.telefono), email: (p.email || '').trim().toLowerCase() };
    l.empresa = { nombre: p.empresa || '', tipoCliente: tipoCliente(p.tipo_cliente), provincia: provinciaValida(p.provincia), poblacion: p.poblacion || '' };
    if (p.trabajadores) l.respuestas.trabajadores = Number(p.trabajadores);
    l.comentario = p.comentario || '';
    l.dispositivo = p.dispositivo || '';
    l.utm = { source: p.utm_source || '', medium: p.utm_medium || '', campaign: p.utm_campaign || '' };
    return l;
  }

  // Lead de Meta Lead Ads: lista de pares name/values en field_data.
  function desdeMeta(p, servicios) {
    const l = base('meta', p);
    const f = {};
    (p.field_data || []).forEach(x => { f[u.norm(x.name).replace(/[^a-z0-9]+/g, '_')] = (x.values || [])[0]; });
    l.campana = p.campaign_name || p.form_name || 'Meta';
    l.servicio = servicioDesdeTexto(p.form_name || p.campaign_name, servicios);
    const full = (f.full_name || '').trim().split(/\s+/);
    l.contacto = { nombre: full[0] || '', apellidos: full.slice(1).join(' '), telefono: u.telefono(f.phone_number), email: (f.email || '').trim().toLowerCase() };
    l.empresa = { nombre: f.company_name || '', tipoCliente: tipoCliente(f.que_eres || f.tipo_de_cliente), provincia: provinciaValida(f.provincia || f.province), poblacion: f.city || '' };
    // Las preguntas propias del formulario se guardan como respuestas.
    const conocidos = ['full_name', 'phone_number', 'email', 'company_name', 'provincia', 'province', 'city', 'tipo_de_cliente'];
    Object.entries(f).forEach(([k, v]) => {
      if (conocidos.includes(k)) return;
      if (/trabajador/.test(k)) l.respuestas.trabajadores = Number(String(v).replace(/\D/g, '')) || '';
      else if (k === 'que_eres') l.respuestas.que_eres = v;
      else l.respuestas[k] = v;
    });
    l.creado = p.created_time ? new Date(p.created_time).toISOString() : l.creado;
    l.utm = { source: 'facebook', medium: 'paid', campaign: p.campaign_name || '' };
    return l;
  }

  // Lead de Google Ads (formulario de clientes potenciales): user_column_data.
  function desdeGoogle(p, servicios) {
    const l = base('google', p);
    const f = {};
    (p.user_column_data || []).forEach(x => { f[x.column_id || u.norm(x.column_name).replace(/[^a-z0-9]+/g, '_')] = x.string_value; });
    l.campana = p.campaign_name || ('Campaña ' + (p.campaign_id || ''));
    l.servicio = servicioDesdeTexto(p.campaign_name || '', servicios);
    const full = (f.FULL_NAME || '').trim().split(/\s+/);
    l.contacto = { nombre: full[0] || '', apellidos: full.slice(1).join(' '), telefono: u.telefono(f.PHONE_NUMBER), email: (f.EMAIL || '').trim().toLowerCase() };
    l.empresa = { nombre: f.COMPANY_NAME || '', tipoCliente: tipoCliente(f.tipo_de_cliente), provincia: provinciaValida(f.provincia || f.REGION), poblacion: f.CITY || '' };
    if (f.n_de_trabajadores) l.respuestas.trabajadores = Number(f.n_de_trabajadores) || '';
    l.utm = { source: 'google', medium: 'cpc', campaign: p.campaign_name || '', gclid: p.gcl_id || '' };
    return l;
  }

  const LECTORES = { web: desdeWeb, meta: desdeMeta, google: desdeGoogle };

  // Punto de entrada único: normaliza, detecta duplicados y avisa de datos que faltan.
  function recibir(fuente, payload, state) {
    const lead = LECTORES[fuente](payload, state.servicios);
    lead.id = 'L' + (++state.seq.lead);
    const avisos = [];
    if (!lead.servicio) avisos.push('No se reconoce el servicio: hay que asignarlo a mano.');
    if (!u.telefonoValido(lead.contacto.telefono)) avisos.push('Teléfono no válido o ausente.');
    if (!lead.empresa.provincia) avisos.push('Falta la provincia.');
    if (!lead.empresa.tipoCliente) avisos.push('Falta el tipo de cliente.');
    // Duplicado: mismo teléfono o email y mismo servicio en los últimos 30 días.
    const limite = Date.now() - 30 * 864e5;
    const dup = state.leads.find(x => x.servicio === lead.servicio && new Date(x.creado).getTime() > limite &&
      ((lead.contacto.telefono && x.contacto.telefono === lead.contacto.telefono) || (lead.contacto.email && x.contacto.email === lead.contacto.email)));
    if (dup) { lead.duplicadoDe = dup.id; avisos.push(`Posible duplicado de ${dup.id}.`); }
    lead.historial.push({ fecha: lead.creado, texto: `Entrada por ${D.FUENTES[fuente]} (${lead.campana})` });
    avisos.forEach(a => lead.historial.push({ fecha: lead.creado, texto: 'Aviso: ' + a }));
    lead.avisos = avisos;
    return lead;
  }

  return { recibir, servicioDesdeTexto, LECTORES };
})();

D.FUENTES = { web: 'Web doiser.com', meta: 'Meta (Facebook/Instagram)', google: 'Google Ads', manual: 'Alta manual' };
