const fs = require('fs');
const path = require('path');
const { injectPortfolioGrid } = require('./lib/portfolio-builder');

const portfolioDataStr = fs.readFileSync(path.join(__dirname, 'data/portfolio.json'), 'utf8');
const portfolioData = JSON.parse(portfolioDataStr);

function processHtml(filePath, lang) {
  const fullPath = path.join(__dirname, filePath);
  const html = fs.readFileSync(fullPath, 'utf8');
  const updatedHtml = injectPortfolioGrid(html, portfolioData.projects, lang);

  fs.writeFileSync(fullPath, updatedHtml, 'utf8');
  console.log(`Updated ${filePath}`);
}

processHtml('index.html', 'ar');
processHtml('index-en.html', 'en');
