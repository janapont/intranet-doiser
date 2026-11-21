// Arranque, navegación por hash y gestión de eventos.
window.D = window.D || {};
D.views = D.views || {};
D.act = D.act || {};

D.ui = {
  badgeEstado(e) {
    const x = D.ESTADOS[e] || { label: e, color: 'gris' };
    const c = { azul: 'blue', rojo: 'red', ambar: 'amber', violeta: 'violet', verde: 'green', gris: 'grey' }[x.color];
    return `<span class="pill p-${c}">${x.label}</span>`;
  },
  fuente(f) { return `<span class="tag">${{ web: 'Web', meta: 'Meta', google: 'Google', manual: 'Manual' }[f] || f}</span>`; },
  iniciales(l) { return ((l.contacto.nombre[0] || '') + (l.contacto.apellidos[0] || '')).toUpperCase() || '?'; },
  toast(msg) {
    document.querySelectorAll('.toast').forEach(x => x.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  },
  modal(titulo, html) {
    D.ui.cerrarModal();
    const m = document.createElement('div'); m.className = 'modal-bg'; m.id = 'modal';
    m.innerHTML = `<div class="modal"><div class="mh"><h2 style="margin:0">${titulo}</h2><button class="btn ghost" data-action="cerrarModal">✕</button></div>${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m) D.ui.cerrarModal(); });
    document.body.appendChild(m);
  },
  cerrarModal() { document.getElementById('modal')?.remove(); },
  json(o) { return `<pre class="json">${D.u.esc(JSON.stringify(o, null, 2))}</pre>`; }
};
D.act.cerrarModal = () => D.ui.cerrarModal();

D.nav = [['resumen', 'Inicio'], ['bandeja', 'Leads'], ['entrada', 'Nuevo lead'], ['proveedores', 'Proveedores'], ['facturacion', 'Facturación'], ['config', 'Ajustes']];

D.go = function (hash) { if (location.hash === hash) D.render(); else location.hash = hash; };

D.render = function () {
  const h = location.hash.replace(/^#/, '') || 'resumen';
  const [vista, param] = h.startsWith('lead-') ? ['lead', h.slice(5)] : [h, ''];
  const st = D.store.get();
  const pendientes = st.leads.filter(l => ['nuevo', 'no_contesta', 'pendiente', 'cualificado'].includes(l.estado)).length;
  const activa = vista === 'lead' ? 'bandeja' : vista;
  document.getElementById('nav').innerHTML = D.nav.map(([k, t]) =>
    `<a href="#${k}" class="${activa === k ? 'on' : ''}">${t}${k === 'bandeja' && pendientes ? `<span class="cnt">${pendientes}</span>` : ''}</a>`).join('');
  const v = D.views[vista] || D.views.resumen;
  const main = document.getElementById('main');
  main.innerHTML = v.render(param);
  if (v.after) v.after(param);
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = D.act[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  const fn = D.act[el.dataset.change];
  if (fn) fn(el, e);
});
document.addEventListener('click', e => {
  const tr = e.target.closest('tr[data-href]');
  if (tr && !e.target.closest('a,button,input,select')) D.go(tr.dataset.href);
});

window.addEventListener('hashchange', () => { D.ui.cerrarModal(); D.render(); window.scrollTo(0, 0); });
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('version').textContent = `v${D.VERSION.num} · ${D.VERSION.fecha}`;
  D.store.cargar(); D.render();
});
