// Utilidades generales.
window.D = window.D || {};
D.views = D.views || {};
D.act = D.act || {};
D.u = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  eur(n) {
    return (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  },
  num(n) { return (Number(n) || 0).toLocaleString('es-ES'); },
  pct(x) { return Math.round((Number(x) || 0) * 100) + '%'; },
  fecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  fechaHora(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  },
  hace(iso) {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.round(h / 24)} d`;
  },
  // Fechas siempre en hora local (España), no en UTC.
  ym(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); },
  ymd(d) { return D.u.ym(d) + '-' + String(d.getDate()).padStart(2, '0'); },
  mes(iso) { return D.u.ym(new Date(iso)); },
  dia(iso) { return D.u.ymd(new Date(iso)); },
  mesActual() { return D.u.ym(new Date()); },
  mesAnterior() { const d = new Date(); return D.u.ym(new Date(d.getFullYear(), d.getMonth() - 1, 1)); },
  nombreMes(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  },
  hoy() { return D.u.ymd(new Date()); },
  clamp(x, a = 0, b = 1) { return Math.max(a, Math.min(b, x)); },
  telefono(t) {
    let s = String(t || '').replace(/[^\d+]/g, '');
    if (s.startsWith('0034')) s = '+34' + s.slice(4);
    if (/^[6789]\d{8}$/.test(s)) s = '+34' + s;
    return s;
  },
  telefonoValido(t) { return /^\+34[6789]\d{8}$/.test(D.u.telefono(t)); },
  emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '')); },
  // Normaliza texto para comparar (sin acentos ni mayúsculas).
  norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); },
  copia(o) { return JSON.parse(JSON.stringify(o)); }
};
