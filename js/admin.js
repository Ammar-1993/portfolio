'use strict';

(() => {
  const MAX_GALLERY_IMAGES = 15;
  const MAX_IMAGE_WIDTH = 1600;
  const MAX_IMAGE_BYTES = 1572864; // 1.5 MB
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;

  const state = {
    authenticated: false,
    branch: 'main',
    projects: [],
    baseSha: '',
    mode: 'create',
    editingId: null,
    manualSlug: false,
    coverItem: null,
    galleryItems: [],
    previewLang: 'ar',
    webpSupported: true,
    busy: false,
    tempCounter: 0,
    reorderDirty: false,
    originalOrderSnapshot: null,
    deletingId: null,
    deleteTriggerEl: null,
  };

  const dom = {
    ghPagesWarning: document.getElementById('gh-pages-warning'),
    toastRegion: document.getElementById('toast-region'),
    branchBadge: document.getElementById('branch-badge'),
    btnBackup: document.getElementById('btn-backup'),
    themeToggle: document.getElementById('theme-toggle'),
    btnLogout: document.getElementById('btn-logout'),

    loginView: document.getElementById('login-view'),
    loginForm: document.getElementById('login-form'),
    loginPassword: document.getElementById('login-password'),
    btnTogglePw: document.getElementById('btn-toggle-pw'),
    loginError: document.getElementById('login-error'),
    btnLogin: document.getElementById('btn-login'),

    dashboardView: document.getElementById('dashboard-view'),
    projectsCount: document.getElementById('projects-count'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnNewProject: document.getElementById('btn-new-project'),
    dashboardBanner: document.getElementById('dashboard-banner'),
    reorderBar: document.getElementById('reorder-bar'),
    btnSaveOrder: document.getElementById('btn-save-order'),
    btnDryRunOrder: document.getElementById('btn-dry-run-order'),
    btnCancelOrder: document.getElementById('btn-cancel-order'),
    projectsLoading: document.getElementById('projects-loading'),
    projectsList: document.getElementById('projects-list'),

    deleteModal: document.getElementById('delete-modal'),
    btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),
    deleteProjectName: document.getElementById('delete-project-name'),
    deleteProjectIdBadge: document.getElementById('delete-project-id-badge'),
    btnDeleteModalBackup: document.getElementById('btn-delete-modal-backup'),
    fieldDeleteModalOrphans: document.getElementById('field-delete-modal-orphans'),
    deleteConfirmInput: document.getElementById('delete-confirm-input'),
    deleteDryRunResult: document.getElementById('delete-dry-run-result'),
    deleteModalError: document.getElementById('delete-modal-error'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    btnDryRunDelete: document.getElementById('btn-dry-run-delete'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),

    editorView: document.getElementById('editor-view'),
    btnBackList: document.getElementById('btn-back-list'),
    editorHeading: document.getElementById('editor-heading'),
    projectForm: document.getElementById('project-form'),

    fieldTitleAr: document.getElementById('field-title-ar'),
    fieldTitleEn: document.getElementById('field-title-en'),
    fieldId: document.getElementById('field-id'),
    idHelpText: document.getElementById('id-help-text'),
    fieldCategory: document.getElementById('field-category'),
    positionFieldWrap: document.getElementById('position-field-wrap'),
    fieldPosition: document.getElementById('field-position'),
    fieldPreview: document.getElementById('field-preview'),
    fieldSummaryAr: document.getElementById('field-summary-ar'),
    fieldSummaryEn: document.getElementById('field-summary-en'),

    webpUnsupportedBanner: document.getElementById('webp-unsupported-banner'),
    duplicateCoverBanner: document.getElementById('duplicate-cover-banner'),
    btnDedupeCover: document.getElementById('btn-dedupe-cover'),
    aspectRatioWarning: document.getElementById('aspect-ratio-warning'),

    coverSlot: document.getElementById('cover-preview-img'),
    coverPlaceholder: document.getElementById('cover-placeholder'),
    coverMetaBadge: document.getElementById('cover-meta-badge'),
    coverFileInput: document.getElementById('cover-file-input'),
    fieldCoverAltAr: document.getElementById('field-cover-alt-ar'),
    fieldCoverAltEn: document.getElementById('field-cover-alt-en'),

    galleryCounter: document.getElementById('gallery-counter'),
    galleryDropzone: document.getElementById('gallery-dropzone'),
    galleryFileInput: document.getElementById('gallery-file-input'),
    galleryList: document.getElementById('gallery-list'),

    orphanCleanupWrap: document.getElementById('orphan-cleanup-wrap'),
    fieldDeleteOrphans: document.getElementById('field-delete-orphans'),

    formErrors: document.getElementById('form-errors'),
    publishProgress: document.getElementById('publish-progress'),
    publishProgressLabel: document.getElementById('publish-progress-label'),
    publishProgressBar: document.getElementById('publish-progress-bar'),
    dryRunResult: document.getElementById('dry-run-result'),

    btnSubmitProject: document.getElementById('btn-submit-project'),
    btnDryRun: document.getElementById('btn-dry-run'),
    btnCancelEditor: document.getElementById('btn-cancel-editor'),

    previewLangAr: document.getElementById('preview-lang-ar'),
    previewLangEn: document.getElementById('preview-lang-en'),
    livePreviewCard: document.getElementById('live-preview-card'),
    previewCardImg: document.getElementById('preview-card-img'),
    previewCardEmpty: document.getElementById('preview-card-empty'),
    previewCardGalleryCount: document.getElementById('preview-card-gallery-count'),
    previewCardTitle: document.getElementById('preview-card-title'),
    previewCardSummary: document.getElementById('preview-card-summary'),
    previewCardLink: document.getElementById('preview-card-link'),
  };

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 78);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function isSafePreviewUrl(url) {
    const s = String(url || '').trim();
    if (!s) return true;
    if (/[\s\u0000-\u001F\u007F]/.test(s)) return false;
    try {
      const parsed = new URL(s);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch (_) {
      return false;
    }
  }

  function showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast alert-${type}`;
    el.textContent = message;
    dom.toastRegion.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 5000);
  }

  function setBanner(type, message, actionNode = null) {
    dom.dashboardBanner.className = `alert alert-${type} alert-row`;
    dom.dashboardBanner.textContent = '';
    const span = document.createElement('span');
    span.textContent = message;
    dom.dashboardBanner.appendChild(span);
    if (actionNode) {
      dom.dashboardBanner.appendChild(actionNode);
    }
    dom.dashboardBanner.hidden = false;
  }

  function clearBanner() {
    dom.dashboardBanner.hidden = true;
    dom.dashboardBanner.textContent = '';
  }

  function checkWebpEncodingSupport() {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      if (typeof canvas.toBlob !== 'function') {
        resolve(false);
        return;
      }
      canvas.toBlob(
        (blob) => {
          resolve(Boolean(blob && blob.type === 'image/webp'));
        },
        'image/webp',
        0.8
      );
    });
  }

  async function decodeImage(file) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        return {
          width: bitmap.width,
          height: bitmap.height,
          drawTo: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
          cleanup: () => bitmap.close(),
        };
      } catch (_) {
        // Fallback below
      }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          drawTo: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
          cleanup: () => URL.revokeObjectURL(url),
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('تعذر قراءة ملف الصورة المحدد'));
      };
      img.src = url;
    });
  }

  function canvasToWebpBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.type !== 'image/webp') {
            reject(new Error('المتصفح لم ينتج صورة WebP. يرجى استخدام Chrome أو Edge.'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        quality
      );
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const str = String(reader.result || '');
        const comma = str.indexOf(',');
        resolve(comma === -1 ? str : str.slice(comma + 1));
      };
      reader.onerror = () => reject(new Error('تعذر قراءة بيانات الصورة'));
      reader.readAsDataURL(blob);
    });
  }

  function nextFilename(slug) {
    state.tempCounter += 1;
    const base = slugify(slug) || 'project';
    const stamp = Date.now().toString(36);
    return `${base.slice(0, 60)}-${stamp}-${state.tempCounter}.webp`;
  }

  async function compressImageToWebp(file, slugHint) {
    if (!state.webpSupported) {
      throw new Error('متصفحك لا يدعم ضغط WebP. يرجى استخدام Chrome أو Edge.');
    }
    if (!file || !String(file.type || '').startsWith('image/')) {
      throw new Error(`الملف "${file ? file.name : ''}" ليس صورة صالحة`);
    }

    const decoded = await decodeImage(file);
    try {
      let targetW = decoded.width;
      let targetH = decoded.height;
      if (targetW > MAX_IMAGE_WIDTH || targetH > MAX_IMAGE_WIDTH) {
        const ratio = Math.min(MAX_IMAGE_WIDTH / targetW, MAX_IMAGE_WIDTH / targetH);
        targetW = Math.max(1, Math.round(targetW * ratio));
        targetH = Math.max(1, Math.round(targetH * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      decoded.drawTo(ctx, targetW, targetH);

      let blob = null;
      for (const q of [0.82, 0.72, 0.62, 0.52]) {
        blob = await canvasToWebpBlob(canvas, q);
        if (blob.size <= MAX_IMAGE_BYTES) break;
      }

      if (!blob || blob.size > MAX_IMAGE_BYTES) {
        throw new Error(`حجم الصورة "${file.name}" لا يزال أكبر من 1.5 MB بعد الضغط`);
      }

      const base64 = await blobToBase64(blob);
      const filename = nextFilename(slugHint);
      return {
        isNew: true,
        filename,
        src: `images/portfolio/${filename}`,
        objectUrl: URL.createObjectURL(blob),
        base64,
        bytes: blob.size,
        origBytes: file.size,
        width: targetW,
        height: targetH,
        uploadedSha: null,
        altAr: '',
        altEn: '',
      };
    } finally {
      decoded.cleanup();
    }
  }

  function revokeItemUrl(item) {
    if (item && item.isNew && item.objectUrl) {
      URL.revokeObjectURL(item.objectUrl);
    }
  }

  function clearEditorMediaMemory() {
    revokeItemUrl(state.coverItem);
    state.galleryItems.forEach(revokeItemUrl);
    state.coverItem = null;
    state.galleryItems = [];
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(data.error || `خطأ في الاتصال (${res.status})`);
      err.status = res.status;
      err.code = data.code || '';
      err.data = data;
      throw err;
    }
    return data;
  }

  function setAuthenticatedUI(authenticated, branch) {
    state.authenticated = authenticated;
    state.branch = branch || 'main';
    dom.loginView.hidden = authenticated;
    dom.btnLogout.hidden = !authenticated;
    dom.btnBackup.hidden = !authenticated;
    dom.branchBadge.textContent = state.branch;
    dom.branchBadge.hidden = !authenticated;
    if (!authenticated) {
      dom.dashboardView.hidden = true;
      dom.editorView.hidden = true;
      clearEditorMediaMemory();
    }
  }

  function showDashboardView() {
    dom.editorView.hidden = true;
    dom.dashboardView.hidden = false;
    clearEditorMediaMemory();
  }

  function handleApiError(err) {
    if (err.code === 'GITHUB_TOKEN_EXPIRED') {
      setBanner('danger', err.message || 'صلاحية رمز GitHub انتهت. يرجى تجديده من GitHub ثم تحديثه في Vercel.');
      showToast(err.message, 'danger');
      return true;
    }
    if (err.status === 401) {
      forceCloseDeleteModal();
      setAuthenticatedUI(false);
      showToast('انتهت جلسة تسجيل الدخول، يرجى الدخول مجدداً', 'warning');
      return true;
    }
    if (err.code === 'BASE_SHA_CONFLICT') {
      forceCloseDeleteModal();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline btn-sm';
      btn.textContent = 'تحديث البيانات الآن';
      btn.addEventListener('click', () => {
        showDashboardView();
        loadProjects();
      });
      setBanner('warning', err.message, btn);
      showToast(err.message, 'warning');
      return true;
    }
    return false;
  }

  function downloadBackupJson() {
    const blob = new Blob([JSON.stringify({ projects: state.projects }, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetReorderState() {
    state.reorderDirty = false;
    state.originalOrderSnapshot = null;
    dom.reorderBar.hidden = true;
    dom.btnNewProject.disabled = false;
  }

  function moveProject(idx, delta) {
    if (state.busy) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= state.projects.length) return;

    if (!state.originalOrderSnapshot) {
      state.originalOrderSnapshot = state.projects.map((p) => p.id);
    }

    const tmp = state.projects[idx];
    state.projects[idx] = state.projects[targetIdx];
    state.projects[targetIdx] = tmp;

    const isStillDirty = state.projects.some((p, i) => p.id !== state.originalOrderSnapshot[i]);
    state.reorderDirty = isStillDirty;
    if (!isStillDirty) {
      state.originalOrderSnapshot = null;
    }
    dom.reorderBar.hidden = !isStillDirty;
    dom.btnNewProject.disabled = isStillDirty;
    renderProjectsList();
  }

  function cancelReorder() {
    if (state.busy || !state.originalOrderSnapshot) return;
    const byId = new Map(state.projects.map((p) => [p.id, p]));
    state.projects = state.originalOrderSnapshot.map((id) => byId.get(id)).filter(Boolean);
    resetReorderState();
    renderProjectsList();
  }

  async function saveReorder({ dryRun = false } = {}) {
    if (state.busy || !state.reorderDirty) return;
    state.busy = true;
    dom.btnSaveOrder.disabled = true;
    dom.btnDryRunOrder.disabled = true;
    dom.btnCancelOrder.disabled = true;
    renderProjectsList();

    try {
      const order = state.projects.map((p) => p.id);
      const res = await apiFetch('/api/projects', {
        method: 'PATCH',
        body: JSON.stringify({
          baseSha: state.baseSha,
          order,
          dryRun,
        }),
      });

      if (dryRun) {
        setBanner(
          'info',
          `معاينة الترتيب (Dry Run): ${res.commitMessage} — المشاريع: ${res.projectCount} — الملفات المحدّثة: ${res.updatedFiles.join('، ')}`
        );
        return;
      }

      state.projects = res.projects;
      state.baseSha = res.baseSha;
      resetReorderState();

      const link = document.createElement('a');
      link.href = res.commitUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'alert-link';
      link.textContent = 'عرض التحديث على GitHub';

      const msg = 'تم حفظ ترتيب المشاريع بنجاح! يتجدد النشر على Vercel خلال ~20 ثانية.';
      setBanner('success', msg, link);
      showToast(msg, 'success');
    } catch (err) {
      if (!handleApiError(err)) {
        setBanner('danger', err.message || 'تعذر حفظ ترتيب المشاريع');
      }
    } finally {
      state.busy = false;
      dom.btnSaveOrder.disabled = false;
      dom.btnDryRunOrder.disabled = false;
      dom.btnCancelOrder.disabled = false;
      renderProjectsList();
    }
  }

  function updateDeleteConfirmState() {
    if (!state.deletingId) {
      dom.btnConfirmDelete.disabled = true;
      return;
    }
    const matches = dom.deleteConfirmInput.value.trim() === state.deletingId;
    dom.btnConfirmDelete.disabled = state.busy || !matches;
  }

  function forceCloseDeleteModal() {
    if (dom.deleteModal.hidden) return;
    dom.deleteModal.hidden = true;
    document.body.style.overflow = '';
    const trigger = state.deleteTriggerEl;
    state.deletingId = null;
    state.deleteTriggerEl = null;
    if (trigger && typeof trigger.focus === 'function' && trigger.isConnected) {
      trigger.focus();
    }
  }

  function closeDeleteModal() {
    if (state.busy) return;
    forceCloseDeleteModal();
  }

  function openDeleteModal(id, triggerEl) {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return;
    state.deletingId = id;
    state.deleteTriggerEl = triggerEl || null;

    dom.deleteProjectName.textContent = project.title.ar || project.title.en;
    dom.deleteProjectIdBadge.textContent = project.id;
    dom.deleteConfirmInput.value = '';
    dom.fieldDeleteModalOrphans.checked = true;
    dom.deleteDryRunResult.hidden = true;
    dom.deleteDryRunResult.textContent = '';
    dom.deleteModalError.hidden = true;
    dom.deleteModalError.textContent = '';
    updateDeleteConfirmState();

    dom.deleteModal.hidden = false;
    document.body.style.overflow = 'hidden';
    dom.deleteConfirmInput.focus();
  }

  async function executeDelete({ dryRun = false } = {}) {
    if (state.busy || !state.deletingId) return;
    if (!dryRun && dom.deleteConfirmInput.value.trim() !== state.deletingId) return;

    dom.deleteModalError.hidden = true;
    dom.deleteDryRunResult.hidden = true;

    state.busy = true;
    dom.btnConfirmDelete.disabled = true;
    dom.btnDryRunDelete.disabled = true;
    dom.btnCancelDelete.disabled = true;
    dom.btnCloseDeleteModal.disabled = true;

    try {
      const targetId = state.deletingId;
      const res = await apiFetch(`/api/projects?id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        body: JSON.stringify({
          baseSha: state.baseSha,
          deleteOrphanImages: dom.fieldDeleteModalOrphans.checked,
          dryRun,
        }),
      });

      if (dryRun) {
        const deletedList =
          res.deletedImages && res.deletedImages.length > 0
            ? res.deletedImages.join('، ')
            : 'لا توجد صور يتيمة ستُحذف';
        dom.deleteDryRunResult.textContent =
          `معاينة الحذف (Dry Run — لم يتم التنفيذ بعد):\n` +
          `• رسالة الـ Commit: ${res.commitMessage}\n` +
          `• المشاريع المتبقية: ${res.projectCount}\n` +
          `• الصور التي ستُحذف (${res.deletedImages.length}): ${deletedList}`;
        dom.deleteDryRunResult.hidden = false;
        return;
      }

      state.projects = res.projects;
      state.baseSha = res.baseSha;
      state.busy = false;
      forceCloseDeleteModal();
      renderProjectsList();

      const link = document.createElement('a');
      link.href = res.commitUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'alert-link';
      link.textContent = 'عرض التحديث على GitHub';

      const deletedCount = Array.isArray(res.deletedImages) ? res.deletedImages.length : 0;
      const msg = `تم حذف المشروع (${deletedCount} صور غير مستخدمة حُذفت). يتجدد النشر على Vercel خلال ~20 ثانية.`;
      setBanner('success', msg, link);
      showToast('تم حذف المشروع بنجاح', 'success');
    } catch (err) {
      if (!handleApiError(err)) {
        dom.deleteModalError.textContent = err.message || 'تعذر حذف المشروع';
        dom.deleteModalError.hidden = false;
      }
    } finally {
      state.busy = false;
      dom.btnDryRunDelete.disabled = false;
      dom.btnCancelDelete.disabled = false;
      dom.btnCloseDeleteModal.disabled = false;
      updateDeleteConfirmState();
    }
  }

  function renderProjectsList() {
    dom.projectsCount.textContent = String(state.projects.length);
    dom.projectsList.textContent = '';

    if (state.projects.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'alert alert-info';
      empty.textContent = 'لا توجد مشاريع حالياً. اضغط على "إضافة مشروع جديد" للبدء.';
      dom.projectsList.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    state.projects.forEach((project, idx) => {
      const card = document.createElement('article');
      card.className = 'project-card';
      card.dataset.projectId = project.id;
      card.dataset.index = String(idx);

      const catLabel = project.category === 'mobile-project' ? 'موبايل' : 'ويب';
      const galleryLen = Array.isArray(project.gallery) ? project.gallery.length : 0;
      const hasPreview = project.preview && isSafePreviewUrl(project.preview) && !project.preview.includes('example.com');
      const lockMsg = state.reorderDirty ? 'احفظ الترتيب أو ألغِه أولاً' : '';

      card.innerHTML = `
        <div class="project-card-media">
          <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.coverAlt ? project.coverAlt.ar : project.title.ar)}" loading="lazy">
        </div>
        <div class="project-card-body">
          <div class="project-card-top">
            <div class="project-card-top-badges">
              <span class="project-order-pill">#${idx + 1}</span>
              <span class="cat-pill">${escapeHtml(catLabel)}</span>
            </div>
            <span class="cat-pill">${galleryLen} لقطات</span>
          </div>
          <h3>${escapeHtml(project.title.ar)}</h3>
          <div class="project-en-sub">${escapeHtml(project.title.en)}</div>
          <div class="project-id-code">${escapeHtml(project.id)}</div>
        </div>
        <div class="project-card-actions">
          <button type="button" class="btn btn-outline btn-sm btn-edit-project" ${state.reorderDirty || state.busy ? 'disabled' : ''} ${lockMsg ? `title="${lockMsg}"` : ''}>تعديل</button>
          <button type="button" class="btn btn-danger-ghost btn-sm btn-delete-project" ${state.reorderDirty || state.busy ? 'disabled' : ''} ${lockMsg ? `title="${lockMsg}"` : ''}>حذف</button>
          ${hasPreview ? `<a class="btn btn-ghost btn-sm" href="${escapeHtml(project.preview)}" target="_blank" rel="noopener noreferrer">معاينة ↗</a>` : ''}
          <div class="project-reorder-group">
            <button type="button" class="btn btn-ghost btn-sm btn-order-up" aria-label="تقديم المشروع للأعلى" ${idx === 0 || state.busy ? 'disabled' : ''}>▲</button>
            <button type="button" class="btn btn-ghost btn-sm btn-order-down" aria-label="تأخير المشروع للأسفل" ${idx === state.projects.length - 1 || state.busy ? 'disabled' : ''}>▼</button>
          </div>
        </div>
      `;

      card.querySelector('.btn-edit-project').addEventListener('click', () => openEditEditor(project.id));
      const deleteBtn = card.querySelector('.btn-delete-project');
      deleteBtn.addEventListener('click', () => openDeleteModal(project.id, deleteBtn));
      card.querySelector('.btn-order-up').addEventListener('click', () => moveProject(idx, -1));
      card.querySelector('.btn-order-down').addEventListener('click', () => moveProject(idx, 1));
      fragment.appendChild(card);
    });

    dom.projectsList.appendChild(fragment);
  }

  async function loadProjects() {
    dom.projectsLoading.hidden = false;
    dom.projectsList.hidden = true;
    resetReorderState();
    try {
      const data = await apiFetch('/api/projects', { method: 'GET' });
      state.projects = Array.isArray(data.projects) ? data.projects : [];
      state.baseSha = data.baseSha || '';
      if (data.branch) {
        state.branch = data.branch;
        dom.branchBadge.textContent = state.branch;
      }
      renderProjectsList();
      dom.projectsList.hidden = false;
    } catch (err) {
      if (!handleApiError(err)) {
        setBanner('danger', err.message || 'تعذر جلب قائمة المشاريع');
      }
    } finally {
      dom.projectsLoading.hidden = true;
    }
  }

  function updateDuplicateCoverBanner() {
    if (!state.coverItem) {
      dom.duplicateCoverBanner.hidden = true;
      return;
    }
    const hasDup = state.galleryItems.some((item) => item.src === state.coverItem.src);
    dom.duplicateCoverBanner.hidden = !hasDup;
  }

  function updateAspectRatioHint() {
    const items = [state.coverItem, ...state.galleryItems].filter((x) => x && x.width && x.height);
    if (items.length < 2) {
      dom.aspectRatioWarning.hidden = true;
      return;
    }
    const ratios = items.map((x) => x.width / x.height);
    const minR = Math.min(...ratios);
    const maxR = Math.max(...ratios);
    if (minR > 0 && (maxR - minR) / minR > 0.25) {
      dom.aspectRatioWarning.textContent = 'ملاحظة: بعض اللقطات الجديدة لها نسبة أبعاد تختلف كثيراً عن البقية. يُفضّل استخدام نسبة متقاربة (16:9 أو 4:3) لتناسق المعرض.';
      dom.aspectRatioWarning.hidden = false;
    } else {
      dom.aspectRatioWarning.hidden = true;
    }
  }

  function renderCoverSlot() {
    if (!state.coverItem) {
      dom.coverSlot.hidden = true;
      dom.coverSlot.removeAttribute('src');
      dom.coverPlaceholder.hidden = false;
      dom.coverMetaBadge.hidden = true;
    } else {
      dom.coverSlot.src = state.coverItem.objectUrl || state.coverItem.src;
      dom.coverSlot.hidden = false;
      dom.coverPlaceholder.hidden = true;
      if (state.coverItem.isNew) {
        dom.coverMetaBadge.textContent = `WebP • ${formatBytes(state.coverItem.bytes)}`;
        dom.coverMetaBadge.hidden = false;
      } else {
        dom.coverMetaBadge.textContent = 'موجودة مسبقاً';
        dom.coverMetaBadge.hidden = false;
      }
    }
    updateDuplicateCoverBanner();
    updateAspectRatioHint();
    updateLivePreview();
  }

  function renderGalleryList() {
    dom.galleryCounter.textContent = `${state.galleryItems.length} / ${MAX_GALLERY_IMAGES}`;
    dom.galleryList.textContent = '';

    state.galleryItems.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'gallery-item-card';

      const thumbSrc = item.objectUrl || item.src;
      const badgeText = item.isNew
        ? `WebP • ${formatBytes(item.bytes)} (وفّرت ${Math.max(0, Math.round((1 - item.bytes / item.origBytes) * 100))}%)`
        : item.src.split('/').pop();

      card.innerHTML = `
        <div class="gallery-thumb-wrap">
          <img src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(item.altAr || 'لقطة شاشة')}">
          <span class="meta-badge">${escapeHtml(badgeText)}</span>
        </div>
        <div class="gallery-item-body">
          <div class="form-grid">
            <div class="form-group">
              <label>النص البديل Alt (عربي) <span class="req">*</span></label>
              <input type="text" class="form-control gallery-alt-ar" maxlength="200" value="${escapeHtml(item.altAr)}" placeholder="مثال: واجهة لوحة التحكم">
            </div>
            <div class="form-group">
              <label>النص البديل Alt (إنجليزي) <span class="req">*</span></label>
              <input type="text" dir="ltr" class="form-control gallery-alt-en" maxlength="200" value="${escapeHtml(item.altEn)}" placeholder="e.g. Dashboard screen">
            </div>
          </div>
          <div class="gallery-item-actions">
            <span class="gallery-order-badge">لقطة #${idx + 1}</span>
            <button type="button" class="btn btn-outline btn-sm btn-set-cover">تعيين كغلاف</button>
            <button type="button" class="btn btn-ghost btn-sm btn-move-up" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button type="button" class="btn btn-ghost btn-sm btn-move-down" ${idx === state.galleryItems.length - 1 ? 'disabled' : ''}>▼</button>
            <button type="button" class="btn btn-danger-ghost btn-sm btn-remove-shot">حذف</button>
          </div>
        </div>
      `;

      const altArInput = card.querySelector('.gallery-alt-ar');
      const altEnInput = card.querySelector('.gallery-alt-en');
      altArInput.addEventListener('input', (e) => { item.altAr = e.target.value; });
      altEnInput.addEventListener('input', (e) => { item.altEn = e.target.value; });

      card.querySelector('.btn-set-cover').addEventListener('click', () => {
        const previousCover = state.coverItem;
        const chosen = state.galleryItems[idx];
        const prevAltAr = dom.fieldCoverAltAr.value;
        const prevAltEn = dom.fieldCoverAltEn.value;

        state.coverItem = chosen;
        dom.fieldCoverAltAr.value = chosen.altAr || prevAltAr;
        dom.fieldCoverAltEn.value = chosen.altEn || prevAltEn;

        if (previousCover) {
          previousCover.altAr = prevAltAr;
          previousCover.altEn = prevAltEn;
          state.galleryItems.splice(idx, 1, previousCover);
        } else {
          state.galleryItems.splice(idx, 1);
        }
        renderCoverSlot();
        renderGalleryList();
      });

      card.querySelector('.btn-move-up').addEventListener('click', () => {
        if (idx === 0) return;
        const tmp = state.galleryItems[idx - 1];
        state.galleryItems[idx - 1] = state.galleryItems[idx];
        state.galleryItems[idx] = tmp;
        renderGalleryList();
      });

      card.querySelector('.btn-move-down').addEventListener('click', () => {
        if (idx >= state.galleryItems.length - 1) return;
        const tmp = state.galleryItems[idx + 1];
        state.galleryItems[idx + 1] = state.galleryItems[idx];
        state.galleryItems[idx] = tmp;
        renderGalleryList();
      });

      card.querySelector('.btn-remove-shot').addEventListener('click', () => {
        const [removed] = state.galleryItems.splice(idx, 1);
        revokeItemUrl(removed);
        renderGalleryList();
        updateDuplicateCoverBanner();
        updateAspectRatioHint();
        updateLivePreview();
      });

      dom.galleryList.appendChild(card);
    });

    updateDuplicateCoverBanner();
    updateAspectRatioHint();
    updateLivePreview();
  }

  function updateLivePreview() {
    const isEn = state.previewLang === 'en';
    dom.livePreviewCard.setAttribute('dir', isEn ? 'ltr' : 'rtl');
    dom.previewLangAr.classList.toggle('active', !isEn);
    dom.previewLangAr.setAttribute('aria-pressed', String(!isEn));
    dom.previewLangEn.classList.toggle('active', isEn);
    dom.previewLangEn.setAttribute('aria-pressed', String(isEn));

    const title = (isEn ? dom.fieldTitleEn.value : dom.fieldTitleAr.value).trim() || (isEn ? 'Project Title' : 'عنوان المشروع');
    const summary = (isEn ? dom.fieldSummaryEn.value : dom.fieldSummaryAr.value).trim();
    const previewUrl = dom.fieldPreview.value.trim();

    dom.previewCardTitle.textContent = title;
    if (summary) {
      dom.previewCardSummary.textContent = summary;
      dom.previewCardSummary.hidden = false;
    } else {
      dom.previewCardSummary.hidden = true;
    }

    const showLink = Boolean(previewUrl && isSafePreviewUrl(previewUrl) && !previewUrl.includes('example.com') && previewUrl !== '#');
    dom.previewCardLink.hidden = !showLink;

    if (state.coverItem) {
      dom.previewCardImg.src = state.coverItem.objectUrl || state.coverItem.src;
      dom.previewCardImg.alt = (isEn ? dom.fieldCoverAltEn.value : dom.fieldCoverAltAr.value).trim() || title;
      dom.previewCardImg.hidden = false;
      dom.previewCardEmpty.hidden = true;
    } else {
      dom.previewCardImg.hidden = true;
      dom.previewCardEmpty.hidden = false;
    }

    if (state.galleryItems.length > 0) {
      const total = state.galleryItems.length + (state.coverItem ? 1 : 0);
      dom.previewCardGalleryCount.textContent = isEn ? `${total} images` : `${total} صور`;
      dom.previewCardGalleryCount.hidden = false;
    } else {
      dom.previewCardGalleryCount.hidden = true;
    }
  }

  function resetEditorCommon() {
    dom.formErrors.hidden = true;
    dom.formErrors.textContent = '';
    dom.dryRunResult.hidden = true;
    dom.dryRunResult.textContent = '';
    dom.publishProgress.hidden = true;
    dom.publishProgressBar.value = 0;
    dom.aspectRatioWarning.hidden = true;
    dom.coverFileInput.value = '';
    dom.galleryFileInput.value = '';
  }

  function openCreateEditor() {
    clearBanner();
    clearEditorMediaMemory();
    resetEditorCommon();

    state.mode = 'create';
    state.editingId = null;
    state.manualSlug = false;

    dom.editorHeading.textContent = 'إضافة مشروع جديد';
    dom.btnSubmitProject.textContent = 'نشر المشروع';
    dom.fieldId.readOnly = false;
    dom.positionFieldWrap.hidden = false;
    dom.fieldPosition.value = 'top';
    dom.orphanCleanupWrap.hidden = true;

    dom.fieldTitleAr.value = '';
    dom.fieldTitleEn.value = '';
    dom.fieldId.value = '';
    dom.fieldCategory.value = 'web-project';
    dom.fieldPreview.value = '';
    dom.fieldSummaryAr.value = '';
    dom.fieldSummaryEn.value = '';
    dom.fieldCoverAltAr.value = '';
    dom.fieldCoverAltEn.value = '';

    renderCoverSlot();
    renderGalleryList();
    dom.dashboardView.hidden = true;
    dom.editorView.hidden = false;
  }

  function openEditEditor(id) {
    const project = state.projects.find((p) => p.id === id);
    if (!project) return;

    clearBanner();
    clearEditorMediaMemory();
    resetEditorCommon();

    state.mode = 'edit';
    state.editingId = project.id;
    state.manualSlug = true;

    dom.editorHeading.textContent = `تعديل مشروع: ${project.title.ar}`;
    dom.btnSubmitProject.textContent = 'حفظ التعديلات';
    dom.fieldId.readOnly = true;
    dom.positionFieldWrap.hidden = true;
    dom.orphanCleanupWrap.hidden = false;
    dom.fieldDeleteOrphans.checked = true;

    dom.fieldTitleAr.value = project.title.ar || '';
    dom.fieldTitleEn.value = project.title.en || '';
    dom.fieldId.value = project.id;
    dom.fieldCategory.value = project.category || 'web-project';
    dom.fieldPreview.value = project.preview || '';
    dom.fieldSummaryAr.value = project.summary ? project.summary.ar || '' : '';
    dom.fieldSummaryEn.value = project.summary ? project.summary.en || '' : '';
    dom.fieldCoverAltAr.value = project.coverAlt ? project.coverAlt.ar || '' : '';
    dom.fieldCoverAltEn.value = project.coverAlt ? project.coverAlt.en || '' : '';

    state.coverItem = project.cover
      ? {
          isNew: false,
          src: project.cover,
          altAr: project.coverAlt ? project.coverAlt.ar || '' : '',
          altEn: project.coverAlt ? project.coverAlt.en || '' : '',
        }
      : null;

    state.galleryItems = Array.isArray(project.gallery)
      ? project.gallery.map((g) => ({
          isNew: false,
          src: g.src,
          altAr: g.alt ? g.alt.ar || '' : '',
          altEn: g.alt ? g.alt.en || '' : '',
        }))
      : [];

    renderCoverSlot();
    renderGalleryList();
    dom.dashboardView.hidden = true;
    dom.editorView.hidden = false;
  }

  function collectAndValidateForm({ dryRun = false } = {}) {
    const errors = [];
    const titleAr = dom.fieldTitleAr.value.trim();
    const titleEn = dom.fieldTitleEn.value.trim();
    const id = dom.fieldId.value.trim();
    const category = dom.fieldCategory.value;
    const preview = dom.fieldPreview.value.trim();
    const summaryAr = dom.fieldSummaryAr.value.trim();
    const summaryEn = dom.fieldSummaryEn.value.trim();
    const coverAltAr = dom.fieldCoverAltAr.value.trim();
    const coverAltEn = dom.fieldCoverAltEn.value.trim();

    if (!titleAr) errors.push('اسم المشروع بالعربية مطلوب');
    if (!titleEn) errors.push('اسم المشروع بالإنجليزية مطلوب');
    if (!SLUG_RE.test(id)) errors.push('المعرّف الفريد يجب أن يحتوي أحرفاً إنجليزية صغيرة وأرقاماً وشرطة فقط (3 إلى 80 محرفاً)');
    if (state.mode === 'create' && state.projects.some((p) => p.id === id)) {
      errors.push(`المعرّف "${id}" مستخدم بالفعل لمشروع آخر`);
    }
    if (!['web-project', 'mobile-project'].includes(category)) errors.push('التصنيف غير صالح');
    if (preview && !isSafePreviewUrl(preview)) errors.push('رابط المعاينة يجب أن يبدأ بـ https:// أو http://');
    if ((summaryAr && !summaryEn) || (!summaryAr && summaryEn)) {
      errors.push('عند كتابة الوصف المختصر يجب إدخاله باللغتين العربية والإنجليزية معاً');
    }

    if (!state.coverItem) {
      errors.push('صورة الغلاف مطلوبة');
    } else {
      if (!coverAltAr) errors.push('وصف الغلاف البديل (عربي) مطلوب');
      if (!coverAltEn) errors.push('وصف الغلاف البديل (إنجليزي) مطلوب');
    }

    if (state.galleryItems.length > MAX_GALLERY_IMAGES) {
      errors.push(`الحد الأقصى للقطات الشاشات هو ${MAX_GALLERY_IMAGES} لقطة`);
    }

    state.galleryItems.forEach((item, idx) => {
      if (!item.altAr.trim() || !item.altEn.trim()) {
        errors.push(`يرجى إدخال النص البديل (عربي وإنجليزي) للقطة #${idx + 1}`);
      }
    });

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const project = {
      id,
      category,
      title: { ar: titleAr, en: titleEn },
    };
    if (summaryAr && summaryEn) {
      project.summary = { ar: summaryAr, en: summaryEn };
    }
    project.cover = dryRun && state.coverItem.isNew ? `images/portfolio/${state.coverItem.filename}` : state.coverItem.src;
    project.coverAlt = { ar: coverAltAr, en: coverAltEn };
    project.preview = preview;
    project.gallery = state.galleryItems.map((item) => ({
      src: dryRun && item.isNew ? `images/portfolio/${item.filename}` : item.src,
      alt: { ar: item.altAr.trim(), en: item.altEn.trim() },
    }));

    return { valid: true, project };
  }

  function showFormErrors(errors) {
    dom.formErrors.textContent = '';
    const ul = document.createElement('ul');
    errors.forEach((msg) => {
      const li = document.createElement('li');
      li.textContent = msg;
      ul.appendChild(li);
    });
    dom.formErrors.appendChild(ul);
    dom.formErrors.hidden = false;
    dom.formErrors.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    dom.btnSubmitProject.disabled = isBusy;
    dom.btnDryRun.disabled = isBusy;
    dom.btnCancelEditor.disabled = isBusy;
    dom.btnBackList.disabled = isBusy;
  }

  async function handleSave({ dryRun = false } = {}) {
    if (state.busy) return;
    dom.formErrors.hidden = true;
    dom.dryRunResult.hidden = true;

    const check = collectAndValidateForm({ dryRun });
    if (!check.valid) {
      showFormErrors(check.errors);
      return;
    }

    setBusy(true);
    try {
      const uploadedBlobs = [];
      if (!dryRun) {
        const toUpload = [];
        if (state.coverItem && state.coverItem.isNew && !state.coverItem.uploadedSha) {
          toUpload.push(state.coverItem);
        }
        state.galleryItems.forEach((item) => {
          if (item.isNew && !item.uploadedSha && item !== state.coverItem) {
            toUpload.push(item);
          }
        });

        const totalSteps = toUpload.length + 1;
        dom.publishProgress.hidden = false;

        for (let i = 0; i < toUpload.length; i++) {
          const item = toUpload[i];
          dom.publishProgressLabel.textContent = `جاري رفع الصورة ${i + 1} من ${toUpload.length}...`;
          dom.publishProgressBar.value = Math.round(((i + 0.5) / totalSteps) * 100);

          const upRes = await apiFetch('/api/upload-image', {
            method: 'POST',
            body: JSON.stringify({
              filename: item.filename,
              contentBase64: item.base64,
            }),
          });
          item.uploadedSha = upRes.sha;
          item.src = upRes.path;
        }

        // Collect all blobs uploaded during this session and referenced by project
        const allItems = [state.coverItem, ...state.galleryItems].filter(Boolean);
        allItems.forEach((item) => {
          if (item.isNew && item.uploadedSha) {
            uploadedBlobs.push({ path: item.src, sha: item.uploadedSha });
          }
        });

        // Update project cover/gallery src from uploaded paths
        check.project.cover = state.coverItem.src;
        check.project.gallery.forEach((g, idx) => {
          g.src = state.galleryItems[idx].src;
        });

        dom.publishProgressLabel.textContent = 'جاري حفظ المشروع وتحديث صفحات الموقع...';
        dom.publishProgressBar.value = 90;
      }

      const method = state.mode === 'edit' ? 'PUT' : 'POST';
      const url = state.mode === 'edit' ? `/api/projects?id=${encodeURIComponent(state.editingId)}` : '/api/projects';
      const payload = {
        baseSha: state.baseSha,
        dryRun,
        project: check.project,
        uploadedBlobs,
        ...(state.mode === 'create' ? { position: dom.fieldPosition.value } : { deleteOrphanImages: dom.fieldDeleteOrphans.checked }),
      };

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (dryRun) {
        dom.dryRunResult.textContent =
          `معاينة ناجحة (لم يتم النشر بعد):\n` +
          `• رسالة الـ Commit: ${res.commitMessage}\n` +
          `• إجمالي المشاريع بعد العملية: ${res.projectCount}\n` +
          `• صور ستُضاف: ${res.addedImages.length} | صور ستُحذف: ${res.deletedImages.length}\n` +
          `• الملفات المحدّثة: ${res.updatedFiles.join('، ')}`;
        dom.dryRunResult.hidden = false;
        return;
      }

      dom.publishProgressBar.value = 100;
      state.projects = res.projects;
      state.baseSha = res.baseSha;

      showDashboardView();
      renderProjectsList();

      const link = document.createElement('a');
      link.href = res.commitUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'alert-link';
      link.textContent = 'عرض التحديث على GitHub';

      const msg = state.mode === 'edit'
        ? 'تم حفظ تعديلات المشروع بنجاح! يتجدد النشر على Vercel خلال ~20 ثانية.'
        : 'تم نشر المشروع الجديد بنجاح! يتجدد النشر على Vercel خلال ~20 ثانية.';
      setBanner('success', msg, link);
      showToast(msg, 'success');
    } catch (err) {
      if (!handleApiError(err)) {
        showFormErrors([err.message || 'تعذر حفظ المشروع']);
      }
    } finally {
      dom.publishProgress.hidden = true;
      setBusy(false);
    }
  }

  async function handleCoverFileChange(file) {
    if (!file) return;
    try {
      const compressed = await compressImageToWebp(file, dom.fieldId.value || dom.fieldTitleEn.value);
      const prev = state.coverItem;
      state.coverItem = compressed;
      revokeItemUrl(prev);
      if (!dom.fieldCoverAltAr.value.trim() && dom.fieldTitleAr.value.trim()) {
        dom.fieldCoverAltAr.value = `${dom.fieldTitleAr.value.trim()} - الواجهة الرئيسية`;
      }
      if (!dom.fieldCoverAltEn.value.trim() && dom.fieldTitleEn.value.trim()) {
        dom.fieldCoverAltEn.value = `${dom.fieldTitleEn.value.trim()} - Main Interface`;
      }
      renderCoverSlot();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleGalleryFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const remaining = MAX_GALLERY_IMAGES - state.galleryItems.length;
    if (remaining <= 0) {
      showToast(`وصلت للحد الأقصى (${MAX_GALLERY_IMAGES} لقطة شاشة)`, 'warning');
      return;
    }

    const batch = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`تم اختيار أول ${remaining} صور فقط لبلوغ الحد الأقصى (15)`, 'warning');
    }

    const titleAr = dom.fieldTitleAr.value.trim();
    const titleEn = dom.fieldTitleEn.value.trim();

    for (const file of batch) {
      try {
        const item = await compressImageToWebp(file, dom.fieldId.value || titleEn);
        const indexNum = state.galleryItems.length + 1;
        item.altAr = titleAr ? `${titleAr} - واجهة ${indexNum}` : `لقطة شاشة ${indexNum}`;
        item.altEn = titleEn ? `${titleEn} - Interface ${indexNum}` : `Screenshot ${indexNum}`;
        state.galleryItems.push(item);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    }
    renderGalleryList();
  }

  function bindEvents() {
    dom.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) {}
    });

    dom.btnTogglePw.addEventListener('click', () => {
      const show = dom.loginPassword.type === 'password';
      dom.loginPassword.type = show ? 'text' : 'password';
      dom.btnTogglePw.textContent = show ? 'إخفاء' : 'إظهار';
    });

    dom.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      dom.loginError.hidden = true;
      const password = dom.loginPassword.value;
      if (!password) {
        dom.loginError.textContent = 'يرجى إدخال كلمة المرور';
        dom.loginError.hidden = false;
        return;
      }
      dom.btnLogin.disabled = true;
      try {
        const res = await apiFetch('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ password }),
        });
        dom.loginPassword.value = '';
        setAuthenticatedUI(true, res.branch);
        showDashboardView();
        await loadProjects();
      } catch (err) {
        dom.loginError.textContent = err.message || 'فشل تسجيل الدخول';
        dom.loginError.hidden = false;
      } finally {
        dom.btnLogin.disabled = false;
      }
    });

    dom.btnLogout.addEventListener('click', async () => {
      try {
        await apiFetch('/api/auth', { method: 'DELETE' });
      } catch (_) {}
      setAuthenticatedUI(false);
    });

    dom.btnBackup.addEventListener('click', downloadBackupJson);
    dom.btnDeleteModalBackup.addEventListener('click', downloadBackupJson);

    dom.btnSaveOrder.addEventListener('click', () => saveReorder({ dryRun: false }));
    dom.btnDryRunOrder.addEventListener('click', () => saveReorder({ dryRun: true }));
    dom.btnCancelOrder.addEventListener('click', cancelReorder);

    dom.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    dom.btnCancelDelete.addEventListener('click', closeDeleteModal);
    dom.deleteModal.addEventListener('click', (e) => {
      if (e.target === dom.deleteModal) closeDeleteModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dom.deleteModal.hidden) closeDeleteModal();
    });
    dom.deleteConfirmInput.addEventListener('input', updateDeleteConfirmState);
    dom.btnDryRunDelete.addEventListener('click', () => executeDelete({ dryRun: true }));
    dom.btnConfirmDelete.addEventListener('click', () => executeDelete({ dryRun: false }));

    dom.btnRefresh.addEventListener('click', () => {
      clearBanner();
      loadProjects();
    });

    dom.btnNewProject.addEventListener('click', openCreateEditor);
    dom.btnBackList.addEventListener('click', showDashboardView);
    dom.btnCancelEditor.addEventListener('click', showDashboardView);

    dom.fieldTitleEn.addEventListener('input', () => {
      if (state.mode === 'create' && !state.manualSlug) {
        dom.fieldId.value = slugify(dom.fieldTitleEn.value);
      }
      updateLivePreview();
    });

    dom.fieldId.addEventListener('input', () => {
      if (state.mode === 'create') {
        state.manualSlug = dom.fieldId.value.trim().length > 0;
      }
    });

    [dom.fieldTitleAr, dom.fieldPreview, dom.fieldSummaryAr, dom.fieldSummaryEn, dom.fieldCoverAltAr, dom.fieldCoverAltEn].forEach((el) => {
      el.addEventListener('input', updateLivePreview);
    });

    dom.previewLangAr.addEventListener('click', () => {
      state.previewLang = 'ar';
      updateLivePreview();
    });
    dom.previewLangEn.addEventListener('click', () => {
      state.previewLang = 'en';
      updateLivePreview();
    });

    dom.coverFileInput.addEventListener('change', (e) => {
      handleCoverFileChange(e.target.files && e.target.files[0]);
      e.target.value = '';
    });

    dom.galleryDropzone.addEventListener('click', () => dom.galleryFileInput.click());
    dom.galleryDropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dom.galleryFileInput.click();
      }
    });
    dom.galleryDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dom.galleryDropzone.classList.add('drag-over');
    });
    dom.galleryDropzone.addEventListener('dragleave', () => {
      dom.galleryDropzone.classList.remove('drag-over');
    });
    dom.galleryDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dom.galleryDropzone.classList.remove('drag-over');
      handleGalleryFiles(e.dataTransfer && e.dataTransfer.files);
    });
    dom.galleryFileInput.addEventListener('change', (e) => {
      handleGalleryFiles(e.target.files);
      e.target.value = '';
    });

    dom.btnDedupeCover.addEventListener('click', () => {
      if (!state.coverItem) return;
      const before = state.galleryItems.length;
      state.galleryItems = state.galleryItems.filter((item) => {
        const keep = item.src !== state.coverItem.src;
        if (!keep) revokeItemUrl(item);
        return keep;
      });
      if (state.galleryItems.length < before) {
        renderGalleryList();
        showToast('تمت إزالة تكرار صورة الغلاف من المعرض', 'success');
      }
    });

    dom.projectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSave({ dryRun: false });
    });
    dom.btnDryRun.addEventListener('click', () => handleSave({ dryRun: true }));
  }

  async function init() {
    if (window.location.hostname.endsWith('github.io')) {
      dom.ghPagesWarning.hidden = false;
    }

    state.webpSupported = await checkWebpEncodingSupport();
    if (!state.webpSupported) {
      dom.webpUnsupportedBanner.hidden = false;
      dom.coverFileInput.disabled = true;
      dom.galleryFileInput.disabled = true;
    }

    bindEvents();

    // Clean hook for Phase 5 (Delete & Reorder)
    window.PortfolioAdmin = {
      state,
      dom,
      apiFetch,
      handleApiError,
      renderProjectsList,
      loadProjects,
      setBanner,
      showToast,
    };

    try {
      const session = await apiFetch('/api/auth', { method: 'GET' });
      if (session.authenticated) {
        setAuthenticatedUI(true, session.branch);
        showDashboardView();
        await loadProjects();
      } else {
        setAuthenticatedUI(false);
      }
    } catch (_) {
      setAuthenticatedUI(false);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
