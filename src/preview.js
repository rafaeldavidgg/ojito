// Fetcher best-effort: titulo + imagen via OpenGraph. Nunca lanza para no bloquear el guardado.
const MAX_BYTES = 500 * 1024;
const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;

function isPublicHttp(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    // Bloqueo basico SSRF: sin credenciales, sin hosts locales evidentes
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (/^(10|192\.168)\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function pickMetaContent(html, attr, value) {
  // Tolerante a orden/caso de atributos y a comillas simples/dobles.
  const tags = html.match(/<meta[^>]*>/gi) || [];
  const want = String(value).toLowerCase();
  for (const tag of tags) {
    const a = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
    if (!a || a[1].toLowerCase() !== want) continue;
    const c = tag.match(/content\s*=\s*["']([^"']+)["']/i);
    if (c && c[1].trim()) return c[1].trim().slice(0, 500);
  }
  return null;
}

function pickMeta(html, prop) {
  return pickMetaContent(html, 'property', prop);
}

function normalizeImageUrl(raw, baseUrl) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;
  try {
    const u = new URL(v, baseUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

function pickLinkImageSrc(html) {
  const tags = html.match(/<link[^>]*>/gi) || [];
  for (const tag of tags) {
    const rel = tag.match(/rel\s*=\s*["']([^"']+)["']/i);
    if (!rel || !rel[1].toLowerCase().split(/\s+/).includes('image_src')) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (href && href[1].trim()) return href[1].trim().slice(0, 500);
  }
  return null;
}

function pickJsonLdImage(html) {
  const blocks = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const b of blocks) {
    const inner = b.replace(/^<script[^>]*>/i, '').replace(/<\/script>\s*$/i, '');
    let data;
    try {
      data = JSON.parse(inner);
    } catch {
      continue;
    }
    const found = findJsonLdImage(data);
    if (found) return found;
  }
  return null;
}

function findJsonLdImage(node) {
  if (!node) return null;
  if (typeof node === 'string') return node.trim().slice(0, 500) || null;
  if (Array.isArray(node)) {
    for (const el of node) {
      const f = findJsonLdImage(el);
      if (f) return f;
    }
    return null;
  }
  if (typeof node === 'object') {
    if (node.image !== undefined) {
      const f = findJsonLdImage(node.image);
      if (f) return f;
    }
    // Product anidado habitual: mainEntity, offers aparte; buscar en profundidad
    for (const k of ['mainEntity', 'item', '@graph']) {
      if (node[k] !== undefined) {
        const f = findJsonLdImage(node[k]);
        if (f) return f;
      }
    }
    if (typeof node.url === 'string' && /img|image|media|cdn|photo/i.test(node.url)) {
      return node.url.trim().slice(0, 500) || null;
    }
  }
  return null;
}

function pickImgFallback(html) {
  const tags = html.match(/<img[^>]*src\s*=\s*["'][^"']+["'][^>]*>/gi) || [];
  const bad = /logo|icon|sprite|avatar|placeholder|pixel|1x1|blank/i;
  let first = null;
  for (const tag of tags) {
    const src = (tag.match(/src\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!src || !src.trim()) continue;
    const s = src.trim();
    if (/^(data|blob|javascript):/i.test(s)) continue;
    if (bad.test(tag) || bad.test(s)) continue;
    if (!first) first = s;
    const cls = (tag.match(/class\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    const w = parseInt((tag.match(/width\s*=\s*["']?(\d+)/i) || [])[1] || '0', 10);
    const h = parseInt((tag.match(/height\s*=\s*["']?(\d+)/i) || [])[1] || '0', 10);
    if (/product|main|hero|gallery|primary/i.test(cls) || w >= 400 || h >= 400) return s.slice(0, 500);
  }
  return first ? first.slice(0, 500) : null;
}

function pickTitle(html) {
  const og = pickMeta(html, 'og:title');
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
  return m ? m[1].trim() : null;
}

function pickImage(html, baseUrl) {
  const candidates = [
    pickMeta(html, 'og:image'),
    pickMeta(html, 'og:image:secure_url'),
    pickMetaContent(html, 'property', 'twitter:image'),
    pickMetaContent(html, 'name', 'twitter:image'),
    pickLinkImageSrc(html),
    pickJsonLdImage(html),
    pickImgFallback(html),
  ];
  for (const c of candidates) {
    const n = normalizeImageUrl(c, baseUrl);
    if (n) return n;
  }
  return null;
}

async function fetchPreview(rawUrl) {
  if (!isPublicHttp(rawUrl)) return { ok: false, reason: 'blocked' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let current = rawUrl;
    let html = null;
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const res = await fetch(current, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'user-agent': 'OjitoBot/1.0 (+https://ojito.app)', accept: 'text/html' },
      });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get('location');
        if (!loc) break;
        current = new URL(loc, current).toString();
        if (!isPublicHttp(current)) return { ok: false, reason: 'blocked' };
        continue;
      }
      if (!res.ok) return { ok: false, reason: `http-${res.status}` };
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) return { ok: false, reason: 'too-large' };
      html = buf.toString('utf8');
      break;
    }
    if (!html) return { ok: false, reason: 'empty' };
    return { ok: true, title: pickTitle(html), image_url: pickImage(html, current) };
  } catch (err) {
    return { ok: false, reason: err && err.name === 'AbortError' ? 'timeout' : 'fetch-failed' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchPreview, isPublicHttp, pickImage, pickMeta, pickTitle, normalizeImageUrl };
