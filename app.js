

const NEW_COUNT = 3;
const CLIP = list => list.classList.contains('grid3') ? 160 : 600; // сколько последних промтов помечать «новый»
const list = document.getElementById('list'), q = document.getElementById('q');
const countEl = document.getElementById('count'), empty = document.getElementById('empty');
const items = PROMPTS.map((p, i) => ({...p, n: i + 1})).filter(p => !p.hidden && (PAGE_TYPE === 'all' || p.type === PAGE_TYPE)).reverse();
let tool = 'Все';

function esc(s){return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function render(){
  list.innerHTML = items.map(p => `
    <article class="card" id="${p.n}" data-n="${p.n}" data-tool="${esc(p.tool)}"
      data-s="${esc((p.n + ' ' + p.title + ' ' + (p.tool||'') + ' ' + (p.text||'') + ' ' + (p.tip||'')).toLowerCase())}">
      <div class="top">
        <a class="num" href="#${p.n}" title="Ссылка на этот промт">№${p.n}</a>
        <div>
          <h2>${esc(p.title)}</h2>
          <div class="tags">
            ${p.tool ? `<span class="tag">${esc(p.tool)}</span>` : ''}
            ${p.n > PROMPTS.length - NEW_COUNT ? '<span class="tag new">новый</span>' : ''}
          </div>
        </div>
      </div>
      ${p.img ? `<div class="pic" data-gal="${esc([p.img, ...(p.gallery||[])].join('|'))}"><img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy">${p.gallery && p.gallery.length ? `<span class="cnt">1 / ${p.gallery.length + 1}</span>` : ''}</div>` : ''}
      ${!p.img && !p.video && list.classList.contains('grid3') ? `<div class="pic ph"><span>${p.n}</span></div>` : ''}
      ${p.video ? `<div class="pic"><video src="${esc(p.video)}" controls muted playsinline preload="none"></video></div>` : ''}
      <div class="ptext${p.text.length > CLIP(list) ? ' clip' : ''}">${esc(p.text)}</div>
      ${p.text.length > CLIP(list) ? '<button class="more" data-more>▾ Показать промт полностью</button>' : ''}
      ${p.tip ? `<div class="tip"><span><b>💡 Совет:</b> ${esc(p.tip)}</span></div>` : ''}
      <div class="acts">
        <button class="btn" data-copy="${p.n}">📋 Скопировать<span class="lg"> промт</span></button>
        <button class="btn ghost" data-link="${p.n}">🔗 Ссылка</button>
      </div>
    </article>`).join('');
}

function buildFilters(){
  const tools = ['Все', ...new Set(items.map(p => p.tool).filter(Boolean))];
  const box = document.getElementById('filters');
  if (tools.length < 3) { box.style.display = 'none'; return; }
  box.innerHTML = tools.map(t => `<button class="fbtn${t === tool ? ' on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('.fbtn'); if (!b) return; tool = b.dataset.t; buildFilters(); apply(); };
}

function apply(){
  const s = q.value.trim().toLowerCase().replace(/^[№#]/, '');
  let shown = 0;
  list.querySelectorAll('.card').forEach(c => {
    const okTool = tool === 'Все' || c.dataset.tool === tool;
    const okText = !s || (/^\d+$/.test(s) ? c.dataset.n === s : c.dataset.s.includes(s));
    c.hidden = !(okTool && okText); if (!c.hidden) shown++;
  });
  countEl.textContent = shown + ' из ' + items.length;
  const num = /^\d+$/.test(s) ? +s : 0;
  if (!shown && num && num <= PROMPTS.length && PAGE_TYPE !== 'all') {
    empty.innerHTML = 'Промт №' + num + ' в другом разделе. <a href="index.html#' + num + '">Открыть №' + num + ' →</a>';
  } else empty.textContent = 'Ничего не нашлось 🙈 Попробуй другое слово или номер.';
  empty.style.display = shown ? 'none' : 'block';
  if (s) { clearTimeout(apply.t); apply.t = setTimeout(() => {
    const lt = list.getBoundingClientRect().top;
    if (lt < 120 || lt > window.innerHeight * 0.7) list.scrollIntoView({block: 'start'});
    const one = num && list.querySelector('.card:not([hidden])');
    if (one && shown === 1) { one.classList.add('hl'); setTimeout(() => one.classList.remove('hl'), 2000); }
  }, 350); }
}

function copy(text, msg){
  const done = () => toast(msg);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, () => fallback(text, done));
  } else fallback(text, done);
}
function fallback(text, cb){
  const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch(e) {} t.remove(); cb();
}
let tt; function toast(m){const el=document.getElementById('toast');el.textContent=m;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),1800);}

list.addEventListener('click', e => {
  const pi = e.target.closest('.pic[data-gal]');
  if (pi) { openLb(pi.dataset.gal.split('|'), 0); return; }
  const mo = e.target.closest('[data-more]');
  if (mo) { const t = mo.previousElementSibling; const open = t.classList.toggle('clip'); mo.textContent = open ? '▾ Показать промт полностью' : '▴ Свернуть'; }
  const c = e.target.closest('[data-copy]'), l = e.target.closest('[data-link]');
  if (c) { const p = items.find(x => x.n == c.dataset.copy); copy(p.text, 'Промт №' + p.n + ' скопирован ✓');
    c.classList.add('done'); c.textContent = '✓ Скопировано'; setTimeout(() => { c.classList.remove('done'); c.innerHTML = '📋 Скопировать<span class="lg"> промт</span>'; }, 1800); }
  if (l) copy(location.href.split('#')[0] + '#' + l.dataset.link, 'Ссылка скопирована ✓');
});

function focusHash(){
  const n = decodeURIComponent(location.hash.slice(1)); if (!n) return;
  const el = document.getElementById(n);
  if (!el) { if (PAGE_TYPE !== 'all' && /^\d+$/.test(n)) location.replace('index.html#' + n); return; }
  q.value = ''; tool = 'Все'; buildFilters(); apply();
  const go = () => el.scrollIntoView({block: 'start'}); go(); [400, 1200, 2500].forEach(t => setTimeout(go, t));
  el.querySelectorAll('img').forEach(i => i.loading = 'eager'); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 3200);
}

render(); buildFilters(); apply();
let gal = [], gi = 0;
const lbEl = document.getElementById('lb');
function showLb(){ lbEl.querySelector('img').src = gal[gi]; const many = gal.length > 1;
  lbEl.querySelectorAll('.lbn').forEach(b => b.hidden = !many); lbEl.querySelector('.lbc').textContent = many ? (gi + 1) + ' / ' + gal.length : ''; }
function openLb(list, i){ gal = list; gi = i; showLb(); lbEl.hidden = false; }
function step(d){ gi = (gi + d + gal.length) % gal.length; showLb(); }
lbEl.onclick = e => {
  if (e.target.closest('.prev')) return step(-1);
  if (e.target.closest('.next') || (e.target.tagName === 'IMG' && gal.length > 1)) return step(1);
  lbEl.hidden = true; };
document.addEventListener('keydown', e => { if (lbEl.hidden) return; if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('lb').hidden = true; });
q.addEventListener('input', apply);
q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); q.blur(); apply(); } });
window.addEventListener('hashchange', focusHash);
window.addEventListener('load', focusHash);
