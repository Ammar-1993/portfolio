# Portfolio — Eng. Ammar Al‑Najjar


[![Status](https://img.shields.io/badge/status-live-brightgreen.svg)](https://ammar-1993.github.io/portfolio/)
![Made with](https://img.shields.io/badge/Made%20with-HTML5%20%7C%20CSS3%20%7C%20JS-1f6feb)
![RTL](https://img.shields.io/badge/Language-AR%20%7C%20RTL-0ea5e9)
![Theme](https://img.shields.io/badge/Theme-Dark-0b1220)

## 🔗 Links
- **Live site:** https://ammar-1993.github.io/portfolio/
- **Repository:** https://github.com/Ammar-1993/portfolio

---

## 📌 Overview
An Arabic (RTL) portfolio website showcasing services, selected projects (Web / Mobile / Desktop), technology stacks, and contact options. Optimized for **speed**, **accessibility**, and **SEO** with a **dark theme** by default.

## ✨ Highlights
- 🎨 **Dark theme** with clear brand color.
- 🧭 **Sticky navbar** + active section highlight on scroll.
- 🗂️ **Filterable portfolio** (web/mobile/desktop) with a **Lightbox** viewer.
- 🖼️ **Unified card ratio** via CSS `aspect-ratio` (easily switchable).
- ♿ **Accessibility:** semantic HTML, alt text, keyboard support, Escape to close Lightbox.
- ⚡ **Performance:** lazy images, deferred JS, minimal scroll work.
- 🌐 **SEO/Social:** title/description, Open Graph/Twitter cards, and JSON‑LD (Person).

## 🧱 Tech Stack
- **Frontend:** HTML5, CSS3 (Bootstrap RTL), Font Awesome
- **JavaScript:** Vanilla JS (no heavy libs)
- **Hosting:** GitHub Pages

---

## 🗂️ Project Structure
```text
portfolio/
├─ css/
│  ├─ bootstrap-rtl.min.css
│  └─ style.css              # Dark theme + accessibility/performance tweaks
├─ images/                   # Prefer WebP/AVIF
│  └─ og-cover.jpg           # Social sharing image
├─ js/
│  └─ main.js                # Nav, filters, lightbox, skills
├─ video/                    # ← renamed from vedio/
│  └─ *.mp4
└─ index.html
```
> **Important:** If your folder is still named `vedio/`, rename it to **`video/`** and update paths in `index.html`.

---

## 🚀 Quick Start (Local)
1) **Clone:**
```bash
git clone https://github.com/Ammar-1993/portfolio.git
cd portfolio
```
2) **Open** `index.html` in the browser, or use VS Code **Live Server** extension.

---

## 🌍 Deploy on GitHub Pages
If not already live:
1) Go to **Settings → Pages**.
2) **Source:** *Deploy from a branch*.
3) **Branch:** `main` & **Folder:** `/ (root)`, then **Save**.
4) Your site will be available at:
```
https://ammar-1993.github.io/portfolio/
```

---

## 🛠️ Customization
### Brand color & fonts
- Change the primary color in `style.css`:
```css
:root{ --main-color:#00a78e; /* brand color */ }
```
- Default font: **Cairo** (you can adjust weights or swap if needed).

### Unified card ratio (Portfolio grid)
Set once via CSS variable (default **16:9** if you added it inline on `<html>`):
```css
:root{
  --tile-ratio: 16/9; /* switch to 4/3 or 1/1 as you prefer */
  --tile-min-h: 220px;
}
/* media box */
.portfolio .portfolio-item-inner .portfolio-img,
.portfolio .portfolio-item-inner-video{
  aspect-ratio: var(--tile-ratio);
  min-height: var(--tile-min-h);
  display: grid; place-items: center;
  background:#0e1626;
}
/* media fit */
.portfolio .portfolio-item-inner .portfolio-img img,
.portfolio .portfolio-item-inner-video video{
  width:100%; height:100%; object-fit: cover; /* or 'contain' to avoid any crop */
}
```

### Contact links
Update WhatsApp/Mail/Tel in the **Contact** section of `index.html`.

---

## 🔍 SEO (already in `index.html`)
- `<title>` and `<meta name="description">`
- Open Graph + Twitter Card (ensure `images/og-cover.jpg` exists)
- JSON‑LD **Person** (name/phone/email)
- `lang="ar" dir="rtl"` on `<html>`

### Quick checklist
- [ ] Accurate Arabic title and description
- [ ] OG image ≥ 1200×630
- [ ] Valid contact/social links

---

## ♿ Accessibility
- Descriptive `alt` attributes for images
- Keyboard navigation (Tab, Enter/Space to open Lightbox)
- Close Lightbox via **Esc**
- Sufficient contrast in dark theme

---

## ⚡ Performance
- Use **WebP/AVIF** when possible
- Add `loading="lazy"` to non-critical images
- Provide `width`/`height` to images to prevent CLS
- Keep `main.js` with `defer`

---

## 🧪 Lighthouse targets
- Performance ≥ 95
- Accessibility ≥ 90
- Best Practices ≥ 95
- SEO ≥ 95        

> Tip: Chrome DevTools → Lighthouse → Generate report.
> ![alt text](image.png)

---

## 🧾 License
No explicit license yet. **Recommended:** add MIT license:
1) Create `LICENSE` file
2) Paste MIT text (with year & your name) or use GitHub template

---

## 🤝 Contributing
Personal project, but small PRs for fixes or a11y/perf improvements are welcome.

---

## 📬 Contact
- WhatsApp: `+967714294340`
- Email: `ammaralnggar@gmail.com`
- Phone: `+967774344625`


