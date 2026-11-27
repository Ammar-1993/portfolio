'use strict';

const {
  FAIL_DELAY_MS,
  sleep,
  sendJson,
  isSecureRequest,
  isAllowedOrigin,
  verifyPassword,
  createSessionToken,
  buildSessionCookie,
  buildClearSessionCookie,
  readJsonBody,
  getSessionFromRequest,
} = require('./_lib/auth');

function getConfiguredBranch() {
  return process.env.GITHUB_BRANCH || 'main';
}

module.exports = async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const session = getSessionFromRequest(req);
    if (!session.configured) {
      return sendJson(res, 500, { error: 'إعدادات الخادم غير مكتملة (SESSION_SECRET مفقود)' });
    }
    if (!session.valid) {
      return sendJson(res, 200, { authenticated: false });
    }
    return sendJson(res, 200, {
      authenticated: true,
      exp: session.exp,
      branch: getConfiguredBranch(),
    });
  }

  if (method === 'POST') {
    if (!isAllowedOrigin(req)) {
      return sendJson(res, 403, { error: 'طلب مرفوض: مصدر غير مصرح به' });
    }

    const storedHash = process.env.ADMIN_PASSWORD_HASH;
    const sessionSecret = process.env.SESSION_SECRET;
    if (!storedHash || !sessionSecret) {
      return sendJson(res, 500, { error: 'إعدادات الخادم غير مكتملة (متغيرات المصادقة مفقودة)' });
    }

    let body;
    try {
      body = await readJsonBody(req, 4096);
    } catch (err) {
      return sendJson(res, err.status || 400, { error: err.message });
    }

    const password = typeof body.password === 'string' ? body.password : '';
    if (!verifyPassword(password, storedHash)) {
      await sleep(FAIL_DELAY_MS);
      return sendJson(res, 401, { error: 'كلمة المرور غير صحيحة' });
    }

    const { token, exp } = createSessionToken(sessionSecret);
    res.setHeader('Set-Cookie', buildSessionCookie(token, isSecureRequest(req)));
    return sendJson(res, 200, {
      authenticated: true,
      exp,
      branch: getConfiguredBranch(),
    });
  }

  if (method === 'DELETE') {
    if (!isAllowedOrigin(req)) {
      return sendJson(res, 403, { error: 'طلب مرفوض: مصدر غير مصرح به' });
    }
    res.setHeader('Set-Cookie', buildClearSessionCookie(isSecureRequest(req)));
    return sendJson(res, 200, { authenticated: false });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return sendJson(res, 405, { error: 'Method Not Allowed' });
};
