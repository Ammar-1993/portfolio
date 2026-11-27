'use strict';

const ALLOWED_CATEGORIES = ['web-project', 'mobile-project'];
const MAX_GALLERY_IMAGES = 15;
const PORTFOLIO_GRID_RE = /(<div class="row" id="portfolio-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;

const PROJECT_ID_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;
const PORTFOLIO_IMAGE_RE = /^images\/portfolio\/[A-Za-z0-9][A-Za-z0-9._-]*\.webp$/;
const SW_VERSION_RE = /const VERSION = "v(\d+)\.(\d+)\.(\d+)";/;
const SITEMAP_LASTMOD_RE = /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g;

/**
 * Escape HTML special characters for safe interpolation into text and attributes.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate that a preview URL is empty or a safe http/https URL without control chars/whitespace.
 * @param {*} url
 * @returns {boolean}
 */
function isSafePreviewUrl(url) {
  if (url === null || url === undefined) return true;
  const s = String(url).trim();
  if (!s) return true;
  if (/[\s\u0000-\u001F\u007F]/.test(s)) return false;
  try {
    const parsed = new URL(s);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (_) {
    return false;
  }
}

/**
 * Check whether a preview URL should render the external preview anchor button.
 * @param {*} url
 * @returns {boolean}
 */
function isRenderablePreviewUrl(url) {
  if (!url) return false;
  const s = String(url).trim();
  return Boolean(s && isSafePreviewUrl(s) && !s.includes('example.com') && s !== '#');
}

/**
 * Validate that a portfolio image path strictly points to a .webp file inside images/portfolio/.
 * @param {*} src
 * @returns {boolean}
 */
function isSafePortfolioImagePath(src) {
  return typeof src === 'string' && !src.includes('..') && PORTFOLIO_IMAGE_RE.test(src);
}

/**
 * Validate a localized { ar, en } text object.
 * @param {*} obj
 * @param {string} fieldName
 * @param {number} maxLen
 * @param {string[]} errors
 * @returns {{ ar: string, en: string } | null}
 */
function validateLocalizedField(obj, fieldName, maxLen, errors) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    errors.push(`${fieldName} must be an object with ar and en strings`);
    return null;
  }
  const ar = typeof obj.ar === 'string' ? obj.ar.trim() : '';
  const en = typeof obj.en === 'string' ? obj.en.trim() : '';
  if (!ar || ar.length > maxLen) {
    errors.push(`${fieldName}.ar must be a non-empty string (<= ${maxLen} chars)`);
  }
  if (!en || en.length > maxLen) {
    errors.push(`${fieldName}.en must be a non-empty string (<= ${maxLen} chars)`);
  }
  return { ar, en };
}

/**
 * Validate and normalize a portfolio project object for create or edit operations.
 * @param {Object} project
 * @param {Object} [options]
 * @param {string[]} [options.existingIds]
 * @param {'create'|'edit'} [options.mode]
 * @param {string|null} [options.currentId]
 * @returns {{ valid: true, project: Object } | { valid: false, errors: string[] }}
 */
