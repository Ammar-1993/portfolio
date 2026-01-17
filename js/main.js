// =====================================================
// main.js — v4 (Theme + Nav + Filters + Lightbox A11y)
// =====================================================

// ===== Shared Utilities =====
const Utils = {
  qs: (sel, scope = document) => scope.querySelector(sel),
  qsa: (sel, scope = document) => Array.from(scope.querySelectorAll(sel)),
  on: (target, type, callback, options) => {
    if (!target) return;
    target.addEventListener(type, callback, options);
  }
};

// ===== Theme (light/dark) =====
(function () {
  'use strict';
  const html = document.documentElement;
  const themeMeta = Utils.qs('meta[name="theme-color"]') || document.getElementById('theme-color');
  const themeBtnId = 'theme-toggle';
  const mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const prefersDark = () => (mqDark ? mqDark.matches : false);
  const computeIsDark = () => html.getAttribute('data-theme') === 'dark' || (!html.hasAttribute('data-theme') && prefersDark());
  function setColorSchemeCSS(isDark) {
    html.style.colorScheme = isDark ? 'dark' : 'light';
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#0b0f19' : '#ffffff');
  }
  function applyTheme(themeOrNull) {
    if (themeOrNull === 'light' || themeOrNull === 'dark') {
      html.setAttribute('data-theme', themeOrNull);
      try { localStorage.setItem('theme', themeOrNull); } catch (_) {}
    } else {
      html.removeAttribute('data-theme');
      try { localStorage.removeItem('theme'); } catch (_) {}
    }
    const isDark = computeIsDark();
    setColorSchemeCSS(isDark);
    const btn = document.getElementById(themeBtnId);
    if (btn) btn.setAttribute('aria-pressed', String(isDark));
  }
  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' || (current === null && prefersDark()) ? 'light' : 'dark';
    applyTheme(next);
  }
  // Initialize theme from storage or system
  (function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch (_) {}
    applyTheme(stored === 'light' || stored === 'dark' ? stored : 'light');
  })();
  // React to system changes if user didn't choose explicitly
  if (mqDark) {
    const onChange = () => {
      try { if (!localStorage.getItem('theme')) applyTheme(null); } catch (_) {}
    };
    if ('addEventListener' in mqDark) mqDark.addEventListener('change', onChange);
    else if ('addListener' in mqDark) mqDark.addListener(onChange);
  }
  // Sync theme across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const v = e.newValue;
      applyTheme(v === 'light' || v === 'dark' ? v : null);
    }
  });
  // Bind theme toggle button
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById(themeBtnId);
    if (btn) {
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', String(computeIsDark()));
      btn.addEventListener('click', toggleTheme);
    }
  });
})();

// ===== Language toggle (simple navigation between pages) =====
document.addEventListener('DOMContentLoaded', () => {
  const langLinks = document.querySelectorAll('#lang-toggle');
  if (!langLinks.length) return;
  langLinks.forEach((el) => {
    // ensure keyboard role/visibility for assistive tech when element isn't an actual link (kept for compatibility)
    if (el.tagName.toLowerCase() !== 'a') el.setAttribute('role', 'button');
    el.addEventListener('click', (e) => {
      // href takes precedence; fallback to data-target for older markup
      const href = el.getAttribute('href') || (el.dataset && el.dataset.target);
      if (!href) return;

      // Close mobile menu if open
      const menu = document.querySelector('.menu');
      const menuBtn = document.querySelector('.menu-btn');
      if (menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }

      // Preserve search and hash when switching pages (enhanced behavior)
      const { search, hash } = window.location;
      // If element is a true <a> and user agent has JS disabled, this code won't run — progressive enhancement preserved.
      e.preventDefault();
      window.location.href = href + (search || '') + (hash || '');
    });
  });
});

