const $ = (s) => document.querySelector(s);
let token = localStorage.getItem('ojito_token') || null;
let lists = [];
let activeList = null;
let filter = 'pending';

async function req(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error((json && json.error) || `Error ${res.status}`);
  return json;
}

function show(view) {
  $('#authView').hidden = view !== 'auth';
  $('#mainView').hidden = view !== 'main';
}

async function refreshMe() {
  if (!token) { show('auth'); return; }
  try {
    const me = await req('GET', '/api/me');
    $('#session').innerHTML = `<span>${me.email}</span><button id="out" class="btn ghost small">Salir</button>`;
    $('#out').onclick = async () => { await req('POST', '/api/logout'); token = null; localStorage.removeItem('ojito_token'); location.reload(); };
    show('main');
    await loadLists();
  } catch { token = null; localStorage.removeItem('ojito_token'); show('auth'); }
}

async function loadLists() {
  lists = await req('GET', '/api/lists');
  const box = $('#lists');
  box.innerHTML = '';
  if (!lists.length) box.innerHTML = '<p class="lede">Aún no hay listas. Crea la primera: Navidad, Aniversario…</p>';
  for (const l of lists) {
    const b = document.createElement('button');
    b.className = 'chip' + (activeList && activeList.id === l.id ? ' active' : '');
    b.textContent = `${l.title} · ${l.ojito_count}`;
    b.onclick = () => { activeList = l; loadLists(); loadDetail(); };
    box.appendChild(b);
  }
  if (!activeList && lists.length) { activeList = lists[0]; loadDetail(); }
  if (activeList) {
    activeList = lists.find((x) => x.id === activeList.id) || null;
    if (activeList) loadDetail(); else { activeList = null; $('#detail').hidden = true; }
  }
}

async function loadDetail() {
  if (!activeList) return;
  $('#detail').hidden = false;
  $('#detailTitle').textContent = activeList.title;
  document.querySelectorAll('.filters .chip').forEach((c) => {
    const on = c.dataset.filter === filter;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const items = await req('GET', `/api/lists/${activeList.id}/ojitos?status=${filter}`);
  const grid = $('#grid');
  grid.innerHTML = '';
  if (!items.length) grid.innerHTML = '<p class="lede">Nada por aquí. Pega el primer enlace arriba.</p>';
  for (const o of items) {
    const d = document.createElement('article');
    d.className = 'tile';
    const title = o.title || 'Ojito sin título';
    const noPreview = !o.image_url && o.preview_status === 'unavailable';
    const media = o.image_url
      ? `<img src="${escapeAttr(o.image_url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" sizes="(max-width: 480px) 100vw, (max-width: 1100px) 50vw, 33vw">`
      : `<div class="noimg">${noPreview ? 'Sin preview — usa Editar para añadir la imagen' : o.preview_status === 'unavailable' ? 'Sin preview — edítalo a mano' : 'Buscando preview…'}</div>`;
    d.innerHTML = `${media}<div class="body"><span class="store">${escapeHtml(o.store || 'link')}</span><h4>${escapeHtml(title)}</h4>
      <a class="url" href="${escapeAttr(o.url)}" target="_blank" rel="noopener">${escapeHtml(shortUrl(o.url))}</a>
      ${o.note ? `<p class="note">${escapeHtml(o.note)}</p>` : ''}
      <div class="actions"></div></div>`;
    const acts = d.querySelector('.actions');
    const toggle = document.createElement('button');
    toggle.className = 'linklike';
    toggle.textContent = o.status === 'pending' ? 'Marcar comprado' : 'Volver a pendiente';
    toggle.onclick = async () => { await req('PATCH', `/api/ojitos/${o.id}`, { status: o.status === 'pending' ? 'purchased' : 'pending' }); loadDetail(); loadLists(); };
    const edit = document.createElement('button');
    edit.className = 'linklike'; edit.textContent = 'Editar';
    edit.onclick = () => openEditSheet(o);
    const retry = document.createElement('button');
    retry.className = 'linklike'; retry.textContent = 'Reintentar preview';
    retry.onclick = async () => { await req('POST', `/api/ojitos/${o.id}/retry-preview`); loadDetail(); };
    const del = document.createElement('button');
    del.className = 'linklike'; del.textContent = 'Eliminar';
    del.onclick = async () => { if (confirm('¿Eliminar este ojito?')) { await req('DELETE', `/api/ojitos/${o.id}`); loadDetail(); loadLists(); } };
    acts.append(toggle, edit, retry, del);
    grid.appendChild(d);
  }
}

function openEditSheet(o) {
  closeEditSheet();
  const dlg = document.createElement('div');
  dlg.id = 'editSheet';
  dlg.className = 'sheet-backdrop';
  dlg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Editar ojito">
    <h3>Editar ojito</h3>
    <label>Título<input class="f-title" maxlength="300" value="${escapeAttr(o.title || '')}" placeholder="Camiseta larga pijama"></label>
    <label>URL de la imagen<input class="f-image" inputmode="url" autocomplete="url" placeholder="https://…" value="${escapeAttr(o.image_url || '')}" aria-label="URL de la imagen"></label>
    <p class="hint">En la tienda: mantén la foto → Copiar enlace de imagen → pégalo aquí. Si la tienda caduca el enlace, la foto puede caer: vuelve a pegarla.</p>
    <div class="imgpreview" hidden></div>
    <p class="imgerror error" role="alert" aria-live="polite" hidden></p>
    <label>Nota<input class="f-note" maxlength="1000" value="${escapeAttr(o.note || '')}" placeholder="Talla, color…"></label>
    <div class="sheet-row">
      <button class="btn ghost small cancel" type="button">Cancelar</button>
      <button class="btn primary small save" type="button">Guardar</button>
    </div>
  </div>`;
  document.body.appendChild(dlg);
  const title = dlg.querySelector('.f-title');
  const image = dlg.querySelector('.f-image');
  const note = dlg.querySelector('.f-note');
  const preview = dlg.querySelector('.imgpreview');
  const error = dlg.querySelector('.imgerror');
  const refresh = () => {
    const v = image.value.trim();
    error.hidden = true;
    preview.hidden = true;
    preview.innerHTML = '';
    if (!v) return;
    if (!isHttpImageUrl(v)) {
      error.textContent = 'Pega una URL de imagen http(s), p. ej. https://…/foto.jpg';
      error.hidden = false;
      return;
    }
    preview.innerHTML = `<img src="${escapeAttr(v)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
    preview.hidden = false;
  };
  image.addEventListener('input', refresh);
  refresh();
  if (image.value) title.focus(); else image.focus();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeEditSheet(); });
  dlg.querySelector('.cancel').onclick = closeEditSheet;
  dlg.querySelector('.save').onclick = async () => {
    const img = image.value.trim();
    if (img && !isHttpImageUrl(img)) {
      error.textContent = 'Pega una URL de imagen http(s), p. ej. https://…/foto.jpg';
      error.hidden = false;
      return;
    }
    try {
      await req('PATCH', `/api/ojitos/${o.id}`, { title: title.value, note: note.value, image_url: img === '' ? null : img });
      closeEditSheet();
      loadDetail();
    } catch (err) { error.textContent = err.message; error.hidden = false; }
  };
}

