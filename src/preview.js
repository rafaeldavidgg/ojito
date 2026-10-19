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

function pickMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]*>`, 'i');
  const tag = html.match(re);
  if (!tag) return null;
  const m = tag[0].match(/content=["']([^"']+)["']/i);
  return m ? m[1].trim().slice(0, 500) : null;
}

function pickTitle(html) {
  const og = pickMeta(html, 'og:title');
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
  return m ? m[1].trim() : null;
}

function pickImage(html, baseUrl) {
  const og = pickMeta(html, 'og:image');
  if (!og) return null;
  try {
    return new URL(og, baseUrl).toString().slice(0, 2000);
  } catch {
    return null;
  }
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

module.exports = { fetchPreview, isPublicHttp };
