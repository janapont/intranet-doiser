// Algoritmo de selección de proveedores.
// Paso 1: filtros obligatorios (si no se cumple uno, el proveedor queda fuera y se explica por qué).
// Paso 2: puntuación de 0 a 100 de los que pasan, con pesos configurables.
// Paso 3: decidir cuántos enviar (1 a 3) según el servicio, la calidad del lead y los candidatos.
window.D = window.D || {};
D.ETIQ_PESOS = { precio: 'precio', calidad: 'calidad', conversion: 'conversión', reparto: 'reparto', prioridad: 'prioridad' };
D.matching = (function () {
  const u = D.u;
  const IMPORTANCIA = { alta: 1, media: 0.7, baja: 0.4 };
  const PRIORIDAD = { alta: 1, baja: 0.4 };
  const UMBRAL = 35; // puntuación mínima para proponer un proveedor

  function cubreZona(p, provincia) {
    const com = D.comunidadDe(provincia);
    const dentro = z => z === 'ES' || z === 'C:' + com || z === 'P:' + provincia;
    return p.zonas.some(dentro) && !p.excluidas.some(dentro);
  }

  // Envíos de un proveedor en el mes y el día actuales (base histórica + envíos registrados aquí).
  function consumo(p, state, ref = new Date()) {
    const mes = u.ym(ref), dia = u.ymd(ref);
    let m = 0, d = 0;
    for (const l of state.leads) for (const e of l.envios) {
      if (e.proveedorId !== p.id || e.estado === 'anulado') continue;
      if (u.mes(e.fecha) === mes) m++;
      if (u.dia(e.fecha) === dia) d++;
    }
    const enMesActual = mes === u.mesActual();
    return { mes: m + (enMesActual ? p.baseMes : 0), dia: d };
  }

  // Calidad del lead (0-1): datos de contacto y respuestas del cuestionario.
  function calidadLead(lead, servicio) {
    if (!servicio) return 0;
    let puntos = 0, total = 0;
    total += 2; if (u.telefonoValido(lead.contacto.telefono)) puntos += 2;
    total += 1; if (u.emailValido(lead.contacto.email)) puntos += 1;
    total += 1; if (lead.empresa.provincia) puntos += 1;
    total += 1; if (lead.empresa.tipoCliente) puntos += 1;
    for (const q of servicio.preguntas) {
      const peso = q.obligatorio ? 1.5 : 0.5;
      total += peso;
      const v = lead.respuestas[q.id];
      if (v !== undefined && v !== '' && v !== null) puntos += peso;
    }
    return puntos / total;
  }

  function faltanObligatorios(lead, servicio) {
    const falta = [];
    if (!servicio) return ['Servicio'];
    if (!u.telefonoValido(lead.contacto.telefono)) falta.push('Teléfono válido');
    if (!lead.empresa.provincia) falta.push('Provincia');
    if (!lead.empresa.tipoCliente) falta.push('Tipo de cliente');
    for (const q of servicio.preguntas) {
      const v = lead.respuestas[q.id];
      if (q.obligatorio && (v === undefined || v === '' || v === null)) falta.push(q.label);
    }
    return falta;
  }

  function evaluar(lead, state) {
    const servicio = state.servicios.find(s => s.id === lead.servicio);
    const pesos = state.pesos;
    const excluidos = [], pasan = [];
    const prov = lead.empresa.provincia;
    const trab = Number(lead.respuestas.trabajadores) || null;
    const limite90 = Date.now() - 90 * 864e5;

    for (const p of state.proveedores) {
      const cfg = p.servicios.find(x => x.s === lead.servicio);
      if (!cfg) continue; // no ofrece el servicio: ni siquiera se lista
      const fuera = m => excluidos.push({ p, cfg, motivo: m });
      if (p.estado === 'pausado') { fuera('Pausado por el proveedor'); continue; }
      if (!prov || !cubreZona(p, prov)) { fuera(`No cubre ${prov || 'la zona (falta provincia)'}`); continue; }
      if (lead.empresa.tipoCliente && !p.tipos.includes(lead.empresa.tipoCliente)) { fuera(`No acepta ${lead.empresa.tipoCliente.toLowerCase()}s`); continue; }
      if (trab && cfg.minTrab && trab < cfg.minTrab) { fuera(`Solo empresas de ${cfg.minTrab}+ trabajadores`); continue; }
      if (trab && cfg.maxTrab && trab > cfg.maxTrab) { fuera(`Solo hasta ${cfg.maxTrab} trabajadores`); continue; }
      if (p.cobro === 'impago') { fuera('Tiene facturas impagadas'); continue; }
      const c = consumo(p, state);
      if (p.limMes && c.mes >= p.limMes) { fuera(`Límite mensual alcanzado (${c.mes}/${p.limMes})`); continue; }
      if (p.limDia && c.dia >= p.limDia) { fuera(`Límite diario alcanzado (${c.dia}/${p.limDia})`); continue; }
      const repetido = state.leads.some(l => l.id !== lead.id && l.servicio === lead.servicio &&
        new Date(l.creado).getTime() > limite90 &&
        ((lead.contacto.telefono && l.contacto.telefono === lead.contacto.telefono) || (lead.contacto.email && l.contacto.email === lead.contacto.email)) &&
        l.envios.some(e => e.proveedorId === p.id && e.estado !== 'anulado'));
      if (repetido) { fuera('Ya recibió a este cliente (últimos 90 días)'); continue; }
      pasan.push({ p, cfg, c });
    }

    // Puntuación
    const precios = pasan.map(x => x.cfg.cpl);
    const pMax = Math.max(0, ...precios);
    const candidatos = pasan.map(({ p, cfg, c }) => {
      const s = {
        precio: pMax > 0 ? cfg.cpl / pMax : 1,
        // Sin histórico (proveedor nuevo): valor neutro.
        calidad: p.invalidacion == null ? 0.5 : u.clamp(1 - p.invalidacion / 0.2),
        conversion: p.contratacion == null ? 0.5 : u.clamp(p.contratacion / 0.25),
        reparto: p.limMes ? u.clamp(1 - c.mes / p.limMes) : u.clamp(1 - c.mes / 400),
        prioridad: (PRIORIDAD[cfg.prioridad] || 0.4) * 0.6 + (IMPORTANCIA[p.importancia] || 0.4) * 0.4
      };
      const desglose = {};
      let total = 0;
      for (const k of Object.keys(pesos)) { desglose[k] = s[k] * pesos[k]; total += desglose[k]; }
      const ajustes = [];
      if (p.estado === 'prueba') { total += 10; ajustes.push('+10 en periodo de prueba'); }
      if (p.cobro === 'cuidado') { total -= 15; ajustes.push('−15 por aviso de cobro'); }
      return { p, cfg, consumo: c, puntos: Math.round(u.clamp(total, 0, 100)), desglose, ajustes, precio: p.estado === 'prueba' ? 0 : cfg.cpl };
    }).sort((a, b) => b.puntos - a.puntos);

    // Cuántos enviar
    const calidad = calidadLead(lead, servicio);
    let n = servicio ? servicio.maxProveedores : 0;
    const razones = [];
    if (servicio) razones.push(`Máximo del servicio: ${servicio.maxProveedores}`);
    if (calidad < 0.6 && n > 1) { n -= 1; razones.push(`Lead con datos incompletos (${u.pct(calidad)}): uno menos`); }
    if (lead.empresa.tipoCliente === 'Particular' && n > 1) { n = 1; razones.push('Particular: solo uno'); }
    const validos = candidatos.filter(x => x.puntos >= UMBRAL);
    if (validos.length < n) razones.push(`Solo ${validos.length} proveedor(es) disponibles con puntuación ≥ ${UMBRAL}`);
    n = Math.min(n, validos.length);

    let motivoNoTriple = '';
    if (servicio && n < servicio.maxProveedores) {
      const porZona = excluidos.filter(x => /cubre/.test(x.motivo)).length;
      const ofrecen = state.proveedores.filter(p => p.estado !== 'pausado' && p.servicios.some(x => x.s === lead.servicio)).length;
      if (validos.length >= servicio.maxProveedores) motivoNoTriple = 'Calidad del lead';
      else if (ofrecen < servicio.maxProveedores) motivoNoTriple = 'Falta de proveedores en la categoría';
      else if (porZona > 0) motivoNoTriple = 'Falta de proveedores en la zona';
      else motivoNoTriple = 'Límites o condiciones de los proveedores';
    }

    return {
      servicio, candidatos, excluidos, n, razones, calidad, motivoNoTriple,
      seleccion: validos.slice(0, n).map(x => x.p.id),
      faltan: faltanObligatorios(lead, servicio),
      umbral: UMBRAL
    };
  }

  return { evaluar, calidadLead, faltanObligatorios, consumo, cubreZona };
})();
