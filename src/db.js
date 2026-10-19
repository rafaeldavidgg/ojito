const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = process.env.OJITO_DB || path.join(__dirname, '..', 'data.sqlite');

const SCHEMA_SQL = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private',
      created_by TEXT NOT NULL REFERENCES users(id),
      archived_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS memberships (
      list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      PRIMARY KEY (list_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS ojitos (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      normalized_url TEXT NOT NULL,
      title TEXT,
      store TEXT,
      image_url TEXT,
      price_snapshot TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      preview_status TEXT NOT NULL DEFAULT 'pending',
      preview_reason TEXT,
      added_by TEXT NOT NULL REFERENCES users(id),
      purchased_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_ojitos_list ON ojitos(list_id);
`;

function useTurso(dbPath) {
  // Tests usan ':memory:' y deben seguir en local aunque haya TURSO_* en env.
  if (dbPath === ':memory:') return false;
  return !!process.env.TURSO_DATABASE_URL;
}

function normalizeArgs(params) {
  let args = params;
  if (args.length === 1 && Array.isArray(args[0])) args = args[0];
  return args.map((v) => (v === undefined ? null : v));
}

function rowsToObjects(rs) {
  if (!rs || !rs.rows) return [];
  const rows = rs.rows;
  if (rows.length === 0) return [];
  // @libsql/client ya devuelve objetos {col: val} en la mayoria de builds.
  if (!Array.isArray(rows[0])) return rows;
  const cols = rs.columns || [];
  return rows.map((r) => Object.fromEntries(r.map((v, i) => [cols[i] || i, v])));
}

function openDb(dbPath = DB_PATH) {
  if (useTurso(dbPath)) {
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const tursoPrepare = (sql) => ({
      get: async (...params) => {
        const rs = await client.execute({ sql, args: normalizeArgs(params) });
        const objs = rowsToObjects(rs);
        return objs[0];
      },
      all: async (...params) => {
        const rs = await client.execute({ sql, args: normalizeArgs(params) });
        return rowsToObjects(rs);
      },
      run: async (...params) => {
        const rs = await client.execute({ sql, args: normalizeArgs(params) });
        return { changes: rs.rowsAffected ?? 0, lastInsertRowid: rs.lastInsertRowid };
      },
    });
    return {
      _turso: true,
      _client: client,
      prepare: tursoPrepare,
      exec: async (sql) => {
        for (const stmt of sql.split(';')) {
          const s = stmt.trim();
          if (s) await client.execute(s);
        }
      },
      // Helpers directos (mapean get/all/run sin pasar por prepare).
      get: async (sql, args = []) => {
        const rs = await client.execute({ sql, args: normalizeArgs([args]).flat() });
        return rowsToObjects(rs)[0];
      },
      all: async (sql, args = []) => {
        const flat = Array.isArray(args) ? args : [args];
        const rs = await client.execute({ sql, args: flat.map((v) => (v === undefined ? null : v)) });
        return rowsToObjects(rs);
      },
      run: async (sql, args = []) => {
        const flat = Array.isArray(args) ? args : [args];
        const rs = await client.execute({ sql, args: flat.map((v) => (v === undefined ? null : v)) });
        return { changes: rs.rowsAffected ?? 0 };
      },
      close: async () => client.close(),
    };
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  // Helpers async-compatibles para unificar con Turso (await funciona en ambos).
  if (!db.get) {
    db.get = (...a) => {
      const [sql, ...rest] = a;
      const args = rest.length === 1 && Array.isArray(rest[0]) ? rest[0] : rest;
      return db.prepare(sql).get(...args);
    };
    db.all = (...a) => {
      const [sql, ...rest] = a;
      const args = rest.length === 1 && Array.isArray(rest[0]) ? rest[0] : rest;
      return db.prepare(sql).all(...args);
    };
    db.run = (...a) => {
      const [sql, ...rest] = a;
      const args = rest.length === 1 && Array.isArray(rest[0]) ? rest[0] : rest;
      return db.prepare(sql).run(...args);
    };
  }
  return db;
}

async function migrate(db) {
  if (db && db._turso) {
    await db.exec(SCHEMA_SQL);
    try {
      await db._client.execute('ALTER TABLE ojitos ADD COLUMN preview_reason TEXT');
    } catch (e) {
      if (!/duplicate|already exists/i.test(e && e.message ? e.message : '')) throw e;
    }
    return;
  }
  db.exec(SCHEMA_SQL);
  try {
    db.exec('ALTER TABLE ojitos ADD COLUMN preview_reason TEXT');
  } catch (e) {
    if (!/duplicate/i.test(e && e.message ? e.message : '')) throw e;
  }
}

module.exports = { openDb, migrate, DB_PATH, SCHEMA_SQL };
