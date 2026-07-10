const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  // Load local file
  await page.goto('file:///home/ammar/code/portfolio/index-en.html', { waitUntil: 'networkidle0' });

  // Force light mode
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  
  // Wait a bit and scroll down slightly to simulate user behavior
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 500));

  const result = await page.evaluate(() => {
    const homeTextNodes = document.querySelectorAll('.home-text');
    const homeImageNodes = document.querySelectorAll('img[src*="hero4.png"]');
    
    // Also get bounding rects
    const textRects = Array.from(homeTextNodes).map(n => n.getBoundingClientRect().toJSON());
    const imageRects = Array.from(homeImageNodes).map(n => n.getBoundingClientRect().toJSON());
    
    // Check for any cloned nodes or shadow roots
    const allText = document.body.innerText;
    const isTextDuplicated = allText.split('Software Engineer').length - 1;
    
    return {
      homeTextCount: homeTextNodes.length,
      homeImageCount: homeImageNodes.length,
      textRects,
      imageRects,
      softwareEngineerOccurrences: isTextDuplicated
    };
  });
  
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
