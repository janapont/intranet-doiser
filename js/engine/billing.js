// Facturación mensual: agrupa los envíos válidos del mes por proveedor y genera facturas.
// En producción, "emitir" llamaría a la API de Holded y el cobro llegaría por GoCardless.
window.D = window.D || {};
D.billing = (function () {
  const IVA = 0.21;

  // Envíos facturables de un mes: enviados, no invalidados, no facturados y con precio > 0.
  function pendientes(state, ym) {
    const porProv = {};
    for (const l of state.leads) for (const e of l.envios) {
      if (D.u.mes(e.fecha) !== ym || e.estado !== 'enviado' || e.facturaId) continue;
      (porProv[e.proveedorId] = porProv[e.proveedorId] || []).push({ lead: l, envio: e });
    }
    return Object.entries(porProv).map(([pid, items]) => {
      const p = state.proveedores.find(x => x.id === pid);
      const cobrables = items.filter(x => x.envio.precio > 0);
      const base = cobrables.reduce((s, x) => s + x.envio.precio, 0);
      return { proveedor: p, items, cobrables, gratis: items.length - cobrables.length, base, iva: base * IVA, total: base * (1 + IVA) };
    }).sort((a, b) => b.base - a.base);
  }

  // Formato orientativo de la API de Holded (documento tipo factura).
  function payloadHolded(borrador, ym, numero) {
    const servicios = {};
    for (const { lead, envio } of borrador.cobrables) {
      const k = lead.servicio + '|' + envio.precio;
      servicios[k] = servicios[k] || { servicio: lead.servicio, precio: envio.precio, uds: 0 };
      servicios[k].uds++;
    }
    return {
      contactCode: borrador.proveedor.id,
      contactName: borrador.proveedor.nombre,
      docNumber: numero,
      date: Math.floor(Date.now() / 1000),
      notes: `Leads enviados en ${D.u.nombreMes(ym)}`,
      items: Object.values(servicios).map(x => ({
        name: 'Leads ' + (D.store.servicio(x.servicio)?.nombre || x.servicio),
        units: x.uds, subtotal: x.precio, tax: IVA * 100
      }))
    };
  }

  function emitir(state, ym, borradores) {
    const creadas = [];
    for (const b of borradores) {
      if (!b.cobrables.length) continue;
      const numero = `DOI-${ym.slice(0, 4)}-${String(++state.seq.factura).padStart(4, '0')}`;
      const f = {
        id: numero, numero, mes: ym, proveedorId: b.proveedor.id, fecha: new Date().toISOString(),
        base: b.base, iva: b.iva, total: b.total, lineas: b.cobrables.length,
        estado: 'emitida', pago: b.proveedor.pago, holded: payloadHolded(b, ym, numero)
      };
      for (const { envio } of b.cobrables) { envio.facturaId = numero; }
      for (const { envio } of b.items) if (!envio.facturaId) envio.facturaId = 'gratis';
      state.facturas.push(f);
      creadas.push(f);
    }
    return creadas;
  }

  return { pendientes, emitir, IVA };
})();