function validateProject(project, options = {}) {
  const { existingIds = [], mode = 'create', currentId = null } = options;
  const errors = [];

  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    return { valid: false, errors: ['project must be an object'] };
  }

  const id = typeof project.id === 'string' ? project.id.trim() : '';
  if (!PROJECT_ID_RE.test(id)) {
    errors.push('id must match ^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$');
  } else if (mode === 'create') {
    if (existingIds.includes(id)) {
      errors.push(`id "${id}" already exists`);
    }
  } else if (mode === 'edit') {
    if (currentId ? id !== currentId : !existingIds.includes(id)) {
      errors.push(currentId ? `id must remain "${currentId}" in edit mode` : `id "${id}" does not exist`);
    }
  } else {
    errors.push(`unsupported validation mode "${mode}"`);
  }

  const category = typeof project.category === 'string' ? project.category.trim() : '';
  if (!ALLOWED_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  const title = validateLocalizedField(project.title, 'title', 120, errors);

  let normalizedSummary;
  if (project.summary !== undefined && project.summary !== null) {
    if (typeof project.summary !== 'object' || Array.isArray(project.summary)) {
      errors.push('summary must be an object with ar and en strings when provided');
    } else {
      const sAr = typeof project.summary.ar === 'string' ? project.summary.ar.trim() : '';
      const sEn = typeof project.summary.en === 'string' ? project.summary.en.trim() : '';
      if (sAr || sEn) {
        if (!sAr || sAr.length > 350) {
          errors.push('summary.ar must be a non-empty string (<= 350 chars) when summary is provided');
        }
        if (!sEn || sEn.length > 350) {
          errors.push('summary.en must be a non-empty string (<= 350 chars) when summary is provided');
        }
        normalizedSummary = { ar: sAr, en: sEn };
      }
    }
  }

  const cover = typeof project.cover === 'string' ? project.cover.trim() : '';
  if (!isSafePortfolioImagePath(cover)) {
    errors.push('cover must be a valid images/portfolio/*.webp path');
  }

  const coverAlt = validateLocalizedField(project.coverAlt, 'coverAlt', 200, errors);

  let preview = '';
  if (project.preview !== undefined && project.preview !== null) {
    if (typeof project.preview !== 'string') {
      errors.push('preview must be a string');
    } else {
      preview = project.preview.trim();
      if (preview.length > 500 || !isSafePreviewUrl(preview)) {
        errors.push('preview must be a safe http/https URL (<= 500 chars)');
      }
    }
  }

  const normalizedGallery = [];
  if (project.gallery !== undefined && project.gallery !== null) {
    if (!Array.isArray(project.gallery)) {
      errors.push('gallery must be an array');
    } else if (project.gallery.length > MAX_GALLERY_IMAGES) {
      errors.push(`gallery cannot exceed ${MAX_GALLERY_IMAGES} images`);
    } else {
      project.gallery.forEach((img, idx) => {
        if (!img || typeof img !== 'object' || Array.isArray(img)) {
          errors.push(`gallery[${idx}] must be an object`);
          return;
        }
        const src = typeof img.src === 'string' ? img.src.trim() : '';
        if (!isSafePortfolioImagePath(src)) {
          errors.push(`gallery[${idx}].src must be a valid images/portfolio/*.webp path`);
        }
        const alt = validateLocalizedField(img.alt, `gallery[${idx}].alt`, 200, errors);
        if (alt) {
          normalizedGallery.push({ src, alt });
        }
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalized = {
    id,
    category,
    title,
  };
  if (normalizedSummary) {
    normalized.summary = normalizedSummary;
  }
  normalized.cover = cover;
  normalized.coverAlt = coverAlt;
  normalized.preview = preview;
  normalized.gallery = normalizedGallery;

  return { valid: true, project: normalized };
}

/**
 * Render the HTML markup for a single portfolio project card.
 * Matches build.js formatting while HTML-escaping all interpolated values.
 * @param {Object} project
 * @param {'ar'|'en'} lang
 * @returns {string}
 */
function createPortfolioHTML(project, lang) {
  const title = (project.title && (project.title[lang] || project.title.ar)) || '';
  const coverAlt = (project.coverAlt && (project.coverAlt[lang] || project.coverAlt.ar)) || '';
  const shortDesc = project.description
    ? (project.description[lang] || project.description.ar || '')
    : (project.summary ? (project.summary[lang] || project.summary.ar || '') : '');

  let previewHtml = '';
  if (isRenderablePreviewUrl(project.preview)) {
    const previewTitle = lang === 'en'
      ? `Open preview: ${title} (opens in new window)`
      : `معاينة ${title} (يفتح في نافذة جديدة)`;
    const previewHoverTitle = lang === 'en' ? 'Opens in a new window' : 'يفتح في نافذة جديدة';
    previewHtml = `
            <a class="project-preview" href="${escapeHtml(project.preview)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(previewHoverTitle)}" aria-label="${escapeHtml(previewTitle)}">
              <svg class="project-preview__svg" aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false">
                <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 3h7v7" />
                  <path d="M10 14L21 3" />
                  <path d="M21 21H3V3" />
                </g>
              </svg>
            </a>`;
  }

  let galleryHtml = '';
  if (project.gallery && project.gallery.length > 0) {
    const galleryImages = project.gallery.map(img => {
      const alt = (img.alt && (img.alt[lang] || img.alt.ar)) || '';
      return `<img data-src="${escapeHtml(img.src)}" alt="${escapeHtml(alt)}" width="640" height="360" loading="lazy" decoding="async">`;
    }).join('\n                    ');
    galleryHtml = `
        <div class="project-gallery" hidden>
                    ${galleryImages}
        </div>`;
  }

  const previewAttr = (project.preview && isSafePreviewUrl(project.preview))
    ? ` data-preview="${escapeHtml(project.preview)}"`
    : '';

  return `
              <div class="portfolio-item" data-category="${escapeHtml(project.category)}"${previewAttr}>
                <div class="portfolio-item-inner">
                  <div class="portfolio-img">
                    <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(coverAlt)}" width="640" height="360" loading="lazy" decoding="async">
                  </div>${galleryHtml ? '\n          ' + galleryHtml : ''}
                  <div class="portfolio-info">
                    <div class="portfolio-info-body">
                      <div class="portfolio-info-text">
                        <h3>${escapeHtml(title)}</h3>
                        ${shortDesc ? `<p class="portfolio-short">${escapeHtml(shortDesc)}</p>` : ''}
                      </div>
                      ${previewHtml}
                    </div>
                  </div>
                </div>
              </div>`;
}

/**
 * Inject generated portfolio grid cards into an HTML page using callback replacement
 * to avoid special '$' replacement patterns.
 * @param {string} html
 * @param {Object[]} projects
 * @param {'ar'|'en'} lang
 * @returns {string}
 */
function injectPortfolioGrid(html, projects, lang) {
  if (!PORTFOLIO_GRID_RE.test(html)) {
    throw new Error(`Could not find portfolio-grid section for lang "${lang}"`);
  }
  const gridHtml = '\n' + projects.map(p => createPortfolioHTML(p, lang)).join('') + '\n            ';
  return html.replace(PORTFOLIO_GRID_RE, (_, open, _old, close) => open + gridHtml + close);
}

/**
 * Serialize portfolio JSON matching the repository's 4-space CRLF format without trailing newline.
 * @param {Object} data
 * @returns {string}
 */
function serializePortfolioJson(data) {
  return JSON.stringify(data, null, 4).replace(/\n/g, '\r\n');
}

/**
 * Increment the patch segment of VERSION inside sw.js.
 * @param {string} swContent
 * @returns {string}
 */
function bumpSwVersion(swContent) {
  if (!SW_VERSION_RE.test(swContent)) {
    throw new Error('Could not find VERSION constant in sw.js');
  }
  return swContent.replace(SW_VERSION_RE, (_, major, minor, patch) => {
    const nextPatch = Number(patch) + 1;
    return `const VERSION = "v${major}.${minor}.${nextPatch}";`;
  });
}

/**
 * Update <lastmod> dates in sitemap.xml.
 * @param {string} sitemapXml
 * @param {string} [isoDate]
 * @returns {string}
 */
function updateSitemapLastmod(sitemapXml, isoDate) {
  const dateStr = isoDate || new Date().toISOString().slice(0, 10);
  return sitemapXml.replace(SITEMAP_LASTMOD_RE, `<lastmod>${dateStr}</lastmod>`);
}

/**
 * Find portfolio image paths referenced before an update that are no longer referenced after.
 * Strictly returns unique sorted paths passing isSafePortfolioImagePath.
 * @param {Object[]} beforeProjects
 * @param {Object[]} afterProjects
 * @returns {string[]}
 */
function findOrphanImages(beforeProjects, afterProjects) {
  const afterSet = new Set();
  for (const proj of afterProjects || []) {
    if (proj && proj.cover) afterSet.add(proj.cover);
    if (proj && Array.isArray(proj.gallery)) {
      for (const img of proj.gallery) {
        if (img && img.src) afterSet.add(img.src);
      }
    }
  }

  const orphans = new Set();
  for (const proj of beforeProjects || []) {
    const refs = [];
    if (proj && proj.cover) refs.push(proj.cover);
    if (proj && Array.isArray(proj.gallery)) {
      for (const img of proj.gallery) {
        if (img && img.src) refs.push(img.src);
      }
    }
    for (const ref of refs) {
      if (!afterSet.has(ref) && isSafePortfolioImagePath(ref)) {
        orphans.add(ref);
      }
    }
  }

  return Array.from(orphans).sort();
}

module.exports = {
  ALLOWED_CATEGORIES,
  MAX_GALLERY_IMAGES,
  PORTFOLIO_GRID_RE,
  escapeHtml,
  isSafePreviewUrl,
  isRenderablePreviewUrl,
  isSafePortfolioImagePath,
  validateProject,
  createPortfolioHTML,
  injectPortfolioGrid,
  serializePortfolioJson,
  bumpSwVersion,
  updateSitemapLastmod,
  findOrphanImages,
};
