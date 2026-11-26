(() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem('woa:' + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('woa:' + k, JSON.stringify(v)); } catch {} }
};
const COST = { g: 'Gratuit / sans mise', p: 'Investissement requis', v: 'Coût variable' };
const FIELDS = [['how','Comment ça fonctionne'],['who','Qui propose'],['access','Conditions d\'accès'],['docs','Documents généralement requis'],
  ['invest','Faut-il investir ?'],['pay','Rémunéré, financé ou gratuit ?'],['pros','Avantages'],['risks','Risques et contraintes'],
  ['find','Comment trouver'],['where','Où postuler / demander'],['ex','Exemples concrets (pédagogiques)'],['src','Sources de référence']];
let D, subs = [], byId = {};
const S = { q: '', fam: '', cost: '', view: store.get('view', 'cards'), favs: store.get('favs', []), hist: store.get('hist', []) };
document.documentElement.dataset.theme = store.get('theme', 'dark');

async function init() {
  try { D = window.WOA_DATA || await (await fetch('data.json')).json(); }
  catch { $('#app').innerHTML = '<p class="empty">Impossible de charger data.json. Lancez un petit serveur local (ex. <code>python -m http.server</code>) ou utilisez le bouton d\'import ⭱.</p>'; return; }
  index(); route();
}
function index() {
  subs = []; byId = {};
  const M = window.WOA_MADA || { fiches: {}, hide: [] };
  D.families.forEach(f => f.subs.forEach((s, i) => { if (M.hide.includes(s.n)) return; const o = { ...s, id: f.id + '-' + i, fam: f.id, famName: f.name, icon: f.icon }; const FI = window.WOA_FICHES || {}; if (FI[s.n] || M.fiches[s.n]) o.f = { ...(s.f || {}), ...(FI[s.n] || {}), ...(M.fiches[s.n] || {}) }; subs.push(o); byId[o.id] = o; }));
}
const fam = id => D.families.find(f => f.id === id);
const isFav = id => S.favs.includes(id);
function toggleFav(id) { S.favs = isFav(id) ? S.favs.filter(x => x !== id) : [...S.favs, id]; store.set('favs', S.favs); route(); }
function match(s) {
  const q = S.q.trim().toLowerCase();
  return (!q || (s.n + ' ' + s.d + ' ' + s.famName + ' ' + Object.values(s.f || {}).flat().join(' ')).toLowerCase().includes(q)) && (!S.fam || s.fam === S.fam) && (!S.cost || s.c === S.cost);
}
function card(s) {
  return `<div class="card" data-open="${s.id}" tabindex="0" role="button">
  <button class="fav ${isFav(s.id) ? 'on' : ''}" data-fav="${s.id}" aria-label="Favori">${isFav(s.id) ? '★' : '☆'}</button>
  <div class="ic">${s.icon}</div><h3>${esc(s.n)}</h3><p>${esc(s.d.slice(0, 110))}${s.d.length > 110 ? '…' : ''}</p>
  <span class="tag">${esc(s.famName)}</span><span class="tag">${COST[s.c]}</span></div>`;
}
const views = {
  home() {
    const sample = subs.slice().sort(() => .5 - Math.random()).slice(0, 6);
    return `<section class="hero"><h1>Explore the World <em>of Opportunities</em></h1>
    <p>Quelles sont toutes les possibilités qui existent dans le monde pour construire une meilleure vie ? Une encyclopédie interactive pour comprendre, distinguer et explorer les grandes familles d'opportunités.</p>
    <input class="search" id="gq" type="search" placeholder="Rechercher une opportunité ou un concept…" aria-label="Recherche globale" value="${esc(S.q)}">
    <div class="stats"><div class="stat"><b>${D.families.length}</b><small>familles</small></div><div class="stat"><b>${subs.length}</b><small>mécanismes</small></div>
    <div class="stat"><b>${subs.filter(s => s.f).length}</b><small>fiches complètes</small></div></div>
    <p class="note">Chiffres calculés sur le contenu actuel de data.json. Aucune opportunité réelle n'est listée : les exemples sont pédagogiques.</p></section>
    <h2>Familles d'opportunités</h2><div class="grid">${D.families.map(f => `<a class="card" href="#explore" data-fam="${f.id}"><div class="ic">${f.icon}</div><h3>${esc(f.name)}</h3><p>${esc(f.desc)}</p><span class="tag">${f.subs.length} mécanismes</span></a>`).join('')}</div>
    <h2>Discover Opportunities</h2><div class="grid">${sample.map(card).join('')}</div>
    <h2>Explore by Objective</h2><div class="grid">${D.objectives.map(o => `<a class="card" href="#objectives"><div class="ic">${o.icon}</div><h3>${esc(o.n)}</h3><p>${o.paths.length} chemins possibles</p></a>`).join('')}</div>
    <h2>Explore by Region</h2><div class="grid">${D.regions.map(r => `<a class="card" href="#regions"><div class="ic">${r.icon}</div><h3>${esc(r.n)}</h3></a>`).join('')}</div>`;
  },
  explore() {
    const res = subs.filter(match);
    let body;
    if (S.view === 'tree') body = D.families.filter(f => res.some(s => s.fam === f.id)).map(f => `<details open><summary>${f.icon} ${esc(f.name)}</summary><ul>${res.filter(s => s.fam === f.id).map(s => `<li><button data-open="${s.id}">${esc(s.n)}</button></li>`).join('')}</ul></details>`).join('');
    else body = `<div class="${S.view === 'list' ? 'list' : 'grid'}">${res.map(card).join('')}</div>`;
    return `<h2>Explorer</h2><div class="bar">
    <input type="search" id="q" placeholder="Filtrer…" value="${esc(S.q)}" aria-label="Filtrer">
    <select id="ff" aria-label="Famille"><option value="">Toutes les familles</option>${D.families.map(f => `<option value="${f.id}" ${S.fam === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
    <select id="fc" aria-label="Coût"><option value="">Tout coût d'accès</option>${Object.entries(COST).map(([k, v]) => `<option value="${k}" ${S.cost === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <select id="fv" aria-label="Vue">${[['cards', 'Cartes'], ['list', 'Liste'], ['tree', 'Arborescence']].map(([k, v]) => `<option value="${k}" ${S.view === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <p class="note">${res.length} résultat(s). Les filtres pays, niveau d'études, âge, durée et expérience seront activés lorsque ces champs seront renseignés dans data.json.</p>${body || '<p class="empty">Aucun résultat.</p>'}`;
  },
  objectives() {
    return `<h2>Explorer par objectif</h2><p class="note">Plusieurs chemins possibles pour un même objectif.</p><div class="grid">${D.objectives.map(o => `<div class="card"><div class="ic">${o.icon}</div><h3>${esc(o.n)}</h3><div class="path">${o.paths.map(p => byId[p] ? `<button data-open="${p}">${esc(byId[p].n)}</button>` : '').join('')}</div></div>`).join('')}</div>`;
  },
  regions() {
    return `<h2>Explorer par région</h2><div class="grid">${D.regions.map(r => `<div class="card"><div class="ic">${r.icon}</div><h3>${esc(r.n)}</h3><p class="todo">Fiches pays à renseigner depuis les sites institutionnels officiels (visas, mobilité, bourses, marché de l'emploi). Aucune condition n'est affichée tant qu'elle n'est pas vérifiée.</p></div>`).join('')}</div>`;
  },
  favs() {
    const f = S.favs.map(id => byId[id]).filter(Boolean), h = S.hist.map(id => byId[id]).filter(Boolean);
    return `<h2>Favoris</h2>${f.length ? `<div class="grid">${f.map(card).join('')}</div>` : '<p class="empty">Aucun favori. Cliquez sur ☆ sur une carte.</p>'}<h2>Consultés récemment</h2>${h.length ? `<div class="grid">${h.map(card).join('')}</div>` : '<p class="empty">Historique vide.</p>'}`;
  }
};
function route() {
  const v = (location.hash.slice(1) || 'home'); const name = views[v] ? v : 'home';
  $('#app').innerHTML = views[name]();
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + name));
}
function open(id) {
  const s = byId[id]; if (!s) return;
  S.hist = [id, ...S.hist.filter(x => x !== id)].slice(0, 12); store.set('hist', S.hist);
  const f = s.f || {};
  const LV = { 'Élevée': '#34d399', 'Moyenne': '#fbbf24', 'Faible': '#f87171' };
  const mada = f.lv ? `<h4>🇲🇬 Accessibilité depuis Madagascar</h4><p><span class="tag" style="color:${LV[f.lv]}">Niveau de chances : ${esc(f.lv)}</span></p><p>${esc(f.ch)}</p><h4>Comment faire, étape par étape</h4><ol>${f.st.map(x => `<li>${esc(x)}</li>`).join('')}</ol><h4>Le marché</h4><p>${esc(f.mk)}</p><p class="note" style="margin-top:8px">Niveau qualitatif estimé, pas un pourcentage officiel : aucune statistique fiable de réussite n'existe pour la plupart de ces voies.</p>` : '';
  const sections = FIELDS.filter(([k]) => !FIELDS.some(([x]) => f[x]) || f[k]).map(([k, l]) => `<h4>${l}</h4><p class="${f[k] ? '' : 'todo'}">${f[k] ? esc(f[k]) : 'Section en cours de rédaction.'}</p>`).join('');
  $('#modal').innerHTML = `<div class="sheet"><button data-close style="float:right" aria-label="Fermer">✕</button><span class="tag">${s.icon} ${esc(s.famName)}</span><span class="tag">${COST[s.c]}</span>
  <h2>${esc(s.n)}</h2><h4>Définition</h4><p>${esc(s.d)}</p>${mada}${sections}<p class="note" style="margin-top:20px">Dernière vérification du contenu : ${esc(D.meta.verified)}. Contenu général : vérifiez toujours auprès des sources officielles.</p>
  <button data-fav="${s.id}" style="margin-top:12px">${isFav(s.id) ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}</button></div>`;
  $('#modal').hidden = false; $('#modal [data-close]').focus();
}
const close = () => { $('#modal').hidden = true; };
document.addEventListener('click', e => {
  const t = e.target;
  const fv = t.closest('[data-fav]'); if (fv) { e.stopPropagation(); const id = fv.dataset.fav, wasOpen = !$('#modal').hidden; toggleFav(id); if (wasOpen) open(id); return; }
  if (t.closest('[data-close]') || t === $('#modal')) return close();
  const fm = t.closest('[data-fam]'); if (fm) { S.fam = fm.dataset.fam; S.q = ''; return; }
  const o = t.closest('[data-open]'); if (o) open(o.dataset.open);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') close();
  if (e.key === 'Enter' && e.target.matches('.card[data-open]')) open(e.target.dataset.open);
});
document.addEventListener('input', e => {
  if (e.target.id === 'gq') { S.q = e.target.value; if (S.q) { location.hash = '#explore'; setTimeout(() => { const q = $('#q'); q.focus(); q.setSelectionRange(99, 99); }, 0); } }
  if (e.target.id === 'q') { S.q = e.target.value; const p = e.target.selectionStart; route(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); }
});
document.addEventListener('change', e => {
  const m = { ff: ['fam'], fc: ['cost'], fv: ['view'] }[e.target.id];
  if (m) { S[m[0]] = e.target.value; if (m[0] === 'view') store.set('view', S.view); route(); }
});
$('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.set('theme', t); };
$('#export').onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' })); a.download = 'data.json'; a.click();
};
$('#import').onchange = async e => {
  try { const j = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(j.families)) throw 0; D = j; index(); route(); }
  catch { alert('Fichier JSON invalide : une clé « families » est attendue.'); }
};
window.addEventListener('hashchange', route);
init();
})();
