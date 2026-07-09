const fs = require('fs');
const path = require('path');

const portfolioDataStr = fs.readFileSync(path.join(__dirname, 'data/portfolio.json'), 'utf8');
const portfolioData = JSON.parse(portfolioDataStr);

function createPortfolioHTML(project, lang) {
  const title = project.title[lang] || project.title.ar;
  const coverAlt = project.coverAlt[lang] || project.coverAlt.ar;
  const shortDesc = project.description ? (project.description[lang] || project.description.ar) : (project.summary ? (project.summary[lang] || project.summary.ar) : '');

  let previewHtml = '';
  if (project.preview && !project.preview.includes('example.com') && project.preview !== '#') {
    const previewTitle = lang === 'en' ? 'Open preview (opens in new window)' : 'يفتح في نافذة جديدة';
    previewHtml = `
            <a class="project-preview" href="${project.preview}" target="_blank" rel="noopener noreferrer" title="يفتح في نافذة جديدة" aria-label="${previewTitle}">
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
      const alt = img.alt[lang] || img.alt.ar;
      return `<img data-src="${img.src}" alt="${alt}" width="640" height="360" loading="lazy" decoding="async">`;
    }).join('\n                    ');
    galleryHtml = `
        <div class="project-gallery" hidden>
                    ${galleryImages}
        </div>`;
  }

  let previewAttr = project.preview ? ` data-preview="${project.preview}"` : '';

  return `
              <div class="portfolio-item" data-category="${project.category}"${previewAttr}>
                <div class="portfolio-item-inner">
                  <div class="portfolio-img">
                    <img src="${project.cover}" alt="${coverAlt}" width="640" height="360" loading="lazy" decoding="async">
                  </div>${galleryHtml ? '\n          ' + galleryHtml : ''}
                  <div class="portfolio-info">
                    <div class="portfolio-info-body">
                      <div class="portfolio-info-text">
                        <h4>${title}</h4>
                        ${shortDesc ? `<p class="portfolio-short">${shortDesc}</p>` : ''}
                      </div>
                      ${previewHtml}
                    </div>
                  </div>
                </div>
              </div>`;
}

function processHtml(filePath, lang) {
  const fullPath = path.join(__dirname, filePath);
  let html = fs.readFileSync(fullPath, 'utf8');
  
  let gridHtml = portfolioData.projects.map(p => createPortfolioHTML(p, lang)).join('');
  gridHtml = '\n' + gridHtml + '\n            ';
  
  // We match the opening tag `<div class="row" id="portfolio-grid">` up to its closing tag right before `</div>\n          </section>`
  const regex = /(<div class="row" id="portfolio-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;
  
  if (!regex.test(html)) {
      console.error(`Could not find portfolio-grid section in ${filePath}`);
      return;
  }

  html = html.replace(regex, `$1${gridHtml}$3`);
  
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log(`Updated ${filePath}`);
}

processHtml('index.html', 'ar');
processHtml('index-en.html', 'en');
