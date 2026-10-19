const crypto = require('node:crypto');

function newId(prefix = 'id') {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function normalizeUrl(raw) {
  const trimmed = String(raw || '').trim();
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const u = new URL(withProto);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('URL invalida: solo http(s)');
  u.hash = '';
  // quitar params tipicos de tracking sin romper la url base
  const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
  for (const k of drop) u.searchParams.delete(k);
  return u.toString();
}

function detectStore(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (host.includes('zara.com')) return 'Zara';
    if (host.includes('victoriassecret')) return "Victoria's Secret";
    if (host.includes('primor')) return 'Primor';
    if (host.includes('shein')) return 'Shein';
    if (host.includes('sephora')) return 'Sephora';
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('hm.com')) return 'H&M';
    if (host.includes('mango')) return 'Mango';
    return host;
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored).split(':');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const check = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
}

module.exports = { newId, normalizeUrl, detectStore, hashPassword, verifyPassword };
