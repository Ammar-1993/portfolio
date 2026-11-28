'use strict';

const {
  isSafePortfolioImagePath,
  validateProject,
  injectPortfolioGrid,
  serializePortfolioJson,
  bumpSwVersion,
  updateSitemapLastmod,
  findOrphanImages,
} = require('../lib/portfolio-builder');
const { sendJson, readJsonBody, requireAuth } = require('./_lib/auth');
const { GitHubError, getBranchHead, getFile, createBlob, commitAtomicChanges } = require('./_lib/github');

const SHA1_RE = /^[a-f0-9]{40}$/i;
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getQueryId(req) {
  if (req.query && typeof req.query.id === 'string') {
    return req.query.id.trim();
  }
  try {
    const url = new URL(req.url || '/', 'https://localhost');
    return (url.searchParams.get('id') || '').trim();
  } catch (_) {
    return '';
  }
}

function collectReferencedImages(project) {
  const set = new Set();
  if (project && project.cover) set.add(project.cover);
  if (project && Array.isArray(project.gallery)) {
    for (const img of project.gallery) {
      if (img && img.src) set.add(img.src);
    }
  }
  return set;
}

function validateUploadedBlobs(rawBlobs, allowedPathsSet) {
  if (rawBlobs === undefined || rawBlobs === null) return { valid: true, blobs: [] };
  if (!Array.isArray(rawBlobs)) {
    return { valid: false, error: 'uploadedBlobs must be an array' };
  }
  const seen = new Set();
  const blobs = [];
  for (const item of rawBlobs) {
    if (!item || typeof item !== 'object') {
      return { valid: false, error: 'Invalid uploadedBlobs entry' };
    }
    const path = typeof item.path === 'string' ? item.path.trim() : '';
    const sha = typeof item.sha === 'string' ? item.sha.trim() : '';
    if (!isSafePortfolioImagePath(path) || !SHA1_RE.test(sha)) {
      return { valid: false, error: 'Invalid uploadedBlobs path or sha' };
    }
    if (allowedPathsSet && !allowedPathsSet.has(path)) {
      return { valid: false, error: `Uploaded image "${path}" is not referenced by the project` };
    }
    if (!seen.has(path)) {
      seen.add(path);
      blobs.push({ path, sha });
    }
  }
  return { valid: true, blobs };
}

function applyOperation({ method, req, body, currentProjects }) {
  const existingIds = currentProjects.map((p) => p.id);

  if (method === 'POST') {
    const check = validateProject(body.project, { existingIds, mode: 'create' });
    if (!check.valid) {
      return { errorStatus: 400, error: check.errors.join(' | '), errors: check.errors };
    }
    const position = body.position === 'bottom' ? 'bottom' : 'top';
    const nextProjects =
      position === 'bottom' ? [...currentProjects, check.project] : [check.project, ...currentProjects];
    const blobCheck = validateUploadedBlobs(body.uploadedBlobs, collectReferencedImages(check.project));
    if (!blobCheck.valid) {
      return { errorStatus: 400, error: blobCheck.error };
    }
    return {
      nextProjects,
      deleteOrphans: false,
      uploadedBlobs: blobCheck.blobs,
      commitMessage: `content(portfolio): add ${check.project.id} [admin]`,
    };
  }

  if (method === 'PUT') {
    const id = getQueryId(req);
    const idx = currentProjects.findIndex((p) => p.id === id);
    if (!id || idx === -1) {
      return { errorStatus: 404, error: 'المشروع المطلوب تعديله غير موجود' };
    }
    const check = validateProject(body.project, { existingIds, mode: 'edit', currentId: id });
    if (!check.valid) {
      return { errorStatus: 400, error: check.errors.join(' | '), errors: check.errors };
    }
    const nextProjects = [...currentProjects];
    nextProjects[idx] = check.project;
    const blobCheck = validateUploadedBlobs(body.uploadedBlobs, collectReferencedImages(check.project));
    if (!blobCheck.valid) {
      return { errorStatus: 400, error: blobCheck.error };
    }
    return {
      nextProjects,
      deleteOrphans: Boolean(body.deleteOrphanImages),
      uploadedBlobs: blobCheck.blobs,
      commitMessage: `content(portfolio): update ${id} [admin]`,
    };
  }

  if (method === 'DELETE') {
    const id = getQueryId(req);
    const idx = currentProjects.findIndex((p) => p.id === id);
    if (!id || idx === -1) {
      return { errorStatus: 404, error: 'المشروع المطلوب حذفه غير موجود' };
    }
    const nextProjects = currentProjects.filter((p) => p.id !== id);
    return {
      nextProjects,
      deleteOrphans: body.deleteOrphanImages !== false,
      uploadedBlobs: [],
      commitMessage: `content(portfolio): delete ${id} [admin]`,
    };
  }

  if (method === 'PATCH') {
    const order = body.order;
    if (!Array.isArray(order) || order.length !== currentProjects.length) {
      return { errorStatus: 400, error: 'قائمة الترتيب يجب أن تطابق عدد المشاريع الحالية بالكامل' };
    }
    const byId = new Map(currentProjects.map((p) => [p.id, p]));
    const seen = new Set();
    const nextProjects = [];
    for (const rawId of order) {
      const id = typeof rawId === 'string' ? rawId.trim() : '';
      if (!byId.has(id) || seen.has(id)) {
        return { errorStatus: 400, error: 'قائمة الترتيب تحتوي على معرّفات غير صالحة أو مكررة' };
      }
      seen.add(id);
      nextProjects.push(byId.get(id));
    }
    return {
      nextProjects,
      deleteOrphans: false,
      uploadedBlobs: [],
      commitMessage: 'content(portfolio): reorder projects [admin]',
    };
  }

  return { errorStatus: 405, error: 'Method Not Allowed' };
}

