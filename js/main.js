// =====================================================
// main.js — v3 (Theme + Nav + Filters + Lightbox A11y)
// متوافق مع هيكلة المشروع الحاليّة دون كسر سلوك HTML/CSS/JS
// =====================================================


// ===== Theme (light/dark) =====
(function () {
  const html = document.documentElement;
  const themeMeta =
    document.querySelector('meta[name="theme-color"]') ||
    document.getElementById('theme-color'); // توافق مع الإصدارات السابقة
  const themeBtnId = 'theme-toggle';

  const mqDark = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  function prefersDark() {
    return mqDark ? mqDark.matches : false;
  }

  function computeIsDark() {
    return (
      html.getAttribute('data-theme') === 'dark' ||
      (!html.hasAttribute('data-theme') && prefersDark())
    );
  }

  function setColorSchemeCSS(isDark) {
    // يساعد المتصفح على تلوين عناصر النماذج والـscrollbars تلقائياً
    html.style.colorScheme = isDark ? 'dark' : 'light';
    if (themeMeta)
      themeMeta.setAttribute('content', isDark ? '#0b0f19' : '#ffffff');
  }

  function applyTheme(themeOrNull) {
    if (themeOrNull === 'light' || themeOrNull === 'dark') {
      html.setAttribute('data-theme', themeOrNull);
      try {
        localStorage.setItem('theme', themeOrNull);
      } catch (_) {}
    } else {
      html.removeAttribute('data-theme');
      try {
        localStorage.removeItem('theme');
      } catch (_) {}
    }
    setColorSchemeCSS(computeIsDark());
    // تحديث حالة زر التبديل (إن وُجد)
    const btn = document.getElementById(themeBtnId);
    if (btn) btn.setAttribute('aria-pressed', String(computeIsDark()));
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme'); // قد تكون null
    const next =
      current === 'dark' || (current === null && prefersDark())
        ? 'light'
        : 'dark';
    applyTheme(next);
  }

  // Initialize from localStorage, else follow system
  (function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem('theme');
    } catch (_) {}
    applyTheme(stored === 'light' || stored === 'dark' ? stored : null);
  })();

  // React to system changes only when user didn't choose explicitly
  if (mqDark) {
    const onChange = () => {
      try {
        if (!localStorage.getItem('theme')) applyTheme(null);
      } catch (_) {}
    };
    // دعم Safari القديم
    if ('addEventListener' in mqDark) mqDark.addEventListener('change', onChange);
    else if ('addListener' in mqDark) mqDark.addListener(onChange);
  }

  // Sync across tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const v = e.newValue;
      applyTheme(v === 'light' || v === 'dark' ? v : null);
    }
  });

  // Bind button
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById(themeBtnId);
    if (btn) {
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', String(computeIsDark()));
      btn.addEventListener('click', toggleTheme);
    }
  });
})();

