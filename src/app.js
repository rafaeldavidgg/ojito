const express = require('express');
const path = require('node:path');
const { register, login, logout, requireAuth } = require('./auth');
const { newId, normalizeUrl, detectStore } = require('./utils');
const { fetchPreview } = require('./preview');

async function canAccess(db, userId, listId) {
  const row = await db.prepare('SELECT 1 FROM memberships WHERE list_id = ? AND user_id = ?').get(listId, userId);
  return !!row;
}

async function touchList(db, listId) {
  await db.prepare("UPDATE lists SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(listId);
}

function enrichAsync(db, ojitoId, url) {
  // no bloquea la respuesta: se ejecuta en background y prerrellena si puede
  fetchPreview(url).then(async (p) => {
    try {
      if (p.ok && (p.title || p.image_url)) {
        const cur = await db.prepare('SELECT title, image_url FROM ojitos WHERE id = ?').get(ojitoId);
        if (!cur) return;
        await db.prepare('UPDATE ojitos SET title = COALESCE(NULLIF(title,\'\'), ?), image_url = COALESCE(image_url, ?), preview_status = ?, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\') WHERE id = ?')
          .run(p.title || null, p.image_url || null, 'ok', ojitoId);
      } else {
        await db.prepare("UPDATE ojitos SET preview_status = 'unavailable' WHERE id = ? AND preview_status = 'pending'").run(ojitoId);
      }
    } catch {
      // best-effort: ignorar
    }
  });
}

function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  const auth = (req, res, next) => requireAuth(db, req, res, next);

  // ---- auth ----
  app.post('/api/register', async (req, res) => {
    try {
      const user = await register(db, req.body.email, req.body.password);
      const session = await login(db, req.body.email, req.body.password);
      res.status(201).json(session);
    } catch (e) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      res.json(await login(db, req.body.email, req.body.password));
    } catch (e) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/logout', auth, async (req, res) => {
    await logout(db, req.user.token);
    res.json({ ok: true });
  });

  app.get('/api/me', auth, (req, res) => {
    res.json({ id: req.user.id, email: req.user.email });
  });

  // ---- listas ----
  app.get('/api/lists', auth, async (req, res) => {
    const includeArchived = req.query.archived === '1';
    const rows = await db.prepare(`
      SELECT l.*, (SELECT COUNT(*) FROM ojitos o WHERE o.list_id = l.id) AS ojito_count
      FROM lists l JOIN memberships m ON m.list_id = l.id
      WHERE m.user_id = ? ${includeArchived ? '' : 'AND l.archived_at IS NULL'}
      ORDER BY l.updated_at DESC
    `).all(req.user.id);
    res.json(rows);
  });

  app.post('/api/lists', auth, async (req, res) => {
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (title.length > 80) return res.status(400).json({ error: 'Nombre demasiado largo (max 80)' });
    const id = newId('list');
    await db.prepare("INSERT INTO lists (id, title, visibility, created_by) VALUES (?, ?, 'private', ?)").run(id, title, req.user.id);
    await db.prepare("INSERT INTO memberships (list_id, user_id, role) VALUES (?, ?, 'owner')").run(id, req.user.id);
    res.status(201).json(await db.prepare('SELECT * FROM lists WHERE id = ?').get(id));
  });

  async function loadList(req, res, next) {
    const list = await db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
    if (!list || !(await canAccess(db, req.user.id, list.id))) return res.status(404).json({ error: 'Lista no encontrada' });
    req.list = list;
    next();
  }

  app.get('/api/lists/:id', auth, loadList, (req, res) => res.json(req.list));

  app.patch('/api/lists/:id', auth, loadList, async (req, res) => {
    const updates = [];
    const params = [];
    if (req.body.title !== undefined) {
      const t = String(req.body.title).trim();
      if (!t) return res.status(400).json({ error: 'El nombre no puede estar vacio' });
      if (t.length > 80) return res.status(400).json({ error: 'Nombre demasiado largo (max 80)' });
      updates.push('title = ?');
      params.push(t);
    }
    if (req.body.archived !== undefined) {
      updates.push('archived_at = ?');
      params.push(req.body.archived ? new Date().toISOString() : null);
    }
    if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    await db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...params, req.list.id);
    res.json(await db.prepare('SELECT * FROM lists WHERE id = ?').get(req.list.id));
  });

  app.delete('/api/lists/:id', auth, loadList, async (req, res) => {
    await db.prepare('DELETE FROM lists WHERE id = ?').run(req.list.id);
    res.json({ ok: true });
  });

  // ---- ojitos ----
  app.get('/api/lists/:id/ojitos', auth, loadList, async (req, res) => {
    const status = req.query.status;
    const where = status === 'pending' || status === 'purchased' ? 'AND o.status = ?' : '';
    const args = status === 'pending' || status === 'purchased' ? [req.list.id, status] : [req.list.id];
    const rows = await db.prepare(`SELECT * FROM ojitos o WHERE o.list_id = ? ${where} ORDER BY o.created_at DESC`).all(...args);
    res.json(rows);
  });

  app.post('/api/lists/:id/ojitos', auth, loadList, async (req, res) => {
    let normalized;
    try {
      normalized = normalizeUrl(req.body.url);
    } catch {
      return res.status(400).json({ error: 'URL invalida: pega un enlace http(s) completo' });
    }
    const id = newId('oj');
    const store = req.body.store ? String(req.body.store).slice(0, 120) : detectStore(normalized);
    await db.prepare(`INSERT INTO ojitos (id, list_id, url, normalized_url, title, store, image_url, price_snapshot, note, status, preview_status, added_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`)
      .run(
        id, req.list.id, String(req.body.url).trim(), normalized,
        req.body.title ? String(req.body.title).slice(0, 300) : null,
        store,
        req.body.image_url ? String(req.body.image_url).slice(0, 2000) : null,
        req.body.price_snapshot ? String(req.body.price_snapshot).slice(0, 60) : null,
        req.body.note ? String(req.body.note).slice(0, 1000) : null,
        req.user.id,
      );
    await touchList(db, req.list.id);
    enrichAsync(db, id, normalized);
    res.status(201).json(await db.prepare('SELECT * FROM ojitos WHERE id = ?').get(id));
  });

  async function loadOjito(req, res, next) {
    const oj = await db.prepare('SELECT * FROM ojitos WHERE id = ?').get(req.params.id);
    if (!oj || !(await canAccess(db, req.user.id, oj.list_id))) return res.status(404).json({ error: 'Ojito no encontrado' });
    req.ojito = oj;
    next();
  }

  app.get('/api/ojitos/:id', auth, loadOjito, (req, res) => res.json(req.ojito));

  app.patch('/api/ojitos/:id', auth, loadOjito, async (req, res) => {
    const allowed = ['title', 'store', 'image_url', 'price_snapshot', 'note', 'url', 'status'];
    const sets = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] === undefined) continue;
      if (k === 'url') {
        try {
          const n = normalizeUrl(req.body.url);
          sets.push('url = ?', 'normalized_url = ?');
          params.push(String(req.body.url).trim(), n);
        } catch {
          return res.status(400).json({ error: 'URL invalida' });
        }
      } else if (k === 'status') {
        if (!['pending', 'purchased'].includes(req.body.status)) return res.status(400).json({ error: 'Estado invalido' });
        sets.push('status = ?', 'purchased_at = ?');
        params.push(req.body.status, req.body.status === 'purchased' ? new Date().toISOString() : null);
      } else {
        const v = req.body[k] === null ? null : String(req.body[k]).slice(0, k === 'note' ? 1000 : 2000);
        sets.push(`${k} = ?`);
        params.push(v === '' ? null : v);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    await db.prepare(`UPDATE ojitos SET ${sets.join(', ')} WHERE id = ?`).run(...params, req.ojito.id);
    await touchList(db, req.ojito.list_id);
    res.json(await db.prepare('SELECT * FROM ojitos WHERE id = ?').get(req.ojito.id));
  });

  app.delete('/api/ojitos/:id', auth, loadOjito, async (req, res) => {
    await db.prepare('DELETE FROM ojitos WHERE id = ?').run(req.ojito.id);
    await touchList(db, req.ojito.list_id);
    res.json({ ok: true });
  });

  app.post('/api/ojitos/:id/retry-preview', auth, loadOjito, async (req, res) => {
    await db.prepare("UPDATE ojitos SET preview_status = 'pending' WHERE id = ?").run(req.ojito.id);
    const p = await fetchPreview(req.ojito.normalized_url);
    if (p.ok && (p.title || p.image_url)) {
      await db.prepare('UPDATE ojitos SET title = COALESCE(title, ?), image_url = COALESCE(image_url, ?), preview_status = ? WHERE id = ?')
        .run(p.title, p.image_url, 'ok', req.ojito.id);
    } else {
      await db.prepare("UPDATE ojitos SET preview_status = 'unavailable' WHERE id = ?").run(req.ojito.id);
    }
    res.json(await db.prepare('SELECT * FROM ojitos WHERE id = ?').get(req.ojito.id));
  });

  // ---- estatico PWA ----
  app.use(express.static(path.join(__dirname, '..', 'public')));

  return app;
}

module.exports = { createApp, canAccess };