(() => {
  'use strict';
  // ===== Helpers (Using Shared Utils) =====
  const { qs, qsa, on } = Utils;

  // ===== Navbar sticky + active link on scroll =====
  const navbar = qs('.navbar');
  const linksContainer = qs('.links');
  const sections = qsa('section[id]');
  let HEADER_OFFSET = navbar ? navbar.offsetHeight : 60;
  function recalcHeaderOffset() {
    HEADER_OFFSET = navbar ? navbar.getBoundingClientRect().height : 60;
  }
  window.addEventListener('resize', recalcHeaderOffset, { passive: true });

  const setSticky = () => {
    if (!navbar) return;
    if (window.scrollY > 20) navbar.classList.add('sticky');
    else navbar.classList.remove('sticky');
    recalcHeaderOffset();
  };

  let activeObserver = null;
  const setActiveLink = () => {
    if (!sections.length || !linksContainer) return;
    if (activeObserver) activeObserver.disconnect();
    activeObserver = new IntersectionObserver((entries) => {
      let currentId = null;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          currentId = entry.target.id;
        }
      });
      qsa('.links a').forEach((a) => {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
      });
      if (currentId) {
        const activeLink = qs(`.links a[href*="#${CSS.escape(currentId)}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
          activeLink.setAttribute('aria-current', 'page');
        }
      }
    }, {
      rootMargin: `-${HEADER_OFFSET}px 0px -${window.innerHeight - HEADER_OFFSET}px 0px`,
      threshold: 0
    });
    sections.forEach((section) => activeObserver.observe(section));
  };

  // smooth internal anchors (respects reduced-motion)
  function bindSmartAnchors() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.addEventListener('click', function(e) {
      const a = e.target.closest('a[href^="#"]:not([href="#"])');
      if (!a) return;
      const hash = a.getAttribute('href');
      const id = hash && hash.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      const top = Math.max(0, window.pageYOffset + target.getBoundingClientRect().top - HEADER_OFFSET);
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', hash);
    });
  }

  // scroll loop (rAF-throttled)
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => { setSticky(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', setActiveLink, { passive: true });
  window.addEventListener('hashchange', setActiveLink, { passive: true });
  document.addEventListener('DOMContentLoaded', () => {
    setSticky(); setActiveLink(); bindSmartAnchors();
  });

  // ===== Mobile menu (burger) =====
  const menu = qs('.menu');
  const menuBtn = qs('.menu-btn');
  if (menu && menuBtn) {
    const openMenu = () => {
      menu.classList.add('active');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      menu.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    if (!menu.id) menu.setAttribute('id', 'main-menu');
    menuBtn.setAttribute('aria-controls', menu.id);
    menuBtn.addEventListener('click', () => {
      if (menu.classList.contains('active')) closeMenu();
      else openMenu();
    });
    // Close on nav link click (event delegation)
    menu.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) closeMenu();
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('active')) return;
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
    // Close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // ===== Skills progress fill =====
  const skillsWrap = qs('.about-skills');
  const skillBars = qsa('.progress-line');
  if (skillsWrap && skillBars.length) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            skillBars.forEach((bar) => {
              const val = bar.dataset.progress;
              if (val) bar.style.width = val;
            });
            obs.disconnect();
          }
        });
      }, { threshold: 0.3 });
      observer.observe(skillsWrap);
    } else {
      // متصفح قديم: املأها مباشرة
      skillBars.forEach((bar) => { const v = bar.dataset.progress; if (v) bar.style.width = v; });
    }
  }

  // ===== Portfolio filter =====
  const filterContainer = qs('.portfolio-filter');
  let portfolioItems = qsa('.portfolio-item');

  function updateVisibleItems(filter) {
    // Re-query items in case they were dynamically added
    portfolioItems = qsa('.portfolio-item');
    
    const f = filter || 'all';
    portfolioItems.forEach((item) => {
      const cat = item.getAttribute('data-category');
      const shouldShow = f === 'all' || f === cat;
      item.classList.toggle('show', shouldShow);
      item.classList.toggle('hide', !shouldShow);
    });
  }

  // default state
  updateVisibleItems('all');

  // Listen for dynamic portfolio rendering completion
  document.addEventListener('portfolioRendered', () => {
    updateVisibleItems('all');
  });

  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      qsa('button[data-filter]', filterContainer).forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      updateVisibleItems(btn.getAttribute('data-filter'));
    });
  }

  // ===== Lightbox (Project Gallery Mode) =====
  const lightbox = qs('.lightbox');
  const lightboxImg = lightbox ? qs('.lightbox-img', lightbox) : null;
  const lightboxClose = lightbox ? qs('.lightbox-close', lightbox) : null;
  const lightboxText = lightbox ? qs('.caption-text', lightbox) : null;
  const lightboxCounter = lightbox ? qs('.caption-counter', lightbox) : null;
  const prevBtn = lightbox ? qs('.prev-item', lightbox) : null;
  const nextBtn = lightbox ? qs('.next-item', lightbox) : null;

  let galleryImages = []; // Stores {src, alt} for the current project
  let currentIndex = 0;
  let lastFocused = null;
  let hiddenForA11y = [];
  let currentPreviewUrl = null;
  let lightboxPreviewEl = null;

  // Helper to extract images from a project item
  function getProjectImages(item) {
    const images = [];
    
    // 1. Main Cover Image
    const coverImg = qs('.portfolio-img img', item);
    if (coverImg) {
      images.push({
        src: coverImg.currentSrc || coverImg.getAttribute('src'),
        alt: coverImg.getAttribute('alt') || ''
      });
    }

    // 2. Hidden Gallery Images
    const hiddenGallery = qs('.project-gallery', item);
    if (hiddenGallery) {
      const hiddenImgs = qsa('img', hiddenGallery);
      hiddenImgs.forEach(img => {
        images.push({
          src: img.getAttribute('src'), // Use getAttribute for lazy-loaded/hidden images
          alt: img.getAttribute('alt') || ''
        });
      });
    }

    return images;
  }

  function preloadAround(idx) {
    if (!galleryImages.length) return;
    const next = galleryImages[(idx + 1) % galleryImages.length];
    const prev = galleryImages[(idx - 1 + galleryImages.length) % galleryImages.length];
    [next, prev].forEach((imgObj) => {
      if (imgObj && imgObj.src) { const pre = new Image(); pre.src = imgObj.src; }
    });
  }

  function updateLightbox() {
    const imgObj = galleryImages[currentIndex];
    if (!imgObj || !lightboxImg) return;
    
    const i18n = document.getElementById('i18n-data');
    const galleryText = i18n ? i18n.dataset.gallery : 'Gallery Image';
    lightboxImg.src = imgObj.src;
    lightboxImg.alt = imgObj.alt || galleryText;
    
    if (lightboxText) lightboxText.textContent = imgObj.alt;
    if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImages.length}`;
    
    // Disable buttons at boundaries
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === galleryImages.length - 1;
    
    preloadAround(currentIndex);
    // Show or hide preview button: only visible on the first image (index 0)
    if (!lightbox) return;
    if (!lightboxPreviewEl) {
      const content = qs('.lightbox-content', lightbox);
      if (content) {
        lightboxPreviewEl = document.createElement('a');
        lightboxPreviewEl.className = 'lightbox-preview';
        lightboxPreviewEl.setAttribute('target', '_blank');
        lightboxPreviewEl.setAttribute('rel', 'noopener noreferrer');
        lightboxPreviewEl.setAttribute('role', 'link');
        lightboxPreviewEl.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Open preview' : 'افتح المعاينة');
        // Insert after the close button so it appears near the header controls
        const closeBtn = qs('.lightbox-close', content);
        if (closeBtn && closeBtn.parentElement) closeBtn.parentElement.insertBefore(lightboxPreviewEl, closeBtn.nextSibling);
        else content.appendChild(lightboxPreviewEl);
      }
    }

    if (lightboxPreviewEl) {
      if (currentIndex === 0 && currentPreviewUrl) {
        lightboxPreviewEl.href = currentPreviewUrl;
        lightboxPreviewEl.hidden = false;
        const previewLabel = document.documentElement.lang === 'en' ? 'Preview' : 'معاينة';
        lightboxPreviewEl.innerHTML = previewLabel + ' <span aria-hidden="true">🔗</span>';
      } else {
        lightboxPreviewEl.hidden = true;
      }
    }
  }

  function hideBackgroundForA11y(hide) {
    if (!lightbox) return;
    if (hide) {
      hiddenForA11y = Array.from(document.body.children).filter((el) => el !== lightbox);
      hiddenForA11y.forEach((el) => el.setAttribute('aria-hidden', 'true'));
    } else {
      hiddenForA11y.forEach((el) => el.removeAttribute('aria-hidden'));
      hiddenForA11y = [];
    }
  }

  function openLightbox(item) {
    if (!lightbox) return;
    
    galleryImages = getProjectImages(item);
    if (galleryImages.length === 0) return;

    // Read preview URL from the DOM element (set by renderer)
    currentPreviewUrl = item.getAttribute('data-preview') || null;

    currentIndex = 0; // Always start from the first image (cover)
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
    // cleanup preview link
    if (lightboxPreviewEl) {
      lightboxPreviewEl.hidden = true;
    }
  }

  function nextItem() { 
    if (!galleryImages.length || currentIndex >= galleryImages.length - 1) return;
    currentIndex++; 
    updateLightbox(); 
  }
  
  function prevItem() { 
    if (!galleryImages.length || currentIndex <= 0) return;
    currentIndex--; 
    updateLightbox(); 
  }

  // expose for control buttons bound later
  window.nextItem = nextItem;
  window.prevItem = prevItem;

  // open only when clicking image cards (not videos)
  // Event Delegation for Portfolio Items
  const portfolioContainer = qs('.portfolio .row:nth-of-type(3)') || qs('.portfolio .container'); // Adjust selector based on HTML structure
  if (portfolioContainer) {
    portfolioContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.portfolio-item');
      if (!item) return;

      // If user clicked the preview link, let the anchor behave normally
      if (e.target.closest && e.target.closest('a.project-preview')) return;

      // Check if it's a video or non-image card
      if (e.target.tagName.toLowerCase() === 'video' || e.target.closest('video')) return;
      if (!qs('.portfolio-img img', item)) return;

      openLightbox(item);
    });

    // Keyboard support for items (Enter/Space)
    portfolioContainer.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('.portfolio-item');
      if (!item) return;
      // Don't open lightbox when Enter/Space is used on the preview link
      if (e.target.closest && e.target.closest('a.project-preview')) return;
      
      e.preventDefault();
      // Check if it's a video or non-image card
      if (e.target.tagName.toLowerCase() === 'video' || e.target.closest('video')) return;
      if (!qs('.portfolio-img img', item)) return;

      openLightbox(item);
    });
  }

  // Add tabindex to items for keyboard accessibility (done once)
  qsa('.portfolio-item').forEach((item) => {
    const clickable = qs('.portfolio-item-inner', item) || item;
    clickable.setAttribute('tabindex', '0');
  });

  if (lightbox) {
    // close by clicking backdrop or close button
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lightboxClose) closeLightbox();
    });

    // keyboard controls + focus trap
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') nextItem();
      else if (e.key === 'ArrowLeft') prevItem();

      if (e.key === 'Tab') {
        const focusables = qsa(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          lightbox
        ).filter((el) => !el.hasAttribute('disabled'));
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();

// ===== Bind lightbox control buttons (no inline onclick) =====
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



// مثال تسجيل SW (تأكد من المسار)
(() => {
  const BASE = './';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${BASE}sw.js`).catch(console.error);
    });
  }
})();



// زر تثبيت تطبيق أنيق + تبديل النص بعد التثبيت
(() => {
  const installBtn = document.getElementById('installBtn');
  if (!installBtn) return;

  // إن كان التطبيق يعمل بوضع مستقل (مثبّت)، أخفِ الزر
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) { installBtn.hidden = true; return; }

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // e.preventDefault();  // Remove to allow browser banner
    deferredPrompt = e;
    // installBtn.hidden = false;  // Hide custom button to use browser banner
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    installBtn.disabled = true;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        const i18n = document.getElementById('i18n-data');
        const installedText = i18n ? i18n.dataset.installed : 'Installed ✅';
        installBtn.querySelector('.btn-install__label').textContent = installedText;
        setTimeout(() => installBtn.hidden = true, 1600);
      } else {
        // User dismissed the prompt. The event cannot be reused.
        // Hide the button until the browser fires the event again.
        installBtn.hidden = true;
        installBtn.disabled = false;
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
      installBtn.disabled = false;
    } finally {
      deferredPrompt = null;
    }
  });

  window.addEventListener('appinstalled', () => {
    const i18n = document.getElementById('i18n-data');
    const installedText = i18n ? i18n.dataset.installed : 'Installed ✅';
    installBtn.querySelector('.btn-install__label').textContent = installedText;
    setTimeout(() => installBtn.hidden = true, 1200);
  });
})();
