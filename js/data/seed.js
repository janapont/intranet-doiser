// Datos de demostración. TODO es ficticio: servicios, precios, proveedores y clientes.
// Sirven para probar el flujo completo sin tocar ningún sistema real.
window.D = window.D || {};

D.TIPOS_CLIENTE = ['Autónomo', 'Empresa', 'Particular'];

// Servicios (subcategorías) con su cuestionario de cualificación.
// Campo "obligatorio": no se puede cualificar el lead sin él.
D.SEED_SERVICIOS = [
  {
    id: 'prl', nombre: 'Prevención de riesgos laborales', categoria: 'Formación y RR. HH.', cplRef: 30, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'trabajadores', label: 'Nº de trabajadores', tipo: 'number', obligatorio: true },
      { id: 'actividad', label: 'Actividad principal', tipo: 'select', opciones: ['Oficina', 'Comercio', 'Hostelería', 'Construcción', 'Industria', 'Transporte', 'Sanitario', 'Otra'], obligatorio: true },
      { id: 'tiene_spa', label: '¿Tiene servicio de prevención actualmente?', tipo: 'select', opciones: ['No', 'Sí, quiere cambiar'], obligatorio: true },
      { id: 'vigilancia', label: '¿Necesita vigilancia de la salud?', tipo: 'select', opciones: ['Sí', 'No', 'No lo sabe'] }
    ]
  },
  {
    id: 'lopd', nombre: 'LOPD y protección de datos', categoria: 'Administración', cplRef: 35, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'trabajadores', label: 'Nº de trabajadores', tipo: 'number', obligatorio: true },
      { id: 'web', label: '¿Tiene web o tienda online?', tipo: 'select', opciones: ['No', 'Web', 'Tienda online'], obligatorio: true },
      { id: 'datos_sensibles', label: '¿Trata datos de salud u otros sensibles?', tipo: 'select', opciones: ['No', 'Sí'] }
    ]
  },
  {
    id: 'gestoria', nombre: 'Gestoría y asesoría', categoria: 'Administración', cplRef: 25, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'forma_juridica', label: 'Forma jurídica', tipo: 'select', opciones: ['Autónomo', 'SL', 'SA', 'Comunidad de bienes', 'Por constituir'], obligatorio: true },
      { id: 'servicios', label: 'Servicios que necesita', tipo: 'select', opciones: ['Fiscal y contable', 'Laboral', 'Integral (fiscal + laboral)'], obligatorio: true },
      { id: 'trabajadores', label: 'Nº de trabajadores', tipo: 'number' },
      { id: 'sector', label: 'Sector de actividad', tipo: 'text' }
    ]
  },
  {
    id: 'renting_furgo', nombre: 'Renting de furgonetas', categoria: 'Viajes y movilidad', cplRef: 22, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'vehiculos', label: 'Nº de vehículos', tipo: 'number', obligatorio: true },
      { id: 'tamano', label: 'Tamaño de furgoneta', tipo: 'select', opciones: ['Pequeña', 'Mediana', 'Grande', 'Indiferente'], obligatorio: true },
      { id: 'plazo', label: 'Plazo (meses)', tipo: 'select', opciones: ['24', '36', '48', '60', 'No lo sabe'] },
      { id: 'km', label: 'Km anuales aprox.', tipo: 'number' }
    ]
  },
  {
    id: 'renting_coche', nombre: 'Renting de coches', categoria: 'Viajes y movilidad', cplRef: 25, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa', 'Particular'],
    preguntas: [
      { id: 'vehiculos', label: 'Nº de vehículos', tipo: 'number', obligatorio: true },
      { id: 'segmento', label: 'Tipo de coche', tipo: 'select', opciones: ['Utilitario', 'Berlina', 'SUV', 'Eléctrico/Híbrido', 'Indiferente'], obligatorio: true },
      { id: 'plazo', label: 'Plazo (meses)', tipo: 'select', opciones: ['24', '36', '48', '60', 'No lo sabe'] }
    ]
  },
  {
    id: 'tpv', nombre: 'TPV', categoria: 'Internet y TIC', cplRef: 25, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'negocio', label: 'Tipo de negocio', tipo: 'select', opciones: ['Hostelería', 'Comercio', 'Peluquería/estética', 'Otro'], obligatorio: true },
      { id: 'terminales', label: 'Nº de terminales', tipo: 'number', obligatorio: true },
      { id: 'software', label: '¿Necesita software de gestión?', tipo: 'select', opciones: ['Sí', 'No'] }
    ]
  },
  {
    id: 'control_horario', nombre: 'Control horario', categoria: 'Formación y RR. HH.', cplRef: 30, maxProveedores: 2, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'trabajadores', label: 'Nº de trabajadores', tipo: 'number', obligatorio: true },
      { id: 'fichaje', label: 'Tipo de fichaje', tipo: 'select', opciones: ['App móvil', 'Terminal físico', 'Ambos'], obligatorio: true }
    ]
  },
  {
    id: 'seguro_baja', nombre: 'Seguro de baja laboral', categoria: 'Administración', cplRef: 20, maxProveedores: 2, tiposCliente: ['Autónomo'],
    preguntas: [
      { id: 'que_eres', label: '¿Qué eres?', tipo: 'select', opciones: ['Autónomo', 'Autónomo societario'], obligatorio: true },
      { id: 'profesion', label: 'Profesión', tipo: 'text', obligatorio: true },
      { id: 'edad', label: 'Tramo de edad', tipo: 'select', opciones: ['18-35', '36-50', '51-65'] }
    ]
  },
  {
    id: 'web', nombre: 'Diseño de páginas web', categoria: 'Internet y TIC', cplRef: 30, maxProveedores: 3, tiposCliente: ['Autónomo', 'Empresa'],
    preguntas: [
      { id: 'tipo_web', label: 'Tipo de web', tipo: 'select', opciones: ['Corporativa', 'Tienda online', 'Landing', 'Rediseño'], obligatorio: true },
      { id: 'presupuesto', label: 'Presupuesto aproximado', tipo: 'select', opciones: ['< 1.000 €', '1.000–3.000 €', '> 3.000 €', 'No lo sabe'] }
    ]
  },
  {
    id: 'igualdad', nombre: 'Planes de igualdad', categoria: 'Formación y RR. HH.', cplRef: 55, maxProveedores: 2, tiposCliente: ['Empresa'],
    preguntas: [
      { id: 'trabajadores', label: 'Nº de trabajadores', tipo: 'number', obligatorio: true },
      { id: 'plazo_legal', label: '¿Tiene requerimiento o plazo?', tipo: 'select', opciones: ['No', 'Sí, inspección', 'Sí, licitación'] }
    ]
  }
];