(() => {
  'use strict';

  // ===== أدوات مساعدة سريعة =====
  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  // ===== شريط التنقّل (Sticky) + تمييز الرابط النشِط أثناء التمرير =====
  const navbar = qs('.navbar');
  const linksContainer = qs('.links');
  const sections = qsa('section[id]');
  let HEADER_OFFSET = (navbar ? navbar.offsetHeight : 60);
window.addEventListener('resize', () => {
  HEADER_OFFSET = (navbar ? navbar.offsetHeight : 60);
});


  const setSticky = () => {
    if (!navbar) return;
    if (window.scrollY > 20) navbar.classList.add('sticky');
    else navbar.classList.remove('sticky');
  };

  function setActiveLink() {
    if (!sections.length || !linksContainer) return;
    const scrollPos = window.scrollY + HEADER_OFFSET;
    let currentId = null;
    for (const section of sections) {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        currentId = section.id;
        break;
      }
    }
    qsa('.links a').forEach((a) => a.classList.remove('active'));
    if (currentId) {
      try {
        const activeLink = qs(
          `.links a[href*="#${CSS.escape(currentId)}"]`
        );
        if (activeLink) activeLink.classList.add('active');
      } catch (_) {
        const activeLink = qsa('.links a').find((a) =>
          (a.getAttribute('href') || '').includes(`#${currentId}`)
        );
        if (activeLink) activeLink.classList.add('active');
      }
    }
  }

  // تفعيل تمرير سلس يحترم شريط التنقّل اللاصق
  function bindSmartAnchors() {
    qsa('.links a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const hash = a.getAttribute('href');
        const id = hash && hash.slice(1);
        const target = id ? document.getElementById(id) : null;
        if (target) {
          e.preventDefault();
          const top = Math.max(0, target.offsetTop - HEADER_OFFSET);
          window.scrollTo({ top, behavior: 'smooth' });
          history.replaceState(null, '', hash);
        }
      });
    });
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setSticky();
          setActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', setActiveLink, { passive: true });
  window.addEventListener('hashchange', setActiveLink, { passive: true });
  document.addEventListener('DOMContentLoaded', () => {
    setSticky();
    setActiveLink();
    bindSmartAnchors();
  });

  // ===== قائمة الهاتف (Burger) =====
  const menu = qs('.menu');
  const menuBtn = qs('.menu-btn');
  if (menu && menuBtn) {
    const closeMenu = () => {
      menu.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    menuBtn.setAttribute('aria-controls', 'main-menu');
    menu.setAttribute('id', 'main-menu');

    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('active');
    });

    // إغلاق القائمة عند الضغط على رابط
    qsa('.nav-link', menu).forEach((link) => link.addEventListener('click', closeMenu));

    // إغلاق عند الضغط خارجها
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('active')) return;
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });

    // إغلاق عبر زر Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ===== تأثير تعبئة أشرطة المهارات =====
  const skillsWrap = qs('.about-skills');
  const skillBars = qsa('.progress-line');
  if (skillsWrap && skillBars.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            skillBars.forEach((bar) => {
              const val = bar.dataset.progress;
              if (val) bar.style.width = val;
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(skillsWrap);
  }

  // ===== مرشّح المعرض =====
  const filterContainer = qs('.portfolio-filter');
  const portfolioItems = qsa('.portfolio-item');

  function updateVisibleItems(filter) {
    const f = filter || 'all';
    portfolioItems.forEach((item) => {
      const cat = item.getAttribute('data-category');
      const shouldShow = f === 'all' || f === cat;
      item.classList.toggle('show', shouldShow);
      item.classList.toggle('hide', !shouldShow);
    });
  }

  // تفعيل الحالة الافتراضية
  updateVisibleItems('all');

  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      qsa('button', filterContainer).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      updateVisibleItems(btn.getAttribute('data-filter'));
    });
  }

  // ===== عارض الصور (Lightbox) — وصول + تحسينات =====
  const lightbox = qs('.lightbox');
  const lightboxImg = lightbox ? qs('.lightbox-img', lightbox) : null;
  const lightboxClose = lightbox ? qs('.lightbox-close', lightbox) : null;
  const lightboxText = lightbox ? qs('.caption-text', lightbox) : null;
  const lightboxCounter = lightbox ? qs('.caption-counter', lightbox) : null;

  let visibleList = [];
  let currentIndex = 0;
  let lastFocused = null;
  let hiddenForA11y = [];

  function computeVisibleList() {
    // العناصر الظاهرة فقط (تتوافق مع الفلتر الحالي)
    visibleList = portfolioItems.filter((item) => item.classList.contains('show'));
    if (!visibleList.length) visibleList = portfolioItems.slice(); // احتياطي
  }

  function preloadAround(idx) {
    if (!visibleList.length) return;
    const next = visibleList[(idx + 1) % visibleList.length];
    const prev = visibleList[(idx - 1 + visibleList.length) % visibleList.length];
    [next, prev].forEach((item) => {
      const imgEl = item && qs('.portfolio-img img', item);
      if (imgEl) {
        const pre = new Image();
        pre.src = imgEl.currentSrc || imgEl.src;
      }
    });
  }

  function updateLightbox() {
    const item = visibleList[currentIndex];
    if (!item || !lightboxImg) return;
    const imgEl = qs('.portfolio-img img', item);
    const titleEl = qs('h4', item);
    const src = imgEl ? (imgEl.currentSrc || imgEl.getAttribute('src')) : '';
    const alt = imgEl ? imgEl.getAttribute('alt') || '' : '';
    if (src) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || (titleEl ? titleEl.textContent.trim() : 'صورة من المعرض');
    }
    if (lightboxText) lightboxText.textContent = titleEl ? titleEl.textContent.trim() : '';
    if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${visibleList.length}`;
    preloadAround(currentIndex);
  }

  function hideBackgroundForA11y(hide) {
    // إخفاء بقية الصفحة عن قارئات الشاشة أثناء فتح العارض
    if (!lightbox) return;
    if (hide) {
      hiddenForA11y = Array.from(document.body.children).filter((el) => el !== lightbox);
      hiddenForA11y.forEach((el) => el.setAttribute('aria-hidden', 'true'));
    } else {
      hiddenForA11y.forEach((el) => el.removeAttribute('aria-hidden'));
      hiddenForA11y = [];
    }
  }

  function openLightbox(idx) {
    if (!lightbox) return;
    computeVisibleList();
    currentIndex = Math.max(0, Math.min(idx, visibleList.length - 1));
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    hideBackgroundForA11y(true);
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    hideBackgroundForA11y(false);
    if (lastFocused) lastFocused.focus();
  }

  function nextItem() {
    computeVisibleList();
    currentIndex = (currentIndex + 1) % visibleList.length;
    updateLightbox();
  }

  function prevItem() {
    computeVisibleList();
    currentIndex = (currentIndex - 1 + visibleList.length) % visibleList.length;
    updateLightbox();
  }

  // إتاحة الدوال لعناصر HTML التي تستخدم onclick (توافق قديم)
  window.nextItem = nextItem;
  window.prevItem = prevItem;

  // فتح العارض عند الضغط على بطاقة
  qsa('.portfolio-item').forEach((item, i) => {
    const clickable = qs('.portfolio-item-inner', item) || item;
    clickable.setAttribute('tabindex', '0');

    clickable.addEventListener('click', (ev) => {
      if (ev.target.tagName.toLowerCase() === 'video' || ev.target.closest('video')) return;
      computeVisibleList();
      const idxVisible = visibleList.indexOf(item);
      openLightbox(idxVisible !== -1 ? idxVisible : i);
    });

    clickable.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        computeVisibleList();
        const idxVisible = visibleList.indexOf(item);
        openLightbox(idxVisible !== -1 ? idxVisible : i);
      }
    });
  });

  if (lightbox) {
    // إغلاق بالنقر على الخلفية أو زر الإغلاق
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lightboxClose) closeLightbox();
    });

    // مفاتيح لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') nextItem();
      else if (e.key === 'ArrowLeft') prevItem();

      // Trap Focus داخل العارض
      if (e.key === 'Tab') {
        const focusables = qsa(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          lightbox
        ).filter((el) => !el.hasAttribute('disabled'));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
})();

// ===== Lightbox control bindings (no inline onclick) =====
document.addEventListener('DOMContentLoaded', () => {
  const lb = document.querySelector('.lightbox');
  if (!lb) return;
  const img = lb.querySelector('.lightbox-img');
  const btnPrev = lb.querySelector('.prev-item');
  const btnNext = lb.querySelector('.next-item');

  function bind() {
    if (typeof window.prevItem === 'function' && typeof window.nextItem === 'function') {
      if (btnPrev) btnPrev.addEventListener('click', (e) => { e.stopPropagation(); window.prevItem(); });
      if (btnNext) btnNext.addEventListener('click', (e) => { e.stopPropagation(); window.nextItem(); });
      if (img) img.addEventListener('click', (e) => { e.stopPropagation(); window.nextItem(); });
    } else {
      setTimeout(bind, 50);
    }
  }
  bind();
});
