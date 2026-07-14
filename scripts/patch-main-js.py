def patch_main_js():
    with open('js/main.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update getProjectImages
    target1 = "const coverImg = qs('.portfolio-img img', item);"
    replacement1 = "const coverImg = qs('.portfolio-img img', item) || qs('.cert-cover-img', item);"
    if target1 in content:
        content = content.replace(target1, replacement1)
        print("Updated getProjectImages")

    # 2. Add cert-grid event listener
    target2 = "// Add tabindex to items for keyboard accessibility (done once)"
    replacement2 = """// Event Delegation for Cert Items
  const certContainer = document.querySelector('.cert-grid');
  if (certContainer) {
    certContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.cert-item');
      if (!item) return;

      // Ensure it has a trigger
      if (!e.target.closest('.cert-btn-gallery') && !e.target.closest('.lightbox-trigger')) return;

      e.preventDefault();
      openLightbox(item);
    });
  }

  // Add tabindex to items for keyboard accessibility (done once)"""
    if target2 in content:
        content = content.replace(target2, replacement2)
        print("Added cert-grid event listener")

    with open('js/main.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_main_js()
