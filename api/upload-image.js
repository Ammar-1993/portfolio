'use strict';

const { sendJson, readJsonBody, requireAuth } = require('./_lib/auth');
const { GitHubError, createBlob } = require('./_lib/github');

const SAFE_WEBP_FILENAME_RE = /^[a-z0-9][a-z0-9-]{1,90}\.webp$/;
const BASE64_DATA_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_REQUEST_BYTES = Math.ceil(2.4 * 1024 * 1024);
const MAX_IMAGE_BYTES = 1572864; // 1.5 MB

function isValidWebpBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 16 || buf.length > MAX_IMAGE_BYTES) {
    return false;
  }
  return (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

module.exports = async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const auth = requireAuth(req, res, { checkOrigin: true });
  if (!auth.ok) return;

  let body;
  try {
    body = await readJsonBody(req, MAX_REQUEST_BYTES);
  } catch (err) {
    return sendJson(res, err.status || 400, { error: err.message });
  }

  const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
  if (!SAFE_WEBP_FILENAME_RE.test(filename)) {
    return sendJson(res, 400, { error: 'اسم الملف غير صالح: يجب أن يكون بصيغة WebP وأحرف إنجليزية صغيرة فقط' });
  }

  if (typeof body.contentBase64 !== 'string' || !body.contentBase64.trim()) {
    return sendJson(res, 400, { error: 'بيانات الصورة مفقودة' });
  }

  const cleanBase64 = body.contentBase64
    .trim()
    .replace(/^data:image\/webp;base64,/i, '')
    .replace(/\s+/g, '');

  if (!cleanBase64 || !BASE64_DATA_RE.test(cleanBase64)) {
    return sendJson(res, 400, { error: 'ترميز Base64 للصورة غير صالح' });
  }

  const buf = Buffer.from(cleanBase64, 'base64');
  if (buf.length > MAX_IMAGE_BYTES) {
    return sendJson(res, 400, { error: 'حجم الصورة يتجاوز الحد الأقصى المسموح به (1.5 MB)' });
  }
  if (!isValidWebpBuffer(buf)) {
    return sendJson(res, 400, { error: 'الملف المرفوع ليس صورة WebP صالحة' });
  }

  try {
    const { sha } = await createBlob(buf.toString('base64'), 'base64');
    return sendJson(res, 200, {
      path: `images/portfolio/${filename}`,
      sha,
      bytes: buf.length,
    });
  } catch (err) {
    if (err instanceof GitHubError) {
      return sendJson(res, err.status, { error: err.message, code: err.code });
    }
    return sendJson(res, 500, { error: 'حدث خطأ غير متوقع أثناء رفع الصورة' });
  }
};
