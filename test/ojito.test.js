const test = require('node:test');
const assert = require('node:assert/strict');
const { openDb, migrate } = require('../src/db');
const { createApp } = require('../src/app');

function memApp() {
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp(db);
  return { db, app };
}

function start(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
}

async function api(port, method, path, token, body) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* vacio */ }
  return { status: res.status, json };
}

test('esquema share-ready: lists sin user_id y lista crea membership owner', async () => {
  const { db } = memApp();
  const cols = db.prepare("PRAGMA table_info(lists)").all().map((c) => c.name);
  assert.ok(!cols.includes('user_id'), 'lists no debe tener user_id directo');
  assert.ok(cols.includes('created_by'));
  const mcols = db.prepare("PRAGMA table_info(memberships)").all().map((c) => c.name);
  assert.ok(mcols.includes('list_id') && mcols.includes('user_id') && mcols.includes('role'));
  const ocols = db.prepare("PRAGMA table_info(ojitos)").all().map((c) => c.name);
  assert.ok(ocols.includes('added_by'));
});

test('auth + listas privadas aisladas por membership', async () => {
  const { app } = memApp();
  const srv = await start(app);
  const port = srv.address().port;
  try {
    const a = await api(port, 'POST', '/api/register', null, { email: 'ella@ojito.app', password: 'supersecreta1' });
    assert.equal(a.status, 201);
    const b = await api(port, 'POST', '/api/register', null, { email: 'el@ojito.app', password: 'supersecreta2' });
    assert.equal(b.status, 201);

    const l = await api(port, 'POST', '/api/lists', a.json.token, { title: 'Regalos Navidad' });
    assert.equal(l.status, 201);
    assert.equal(l.json.visibility, 'private');

    const bad = await api(port, 'POST', '/api/lists', a.json.token, { title: '   ' });
    assert.equal(bad.status, 400);

    const mineB = await api(port, 'GET', '/api/lists', b.json.token);
    assert.equal(mineB.status, 200);
    assert.deepEqual(mineB.json, []);

    const peek = await api(port, 'GET', `/api/lists/${l.json.id}`, b.json.token);
    assert.equal(peek.status, 404);
  } finally {
    srv.close();
  }
});

test('ojitos: guardado minimo, url invalida rechazada, edicion y estado', async () => {
  const { app } = memApp();
  const srv = await start(app);
  const port = srv.address().port;
  try {
    const a = await api(port, 'POST', '/api/register', null, { email: 'a@ojito.app', password: 'supersecreta1' });
    const l = await api(port, 'POST', '/api/lists', a.json.token, { title: 'Caprichos caros' });

    const bad = await api(port, 'POST', `/api/lists/${l.json.id}/ojitos`, a.json.token, { url: 'pantalon zara' });
    assert.equal(bad.status, 400);

    const good = await api(port, 'POST', `/api/lists/${l.json.id}/ojitos`, a.json.token, { url: 'https://www.zara.com/es/pantalon-123' });
    assert.equal(good.status, 201);
    assert.equal(good.json.status, 'pending');
    assert.ok(good.json.store.toLowerCase().includes('zara'));

    const edit = await api(port, 'PATCH', `/api/ojitos/${good.json.id}`, a.json.token, { title: 'Tonico Primor', note: 'piel sensible' });
    assert.equal(edit.status, 200);
    assert.equal(edit.json.title, 'Tonico Primor');

    const bought = await api(port, 'PATCH', `/api/ojitos/${good.json.id}`, a.json.token, { status: 'purchased' });
    assert.equal(bought.json.status, 'purchased');

    const pend = await api(port, 'GET', `/api/lists/${l.json.id}/ojitos?status=pending`, a.json.token);
    assert.deepEqual(pend.json, []);
  } finally {
    srv.close();
  }
});

test('preview bloqueada no impide guardar + share-ready via SQL', async () => {
  const { db, app } = memApp();
  const srv = await start(app);
  const port = srv.address().port;
  try {
    const a = await api(port, 'POST', '/api/register', null, { email: 'x@ojito.app', password: 'supersecreta1' });
    const bb = await api(port, 'POST', '/api/register', null, { email: 'y@ojito.app', password: 'supersecreta2' });
    const l = await api(port, 'POST', '/api/lists', a.json.token, { title: 'Aniversario' });
    const t0 = Date.now();
    const o = await api(port, 'POST', `/api/lists/${l.json.id}/ojitos`, a.json.token, { url: 'http://localhost:9/nonexistent' });
    assert.equal(o.status, 201);
    assert.ok(Date.now() - t0 < 5000, 'el guardado responde sin esperar al fetch');

    // v2 simulada: anadir segundo miembro por SQL otorga acceso sin migracion
    const rowB = db.prepare('SELECT id FROM users WHERE email = ?').get('y@ojito.app');
    db.prepare("INSERT INTO memberships (list_id, user_id, role) VALUES (?, ?, 'editor')").run(l.json.id, rowB.id);
    const seen = await api(port, 'GET', `/api/lists/${l.json.id}`, bb.json.token);
    assert.equal(seen.status, 200);
  } finally {
    srv.close();
  }
});