function closeEditSheet() { document.querySelector('#editSheet')?.remove(); }
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
function shortUrl(u) { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + x.pathname.slice(0, 40); } catch { return u; } }
function isHttpImageUrl(s) { try { const u = new URL(String(s || '').trim()); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } }

$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const mode = e.submitter.dataset.mode;
  $('#authError').textContent = '';
  try {
    const r = await req('POST', mode === 'login' ? '/api/login' : '/api/register', { email: $('#email').value, password: $('#password').value });
    token = r.token; localStorage.setItem('ojito_token', token);
    refreshMe();
  } catch (err) { $('#authError').textContent = err.message; }
});

$('#newListForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('#newListTitle').value.trim();
  if (!title) return;
  const created = await req('POST', '/api/lists', { title });
  $('#newListTitle').value = '';
  activeList = created;
  await loadLists(); loadDetail();
});

$('#newOjitoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = $('#newOjitoUrl').value.trim();
  if (!url || !activeList) return;
  $('#newOjitoUrl').value = '';
  await req('POST', `/api/lists/${activeList.id}/ojitos`, { url });
  filter = 'pending';
  await loadDetail(); loadLists();
});

document.querySelectorAll('.filters .chip').forEach((c) => c.onclick = () => { filter = c.dataset.filter; loadDetail(); });

$('#renameBtn').onclick = async () => {
  const t = prompt('Nuevo nombre', activeList.title);
  if (!t || !t.trim()) return;
  activeList = await req('PATCH', `/api/lists/${activeList.id}`, { title: t.trim() });
  loadLists(); loadDetail();
};
$('#archiveBtn').onclick = async () => {
  activeList = await req('PATCH', `/api/lists/${activeList.id}`, { archived: true });
  activeList = null; $('#detail').hidden = true; loadLists();
};
$('#deleteListBtn').onclick = async () => {
  if (!confirm(`¿Eliminar "${activeList.title}" y sus ojitos?`)) return;
  await req('DELETE', `/api/lists/${activeList.id}`);
  activeList = null; $('#detail').hidden = true; loadLists();
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
refreshMe();
