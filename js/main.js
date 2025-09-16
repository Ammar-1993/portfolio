(() => {
  'use strict';

  // ===== أدوات مساعدة سريعة =====
  const qs = (sel, scope = document) => scope.querySelector(sel);
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  // ===== شريط التنقّل (Sticky) + تمييز الرابط النشِط أثناء التمرير =====
  const navbar = qs('.navbar');
  const linksContainer = qs('.links');
  const sections = qsa('section[id]');

  const setSticky = () => {
    if (!navbar) return;
    if (window.scrollY > 20) navbar.classList.add('sticky');
    else navbar.classList.remove('sticky');
  };

  function setActiveLink() {
    if (!sections.length || !linksContainer) return;
    const scrollPos = window.scrollY + 55; // إزاحة بسيطة لحساب ارتفاع الهيدر
    let currentId = null;
    for (const section of sections) {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        currentId = section.id;
        break;
      }
    }
    qsa('.links a').forEach(a => a.classList.remove('active'));
    if (currentId) {
      try {
        const activeLink = qs(`.links a[href*="#${CSS.escape(currentId)}"]`);
        if (activeLink) activeLink.classList.add('active');
      } catch (_) {
        // متصفح قديم لا يدعم CSS.escape
        const activeLink = qsa('.links a').find(a => (a.getAttribute('href') || '').includes(`#${currentId}`));
        if (activeLink) activeLink.classList.add('active');
      }
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        setSticky();
        setActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', setActiveLink, { passive: true });
  document.addEventListener('DOMContentLoaded', () => {
    setSticky();
    setActiveLink();
  });

  // ===== قائمة الهاتف (Burger) =====
  const menu = qs('.menu');
  const menuBtn = qs('.menu-btn');
  if (menu && menuBtn) {
    const closeMenu = () => {
      menu.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('active');
    });

    // إغلاق القائمة عند الضغط على رابط
    qsa('.nav-link', menu).forEach(link => link.addEventListener('click', closeMenu));

    // إغلاق عند الضغط خارجها
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });

    // إغلاق عبر زر Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ===== تأثير تعبئة أشرطة المهارات باستخدام IntersectionObserver =====
  const skillsWrap = qs('.about-skills');
  const skillBars = qsa('.progress-line');
  if (skillsWrap && skillBars.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          skillBars.forEach(bar => {
            const val = bar.dataset.progress;
            if (val) bar.style.width = val;
          });
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(skillsWrap);
  }

  // ===== مرشّح المعرض =====
  const filterContainer = qs('.portfolio-filter');
  const portfolioItems = qsa('.portfolio-item');

  function updateVisibleItems(filter) {
    const f = filter || 'all';
    portfolioItems.forEach(item => {
      const cat = item.getAttribute('data-category');
      const shouldShow = (f === 'all') || (f === cat);
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
      qsa('button', filterContainer).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateVisibleItems(btn.getAttribute('data-filter'));
    });
  }

  // ===== عارض الصور (Lightbox) مع دعم لوحة المفاتيح وتركيز الوصول =====
  const lightbox = qs('.lightbox');
  const lightboxImg = lightbox ? qs('.lightbox-img', lightbox) : null;
  const lightboxClose = lightbox ? qs('.lightbox-close', lightbox) : null;
  const lightboxText = lightbox ? qs('.caption-text', lightbox) : null;
  const lightboxCounter = lightbox ? qs('.caption-counter', lightbox) : null;

  let visibleList = [];
  let currentIndex = 0;
  let lastFocused = null;

  function computeVisibleList() {
    // العناصر الظاهرة فقط (تتوافق مع الفلتر الحالي)
    visibleList = portfolioItems.filter(item => item.classList.contains('show'));
    if (!visibleList.length) visibleList = portfolioItems.slice(); // احتياطي
  }

  function updateLightbox() {
    const item = visibleList[currentIndex];
    if (!item || !lightboxImg) return;
    const imgEl = qs('.portfolio-img img', item);
    const titleEl = qs('h4', item);
    const src = imgEl ? imgEl.getAttribute('src') : '';
    const alt = imgEl ? (imgEl.getAttribute('alt') || '') : '';
    if (src) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || (titleEl ? titleEl.textContent.trim() : 'صورة من المعرض');
    }
    if (lightboxText) lightboxText.textContent = titleEl ? titleEl.textContent.trim() : '';
    if (lightboxCounter) lightboxCounter.textContent = `${currentIndex + 1} / ${visibleList.length}`;
  }

  function openLightbox(idx) {
    if (!lightbox) return;
    computeVisibleList();
    currentIndex = Math.max(0, Math.min(idx, visibleList.length - 1));
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
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

  // إتاحة الدوال لعناصر HTML التي تستخدم onclick
  window.nextItem = nextItem;
  window.prevItem = prevItem;

  // فتح العارض عند الضغط على بطاقة
  portfolioItems.forEach((item, i) => {
    const clickable = qs('.portfolio-item-inner', item) || item;
    // اجعل البطاقة قابلة للتركيز عبر لوحة المفاتيح
    clickable.setAttribute('tabindex', '0');

    clickable.addEventListener('click', (ev) => {
      // تجاهل إن كان الهدف فيديو (لا نفتحه داخل العارض)
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

      // حصر التنقّل داخل العارض (Trap Focus)
      if (e.key === 'Tab') {
        const focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', lightbox)
          .filter(el => !el.hasAttribute('disabled'));
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
