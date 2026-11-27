'use strict';

const crypto = require('crypto');

const COOKIE_NAME = 'portfolio_admin_session';
const SESSION_TTL_SECONDS = 7200;
const FAIL_DELAY_MS = 700;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(val);
    } catch (_) {
      cookies[key] = val;
    }
  }
  return cookies;
}

function getRequestHost(req) {
  const raw = req.headers['x-forwarded-host'] || req.headers.host || '';
  return String(raw).split(',')[0].trim();
}

function isSecureRequest(req) {
  if (process.env.VERCEL_ENV === 'production') return true;
  const host = getRequestHost(req).split(':')[0].toLowerCase();
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  if ((host === 'localhost' || host === '127.0.0.1') && proto !== 'https') {
    return false;
  }
  return true;
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  const host = getRequestHost(req);
  if (!origin || !host) return false;

  let originUrl;
  try {
    originUrl = new URL(String(origin));
  } catch (_) {
    return false;
  }

  if (originUrl.host !== host) return false;

  const isProd = process.env.VERCEL_ENV === 'production';
  if (originUrl.protocol === 'https:') {
    if (!isProd) return true;
    const allowedProdHosts = new Set(
      [
        'ammar1993.vercel.app',
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
      ]
        .filter(Boolean)
        .map((h) => String(h).trim())
    );
    return allowedProdHosts.has(host);
  }

  if (originUrl.protocol === 'http:') {
    return !isProd && (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1');
  }

  return false;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || !password) return false;
  if (typeof storedHash !== 'string' || !storedHash) return false;

  const parts = storedHash.trim().split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltHex = parts[4];
  const hashHex = parts[5];

  if (!Number.isInteger(N) || N < 2 || !Number.isInteger(r) || r < 1 || !Number.isInteger(p) || p < 1) {
    return false;
  }
  if (!/^[a-f0-9]{16,}$/i.test(saltHex) || !/^[a-f0-9]{32,}$/i.test(hashHex) || hashHex.length % 2 !== 0) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(hashHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, saltHex, expectedBuf.length, { N, r, p });
    if (derivedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, expectedBuf);
  } catch (_) {
    return false;
  }
}

function signHmac(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function createSessionToken(secret, ttlSeconds = SESSION_TTL_SECONDS) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload = {
    iat,
    exp,
    n: crypto.randomBytes(12).toString('hex'),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signHmac(encodedPayload, secret);
  return { token: `${encodedPayload}.${signature}`, exp };
}

function verifySessionToken(token, secret) {
  if (typeof token !== 'string' || typeof secret !== 'string' || !secret) {
    return { valid: false };
  }
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0 || dotIdx !== token.lastIndexOf('.')) {
    return { valid: false };
  }

  const encodedPayload = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!encodedPayload || !providedSig) return { valid: false };

  const expectedSig = signHmac(encodedPayload, secret);
  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload.exp !== 'number' || payload.exp <= now) {
      return { valid: false };
    }
    return { valid: true, exp: payload.exp };
  } catch (_) {
    return { valid: false };
  }
}

function buildSessionCookie(token, isSecure) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/api',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}

function buildClearSessionCookie(isSecure) {
  const parts = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/api',
    'Max-Age=0',
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}

async function readJsonBody(req, maxBytes = 256 * 1024) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      const size = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
      if (size > maxBytes) {
        const err = new Error('حجم البيانات المرسلة يتجاوز الحد المسموح به');
        err.status = 413;
        throw err;
      }
      return req.body;
    }
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
        const err = new Error('حجم البيانات المرسلة يتجاوز الحد المسموح به');
        err.status = 413;
        throw err;
      }
      if (!req.body.trim()) return {};
      try {
        return JSON.parse(req.body);
      } catch (_) {
        const err = new Error('صيغة JSON غير صالحة');
        err.status = 400;
        throw err;
      }
    }
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        settled = true;
        const err = new Error('حجم البيانات المرسلة يتجاوز الحد المسموح به');
        err.status = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        const err = new Error('صيغة JSON غير صالحة');
        err.status = 400;
        reject(err);
      }
    });

    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      err.status = 400;
      reject(err);
    });
  });
}

function getSessionFromRequest(req) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return { configured: false, valid: false };
  const cookies = parseCookies(req.headers.cookie);
  const result = verifySessionToken(cookies[COOKIE_NAME], secret);
  return { configured: true, ...result };
}

function requireAuth(req, res, { checkOrigin = true } = {}) {
  if (!process.env.SESSION_SECRET) {
    sendJson(res, 500, { error: 'إعدادات الخادم غير مكتملة (SESSION_SECRET مفقود)' });
    return { ok: false };
  }

  if (checkOrigin && !isAllowedOrigin(req)) {
    sendJson(res, 403, { error: 'طلب مرفوض: مصدر غير مصرح به' });
    return { ok: false };
  }

  const session = getSessionFromRequest(req);
  if (!session.valid) {
    sendJson(res, 401, { error: 'يرجى تسجيل الدخول أولاً' });
    return { ok: false };
  }

  return { ok: true, session };
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  FAIL_DELAY_MS,
  sleep,
  sendJson,
  parseCookies,
  isSecureRequest,
  isAllowedOrigin,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  buildSessionCookie,
  buildClearSessionCookie,
  readJsonBody,
  getSessionFromRequest,
  requireAuth,
};
