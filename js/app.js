// Arranque, navegación por hash y gestión de eventos.
window.D = window.D || {};
D.views = D.views || {};
D.act = D.act || {};

D.ui = {
  badgeEstado(e) { const x = D.ESTADOS[e] || { label: e, color: 'gris' }; return `<span class="badge b-${x.color}">${x.label}</span>`; },
  fuente(f) { return `<span class="src ${f}">${{ web: 'WEB', meta: 'META', google: 'GOOGLE', manual: 'MANUAL' }[f] || f}</span>`; },
  toast(msg) {
    document.querySelectorAll('.toast').forEach(x => x.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  },
  modal(titulo, html) {
    D.ui.cerrarModal();
    const m = document.createElement('div'); m.className = 'modal-bg'; m.id = 'modal';
    m.innerHTML = `<div class="modal"><div class="top"><h2>${titulo}</h2><button class="btn" data-action="cerrarModal">Cerrar</button></div>${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m) D.ui.cerrarModal(); });
    document.body.appendChild(m);
  },
  cerrarModal() { document.getElementById('modal')?.remove(); },
  json(o) { return `<pre class="json">${D.u.esc(JSON.stringify(o, null, 2))}</pre>`; }
};
D.act.cerrarModal = () => D.ui.cerrarModal();

D.nav = [
  ['resumen', 'Resumen'], ['entrada', 'Simular entrada'], ['bandeja', 'Bandeja de leads'],
  ['proveedores', 'Proveedores'], ['facturacion', 'Facturación'], ['config', 'Configuración']
];

D.go = function (hash) { if (location.hash === hash) D.render(); else location.hash = hash; };

D.render = function () {
  const h = location.hash.replace(/^#/, '') || 'resumen';
  const [vista, param] = h.startsWith('lead-') ? ['lead', h.slice(5)] : [h, ''];
  const st = D.store.get();
  const porLlamar = st.leads.filter(l => ['nuevo', 'no_contesta', 'pendiente'].includes(l.estado)).length;
  const porAsignar = st.leads.filter(l => l.estado === 'cualificado').length;
  const activa = vista === 'lead' ? 'bandeja' : vista;
  document.getElementById('nav').innerHTML = D.nav.map(([k, t]) => {
    const cnt = k === 'bandeja' ? `<span class="cnt" title="Por llamar / por asignar">${porLlamar} · ${porAsignar}</span>` : '';
    return `<a href="#${k}" class="${activa === k ? 'on' : ''}">${t}${cnt}</a>`;
  }).join('');
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
window.addEventListener('DOMContentLoaded', () => { D.store.cargar(); D.render(); });