// Proveedores ficticios.
// zonas: 'ES' = toda España, 'C:<comunidad>', 'P:<provincia>'. excluidas: mismo formato.
// cobro: 'ok' | 'cuidado' | 'impago'. estado: 'activo' | 'pausado' | 'prueba'.
D.SEED_PROVEEDORES = [
  { id: 'p01', nombre: 'Prevenia Integral', servicios: [{ s: 'prl', cpl: 34, prioridad: 'alta' }, { s: 'lopd', cpl: 32, prioridad: 'baja' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 220, baseMes: 120, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.05, contratacion: 0.14, entrega: 'email', email: 'leads@prevenia.example', pago: 'GoCardless' },
  { id: 'p02', nombre: 'Salus Prevención Madrid', servicios: [{ s: 'prl', cpl: 28, prioridad: 'alta', maxTrab: 50 }], zonas: ['C:Comunidad de Madrid', 'P:Toledo', 'P:Guadalajara'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 6, limMes: 90, baseMes: 61, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.08, contratacion: 0.11, entrega: 'email', email: 'comercial@salusprev.example', pago: 'GoCardless' },
  { id: 'p03', nombre: 'Alerta Laboral Catalunya', servicios: [{ s: 'prl', cpl: 36, prioridad: 'alta' }], zonas: ['C:Cataluña'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 150, baseMes: 88, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.04, contratacion: 0.17, entrega: 'json', email: 'api@alertalaboral.example', pago: 'GoCardless' },
  { id: 'p04', nombre: 'Grupo Previsión Levante', servicios: [{ s: 'prl', cpl: 25, prioridad: 'alta' }, { s: 'lopd', cpl: 22, prioridad: 'alta' }], zonas: ['C:Comunidad Valenciana', 'P:Murcia', 'P:Albacete'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 120, baseMes: 54, importancia: 'media', cobro: 'cuidado', estado: 'activo', invalidacion: 0.12, contratacion: 0.08, entrega: 'email', email: 'leads@previsionlevante.example', pago: 'Transferencia' },
  { id: 'p05', nombre: 'Seguridad Laboral Sur', servicios: [{ s: 'prl', cpl: 27, prioridad: 'alta' }], zonas: ['C:Andalucía'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 5, limMes: 80, baseMes: 43, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.07, contratacion: 0.12, entrega: 'email', email: 'info@segsur.example', pago: 'GoCardless' },
  { id: 'p06', nombre: 'Laborum Prevención', servicios: [{ s: 'prl', cpl: 18, prioridad: 'baja' }, { s: 'lopd', cpl: 18, prioridad: 'baja' }], zonas: ['ES'], excluidas: ['C:Canarias'], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 400, baseMes: 300, importancia: 'baja', cobro: 'impago', estado: 'activo', invalidacion: 0.18, contratacion: 0.05, entrega: 'email', email: 'leads@laborum.example', pago: 'Transferencia' },
  { id: 'p07', nombre: 'Datacheck Consultores', servicios: [{ s: 'lopd', cpl: 40, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 100, baseMes: 47, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.03, contratacion: 0.16, entrega: 'email', email: 'altas@datacheck.example', pago: 'GoCardless' },
  { id: 'p08', nombre: 'Protegedatos Norte', servicios: [{ s: 'lopd', cpl: 30, prioridad: 'alta' }], zonas: ['C:País Vasco', 'C:Cantabria', 'C:Asturias', 'C:Navarra', 'C:Galicia'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 40, baseMes: 12, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.06, contratacion: 0.10, entrega: 'email', email: 'hola@protegedatos.example', pago: 'GoCardless' },
  { id: 'p09', nombre: 'Asesoría Fiscalia', servicios: [{ s: 'gestoria', cpl: 28, prioridad: 'alta' }], zonas: ['C:Cataluña', 'C:Aragón'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 3, limMes: 50, baseMes: 22, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.05, contratacion: 0.20, entrega: 'email', email: 'nuevos@fiscalia.example', pago: 'GoCardless' },
  { id: 'p10', nombre: 'Gestoría Online 24', servicios: [{ s: 'gestoria', cpl: 20, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 200, baseMes: 140, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.09, contratacion: 0.09, entrega: 'webhook', email: 'crm@gestoria24.example', pago: 'GoCardless' },
  { id: 'p11', nombre: 'Asesores Klar', servicios: [{ s: 'gestoria', cpl: 32, prioridad: 'alta', maxTrab: 20 }], zonas: ['C:Comunidad de Madrid'], excluidas: [], tipos: ['Autónomo'], limDia: 0, limMes: 30, baseMes: 30, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.02, contratacion: 0.22, entrega: 'email', email: 'alta@klar.example', pago: 'GoCardless' },
  { id: 'p12', nombre: 'FlotaPlus Renting', servicios: [{ s: 'renting_furgo', cpl: 20, prioridad: 'alta' }, { s: 'renting_coche', cpl: 18, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 500, baseMes: 260, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.10, contratacion: 0.06, entrega: 'json', email: 'leads@flotaplus.example', pago: 'GoCardless' },
  { id: 'p13', nombre: 'Movilia Car', servicios: [{ s: 'renting_furgo', cpl: 30, prioridad: 'alta' }, { s: 'renting_coche', cpl: 30, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa', 'Particular'], limDia: 0, limMes: 300, baseMes: 150, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.07, contratacion: 0.07, entrega: 'email', email: 'renting@movilia.example', pago: 'GoCardless' },
  { id: 'p14', nombre: 'Concesionario Ronda Motor', servicios: [{ s: 'renting_coche', cpl: 26, prioridad: 'alta' }, { s: 'renting_furgo', cpl: 24, prioridad: 'baja' }], zonas: ['C:Cataluña', 'C:Islas Baleares'], excluidas: [], tipos: ['Autónomo', 'Empresa', 'Particular'], limDia: 4, limMes: 60, baseMes: 25, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.08, contratacion: 0.09, entrega: 'email', email: 'ventas@rondamotor.example', pago: 'Domiciliación' },
  { id: 'p15', nombre: 'Autos Meseta', servicios: [{ s: 'renting_furgo', cpl: 19, prioridad: 'alta' }], zonas: ['C:Comunidad de Madrid', 'C:Castilla-La Mancha', 'C:Castilla y León'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 70, baseMes: 31, importancia: 'media', cobro: 'ok', estado: 'prueba', invalidacion: 0.0, contratacion: 0.0, entrega: 'email', email: 'info@autosmeseta.example', pago: 'GoCardless' },
  { id: 'p16', nombre: 'Cobra Fácil TPV', servicios: [{ s: 'tpv', cpl: 22, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 150, baseMes: 70, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.08, contratacion: 0.10, entrega: 'email', email: 'leads@cobrafacil.example', pago: 'GoCardless' },
  { id: 'p17', nombre: 'Comanda Pro', servicios: [{ s: 'tpv', cpl: 28, prioridad: 'alta' }, { s: 'control_horario', cpl: 30, prioridad: 'baja' }], zonas: ['C:Andalucía', 'C:Extremadura', 'C:Región de Murcia'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 60, baseMes: 20, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.05, contratacion: 0.13, entrega: 'email', email: 'altas@comandapro.example', pago: 'GoCardless' },
  { id: 'p18', nombre: 'SoftCaja Hostelería', servicios: [{ s: 'tpv', cpl: 50, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Empresa', 'Autónomo'], limDia: 3, limMes: 60, baseMes: 41, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.04, contratacion: 0.12, entrega: 'email', email: 'partners@softcaja.example', pago: 'GoCardless' },
  { id: 'p19', nombre: 'Fichaje Simple', servicios: [{ s: 'control_horario', cpl: 32, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 120, baseMes: 66, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.03, contratacion: 0.18, entrega: 'email', email: 'comercial@fichajesimple.example', pago: 'GoCardless' },
  { id: 'p20', nombre: 'Correduría Autónomos Plus', servicios: [{ s: 'seguro_baja', cpl: 20, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo'], limDia: 0, limMes: 150, baseMes: 95, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.06, contratacion: 0.15, entrega: 'email', email: 'leads@autonomosplus.example', pago: 'GoCardless' },
  { id: 'p21', nombre: 'Agente Seguros Mar', servicios: [{ s: 'seguro_baja', cpl: 18, prioridad: 'baja' }], zonas: ['C:Comunidad Valenciana'], excluidas: [], tipos: ['Autónomo'], limDia: 2, limMes: 20, baseMes: 6, importancia: 'baja', cobro: 'ok', estado: 'prueba', invalidacion: 0.0, contratacion: 0.0, entrega: 'email', email: 'mar.seguros@example.com', pago: 'Transferencia' },
  { id: 'p22', nombre: 'Estudio Pixel Web', servicios: [{ s: 'web', cpl: 30, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 80, baseMes: 38, importancia: 'media', cobro: 'ok', estado: 'activo', invalidacion: 0.09, contratacion: 0.08, entrega: 'email', email: 'proyectos@pixelweb.example', pago: 'GoCardless' },
  { id: 'p23', nombre: 'Tiendas Online Express', servicios: [{ s: 'web', cpl: 35, prioridad: 'alta' }], zonas: ['ES'], excluidas: [], tipos: ['Autónomo', 'Empresa'], limDia: 0, limMes: 50, baseMes: 22, importancia: 'media', cobro: 'ok', estado: 'pausado', invalidacion: 0.07, contratacion: 0.09, entrega: 'email', email: 'hola@tiendasexpress.example', pago: 'GoCardless' },
  { id: 'p24', nombre: 'Igualia Consultoría', servicios: [{ s: 'igualdad', cpl: 60, prioridad: 'alta', minTrab: 50 }], zonas: ['ES'], excluidas: [], tipos: ['Empresa'], limDia: 0, limMes: 30, baseMes: 11, importancia: 'alta', cobro: 'ok', estado: 'activo', invalidacion: 0.02, contratacion: 0.25, entrega: 'email', email: 'planes@igualia.example', pago: 'GoCardless' }
];

// Pesos por defecto del algoritmo (suman 100).
D.SEED_PESOS = { precio: 30, calidad: 20, conversion: 20, reparto: 15, prioridad: 15 };

// Generador determinista para que la demo sea siempre igual al reiniciar.
D.rng = function (seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};

D.NOMBRES = ['Laura', 'Jordi', 'Marta', 'Carlos', 'Nuria', 'Pablo', 'Elena', 'Javier', 'Sara', 'Miguel', 'Lucía', 'Andrés', 'Raquel', 'Sergio', 'Cristina', 'David', 'Ana', 'Óscar', 'Irene', 'Rubén'];
D.APELLIDOS = ['García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz', 'Díaz', 'Moreno', 'Vidal', 'Puig', 'Serra', 'Romero', 'Navarro', 'Torres'];
D.NEGOCIOS = ['Bar La Plaza', 'Reformas Delta', 'Clínica Dental Sonrisa', 'Transportes Ruta 7', 'Panadería Espiga', 'Taller Mecánico Norte', 'Estudio Arquitectura Línea', 'Peluquería Bella', 'Construcciones Albar', 'Frutas Huerta', 'Academia Idiomas Plus', 'Gimnasio Fuerza', 'Floristería Jazmín', 'Limpiezas Brillo', 'Logística Express', 'Consultora Nexo'];
