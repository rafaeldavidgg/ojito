const { newId, hashPassword, verifyPassword } = require('./utils');

async function register(db, email, password) {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw Object.assign(new Error('Email invalido'), { status: 400 });
  if (String(password || '').length < 8) throw Object.assign(new Error('Password minimo 8 caracteres'), { status: 400 });
  const exists = await db.prepare('SELECT id FROM users WHERE email = ?').get(clean);
  if (exists) throw Object.assign(new Error('Email ya registrado'), { status: 409 });
  const id = newId('u');
  await db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, clean, hashPassword(password));
  return { id, email: clean };
}

async function login(db, email, password) {
  const clean = String(email || '').trim().toLowerCase();
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').get(clean);
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw Object.assign(new Error('Credenciales invalidas'), { status: 401 });
  }
  const token = newId('tok') + newId('');
  await db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, row.id);
  return { token, user: { id: row.id, email: row.email } };
}

async function logout(db, token) {
  if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

async function authFromHeader(db, req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const row = await db.prepare('SELECT s.token, u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(token);
  return row ? { id: row.id, email: row.email, token: row.token } : null;
}

async function requireAuth(db, req, res, next) {
  const user = await authFromHeader(db, req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  req.user = user;
  next();
}

module.exports = { register, login, logout, authFromHeader, requireAuth };