module.exports = async (req, res) => {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const auth = requireAuth(req, res, { checkOrigin: false });
    if (!auth.ok) return;

    try {
      const head = await getBranchHead();
      const portfolioFile = await getFile('data/portfolio.json', head.commitSha);
      const parsed = JSON.parse(portfolioFile.content);
      return sendJson(res, 200, {
        projects: parsed.projects || [],
        baseSha: portfolioFile.sha,
        headSha: head.commitSha,
        branch: head.branch,
      });
    } catch (err) {
      if (err instanceof GitHubError) {
        return sendJson(res, err.status, { error: err.message, code: err.code });
      }
      return sendJson(res, 500, { error: 'تعذر جلب قائمة المشاريع من GitHub' });
    }
  }

  if (!MUTATION_METHODS.has(method)) {
    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const auth = requireAuth(req, res, { checkOrigin: true });
  if (!auth.ok) return;

  let body;
  try {
    body = await readJsonBody(req, 256 * 1024);
  } catch (err) {
    return sendJson(res, err.status || 400, { error: err.message });
  }

  const baseSha = typeof body.baseSha === 'string' ? body.baseSha.trim() : '';
  if (!SHA1_RE.test(baseSha)) {
    return sendJson(res, 400, { error: 'بصمة التزامن (baseSha) مفقودة أو غير صالحة' });
  }

  const dryRun = Boolean(body.dryRun);

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const head = await getBranchHead();
      const [portfolioFile, indexArFile, indexEnFile, swFile, sitemapFile] = await Promise.all([
        getFile('data/portfolio.json', head.commitSha),
        getFile('index.html', head.commitSha),
        getFile('index-en.html', head.commitSha),
        getFile('sw.js', head.commitSha),
        getFile('sitemap.xml', head.commitSha),
      ]);

      if (portfolioFile.sha !== baseSha) {
        return sendJson(res, 409, {
          error: 'تم تعديل قائمة المشاريع من مكان آخر منذ فتح الصفحة. يرجى تحديث البيانات والمحاولة مجدداً.',
          code: 'BASE_SHA_CONFLICT',
          currentBaseSha: portfolioFile.sha,
        });
      }

      const currentData = JSON.parse(portfolioFile.content);
      const currentProjects = Array.isArray(currentData.projects) ? currentData.projects : [];
      const result = applyOperation({ method, req, body, currentProjects });

      if (result.errorStatus) {
        return sendJson(res, result.errorStatus, {
          error: result.error,
          ...(result.errors ? { errors: result.errors } : {}),
        });
      }

      const nextData = { ...currentData, projects: result.nextProjects };
      const nextJsonStr = serializePortfolioJson(nextData);
      const nextIndexAr = injectPortfolioGrid(indexArFile.content, result.nextProjects, 'ar');
      const nextIndexEn = injectPortfolioGrid(indexEnFile.content, result.nextProjects, 'en');
      const nextSw = bumpSwVersion(swFile.content);
      const nextSitemap = updateSitemapLastmod(sitemapFile.content);
      const orphanImages = result.deleteOrphans ? findOrphanImages(currentProjects, result.nextProjects) : [];

      if (dryRun) {
        return sendJson(res, 200, {
          dryRun: true,
          commitMessage: result.commitMessage,
          projectCount: result.nextProjects.length,
          addedImages: result.uploadedBlobs.map((b) => b.path),
          deletedImages: orphanImages,
          updatedFiles: ['data/portfolio.json', 'index.html', 'index-en.html', 'sw.js', 'sitemap.xml'],
        });
      }

      const [jsonBlob, arBlob, enBlob, swBlob, sitemapBlob] = await Promise.all([
        createBlob(nextJsonStr, 'utf-8'),
        createBlob(nextIndexAr, 'utf-8'),
        createBlob(nextIndexEn, 'utf-8'),
        createBlob(nextSw, 'utf-8'),
        createBlob(nextSitemap, 'utf-8'),
      ]);

      const treeEntries = [
        { path: 'data/portfolio.json', mode: '100644', type: 'blob', sha: jsonBlob.sha },
        { path: 'index.html', mode: '100644', type: 'blob', sha: arBlob.sha },
        { path: 'index-en.html', mode: '100644', type: 'blob', sha: enBlob.sha },
        { path: 'sw.js', mode: '100644', type: 'blob', sha: swBlob.sha },
        { path: 'sitemap.xml', mode: '100644', type: 'blob', sha: sitemapBlob.sha },
        ...result.uploadedBlobs.map((b) => ({
          path: b.path,
          mode: '100644',
          type: 'blob',
          sha: b.sha,
        })),
        ...orphanImages.map((imgPath) => ({
          path: imgPath,
          mode: '100644',
          type: 'blob',
          sha: null,
        })),
      ];

      try {
        const committed = await commitAtomicChanges({
          baseTreeSha: head.treeSha,
          parentCommitSha: head.commitSha,
          entries: treeEntries,
          message: result.commitMessage,
        });

        return sendJson(res, 200, {
          ok: true,
          commitSha: committed.commitSha,
          commitUrl: committed.commitUrl,
          branch: committed.branch,
          baseSha: jsonBlob.sha,
          projects: result.nextProjects,
          deletedImages: orphanImages,
        });
      } catch (err) {
        if (err instanceof GitHubError && err.code === 'REF_CONFLICT' && attempt === 0) {
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    if (err instanceof GitHubError) {
      return sendJson(res, err.status, { error: err.message, code: err.code });
    }
    return sendJson(res, 500, { error: err.message || 'حدث خطأ غير متوقع أثناء حفظ التغييرات' });
  }
};
