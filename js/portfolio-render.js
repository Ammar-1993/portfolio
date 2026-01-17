// =====================================================
// portfolio-render.js — Dynamic Portfolio Rendering
// =====================================================

(function() {
  'use strict';

  const PORTFOLIO_DATA_URL = 'data/portfolio.json';
  const PORTFOLIO_CONTAINER_SELECTOR = '.portfolio .row:nth-of-type(3)';
  
  // Detect language from HTML lang attribute
  const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';

  /**
   * Create a portfolio item DOM element
   * @param {Object} project - Project data object
   * @returns {HTMLElement} - Portfolio item element
   */
  function createPortfolioItem(project) {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.setAttribute('data-category', project.category);
    if (project.preview) item.setAttribute('data-preview', project.preview);

    const title = project.title[lang] || project.title.ar;
    const coverAlt = project.coverAlt[lang] || project.coverAlt.ar;

    item.innerHTML = `
      <div class="portfolio-item-inner">
        <div class="portfolio-img">
          <img src="${project.cover}" alt="${coverAlt}" loading="lazy" decoding="async">
        </div>
        ${project.gallery && project.gallery.length > 0 ? createGalleryHTML(project.gallery) : ''}
        <div class="portfolio-info">
          <h4>${title}</h4>
          <div class="icon" aria-hidden="true">
            <svg class="ico" aria-hidden="true">
              <use href="images/icons.svg#search" />
            </svg>
          </div>
        </div>
      </div>
    `;

    return item;
  }

  /**
   * Create hidden gallery HTML
   * @param {Array} gallery - Array of gallery image objects
   * @returns {string} - Gallery HTML string
   */
  function createGalleryHTML(gallery) {
    if (!gallery || gallery.length === 0) return '';
    
    const galleryImages = gallery.map(img => {
      const alt = img.alt[lang] || img.alt.ar;
      return `<img src="${img.src}" alt="${alt}">`;
    }).join('\n                    ');

    return `
        <div class="project-gallery" hidden>
                    ${galleryImages}
        </div>`;
  }

  /**
   * Render all portfolio items
   * @param {Array} projects - Array of project objects
   */
  function renderPortfolio(projects) {
    const container = document.querySelector(PORTFOLIO_CONTAINER_SELECTOR);
    if (!container) {
      console.warn('Portfolio container not found');
      return;
    }

    // Clear existing portfolio items (keep video items if any)
    const existingItems = container.querySelectorAll('.portfolio-item');
    existingItems.forEach(item => {
      // Only remove image-based items, not video items
      if (item.querySelector('.portfolio-img')) {
        item.remove();
      }
    });

    // Create and append new items
    const fragment = document.createDocumentFragment();
    projects.forEach(project => {
      fragment.appendChild(createPortfolioItem(project));
    });

    // Insert before video items if they exist
    const firstVideoItem = container.querySelector('.portfolio-item-inner-video');
    if (firstVideoItem && firstVideoItem.parentElement) {
      container.insertBefore(fragment, firstVideoItem.parentElement);
    } else {
      container.appendChild(fragment);
    }
  }

  /**
   * Load and render portfolio data
   */
  async function initPortfolio() {
    try {
      const response = await fetch(PORTFOLIO_DATA_URL);
      if (!response.ok) {
        throw new Error(`Failed to load portfolio data: ${response.status}`);
      }
      
      const data = await response.json();
      renderPortfolio(data.projects);
      
      // Trigger filter update to show all items initially
      const event = new CustomEvent('portfolioRendered');
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      // Fallback: keep static HTML if JSON fails to load
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortfolio);
  } else {
    initPortfolio();
  }
})();
